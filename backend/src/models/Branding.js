const mongoose = require('mongoose');

const brandingSchema = new mongoose.Schema({
  appName: {
    type: String,
    required: true,
    default: 'BuildCRM',
    trim: true,
  },
  appShortName: {
    type: String,
    default: 'BuildCRM',
    trim: true,
  },
  tagline: {
    type: String,
    default: 'Tiles & Sanitary Wares CRM',
    trim: true,
  },
  logoType: {
    type: String,
    enum: ['icon', 'image'],
    default: 'icon',
  },
  logoIcon: {
    type: String,
    default: 'Box',
  },
  logoImage: {
    type: String,
    default: '',
  },
  primaryColor: {
    type: String,
    default: '#2563EB',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Branding', brandingSchema);
