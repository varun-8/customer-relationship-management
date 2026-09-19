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
      totalRevenue: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 },
      totalQuotes: { type: Number, default: 0 },
      totalWalkins: { type: Number, default: 0 },
      conversionRate: { type: String, default: '0%' },
      totalFollowups: { type: Number, default: 0 },
      repeatCustomersCount: { type: Number, default: 0 },
      totalCustomerInquiries: { type: Number, default: 0 },
      totalLostDeals: { type: Number, default: 0 },
      totalLostValue: { type: Number, default: 0 },
      avgDealSize: { type: Number, default: 0 },
      topLostReason: { type: String, default: 'N/A' },
      topCompetitor: { type: String, default: 'N/A' },
      analyzedAt: { type: Date, default: Date.now },
    },
    content: {
      executiveSummary: { type: String, default: '' },
      showroomOverview: { type: String, default: '' },
      areasToImprove: [
        {
          title: String,
          category: String,
          problem: String,
          solution: String,
          impact: String,
          color: String,
        },
      ],
      strengths: [String],
      rootCauses: [
        {
          reason: String,
          percentage: Number,
          lostValue: String,
          analysis: String,
          commercialRemedy: String,
          impact: String,
        },
      ],
      lossDrivers: [
        {
          reason: String,
          percentage: Number,
          lostValue: String,
          analysis: String,
          commercialRemedy: String,
          impact: String,
        },
      ],
      competitorAnalysis: [
        {
          competitor: String,
          marketThreat: String,
          pricingDifference: String,
          observedStrength: String,
          competitorStrengths: String,
          vulnerability: String,
          counterStrategy: String,
          floorScript: String,
        },
      ],
      serviceImprovements: [
        {
          area: String,
          impact: String,
          recommendation: String,
          implementationSteps: String,
        },
      ],
      proposalInclusions: [String],
      staffPerformance: {
        type: mongoose.Schema.Types.Mixed,
        default: '',
      },
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
      actionRoadmap: [String],
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
