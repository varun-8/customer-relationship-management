const mongoose = require('mongoose');

const connectedDeviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  deviceName: {
    type: String,
    default: 'Mobile Device',
  },
  platform: {
    type: String,
    enum: ['ios', 'android', 'web', 'other'],
    default: 'android',
  },
  appVersion: {
    type: String,
    default: '1.0.0',
  },
  ipAddress: {
    type: String,
    default: '',
  },
  userProfile: {
    name: { type: String, default: 'Showroom Staff' },
    role: { type: String, default: 'employee' },
    email: { type: String, default: '' },
    icon: { type: String, default: '📱' },
  },
  isOnline: {
    type: Boolean,
    default: true,
  },
  lastAction: {
    type: String,
    default: 'Connected',
  },
  lastSeenAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  pairedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ConnectedDevice', connectedDeviceSchema);
