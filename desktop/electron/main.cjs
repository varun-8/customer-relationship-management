const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');
const { spawn, execSync } = require('child_process');

let mainWindow = null;
let spawnedMongoProcess = null;

// Initialize production log directory in <userData>/logs/app.log
const logDir = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFilePath = path.join(logDir, 'app.log');
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

function log(msg, ...args) {
  const timestamp = new Date().toISOString();
  const text = `[${timestamp}] ${msg} ${args.length ? args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ') : ''}\n`;
  console.log(msg, ...args);
  try {
    logStream.write(text);
  } catch (e) {}
}

log('=======================================================');
log('🚀 Vasantham CRM Electron Application Launch');
log(`UserData path: ${app.getPath('userData')}`);
log(`Log file path: ${logFilePath}`);
log('=======================================================');

// Helper to check if TCP port is open (used for MongoDB readiness check)
function isPortOpen(port = 27017, host = '127.0.0.1', timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

// Locate bundled mongod.exe executable
function getMongodExePath() {
  const resourcesPath = process.resourcesPath || path.resolve(__dirname, '../..');
  const possiblePaths = [
    // 1. Packaged extraResources path: resources/mongodb/mongod.exe
    path.join(resourcesPath, 'mongodb', 'mongod.exe'),
    // 2. Packaged extraResources path: resources/backend/bin/mongod.exe
    path.join(resourcesPath, 'backend', 'bin', 'mongod.exe'),
    path.join(resourcesPath, 'bin', 'mongod.exe'),
    path.join(resourcesPath, 'app.asar.unpacked', 'backend', 'bin', 'mongod.exe'),
    // 3. Dev environment paths
    path.resolve(__dirname, '../../backend/bin/mongod.exe'),
    path.join(process.cwd(), 'backend', 'bin', 'mongod.exe'),
    path.join(process.cwd(), 'resources', 'mongodb', 'mongod.exe'),
  ];

  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      log(`[MongoDB Path] Found executable at: ${p}`);
      return p;
    }
  }
  return null;
}

