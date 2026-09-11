const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');
const { spawn, exec } = require('child_process');

// Chromium switches to prevent Windows cache conflicts & GPU disk cache locking
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

// Single Instance Lock: Prevent multiple Electron instances from colliding on cache files
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

let mainWindow = null;
let mongoProcess = null;
let backendProcess = null;

// Persistent log helper
function getLogFile() {
  const logDir = path.join(app.getPath('userData'), 'logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return path.join(logDir, 'app.log');
}

function log(...args) {
  const msg = `[${new Date().toISOString()}] ${args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')}`;
  console.log(msg);
  try {
    fs.appendFileSync(getLogFile(), msg + '\n');
  } catch (e) {}
}

// Helper to check if a TCP port is open / listening
function isPortOpen(port, host = '127.0.0.1', timeoutMs = 1200) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

// Helper to wait until an HTTP endpoint is online
function waitForUrl(url, timeoutMs = 30000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(url, (res) => {
        if (res.statusCode) {
          resolve(true);
        } else {
          retry();
        }
      });
      req.on('error', () => retry());
      req.setTimeout(1200, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`Timeout waiting for ${url}`));
      } else {
        setTimeout(check, 400);
      }
    };
    check();
  });
}

// 1. Auto-Start Bundled MongoDB 6.0 Server
async function startBundledMongoDB() {
  const isMongoRunning = await isPortOpen(27017);
  if (isMongoRunning) {
    log('✅ [MongoDB] Port 27017 is already active. Using running MongoDB instance.');
    return;
  }

  // Candidate paths for mongod.exe
  const candidatePaths = app.isPackaged
    ? [
        path.join(process.resourcesPath, 'mongodb', 'mongod.exe'),
        path.join(process.resourcesPath, 'backend', 'bin', 'mongodb', 'mongod.exe'),
        path.join(process.resourcesPath, 'backend', 'bin', 'mongod.exe'),
        path.join(app.getAppPath(), '..', 'mongodb', 'mongod.exe'),
        path.join(app.getAppPath(), 'mongodb', 'mongod.exe'),
      ]
    : [
        path.resolve(__dirname, '../../backend/bin/mongodb/mongod.exe'),
        path.resolve(__dirname, '../backend/bin/mongodb/mongod.exe'),
        path.resolve(__dirname, '../../backend/bin/mongod.exe'),
      ];

  const mongodPath = candidatePaths.find((p) => fs.existsSync(p));

  if (!mongodPath) {
    log('⚠️ [MongoDB Notice] mongod.exe binary not found. Searched paths:', candidatePaths);
    return;
  }

  // Create persistent data directory in Windows AppData
  const dbDataDir = path.join(app.getPath('userData'), 'mongodb_data');
  if (!fs.existsSync(dbDataDir)) {
    fs.mkdirSync(dbDataDir, { recursive: true });
  }

  // Clean stale lock file if mongod is not running
  const lockFile = path.join(dbDataDir, 'mongod.lock');
  if (fs.existsSync(lockFile)) {
    try {
      const stats = fs.statSync(lockFile);
      if (stats.size === 0) {
        fs.unlinkSync(lockFile);
        log('🧹 [MongoDB] Cleaned stale 0-byte mongod.lock file.');
      }
    } catch (e) {}
  }

  log(`🍃 [MongoDB 6.0] Spawning bundled MongoDB binary from: ${mongodPath}`);
  log(`   Database Storage Path: ${dbDataDir}`);

  const spawnMongod = (repair = false) => {
    const args = repair
      ? ['--dbpath', dbDataDir, '--repair']
      : ['--dbpath', dbDataDir, '--port', '27017', '--bind_ip', '127.0.0.1'];

    const proc = spawn(mongodPath, args, {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (proc.stdout) {
      proc.stdout.on('data', (d) => {
        const str = d.toString().trim();
        if (str) log(`[mongod] ${str}`);
      });
    }
    if (proc.stderr) {
      proc.stderr.on('data', (d) => {
        const str = d.toString().trim();
        if (str) log(`[mongod stderr] ${str}`);
      });
    }
    return proc;
  };

  try {
    mongoProcess = spawnMongod(false);

    mongoProcess.on('error', (err) => {
      log('❌ [MongoDB Error] Failed to launch mongod.exe:', err.message);
    });

    mongoProcess.on('exit', async (code) => {
      log(`⚠️ [MongoDB] Process exited with code ${code}`);
      // Code 100 or non-zero indicates dirty shutdown or lock issue
      if (code !== 0 && !(await isPortOpen(27017))) {
        log('🔧 [MongoDB] Running auto-repair on database (--repair)...');
        const repairProc = spawnMongod(true);
        repairProc.on('exit', (rCode) => {
          log(`🔧 [MongoDB] Repair completed with code ${rCode}. Restarting MongoDB...`);
          mongoProcess = spawnMongod(false);
        });
      }
    });

    // Wait for MongoDB port to become active (up to 20 seconds)
    for (let i = 0; i < 40; i++) {
      const active = await isPortOpen(27017);
      if (active) {
        log('🎉 [MongoDB 6.0] Server started and listening on port 27017!');
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  } catch (err) {
    log('❌ [MongoDB Exception]', err.message);
  }
}

function ensureWindowsFirewallRules() {
  if (process.platform !== 'win32') return;
  const ports = [5000, 27017];
  ports.forEach((port) => {
    try {
      const ruleName = `Vasantham CRM Port ${port}`;
      const checkCmd = `netsh advfirewall firewall show rule name="${ruleName}"`;
      exec(checkCmd, (err, stdout) => {
        if (err || !stdout || !stdout.includes(ruleName)) {
          const addCmd = `netsh advfirewall firewall add rule name="${ruleName}" dir=in action=allow protocol=TCP localport=${port} profile=any`;
          exec(addCmd, () => {});
        }
      });
    } catch (e) {}
  });
}

// 2. Auto-Start Express Backend Server
async function startEmbeddedBackend() {
  const isBackendRunning = await isPortOpen(5000);
  if (isBackendRunning) {
    log('✅ [Backend] API server is already active on http://127.0.0.1:5000');
    return;
  }

  const candidatePaths = app.isPackaged
    ? [
        path.join(process.resourcesPath, 'backend', 'src', 'server.js'),
        path.join(process.resourcesPath, 'app', 'backend', 'src', 'server.js'),
        path.join(app.getAppPath(), 'backend', 'src', 'server.js'),
        path.join(app.getAppPath(), '..', 'backend', 'src', 'server.js'),
        path.join(__dirname, '../backend/src/server.js'),
      ]
    : [
        path.resolve(__dirname, '../../backend/src/server.js'),
        path.resolve(__dirname, '../backend/src/server.js'),
      ];

  const backendServerPath = candidatePaths.find((p) => fs.existsSync(p));

  if (!backendServerPath) {
    log('⚠️ [Backend Warning] server.js not found. Searched paths:', candidatePaths);
    return;
  }

  log(`🚀 [Backend API] Launching Express server from: ${backendServerPath}`);
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vasantham_crm';
  process.env.PORT = process.env.PORT || '5000';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'vasantham_jwt_secret_key_2026';
  process.env.DEV_KEY = process.env.DEV_KEY || 'vasantham_dev_secret_wipe_key_2026';
  process.env.NODE_ENV = 'production';

  const backendCwd = path.dirname(path.dirname(backendServerPath));

  try {
    // Spawn backend as isolated child process with Electron's embedded Node runtime
    backendProcess = spawn(process.execPath, [backendServerPath], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        PORT: '5000',
        MONGODB_URI: process.env.MONGODB_URI,
        NODE_ENV: 'production',
      },
      cwd: backendCwd,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (backendProcess.stdout) {
      backendProcess.stdout.on('data', (d) => {
        const str = d.toString().trim();
        if (str) log(`[Backend] ${str}`);
      });
    }

    if (backendProcess.stderr) {
      backendProcess.stderr.on('data', (d) => {
        const str = d.toString().trim();
        if (str) log(`[Backend stderr] ${str}`);
      });
    }

    backendProcess.on('error', (err) => {
      log(`⚠️ [Backend Spawn Error] ${err.message}. Falling back to in-process require...`);
      try {
        require(backendServerPath);
        log('🎉 [Backend API] In-process Express server initialized!');
      } catch (reqErr) {
        log('❌ [Backend Require Error]', reqErr.message);
      }
    });

    backendProcess.on('exit', (code) => {
      log(`⚠️ [Backend Child] Process exited with code ${code}`);
    });
  } catch (err) {
    log(`⚠️ [Backend Spawn Exception] ${err.message}. Loading in-process...`);
    try {
      require(backendServerPath);
      log('🎉 [Backend API] In-process Express server initialized!');
    } catch (reqErr) {
      log('❌ [Backend Require Error]', reqErr.message);
    }
  }
}

function cleanupProcesses() {
  log('🧹 [Exit Cleanup] Terminating child processes...');
  if (backendProcess && !backendProcess.killed) {
    try {
      if (process.platform === 'win32' && backendProcess.pid) {
        exec(`taskkill /pid ${backendProcess.pid} /T /F`, () => {});
      } else {
        backendProcess.kill('SIGTERM');
      }
    } catch (e) {}
  }
  if (mongoProcess && !mongoProcess.killed) {
    try {
      if (process.platform === 'win32' && mongoProcess.pid) {
        exec(`taskkill /pid ${mongoProcess.pid} /T /F`, () => {});
      } else {
        mongoProcess.kill('SIGTERM');
      }
    } catch (e) {}
  }
}

function createWindow() {
  const iconPath = path.join(__dirname, '../public/logo.png');
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Vasantham Tiles & Sanitary Wares — Customer CRM',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    show: false,
  });

  mainWindow.setTitle('Vasantham Tiles & Sanitary Wares — Customer CRM');

  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  const isDev = !app.isPackaged && process.env.NODE_ENV === 'development';

  if (isDev) {
    mainWindow.loadURL(devUrl);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    const altIndexPath = path.join(app.getAppPath(), 'dist/index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else if (fs.existsSync(altIndexPath)) {
      mainWindow.loadFile(altIndexPath);
    } else {
      log(`❌ index.html missing at ${indexPath} and ${altIndexPath}`);
      mainWindow.loadFile(indexPath);
    }
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    log(`❌ [Electron Load Failure] URL: ${validatedURL}, Error: ${errorDescription} (${errorCode})`);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  Menu.setApplicationMenu(null);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    log('=======================================================');
    log('🚀 Vasantham CRM Electron Application Launch');
    log('UserData path:', app.getPath('userData'));
    log('Log file path:', getLogFile());
    log('=======================================================');

    // 0. Register Windows Firewall Rules for Ports 5000 & 27017
    ensureWindowsFirewallRules();

    // Run IP Auto-Sync & Firewall rule registration
    const updateIpCandidatePaths = [
      path.resolve(__dirname, '../../scripts/update-ip.js'),
      path.resolve(__dirname, '../scripts/update-ip.js'),
      path.join(process.resourcesPath, 'scripts', 'update-ip.js'),
    ];
    const updateIpScript = updateIpCandidatePaths.find((p) => fs.existsSync(p));
    if (updateIpScript) {
      try {
        require(updateIpScript);
      } catch (e) {}
    }

    // 1. Start MongoDB 6.0
    await startBundledMongoDB();

    // 2. Start Express Backend
    await startEmbeddedBackend();

    // 3. Wait for Backend API readiness (up to 30 seconds)
    try {
      await waitForUrl('http://127.0.0.1:5000/api/health', 30000);
      log('✨ Backend API healthcheck passed successfully!');
    } catch (e) {
      log('⚠️ API healthcheck timeout, opening UI...');
    }

    // 4. Create App Window
    createWindow();
  } catch (err) {
    log('❌ Initialization error:', err);
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  cleanupProcesses();
});

app.on('will-quit', () => {
  cleanupProcesses();
});

app.on('window-all-closed', () => {
  cleanupProcesses();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
