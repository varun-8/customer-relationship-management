const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const net = require('net');

const DEFAULT_LOCAL_URI = 'mongodb://127.0.0.1:27017/vasantham_crm';

let isConnecting = false;
let retryInterval = null;
let spawnedMongoProcess = null;

// Helper to check if TCP port is accepting connections
const isMongoPortOpen = (port = 27017, host = '127.0.0.1', timeoutMs = 800) => {
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
};

// Resolve path to persistent db data folder in %APPDATA%/Vasantham CRM/mongodb-data
const getPersistentDbPath = () => {
  const appDataPath = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share');
  const dir = path.join(appDataPath, 'Vasantham CRM', 'mongodb-data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// Locate bundled mongod.exe binary executable
const getBundledMongodExePath = () => {
  const resourcesDir = process.resourcesPath || '';
  const possiblePaths = [
    // 1. Packaged extraResources path in Electron installer
    path.join(resourcesDir, 'backend', 'bin', 'mongod.exe'),
    path.join(resourcesDir, 'bin', 'mongod.exe'),
    path.join(resourcesDir, 'app.asar.unpacked', 'backend', 'bin', 'mongod.exe'),
    // 2. Relative path in backend/bin/mongod.exe
    path.join(__dirname, '../../bin/mongod.exe'),
    path.join(__dirname, '../bin/mongod.exe'),
    path.resolve(__dirname, '../../../backend/bin/mongod.exe'),
    path.join(process.cwd(), 'resources', 'backend', 'bin', 'mongod.exe'),
    path.join(process.cwd(), 'resources', 'bin', 'mongod.exe'),
    path.join(process.cwd(), 'backend', 'bin', 'mongod.exe'),
    // 3. System installed Mongo binary fallback
    'C:\\Program Files\\MongoDB\\Server\\8.3\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
  ];

  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      console.log(`[Bundled MongoDB Path] Found executable at: ${p}`);
      return p;
    }
  }
  return null;
};

// Spawn bundled mongod.exe daemon on port 27017
const launchBundledMongoDaemon = async () => {
  const isOpenAlready = await isMongoPortOpen(27017, '127.0.0.1', 400);
  if (isOpenAlready) return true;

  const mongodExe = getBundledMongodExePath();
  if (!mongodExe) {
    console.warn('[Bundled MongoDB Notice] mongod.exe binary not found in resources.');
    return false;
  }

  const dbPath = getPersistentDbPath();
  console.log(`🚀 [Bundled MongoDB] Spawning standalone database engine: ${mongodExe}`);
  console.log(`📁 [Bundled MongoDB] Persistent storage directory: ${dbPath}`);

  try {
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    spawnedMongoProcess = spawn(mongodExe, [
      '--dbpath', dbPath,
      '--port', '27017',
      '--bind_ip', '127.0.0.1',
    ], {
      detached: false,
      stdio: 'ignore',
    });

    spawnedMongoProcess.on('error', (err) => {
      console.error('[Bundled MongoDB Error]', err.message);
      spawnedMongoProcess = null;
    });

    spawnedMongoProcess.on('exit', (code) => {
      console.log(`[Bundled MongoDB] Process exited with code ${code}`);
      spawnedMongoProcess = null;
    });

    // Poll port 27017 for up to 6 seconds until daemon is listening
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const isOpen = await isMongoPortOpen(27017, '127.0.0.1', 300);
      if (isOpen) {
        console.log('✅ [Bundled MongoDB] Database engine is active and listening on 127.0.0.1:27017');
        return true;
      }
    }
    console.warn('[Bundled MongoDB Warning] Daemon spawned, proceeding to connection attempts.');
    return true;
  } catch (err) {
    console.error('[Bundled MongoDB] Failed to spawn daemon:', err.message);
    return false;
  }
};

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) return;
  isConnecting = true;

  const mongoUri = process.env.MONGODB_URI || DEFAULT_LOCAL_URI;
  const isLocal = mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost');

  // Proactively check if local MongoDB port is open; if closed, spawn bundled engine immediately
  if (isLocal) {
    const isPortOpen = await isMongoPortOpen(27017, '127.0.0.1');
    if (!isPortOpen) {
      console.log('⚡ [Bundled MongoDB Engine] Port 27017 closed. Launching bundled MongoDB engine immediately...');
      await launchBundledMongoDaemon();
    }
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 4000,
    });
    const dbType = isLocal ? 'Local MongoDB' : 'MongoDB Atlas Cloud';
    console.log(`[${dbType}] Connected successfully: ${conn.connection.host} / ${conn.connection.name}`);
    
    // Auto-seed default admin accounts and form schemas if DB is empty
    const { autoSeedIfEmpty } = require('../utils/seedData');
    autoSeedIfEmpty().catch((err) => console.warn('[Auto-Seed Error]', err.message));

    if (retryInterval) {
      clearInterval(retryInterval);
      retryInterval = null;
    }
    isConnecting = false;
    return conn;
  } catch (error) {
    console.error(`[Database Connection Warning] Primary connection failed (${mongoUri}): ${error.message}`);

    // If primary connection failed, spawn bundled mongod.exe and attempt connection
    try {
      console.log('🚀 [Bundled MongoDB Engine] Launching standalone database engine...');
      const daemonStarted = await launchBundledMongoDaemon();
      
      if (daemonStarted) {
        const conn = await mongoose.connect(DEFAULT_LOCAL_URI, {
          serverSelectionTimeoutMS: 5000,
        });

        console.log(`[Bundled MongoDB Engine] Connected successfully: ${conn.connection.host} / ${conn.connection.name}`);
        
        const { autoSeedIfEmpty } = require('../utils/seedData');
        autoSeedIfEmpty().catch((err) => console.warn('[Auto-Seed Error]', err.message));

        if (retryInterval) {
          clearInterval(retryInterval);
          retryInterval = null;
        }
        isConnecting = false;
        return conn;
      }
    } catch (embeddedErr) {
      console.error(`[Bundled MongoDB Engine Failed] ${embeddedErr.message}`);
    }

    console.warn('[Database Notice] Backend server will remain running while attempting auto-reconnect every 5 seconds.');
    isConnecting = false;

    // Start auto-retry loop every 5s if not already retrying
    if (!retryInterval) {
      retryInterval = setInterval(() => {
        connectDB();
      }, 5000);
    }
  }
};

module.exports = connectDB;
