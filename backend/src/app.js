const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const formRoutes = require('./routes/formRoutes');
const customerRoutes = require('./routes/customerRoutes');
const sequenceRoutes = require('./routes/sequenceRoutes');
const brandingRoutes = require('./routes/brandingRoutes');
const kpiRoutes = require('./routes/kpiRoutes');
const lostSaleRoutes = require('./routes/lostSaleRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const followupRoutes = require('./routes/followupRoutes');
const userRoutes = require('./routes/userRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const backupRoutes = require('./routes/backupRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id', 'x-device-id', 'Accept'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'ok',
    online: true,
    dbConnected: mongoose.connection.readyState === 1,
    service: 'Vasantham Tiles & Sanitary Wares CRM Backend',
    timestamp: new Date(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer-form', formRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sequence', sequenceRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/lost-sales', lostSaleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/backup', backupRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message || err);

  const isDbErr = err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    (err.message && (err.message.includes('ECONNREFUSED') || err.message.includes('timed out')));

  if (isDbErr) {
    return res.status(503).json({
      success: false,
      message: 'CRM Backend is connecting to MongoDB (mongodb://127.0.0.1:27017). Please verify MongoDB service is running.',
      isDbConnecting: true,
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
