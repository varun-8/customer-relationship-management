const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start Express server immediately so health diagnostics respond instantly
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 Vasantham CRM Backend active on port ${PORT} (0.0.0.0)`);
  console.log(`📡 API Base: http://localhost:${PORT}/api`);
  console.log(`=======================================================`);

  // Connect to Database asynchronously
  connectDB();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Server Error] Port ${PORT} is already in use by another process.`);
  } else {
    console.error('[Server Error]', err);
  }
});
