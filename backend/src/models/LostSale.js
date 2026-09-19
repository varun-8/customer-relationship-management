const mongoose = require('mongoose');

const lostSaleSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      trim: true,
      index: true,
    },
    customerRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerType: {
      type: String,
      trim: true,
      default: 'Direct Client',
    },
    requirements: {
      type: [String],
      default: [],
    },
    phone: {
      type: String,
      trim: true,
    },
    quoteValue: {
      type: Number,
      required: [true, 'Quote value is required'],
      min: [0, 'Quote value cannot be negative'],
    },
    products: {
      type: [String],
      enum: ['Tile', 'Sanitary', 'CP', 'Adhesive', 'Fittings', 'Vanity', 'Kitchen Sink', 'Other'],
      default: ['Tile'],
    },
    salesperson: {
      type: String,
      required: [true, 'Salesperson name is required'],
      trim: true,
      index: true,
    },
    lostReason: {
      type: String,
      required: [true, 'Lost reason is required'],
      trim: true,
      index: true,
    },
    competitor: {
      type: String,
      trim: true,
      default: 'Unknown / Local Dealer',
      index: true,
    },
    priceDifference: {
      type: Number,
      default: 0,
    },
    priceDiffPercentage: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    dateString: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['lost', 'win_back', 'reopened'],
      default: 'lost',
      index: true,
    },
    createdBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: 'Showroom Staff' },
      role: { type: String, default: 'employee' },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for date and salesperson queries
lostSaleSchema.index({ dateString: -1, salesperson: 1 });
lostSaleSchema.index({ competitor: 1, lostReason: 1 });

module.exports = mongoose.model('LostSale', lostSaleSchema);