// Start bundled MongoDB daemon and wait until ready
async function ensureMongoDBStarted() {
  const isAlreadyOpen = await isPortOpen(27017, '127.0.0.1', 500);
  if (isAlreadyOpen) {
    log('✅ [MongoDB] Engine is already active and listening on 127.0.0.1:27017');
    return true;
  }

  const mongodExe = getMongodExePath();
  if (!mongodExe) {
    throw new Error(`Bundled MongoDB executable (mongod.exe) not found in application resources.`);
  }

  // Persistent storage directory in <userData>/mongodb-data
  const dbPath = path.join(app.getPath('userData'), 'mongodb-data');
  if (!fs.existsSync(dbPath)) {
    log(`[MongoDB] Creating database directory at: ${dbPath}`);
    fs.mkdirSync(dbPath, { recursive: true });
  }

  log(`🚀 [MongoDB] Spawning database engine: ${mongodExe}`);
  log(`📁 [MongoDB] Storage directory: ${dbPath}`);

  let mongoStderr = '';
  try {
    spawnedMongoProcess = spawn(mongodExe, [
      '--dbpath', dbPath,
      '--port', '27017',
      '--bind_ip', '127.0.0.1',
    ], {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (spawnedMongoProcess.stdout) {
      spawnedMongoProcess.stdout.on('data', (data) => {
        log(`[MongoDB] ${data.toString().trim()}`);
      });
    }

    if (spawnedMongoProcess.stderr) {
      spawnedMongoProcess.stderr.on('data', (data) => {
        const errLine = data.toString().trim();
        mongoStderr += errLine + '\n';
        log(`[MongoDB stderr] ${errLine}`);
      });
    }

    spawnedMongoProcess.on('error', (err) => {
      log(`[MongoDB Process Error] ${err.message}`);
      spawnedMongoProcess = null;
    });

    spawnedMongoProcess.on('exit', (code, signal) => {
      log(`[MongoDB Process Exit] Code: ${code}, Signal: ${signal}`);
      spawnedMongoProcess = null;
    });

    // Poll TCP port 27017 for up to 30 seconds (60 * 500ms)
    log('[MongoDB] Waiting for database engine to accept connections on 127.0.0.1:27017...');
    for (let i = 0; i < 60; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const isOpen = await isPortOpen(27017, '127.0.0.1', 400);
      if (isOpen) {
        log('✅ [MongoDB] Database engine is active and listening on 127.0.0.1:27017');
        return true;
      }
    }

    throw new Error(`MongoDB engine failed to respond on port 27017 within 30 seconds.\n${mongoStderr.slice(-400)}`);
  } catch (err) {
    log(`[MongoDB Spawn Failure] ${err.message}`);
    throw err;
  }
}

// Helper to check if backend server health check endpoint is responding
function checkBackendHealth(url = 'http://127.0.0.1:5000/api/health', requireDb = true, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          try {
            const data = JSON.parse(body);
            if (requireDb) {
              resolve(data.online !== false && data.dbConnected === true);
            } else {
              resolve(data.online !== false);
            }
          } catch (e) {
            resolve(true);
          }
        } else {
          resolve(false);
        }
      });
    });
    req.on('error', () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Wait for backend server to complete startup & database connection
async function waitForBackend(maxAttempts = 40, delayMs = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    const isHealthy = await checkBackendHealth('http://127.0.0.1:5000/api/health', true);
    if (isHealthy) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

// Start embedded backend server sequentially after MongoDB is confirmed ready
async function startEmbeddedBackend() {
  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
  if (isDev) {
    log('[Electron Main] Running in Dev Mode — using external backend process if available.');
    return true;
  }

  // 1. First ensure MongoDB is started & ready
  try {
    await ensureMongoDBStarted();
  } catch (err) {
    log(`[Electron Main Error] Local database startup failed: ${err.message}`);
    dialog.showErrorBox(
      'Vasantham CRM — Local Database Failure',
      `Unable to start local database server. Please contact support.\n\nDiagnostic log file:\n${logFilePath}`
    );
    return false;
  }

  // 2. Check if backend server is already running
  const isAlreadyAlive = await checkBackendHealth();
  if (isAlreadyAlive) {
    log('[Electron Main] Backend is already running on http://127.0.0.1:5000');
    return true;
  }

  log('[Electron Main] Starting embedded Express backend server...');
  try {
    const resourcesPath = process.resourcesPath || path.resolve(__dirname, '../..');
    
    // Check extraResources production path first, then appPath, then dev fallback
    let backendServerPath = path.join(resourcesPath, 'backend/src/server.js');
    if (!fs.existsSync(backendServerPath)) {
      backendServerPath = path.join(app.getAppPath(), 'backend/src/server.js');
    }
    if (!fs.existsSync(backendServerPath)) {
      backendServerPath = path.resolve(__dirname, '../../backend/src/server.js');
    }

    if (!fs.existsSync(backendServerPath)) {
      throw new Error(`Cannot locate backend server at path: ${backendServerPath}`);
    }
    
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/vasantham_crm';
    process.env.PORT = process.env.PORT || '5000';
    process.env.NODE_ENV = 'production';

    // Require and start Express server in process
    require(backendServerPath);

    log('[Electron Main] Waiting for Express backend health check...');
    const isReady = await waitForBackend(40, 500);
    if (!isReady) {
      throw new Error('Backend server did not respond to health check within 20 seconds.');
    }
    log('[Electron Main] Embedded Express backend & database connected successfully.');
    return true;
  } catch (err) {
    log('[Electron Main Error] Failed to launch embedded backend:', err.message);
    dialog.showErrorBox(
      'Vasantham CRM — Backend Service Warning',
      `Unable to start application backend service. Please contact support.\n\nDiagnostic log file:\n${logFilePath}`
    );
    return false;
  }
}

function stopAllServices() {
  if (spawnedMongoProcess) {
    log('[Shutdown] Stopping spawned MongoDB daemon...');
    try {
      if (process.platform === 'win32' && spawnedMongoProcess.pid) {
        execSync(`taskkill /pid ${spawnedMongoProcess.pid} /T /F`);
      } else {
        spawnedMongoProcess.kill('SIGTERM');
      }
    } catch (e) {
      log(`[Shutdown Notice] mongod process cleanup: ${e.message}`);
    }
    spawnedMongoProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Vasantham Tiles & Sanitary Wares — Customer CRM',
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
  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';

  // Error listener for web page load failures
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    log(`[Electron Main] Web content failed to load (${errorCode}): ${errorDescription} at ${validatedURL}`);
    dialog.showErrorBox(
      'Vasantham CRM — Loading Error',
      `Failed to load application interface:\n${errorDescription} (code: ${errorCode})\nURL: ${validatedURL}`
    );
  });

  if (isDev) {
    mainWindow.loadURL(devUrl);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
  }

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
  const success = await startEmbeddedBackend();
  if (success) {
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', () => {
  stopAllServices();
});

app.on('will-quit', () => {
  stopAllServices();
});

app.on('window-all-closed', () => {
  stopAllServices();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (err) => {
  log(`[Uncaught Exception] ${err.stack || err.message}`);
});
