const mongoose = require('mongoose');

const DEFAULT_LOCAL_URI = 'mongodb://127.0.0.1:27017/vasantham_crm';

let isConnecting = false;
let retryInterval = null;

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
      serverSelectionTimeoutMS: 5000,
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
    console.error(`[Database Connection Warning] Failed to connect to ${mongoUri}: ${error.message}`);

    // If custom env URI failed and it wasn't local, attempt fallback to local MongoDB instance
    if (!isLocal) {
      console.log(`[Local MongoDB Fallback] Trying local MongoDB instance at ${DEFAULT_LOCAL_URI}...`);
      try {
        const fallbackConn = await mongoose.connect(DEFAULT_LOCAL_URI, {
          serverSelectionTimeoutMS: 5000,
        });
        console.log(`[Local MongoDB Fallback] Connected successfully: ${fallbackConn.connection.host} / ${fallbackConn.connection.name}`);
        if (retryInterval) {
          clearInterval(retryInterval);
          retryInterval = null;
        }
        isConnecting = false;
        return fallbackConn;
      } catch (fallbackError) {
        console.error(`[Local MongoDB Fallback Failed] ${fallbackError.message}`);
      }
    }

    console.warn('[Database Notice] Backend server will remain running while attempting auto-reconnect every 5 seconds.');
    console.warn('👉 Please ensure MongoDB Community Server service is started on port 27017 (mongodb://127.0.0.1:27017)');
    
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
