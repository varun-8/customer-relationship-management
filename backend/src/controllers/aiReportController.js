const AiReport = require('../models/AiReport');
const LostSale = require('../models/LostSale');
const aiService = require('../services/aiService');

/**
 * GET /api/ai-reports/status
 * Returns quota lock status for current month and current year
 */
exports.getReportStatus = async (req, res) => {
  try {
    const today = new Date();
    const currentMonth = today.toISOString().substring(0, 7); // 'YYYY-MM'
    const currentYear = today.getFullYear().toString(); // 'YYYY'

    const [existingMonthly, existingYearly] = await Promise.all([
      AiReport.findOne({ reportType: 'monthly', period: currentMonth }),
      AiReport.findOne({ reportType: 'yearly', period: currentYear }),
    ]);

    res.json({
      success: true,
      currentMonth,
      currentYear,
      monthly: {
        locked: Boolean(existingMonthly),
        reportId: existingMonthly?._id || null,
        generatedAt: existingMonthly?.createdAt || null,
        period: currentMonth,
        title: existingMonthly?.title || null,
      },
      yearly: {
        locked: Boolean(existingYearly),
        reportId: existingYearly?._id || null,
        generatedAt: existingYearly?.createdAt || null,
        period: currentYear,
        title: existingYearly?.title || null,
      },
    });
  } catch (err) {
    console.error('Error fetching AI report status:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/ai-reports/generate
 * Generates an AI report (locked if already generated for that period)
 */
exports.generateReport = async (req, res) => {
  try {
    const { reportType = 'monthly' } = req.body;
    const today = new Date();
    const currentMonth = today.toISOString().substring(0, 7);
    const currentYear = today.getFullYear().toString();

    const period =
      req.body.period || (reportType === 'monthly' ? currentMonth : currentYear);

    // 1. Strict Quota Check: Only once per month and once per year
    const existing = await AiReport.findOne({ reportType, period });
    if (existing) {
      return res.status(409).json({
        success: false,
        locked: true,
        message:
          reportType === 'monthly'
            ? `A monthly report for ${period} has already been generated. Reports are limited to once per calendar month.`
            : `An annual report for ${period} has already been generated. Reports are limited to once per calendar year.`,
        reportId: existing._id,
      });
    }

    // 2. Fetch relevant lost sales records
    let filter = {};
    if (reportType === 'monthly') {
      filter = { dateString: { $regex: `^${period}` } };
    } else {
      filter = { dateString: { $regex: `^${period}` } };
    }

    let records = await LostSale.find(filter).lean();

    // Fallback: If current month has very few deals (e.g. at start of month), incorporate all historical lost sales
    if (records.length < 3) {
      records = await LostSale.find().lean();
    }

    if (!records || records.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          'No lost sales records are available in the system to analyze. Please log lost deals before generating an AI report.',
      });
    }

    // 3. Generate through AI Service
    const reportData = await aiService.generateLostSalesReport({
      lostSales: records,
      reportType,
      period,
    });

    // 4. Store permanently in database
    const savedReport = await AiReport.create({
      reportType,
      period,
      title: reportData.title,
      summary: reportData.summary,
      metrics: reportData.metrics,
      content: reportData.content,
      generatedBy: reportData.generatedBy,
    });

    res.status(201).json({
      success: true,
      message: `${reportType === 'monthly' ? 'Monthly' : 'Yearly'} AI Strategic Report successfully generated!`,
      data: savedReport,
    });
  } catch (err) {
    console.error('Error generating AI report:', err);
    const isNoApiKey = err.code === 'NO_API_KEY' || (err.message && err.message.toLowerCase().includes('api key'));
    const statusCode = err.statusCode || (isNoApiKey ? 400 : 500);
    res.status(statusCode).json({
      success: false,
      code: isNoApiKey ? 'NO_API_KEY' : 'AI_ERROR',
      message: isNoApiKey
        ? 'Google Gemini API Key is missing. Please configure your API key in Settings > Developer Mode to generate AI strategic reports.'
        : (err.message || 'Failed to generate AI report.'),
    });
  }
};

/**
 * GET /api/ai-reports/history
 * Returns list of previously generated reports
 */
exports.getReportsHistory = async (req, res) => {
  try {
    const reports = await AiReport.find()
      .select('reportType period title summary metrics generatedBy createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: reports,
    });
  } catch (err) {
    console.error('Error fetching report history:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/ai-reports/:id
 * Returns single full report
 */
exports.getReportById = async (req, res) => {
  try {
    const report = await AiReport.findById(req.params.id).lean();
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (err) {
    console.error('Error fetching report by ID:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
