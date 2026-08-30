const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const DEFAULT_LOCAL_URI = 'mongodb://127.0.0.1:27017/vasantham_crm';

let isConnecting = false;
let retryInterval = null;
let spawnedMongoProcess = null;

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
    path.join(resourcesDir, 'bin', 'mongod.exe'),
    path.join(resourcesDir, 'app.asar.unpacked', 'backend', 'bin', 'mongod.exe'),
    // 2. Relative path in backend/bin/mongod.exe
    path.join(__dirname, '../../bin/mongod.exe'),
    path.join(__dirname, '../bin/mongod.exe'),
    path.resolve(__dirname, '../../../backend/bin/mongod.exe'),
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
  if (spawnedMongoProcess) return true;

  const mongodExe = getBundledMongodExePath();
  if (!mongodExe) {
    console.warn('[Bundled MongoDB Notice] mongod.exe binary not found in resources.');
    return false;
  }

  const dbPath = getPersistentDbPath();
  console.log(`🚀 [Bundled MongoDB] Spawning standalone database engine: ${mongodExe}`);
  console.log(`📁 [Bundled MongoDB] Persistent storage directory: ${dbPath}`);

  try {
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

    // Wait 1.5s for mongod daemon to initialize database engine
    await new Promise((r) => setTimeout(r, 1500));
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

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
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
