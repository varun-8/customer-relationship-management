const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow = null;
let backendProcess = null;

// Helper to check if backend server health check endpoint is responding and database is connected
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

// Start backend server internally if app is packaged into production installer
async function startEmbeddedBackend() {
  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
  if (isDev) {
    console.log('[Electron Main] Running in Dev Mode — assuming external backend process.');
    return true;
  }

  const isAlreadyAlive = await checkBackendHealth();
  if (isAlreadyAlive) {
    console.log('[Electron Main] Backend is already running on http://127.0.0.1:5000');
    return true;
  }

  console.log('[Electron Main] Starting embedded Express backend server & database engine...');
  try {
    const fs = require('fs');
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
    
    process.env.PORT = process.env.PORT || '5000';
    process.env.NODE_ENV = 'production';

    // Require and start Express server in process
    require(backendServerPath);

    const isReady = await waitForBackend(40, 500);
    if (!isReady) {
      throw new Error('Backend server did not respond to health check within 20 seconds.');
    }
    console.log('[Electron Main] Embedded Express backend & database connected successfully.');
    return true;
  } catch (err) {
    console.error('[Electron Main Error] Failed to launch embedded backend:', err);
    dialog.showErrorBox(
      'Vasantham CRM — Database Connection Warning',
      `Failed to start backend database server:\n${err.message}\n\nPlease verify network settings or restart the application.`
    );
    return false;
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
    console.error(`[Electron Main] Web content failed to load (${errorCode}): ${errorDescription} at ${validatedURL}`);
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
  await startEmbeddedBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
