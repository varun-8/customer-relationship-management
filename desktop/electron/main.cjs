const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');
const { spawn, exec } = require('child_process');

let mainWindow = null;
let mongoProcess = null;

// Helper to check if a TCP port is open / listening
function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1200);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

// Helper to wait until an HTTP endpoint is online
function waitForUrl(url, timeoutMs = 25000) {
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
      req.setTimeout(1000, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() - startTime > timeoutMs) {
        reject(new Error(`Timeout waiting for ${url}`));
      } else {
        setTimeout(check, 350);
      }
    };
    check();
  });
}

// 1. Auto-Start Bundled MongoDB 6.0 Server
async function startBundledMongoDB() {
  const isMongoRunning = await isPortOpen(27017);
  if (isMongoRunning) {
    console.log('✅ [MongoDB] Port 27017 is active. Using running MongoDB instance.');
    return;
  }

  // Candidate paths for mongod.exe
  const candidatePaths = app.isPackaged ? [
    path.join(process.resourcesPath, 'mongodb', 'mongod.exe'),
    path.join(app.getAppPath(), '..', 'mongodb', 'mongod.exe'),
    path.join(app.getAppPath(), 'mongodb', 'mongod.exe')
  ] : [
    path.resolve(__dirname, '../../backend/bin/mongodb/mongod.exe'),
    path.resolve(__dirname, '../backend/bin/mongodb/mongod.exe')
  ];

  const mongodPath = candidatePaths.find(p => fs.existsSync(p));

  if (!mongodPath) {
    console.warn(`⚠️ [MongoDB Notice] mongod.exe binary not found. Searched paths:`, candidatePaths);
    return;
  }

  // Create persistent data directory in Windows AppData
  const dbDataDir = path.join(app.getPath('userData'), 'mongodb_data');
  if (!fs.existsSync(dbDataDir)) {
    fs.mkdirSync(dbDataDir, { recursive: true });
  }

  console.log(`🍃 [MongoDB 6.0] Spawning bundled MongoDB binary from: ${mongodPath}`);
  console.log(`   Database Storage Path: ${dbDataDir}`);

  try {
    mongoProcess = spawn(mongodPath, ['--dbpath', dbDataDir, '--port', '27017', '--bind_ip', '127.0.0.1'], {
      stdio: 'ignore',
      detached: false,
      windowsHide: true,
    });

    mongoProcess.on('error', (err) => {
      console.error('❌ [MongoDB Error] Failed to launch mongod.exe:', err.message);
    });

    // Wait for MongoDB port to become active (up to 30 seconds)
    for (let i = 0; i < 60; i++) {
      const active = await isPortOpen(27017);
      if (active) {
        console.log('🎉 [MongoDB 6.0] Server started and listening on port 27017!');
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  } catch (err) {
    console.error('❌ [MongoDB Exception]', err.message);
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
    console.log('✅ [Backend] API server is active on http://127.0.0.1:5000');
    return;
  }

  const candidatePaths = app.isPackaged ? [
    path.join(process.resourcesPath, 'backend', 'src', 'server.js'),
    path.join(app.getAppPath(), 'backend', 'src', 'server.js'),
    path.join(app.getAppPath(), '..', 'backend', 'src', 'server.js'),
    path.join(__dirname, '../backend/src/server.js')
  ] : [
    path.resolve(__dirname, '../../backend/src/server.js'),
    path.resolve(__dirname, '../backend/src/server.js')
  ];

  const backendServerPath = candidatePaths.find(p => fs.existsSync(p));

  if (!backendServerPath) {
    console.warn(`⚠️ [Backend Warning] server.js not found. Searched paths:`, candidatePaths);
    return;
  }

  console.log(`🚀 [Backend API] Launching Express server from: ${backendServerPath}`);
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vasantham_crm';
  process.env.PORT = process.env.PORT || '5000';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'vasantham_jwt_secret_key_2026';
  process.env.DEV_KEY = process.env.DEV_KEY || 'vasantham_dev_secret_wipe_key_2026';
  process.env.NODE_ENV = 'production';

  try {
    require(backendServerPath);
    console.log('🎉 [Backend API] Express server initialized!');
  } catch (err) {
    console.error('❌ [Backend Error] Failed to load server.js:', err.message);
  }
}

function cleanupProcesses() {
  console.log('🧹 [Exit Cleanup] Terminating child processes...');
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
      console.error(`❌ index.html missing at ${indexPath} and ${altIndexPath}`);
      mainWindow.loadFile(indexPath);
    }
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error(`❌ [Electron Load Failure] URL: ${validatedURL}, Error: ${errorDescription} (${errorCode})`);
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
    // 0. Register Windows Firewall Rules for Ports 5000 & 27017
    ensureWindowsFirewallRules();
    // Run IP Auto-Sync & Firewall rule registration
    let updateIpScript = '';
    if (app.isPackaged) {
      updateIpScript = path.join(__dirname, '../scripts/update-ip.js');
    } else {
      updateIpScript = path.resolve(__dirname, '../../scripts/update-ip.js');
    }
    if (fs.existsSync(updateIpScript)) {
      try { require(updateIpScript); } catch (e) {}
    }

    // 1. Start MongoDB 6.0
    await startBundledMongoDB();

    // 2. Start Express Backend
    await startEmbeddedBackend();

    // 3. Wait for Backend API readiness (up to 30 seconds)
    try {
      await waitForUrl('http://127.0.0.1:5000/api/health', 30000);
    } catch (e) {
      console.warn('⚠️ API healthcheck timeout, opening UI...');
    }

    // 4. Create App Window
    createWindow();
  } catch (err) {
    console.error('Initialization error:', err);
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
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
