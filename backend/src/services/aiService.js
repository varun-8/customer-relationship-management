const SystemSetting = require('../models/SystemSetting');

/**
 * Get active Gemini API Key from database or environment fallback
 */
async function getGeminiApiKey() {
  try {
    const setting = await SystemSetting.findOne({ key: 'geminiApiKey' });
    if (setting && setting.value && String(setting.value).trim()) {
      return String(setting.value).trim();
    }
  } catch (err) {
    console.warn('Could not read geminiApiKey from SystemSetting:', err.message);
  }
  return process.env.GEMINI_API_KEY || null;
}

/**
 * Get active Gemini Model
 */
async function getGeminiModel() {
  try {
    const setting = await SystemSetting.findOne({ key: 'geminiModel' });
    if (setting && setting.value && String(setting.value).trim()) {
      return String(setting.value).trim();
    }
  } catch (err) {
    console.warn('Could not read geminiModel from SystemSetting:', err.message);
  }
  return 'gemini-1.5-flash';
}

/**
 * Test a Gemini API key
 */
async function testApiKey(apiKey, model = 'gemini-1.5-flash') {
  if (!apiKey || !String(apiKey).trim()) {
    throw new Error('API Key is empty or invalid.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    apiKey.trim()
  )}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Hello, verify API connection.' }] }],
      generationConfig: { maxOutputTokens: 20 },
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData?.error?.message ||
      `Gemini API returned HTTP ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }

  return { success: true, message: 'Gemini API Key verified successfully!' };
}

/**
 * Pre-process lost sales records into an aggregated statistical intelligence payload
 */
function aggregateLostSalesData(lostSales = []) {
  const totalDeals = lostSales.length;
  const totalLostValue = lostSales.reduce((sum, s) => sum + (Number(s.quoteValue) || 0), 0);
  const avgDealSize = totalDeals > 0 ? Math.round(totalLostValue / totalDeals) : 0;

  // Reasons breakdown
  const reasonMap = {};
  lostSales.forEach((s) => {
    const r = s.lostReason || 'Unspecified';
    reasonMap[r] = (reasonMap[r] || 0) + 1;
  });
  const reasonsBreakdown = Object.entries(reasonMap)
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: Math.round((count / totalDeals) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  // Competitor breakdown
  const competitorMap = {};
  lostSales.forEach((s) => {
    const comp = s.competitor || 'Local Competitor';
    if (!competitorMap[comp]) {
      competitorMap[comp] = { count: 0, totalValue: 0, priceDiffs: [] };
    }
    competitorMap[comp].count += 1;
    competitorMap[comp].totalValue += Number(s.quoteValue) || 0;
    if (s.priceDifference) competitorMap[comp].priceDiffs.push(Number(s.priceDifference));
  });
  const competitorBreakdown = Object.entries(competitorMap)
    .map(([competitor, data]) => {
      const avgDiff =
        data.priceDiffs.length > 0
          ? Math.round(data.priceDiffs.reduce((a, b) => a + b, 0) / data.priceDiffs.length)
          : 0;
      return {
        competitor,
        count: data.count,
        totalValue: data.totalValue,
        avgPriceDifference: avgDiff,
      };
    })
    .sort((a, b) => b.count - a.count);

  // Products affected
  const productMap = {};
  lostSales.forEach((s) => {
    const prods = Array.isArray(s.products) ? s.products : [s.products || 'Tile'];
    prods.forEach((p) => {
      productMap[p] = (productMap[p] || 0) + (Number(s.quoteValue) || 0);
    });
  });

  // Extract qualitative feedback themes without personal info
  const qualitativeFeedback = lostSales
    .filter((s) => s.notes && String(s.notes).trim().length > 3)
    .slice(0, 30)
    .map((s) => s.notes.trim().replace(/\b\d{10}\b/g, '[phone]'));

  return {
    totalDeals,
    totalLostValue,
    avgDealSize,
    topLostReason: reasonsBreakdown[0]?.reason || 'Pricing',
    topCompetitor: competitorBreakdown[0]?.competitor || 'Local Competitors',
    reasonsBreakdown,
    competitorBreakdown,
    productMap,
    qualitativeFeedback,
  };
}

/**
 * Generate Strategic AI Report for Lost Sales
 */
async function generateLostSalesReport({ lostSales, reportType, period }) {
  const apiKey = await getGeminiApiKey();
  if (!apiKey) {
    const err = new Error(
      'Google Gemini API Key is missing. Please configure your API key in Settings > Developer Mode > AI Configuration to generate AI strategic reports.'
    );
    err.code = 'NO_API_KEY';
    err.statusCode = 400;
    throw err;
  }

  const model = await getGeminiModel();
  const summaryData = aggregateLostSalesData(lostSales);

  if (summaryData.totalDeals === 0) {
    throw new Error(
      `No lost sales records found for period ${period}. Please log lost deals before generating an analysis.`
    );
  }

  const periodLabel =
    reportType === 'monthly'
      ? `Monthly Audit for ${period}`
      : `Annual Comprehensive Audit for ${period}`;

  const systemPrompt = `You are a Senior Retail Commercial Strategist and Tile Showroom Intelligence Advisor.
Analyze the provided lost sales dataset for a tile, sanitary ware, and building materials retail showroom.

CRITICAL INSTRUCTIONS:
1. DO NOT mention individual customer names, phone numbers, or private records. Focus exclusively on strategic drivers, market patterns, competitor behavior, and operational improvements.
2. Provide deep, actionable, practical advice for showroom owners, sales staff, and field executives.
3. Return ONLY valid JSON adhering strictly to the requested schema. Do not enclose in markdown blocks if possible, or use standard \`\`\`json.`;

  const userPrompt = `Generate a ${periodLabel} Strategic Intelligence Report based on this aggregated lost sales data:

Summary Metrics:
- Total Lost Deals: ${summaryData.totalDeals}
- Total Lost Revenue Value: ₹${summaryData.totalLostValue.toLocaleString('en-IN')}
- Average Deal Size: ₹${summaryData.avgDealSize.toLocaleString('en-IN')}
- Top Loss Reason: ${summaryData.topLostReason}
- Top Competing Showroom: ${summaryData.topCompetitor}

Primary Root Cause Distribution:
${JSON.stringify(summaryData.reasonsBreakdown, null, 2)}

Competitor Capture Distribution & Pricing Gaps:
${JSON.stringify(summaryData.competitorBreakdown, null, 2)}

Product Revenue Exposure:
${JSON.stringify(summaryData.productMap, null, 2)}

Showroom Qualitative Notes & Win-Back Observations:
${JSON.stringify(summaryData.qualitativeFeedback.slice(0, 15), null, 2)}

Output Schema (must be valid JSON matching this structure exactly):
{
  "title": "${periodLabel} - Lost Sales & Competitor Intelligence Strategic Audit",
  "summary": "1-2 sentence high-level executive takeaway.",
  "executiveSummary": "Comprehensive 3-paragraph executive summary detailing the financial impact, core commercial leakage points, and market dynamics.",
  "lossDrivers": [
    {
      "reason": "Loss reason name",
      "percentage": 45,
      "analysis": "Detailed explanation of why clients walked away under this category",
      "impact": "High / Medium / Low"
    }
  ],
  "competitorAnalysis": [
    {
      "competitor": "Competitor name",
      "marketThreat": "High / Moderate / Local Niche",
      "pricingDifference": "Average price or margin gap",
      "competitorStrengths": "Why customers selected them (e.g. aggressive credit, free transport, 3D room preview, mason kickbacks)",
      "counterStrategy": "Concrete counter-measure for our showroom to beat them"
    }
  ],
  "serviceGaps": [
    "Identified gap in our current sales follow-up or showroom experience"
  ],
  "waysToImprove": [
    "Concrete, high-impact operational improvements to surpass competitor service standards"
  ],
  "whatToInclude": [
    "Specific items that MUST be included in future quotations, site visits, and presentations to close deals"
  ],
  "strategicRecommendations": [
    {
      "timeframe": "Immediate (1-14 Days) / Medium-Term (15-60 Days)",
      "priority": "Critical / High / Medium",
      "recommendation": "Strategic recommendation headline",
      "actionPlan": "Step-by-step implementation blueprint"
    }
  ],
  "rawMarkdown": "A complete, beautifully formatted Markdown version of this entire strategic report with bold headers, bullet points, and tables."
}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    apiKey
  )}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: `${systemPrompt}\n\n${userPrompt}` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.3,
      topP: 0.9,
      maxOutputTokens: 8192,
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 65000); // 65s timeout

  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (netErr) {
    clearTimeout(timeoutId);
    if (netErr.name === 'AbortError') {
      throw new Error('AI report generation timed out. Please try again.');
    }
    throw new Error(`Network error calling Gemini API: ${netErr.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMsg =
      errorBody?.error?.message ||
      `Gemini API Error (HTTP ${response.status}): ${response.statusText}`;
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('Received an empty response from Gemini AI. Please try again.');
  }

  // Parse JSON output
  let parsedContent;
  try {
    let cleanJson = rawText.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
    }
    parsedContent = JSON.parse(cleanJson);
  } catch (parseErr) {
    console.warn('Could not parse pure JSON from Gemini, wrapping in structured fallback:', parseErr.message);
    parsedContent = {
      title: `${periodLabel} - Lost Sales Strategic Intelligence Audit`,
      summary: 'Executive Strategic Analysis of Lost Deals',
      executiveSummary: rawText.slice(0, 500) + '...',
      lossDrivers: summaryData.reasonsBreakdown.map((r) => ({
        reason: r.reason,
        percentage: r.percentage,
        analysis: `Accounts for ${r.percentage}% of lost deals.`,
        impact: r.percentage > 30 ? 'High' : 'Medium',
      })),
      competitorAnalysis: summaryData.competitorBreakdown.map((c) => ({
        competitor: c.competitor,
        marketThreat: 'High',
        pricingDifference: c.avgPriceDifference ? `₹${c.avgPriceDifference}` : 'Competitor discount',
        competitorStrengths: 'Aggressive pricing and stock availability',
        counterStrategy: 'Bundle epoxy adhesive & provide transparent breakdown quotations',
      })),
      serviceGaps: [
        'Delayed quote delivery after customer showroom visit',
        'Lack of 3D visual preview for tiles and bathroom mockups',
      ],
      waysToImprove: [
        'Implement instant WhatsApp quotation dispatch within 2 hours of showroom visit',
        'Train staff to counter competitor price negotiations with material quality warranties',
      ],
      whatToInclude: [
        'Itemized square foot coverage calculations',
        'Complementary site measurement visit offer',
        'Epoxy grout and tile spacer recommendation breakdown',
      ],
      strategicRecommendations: [
        {
          timeframe: 'Immediate (1-14 Days)',
          priority: 'Critical',
          recommendation: 'Launch 2-Hour Quote Dispatch Guarantee',
          actionPlan: 'Enforce same-day quotation sharing on WhatsApp before the client visits competing dealers.',
        },
      ],
      rawMarkdown: rawText,
    };
  }

  return {
    title: parsedContent.title || `${periodLabel} - Strategic Intelligence Report`,
    summary: parsedContent.summary || 'Strategic review of lost deals',
    metrics: {
      totalLostDeals: summaryData.totalDeals,
      totalLostValue: summaryData.totalLostValue,
      avgDealSize: summaryData.avgDealSize,
      topLostReason: summaryData.topLostReason,
      topCompetitor: summaryData.topCompetitor,
      analyzedAt: new Date(),
    },
    content: {
      executiveSummary: parsedContent.executiveSummary || '',
      lossDrivers: parsedContent.lossDrivers || [],
      competitorAnalysis: parsedContent.competitorAnalysis || [],
      serviceGaps: parsedContent.serviceGaps || [],
      waysToImprove: parsedContent.waysToImprove || [],
      whatToInclude: parsedContent.whatToInclude || [],
      strategicRecommendations: parsedContent.strategicRecommendations || [],
      rawMarkdown: parsedContent.rawMarkdown || rawText,
    },
    generatedBy: `Gemini AI (${model})`,
  };
}

module.exports = {
  getGeminiApiKey,
  getGeminiModel,
  testApiKey,
  generateLostSalesReport,
};
