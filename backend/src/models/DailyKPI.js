const mongoose = require('mongoose');

const dailyKpiSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true,
  },
  dateString: {
    type: String, // 'YYYY-MM-DD' for fast querying and uniqueness
    required: true,
    index: true,
  },
  staffName: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // 3. Walk-ins Funnel (Visits -> Quotes -> Orders)
  walkins: {
    visits: {
      type: Number,
      default: 0,
      min: 0,
    },
    quotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    orders: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  // 4. Follow-ups (Number of customer follow-up calls / visits)
  followUpsCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  // 5. Orders (Number of Bills closed)
  ordersCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  // 6. Sales Value (Total Bill Amount in INR)
  salesValue: {
    type: Number,
    default: 0,
    min: 0,
  },
  // 7. Old / Repeat Customers (Yes / No + count & notes)
  oldCustomers: {
    type: Boolean,
    default: false,
  },
  oldCustomersCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  oldCustomerNotes: {
    type: String,
    default: '',
    trim: true,
  },
  // 8. Engineer Calls (Yes / No + count & notes)
  engineerCalls: {
    type: Boolean,
    default: false,
  },
  engineerCallsCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  engineerNotes: {
    type: String,
    default: '',
    trim: true,
  },
  // 9. Cross-sell (Yes / No + product tags & notes)
  crossSell: {
    type: Boolean,
    default: false,
  },
  crossSellItems: {
    type: [String],
    default: [],
  },
  crossSellNotes: {
    type: String,
    default: '',
    trim: true,
  },
  // Review notes / remarks
  notes: {
    type: String,
    default: '',
    trim: true,
  },
  submittedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, default: 'System' },
    role: { type: String, default: 'employee' },
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

// Compound unique index per staff per date string to allow clean daily upserts
dailyKpiSchema.index({ dateString: 1, staffName: 1 }, { unique: true });

// Auto-update timestamp
dailyKpiSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (this.date && !this.dateString) {
    this.dateString = new Date(this.date).toISOString().split('T')[0];
  }
  next();
});

module.exports = mongoose.model('DailyKPI', dailyKpiSchema);
