const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  formVersion: {
    type: Number,
    required: true,
    default: 1,
  },
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  status: {
    type: String,
    default: 'active',
  },
  notes: {
    type: String,
    default: '',
  },
  createdBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: 'System' },
    role: { type: String, default: 'employee' },
  },
  updatedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String },
    role: { type: String },
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// High-performance query indexes
customerSchema.index({ customerId: 'text' });
customerSchema.index({ 'data.phone': 1 });
customerSchema.index({ 'data.status': 1 });
customerSchema.index({ 'data.salesperson': 1 });
customerSchema.index({ 'data.entryDate': -1 });
customerSchema.index({ 'data.nextFollowUp': 1 });
customerSchema.index({ 'data.customerType': 1 });
customerSchema.index({ 'data.status': 1, 'data.salesperson': 1 });
customerSchema.index({ 'data.entryDate': -1, 'data.salesperson': 1 });

module.exports = mongoose.model('Customer', customerSchema);
