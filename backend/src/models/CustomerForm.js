const mongoose = require('mongoose');

const fieldOptionSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { _id: false });

const fieldValidationSchema = new mongoose.Schema({
  min: { type: Number },
  max: { type: Number },
  minLength: { type: Number },
  maxLength: { type: Number },
  pattern: { type: String },
  currencySymbol: { type: String, default: '₹' },
  phoneFormat: { type: String, default: '10-digit' },
  dateFormat: { type: String, default: 'YYYY-MM-DD' },
  autoNumberConfig: {
    prefix: { type: String, default: '' },
    start: { type: Number, default: 1 },
    digits: { type: Number, default: 6 },
    step: { type: Number, default: 1 },
  },
}, { _id: false });

const formFieldSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  label: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'text',
      'textarea',
      'number',
      'phone',
      'email',
      'date',
      'time',
      'datetime',
      'checkbox',
      'radio',
      'select',
      'multiselect',
      'currency',
      'url',
      'auto_number',
    ],
  },
  required: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    required: true,
    default: 0,
  },
  placeholder: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  defaultValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  options: [fieldOptionSchema],
  validation: {
    type: fieldValidationSchema,
    default: () => ({}),
  },
}, { _id: false });

const customerFormSchema = new mongoose.Schema({
  name: {
    type: String,
    default: 'Customer CRM Form',
  },
  version: {
    type: Number,
    required: true,
    default: 1,
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true,
  },
  fields: [formFieldSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  publishedAt: {
    type: Date,
  },
  changelog: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

customerFormSchema.index({ status: 1, version: -1 });

module.exports = mongoose.model('CustomerForm', customerFormSchema);
