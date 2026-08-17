const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[MongoDB Atlas] Connected successfully: ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Atlas] Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
