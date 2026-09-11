const mongoose = require('mongoose');

const aiReportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      required: true,
      enum: ['monthly', 'yearly'],
      index: true,
    },
    period: {
      type: String, // 'YYYY-MM' (e.g., '2026-09') or 'YYYY' (e.g., '2026')
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    summary: {
      type: String,
      default: '',
    },
    metrics: {
      totalLostDeals: { type: Number, default: 0 },
      totalLostValue: { type: Number, default: 0 },
      avgDealSize: { type: Number, default: 0 },
      topLostReason: { type: String, default: 'N/A' },
      topCompetitor: { type: String, default: 'N/A' },
      analyzedAt: { type: Date, default: Date.now },
    },
    content: {
      executiveSummary: { type: String, default: '' },
      lossDrivers: [
        {
          reason: String,
          percentage: Number,
          analysis: String,
          impact: String,
        },
      ],
      competitorAnalysis: [
        {
          competitor: String,
          marketThreat: String,
          pricingDifference: String,
          competitorStrengths: String,
          counterStrategy: String,
        },
      ],
      serviceGaps: [String],
      waysToImprove: [String],
      whatToInclude: [String],
      strategicRecommendations: [
        {
          timeframe: String,
          priority: String,
          recommendation: String,
          actionPlan: String,
        },
      ],
      rawMarkdown: { type: String, default: '' },
    },
    generatedBy: {
      type: String,
      default: 'System AI Consultant',
    },
  },
  {
    timestamps: true,
  }
);

// Enforce strict one-time generation per month and per year
aiReportSchema.index({ reportType: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('AiReport', aiReportSchema);
