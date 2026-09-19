const AiReport = require('../models/AiReport');
const LostSale = require('../models/LostSale');
const DailyKPI = require('../models/DailyKPI');
const Customer = require('../models/Customer');
const SalesTarget = require('../models/SalesTarget');
const aiService = require('../services/aiService');

/**
 * GET /api/ai-reports/status
 * Returns quota lock status for current month and current year
 */
exports.getReportStatus = async (req, res) => {
  try {
    const today = new Date();
    const currentMonth = req.query.month || today.toISOString().substring(0, 7); // 'YYYY-MM'
    const currentYear = req.query.year || today.getFullYear().toString(); // 'YYYY'

    const [existingMonthly, existingYearly, openAiKey, geminiKey] = await Promise.all([
      AiReport.findOne({ reportType: 'monthly', period: currentMonth }),
      AiReport.findOne({ reportType: 'yearly', period: currentYear }),
      aiService.getOpenAiApiKey(),
      aiService.getGeminiApiKey(),
    ]);

    const hasApiKey = Boolean(openAiKey || geminiKey);

    res.json({
      success: true,
      currentMonth,
      currentYear,
      hasApiKey,
      activeProvider: openAiKey ? 'openai' : (geminiKey ? 'gemini' : null),
      monthly: {
        locked: false,
        hasReport: Boolean(existingMonthly),
        reportId: existingMonthly?._id || null,
        generatedAt: existingMonthly?.createdAt || null,
        period: currentMonth,
        title: existingMonthly?.title || null,
        existingReport: existingMonthly || null,
      },
      yearly: {
        locked: false,
        hasReport: Boolean(existingYearly),
        reportId: existingYearly?._id || null,
        generatedAt: existingYearly?.createdAt || null,
        period: currentYear,
        title: existingYearly?.title || null,
        existingReport: existingYearly || null,
      },
    });
  } catch (err) {
    console.error('Error fetching AI report status:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/ai-reports/generate
 * Generates an AI comprehensive business report (all showroom data analyzed)
 */
exports.generateReport = async (req, res) => {
  try {
    const { reportType = 'monthly' } = req.body;
    const today = new Date();
    const currentMonth = today.toISOString().substring(0, 7);
    const currentYear = today.getFullYear().toString();

    const period =
      req.body.period || (reportType === 'monthly' ? currentMonth : currentYear);

    const dateRegex = new RegExp(`^${period}`);

    // Concurrently fetch all showroom operational records for strictly the selected period
    const [kpiRecords, lostSaleRecords, customerDocs, salesTargetDoc] = await Promise.all([
      DailyKPI.find({ dateString: { $regex: dateRegex } }).lean(),
      LostSale.find({ dateString: { $regex: dateRegex } }).lean(),
      Customer.find({}).lean(),
      SalesTarget.findOne({ month: reportType === 'monthly' ? period : { $regex: dateRegex } }).lean(),
    ]);

    // Filter customers strictly matching the selected period (by entryDate or createdAt)
    const periodCustomers = (customerDocs || []).filter((c) => {
      const d = c.data || {};
      const eDate = d.entryDate || (c.createdAt ? new Date(c.createdAt).toISOString().substring(0, 10) : '');
      return eDate.startsWith(period);
    });

    const hasAnyRecords =
      (kpiRecords && kpiRecords.length > 0) ||
      (lostSaleRecords && lostSaleRecords.length > 0) ||
      (periodCustomers && periodCustomers.length > 0);

    if (!hasAnyRecords) {
      return res.status(400).json({
        success: false,
        message: `No showroom operational data (daily KPIs, customer visits, or lost deals) found for ${reportType === 'monthly' ? 'month' : 'year'} "${period}". Only data from the selected period is fed into the AI report. Please ensure showroom activities or lost sales are recorded for ${period}.`,
      });
    }

    // 2. Generate through AI Service (OpenAI ChatGPT or Gemini)
    const reportData = await aiService.generateComprehensiveAiReport({
      kpis: kpiRecords || [],
      customers: periodCustomers || [],
      lostSales: lostSaleRecords || [],
      target: salesTargetDoc || null,
      reportType,
      period,
    });

    // 3. Store in database (Update existing or create new)
    const savedReport = await AiReport.findOneAndUpdate(
      { reportType, period },
      {
        reportType,
        period,
        title: reportData.title,
        summary: reportData.summary,
        metrics: reportData.metrics,
        content: reportData.content,
        generatedBy: reportData.generatedBy,
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: `${reportType === 'monthly' ? 'Monthly' : 'Yearly'} AI Showroom Business Report successfully generated!`,
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
        ? 'AI API Key is missing. Please configure your OpenAI or Gemini API Key in Settings > AI Configuration.'
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
      .select('reportType period title summary metrics content generatedBy createdAt')
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

/**
 * GET /api/ai-reports/chatgpt-prompt
 * Builds complete, formatted ChatGPT prompt with all showroom operational data
 */
exports.getChatGptPrompt = async (req, res) => {
  try {
    const today = new Date();
    const currentMonth = today.toISOString().substring(0, 7);
    const currentYear = today.getFullYear().toString();
    const reportType = req.query.reportType || 'monthly';
    const period = req.query.period || (reportType === 'monthly' ? currentMonth : currentYear);

    const dateRegex = new RegExp(`^${period}`);

    const [kpiRecords, lostSaleRecords, customerDocs, salesTargetDoc] = await Promise.all([
      DailyKPI.find({ dateString: { $regex: dateRegex } }).lean(),
      LostSale.find({ dateString: { $regex: dateRegex } }).lean(),
      Customer.find({}).lean(),
      SalesTarget.findOne({ month: reportType === 'monthly' ? period : { $regex: dateRegex } }).lean(),
    ]);

    const periodCustomers = (customerDocs || []).filter((c) => {
      const d = c.data || {};
      const eDate = d.entryDate || (c.createdAt ? new Date(c.createdAt).toISOString().substring(0, 10) : '');
      return eDate.startsWith(period);
    });

    const hasAnyRecords =
      (kpiRecords && kpiRecords.length > 0) ||
      (lostSaleRecords && lostSaleRecords.length > 0) ||
      (periodCustomers && periodCustomers.length > 0);

    if (!hasAnyRecords) {
      return res.status(400).json({
        success: false,
        message: `No showroom operational data found for ${reportType === 'monthly' ? 'month' : 'year'} "${period}". Please ensure showroom activities or lost sales are recorded for this period before generating a prompt.`,
      });
    }

    const prompt = aiService.buildChatGPTWebPrompt({
      kpis: kpiRecords || [],
      customers: periodCustomers || [],
      lostSales: lostSaleRecords || [],
      target: salesTargetDoc || null,
      reportType,
      period,
    });

    const payload = {
      period,
      reportType,
      recordCount: (kpiRecords?.length || 0) + (lostSaleRecords?.length || 0) + (periodCustomers?.length || 0),
      prompt,
      chatGptUrl: 'https://chatgpt.com/',
    };

    res.json({
      success: true,
      ...payload,
      data: payload,
    });
  } catch (err) {
    console.error('Error generating ChatGPT prompt:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

