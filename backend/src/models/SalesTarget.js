const mongoose = require('mongoose');

const salesTargetSchema = new mongoose.Schema(
  {
    month: {
      type: String, // 'YYYY-MM'
      required: true,
      unique: true,
      index: true,
    },
    showroomTarget: {
      type: Number,
      default: 2500000, // Default 25 Lakhs showroom target
      min: [0, 'Target cannot be negative'],
    },
    enableStaffTargets: {
      type: Boolean,
      default: true,
    },
    staffTargets: [
      {
        staffName: { type: String, required: true, trim: true },
        target: { type: Number, default: 500000, min: 0 },
        disabled: { type: Boolean, default: false },
      },
    ],
    updatedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: { type: String, default: 'Admin' },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SalesTarget', salesTargetSchema);
