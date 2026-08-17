const mongoose = require('mongoose');

const sequenceSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  prefix: {
    type: String,
    default: 'VAS-',
    trim: true,
  },
  currentValue: {
    type: Number,
    default: 0,
  },
  startValue: {
    type: Number,
    default: 1,
  },
  padding: {
    type: Number,
    default: 6,
  },
  step: {
    type: Number,
    default: 1,
  },
  description: {
    type: String,
    default: 'Customer ID Sequence Counter',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Sequence', sequenceSchema);
