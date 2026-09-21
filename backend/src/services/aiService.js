const SystemSetting = require('../models/SystemSetting');

/**
 * Get active AI Provider ('openai' or 'gemini')
 */
async function getAiProvider() {
  try {
    const setting = await SystemSetting.findOne({ key: 'aiProvider' });
    if (setting && setting.value && String(setting.value).trim()) {
      return String(setting.value).trim().toLowerCase();
    }
    const openAiKey = await getOpenAiApiKey();
    if (openAiKey) return 'openai';
  } catch (err) {
    console.warn('Could not read aiProvider from SystemSetting:', err.message);
  }
  return 'gemini';
}

/**
 * Get active OpenAI API Key
 */
async function getOpenAiApiKey() {
  try {
    const setting = await SystemSetting.findOne({ key: 'openaiApiKey' });
    if (setting && setting.value && String(setting.value).trim()) {
      return String(setting.value).trim();
    }
  } catch (err) {
    console.warn('Could not read openaiApiKey from SystemSetting:', err.message);
  }
  return process.env.OPENAI_API_KEY || null;
}

/**
 * Get active OpenAI Model
 */
async function getOpenAiModel() {
  try {
    const setting = await SystemSetting.findOne({ key: 'openaiModel' });
    if (setting && setting.value && String(setting.value).trim()) {
      return String(setting.value).trim();
    }
  } catch (err) {
    console.warn('Could not read openaiModel from SystemSetting:', err.message);
  }
  return 'gpt-4o-mini';
}

/**
 * Test an OpenAI API key
 */
async function testOpenAiApiKey(apiKey, model = 'gpt-4o-mini') {
  if (!apiKey || !String(apiKey).trim()) {
    throw new Error('OpenAI API Key is empty or invalid.');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: model.trim() || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say hello.' }],
      max_tokens: 10,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message =
      errorData?.error?.message ||
      `OpenAI API returned HTTP ${res.status}: ${res.statusText}`;
    throw new Error(message);
  }

  return { success: true, message: 'OpenAI (ChatGPT) API Key verified successfully!' };
}

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

  // Deal size tiers
  const dealTiers = {
    highValue: { count: 0, totalValue: 0, label: 'High-Value Project Deals (> ₹1,00,000)' },
    midValue: { count: 0, totalValue: 0, label: 'Mid-Value Residential Deals (₹35,000 - ₹1,00,000)' },
    retailValue: { count: 0, totalValue: 0, label: 'Retail / Walk-in Renovations (< ₹35,000)' },
  };

  lostSales.forEach((s) => {
    const val = Number(s.quoteValue) || 0;
    if (val >= 100000) {
      dealTiers.highValue.count += 1;
      dealTiers.highValue.totalValue += val;
    } else if (val >= 35000) {
      dealTiers.midValue.count += 1;
      dealTiers.midValue.totalValue += val;
    } else {
      dealTiers.retailValue.count += 1;
      dealTiers.retailValue.totalValue += val;
    }
  });

  // Reasons breakdown with lost revenue per reason
  const reasonMap = {};
  lostSales.forEach((s) => {
    const r = s.lostReason || 'Unspecified';
    if (!reasonMap[r]) {
      reasonMap[r] = { count: 0, totalValue: 0 };
    }
    reasonMap[r].count += 1;
    reasonMap[r].totalValue += Number(s.quoteValue) || 0;
  });
  const reasonsBreakdown = Object.entries(reasonMap)
    .map(([reason, data]) => ({
      reason,
      count: data.count,
      totalLostValue: data.totalValue,
      percentage: totalDeals > 0 ? Math.round((data.count / totalDeals) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Competitor breakdown with price gap calculations
  const competitorMap = {};
  lostSales.forEach((s) => {
    const comp = s.competitor || 'Local Competitor';
    if (!competitorMap[comp]) {
      competitorMap[comp] = { count: 0, totalValue: 0, priceDiffs: [], priceDiffPcts: [] };
    }
    competitorMap[comp].count += 1;
    competitorMap[comp].totalValue += Number(s.quoteValue) || 0;
    if (s.priceDifference) competitorMap[comp].priceDiffs.push(Number(s.priceDifference));
    if (s.priceDiffPercentage) competitorMap[comp].priceDiffPcts.push(Number(s.priceDiffPercentage));
  });
  const competitorBreakdown = Object.entries(competitorMap)
    .map(([competitor, data]) => {
      const avgDiff =
        data.priceDiffs.length > 0
          ? Math.round(data.priceDiffs.reduce((a, b) => a + b, 0) / data.priceDiffs.length)
          : 0;
      const avgDiffPct =
        data.priceDiffPcts.length > 0
          ? (data.priceDiffPcts.reduce((a, b) => a + b, 0) / data.priceDiffPcts.length).toFixed(1)
          : null;
      return {
        competitor,
        count: data.count,
        totalValue: data.totalValue,
        avgPriceDifference: avgDiff,
        avgPriceDifferencePercentage: avgDiffPct ? `${avgDiffPct}%` : 'Not recorded',
      };
    })
    .sort((a, b) => b.count - a.count);

  // Products affected breakdown
  const productMap = {};
  lostSales.forEach((s) => {
    const prods = Array.isArray(s.products) ? s.products : [s.products || 'Tile'];
    prods.forEach((p) => {
      if (!productMap[p]) {
        productMap[p] = { count: 0, totalValue: 0 };
      }
      productMap[p].count += 1;
      productMap[p].totalValue += Number(s.quoteValue) || 0;
    });
  });
  const productBreakdown = Object.entries(productMap)
    .map(([product, data]) => ({
      product,
      dealsAffected: data.count,
      totalLostValue: data.totalValue,
      shareOfLostRevenue: totalLostValue > 0 ? `${Math.round((data.totalValue / totalLostValue) * 100)}%` : '0%',
    }))
    .sort((a, b) => b.totalLostValue - a.totalLostValue);

  // Salesperson loss distribution
  const salespersonMap = {};
  lostSales.forEach((s) => {
    const sp = s.salesperson || 'Unassigned';
    if (!salespersonMap[sp]) {
      salespersonMap[sp] = { count: 0, totalValue: 0, topReasons: {} };
    }
    salespersonMap[sp].count += 1;
    salespersonMap[sp].totalValue += Number(s.quoteValue) || 0;
    const r = s.lostReason || 'Other';
    salespersonMap[sp].topReasons[r] = (salespersonMap[sp].topReasons[r] || 0) + 1;
  });
  const salespersonStats = Object.entries(salespersonMap)
    .map(([salesperson, data]) => {
      const topR = Object.entries(data.topReasons).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Pricing';
      return {
        salesperson,
        lostDeals: data.count,
        lostRevenue: data.totalValue,
        primaryDropReason: topR,
      };
    })
    .sort((a, b) => b.lostRevenue - a.lostRevenue);

  // Overall Price Difference metrics
  const allPriceDiffs = lostSales.map((s) => Number(s.priceDifference)).filter((v) => v > 0);
  const avgOverallPriceGap =
    allPriceDiffs.length > 0
      ? Math.round(allPriceDiffs.reduce((a, b) => a + b, 0) / allPriceDiffs.length)
      : 0;

  // Extract qualitative feedback themes without personal info
  const qualitativeFeedback = lostSales
    .filter((s) => s.notes && String(s.notes).trim().length > 3)
    .slice(0, 35)
    .map((s) => s.notes.trim().replace(/\b\d{10}\b/g, '[phone]'));

  return {
    totalDeals,
    totalLostValue,
    avgDealSize,
    dealTiers,
    topLostReason: reasonsBreakdown[0]?.reason || 'Pricing',
    topCompetitor: competitorBreakdown[0]?.competitor || 'Local Competitors',
    reasonsBreakdown,
    competitorBreakdown,
    productBreakdown,
    salespersonStats,
    avgOverallPriceGap,
    qualitativeFeedback,
  };
}

/**
 * Pre-process all showroom operational collections into a compact, token-efficient intelligence payload
 */
function aggregateShowroomBusinessData({
  kpis = [],
  customers = [],
  lostSales = [],
  target = null,
  reportType = 'monthly',
  period,
}) {
  // 1. KPI aggregates (Revenue, Orders, Walkins, Quotes, Followups)
  let totalRevenue = 0;
  let totalOrders = 0;
  let totalWalkins = 0;
  let totalQuotes = 0;
  let totalFollowups = 0;
  let repeatCustomersCount = 0;
  const staffKpiMap = {};

  kpis.forEach((k) => {
    const rev = Number(k.salesValue) || 0;
    const ords = Number(k.ordersCount) || Number(k.walkins?.orders) || 0;
    const visits = Number(k.walkins?.visits) || 0;
    const quotes = Number(k.walkins?.quotes) || 0;
    const followups = Number(k.followUpsCount) || 0;
    const repeats = Number(k.oldCustomersCount) || 0;

    totalRevenue += rev;
    totalOrders += ords;
    totalWalkins += visits;
    totalQuotes += quotes;
    totalFollowups += followups;
    repeatCustomersCount += repeats;

    const sName = k.staffName || 'Unassigned';
    if (!staffKpiMap[sName]) {
      staffKpiMap[sName] = { visits: 0, quotes: 0, orders: 0, revenue: 0 };
    }
    staffKpiMap[sName].visits += visits;
    staffKpiMap[sName].quotes += quotes;
    staffKpiMap[sName].orders += ords;
    staffKpiMap[sName].revenue += rev;
  });

  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const visitToQuoteRate = totalWalkins > 0 ? ((totalQuotes / totalWalkins) * 100).toFixed(1) : '0.0';
  const quoteToOrderRate = totalQuotes > 0 ? ((totalOrders / totalQuotes) * 100).toFixed(1) : '0.0';
  const overallConversionRate = totalWalkins > 0 ? ((totalOrders / totalWalkins) * 100).toFixed(1) : '0.0';

  // Target comparison
  const defaultTarget = reportType === 'monthly' ? 2500000 : 30000000;
  const targetRevenue = (target && Number(target.showroomTarget)) || defaultTarget;
  const targetAchievementPct = targetRevenue > 0 ? Math.round((totalRevenue / targetRevenue) * 100) : 0;

  // 2. Customer Inquiries Breakdown
  const customerTypeMap = {};
  const customerStatusMap = {};
  customers.forEach((c) => {
    const d = c.data || {};
    const cType = d.customerType || c.customerType || 'Retail Homeowner';
    const cStatus = d.status || c.status || 'Active';
    customerTypeMap[cType] = (customerTypeMap[cType] || 0) + 1;
    customerStatusMap[cStatus] = (customerStatusMap[cStatus] || 0) + 1;
  });

  // 3. Lost Sales Breakdown (using existing helper)
  const lostSummary = aggregateLostSalesData(lostSales);

  // 4. Staff Performance merged
  const staffPerformance = Object.entries(staffKpiMap).map(([name, data]) => {
    const lostByStaff = lostSales.filter((s) => s.salesperson === name);
    const lostRev = lostByStaff.reduce((sum, s) => sum + (Number(s.quoteValue) || 0), 0);
    const convPct = data.visits > 0 ? Math.round((data.orders / data.visits) * 100) : 0;
    return {
      staffName: name,
      walkinVisits: data.visits,
      quotesGiven: data.quotes,
      ordersClosed: data.orders,
      revenueGenerated: data.revenue,
      lostDeals: lostByStaff.length,
      lostRevenue: lostRev,
      conversionRate: `${convPct}%`,
    };
  });

  return {
    period,
    reportType,
    totalRevenue,
    totalOrders,
    avgOrderValue,
    targetRevenue,
    targetAchievementPct,
    totalWalkins,
    totalQuotes,
    totalFollowups,
    repeatCustomersCount,
    visitToQuoteRate: `${visitToQuoteRate}%`,
    quoteToOrderRate: `${quoteToOrderRate}%`,
    overallConversionRate: `${overallConversionRate}%`,
    totalCustomerInquiries: customers.length,
    customerTypeBreakdown: customerTypeMap,
    customerStatusBreakdown: customerStatusMap,
    lostSalesSummary: lostSummary,
    staffPerformance,
  };
}

/**
 * Generate Comprehensive AI Business Report for the Showroom
 */
async function generateComprehensiveAiReport({
  kpis = [],
  customers = [],
  lostSales = [],
  target = null,
  reportType = 'monthly',
  period,
}) {
  const provider = await getAiProvider();
  let apiKey, model, isUsingOpenAi = false;

  if (provider === 'openai') {
    apiKey = await getOpenAiApiKey();
    model = await getOpenAiModel();
    isUsingOpenAi = true;
  } else {
    apiKey = await getGeminiApiKey();
    model = await getGeminiModel();
    if (!apiKey) {
      const openAiKey = await getOpenAiApiKey();
      if (openAiKey) {
        apiKey = openAiKey;
        model = await getOpenAiModel();
        isUsingOpenAi = true;
      }
    }
  }

  if (!apiKey) {
    const err = new Error(
      'AI API Key is missing. Please configure your OpenAI (ChatGPT) or Google Gemini API Key in Settings > AI Configuration.'
    );
    err.code = 'NO_API_KEY';
    err.statusCode = 400;
    throw err;
  }

  // Aggregate all showroom operational data into a compact token-efficient summary
  const summary = aggregateShowroomBusinessData({
    kpis,
    customers,
    lostSales,
    target,
    reportType,
    period,
  });

  const periodLabel =
    reportType === 'monthly'
      ? `Monthly Showroom Business Report (${period})`
      : `Annual Showroom Business Report (${period})`;

  const systemPrompt = `You are a Senior Showroom Growth Director and Retail Operations Advisor for "Vasantham Tiles & Sanitary Wares" (a premier multi-brand showroom selling Vitrified/Ceramic Tiles, Large Slabs, Sanitary Wares, CP Fittings, Bath Vanities, Tile Adhesives/Epoxy, and Kitchen Sinks).
Your mission is to analyze all showroom operational data (Revenue, Walk-ins, Quotations, Customer Inquiries, and Lost Sales) and deliver a MODERN, COLORFUL, MINIMALISTIC BUSINESS REPORT.

CRITICAL TONE & FORMAT RULES:
1. CLEAR & SIMPLE WORDS: Explain findings in simple, direct, plain English that showroom owners, floor managers, and sales staff immediately understand. No long academic essays. No corporate jargon.
2. COLORFUL & VIBRANT STRUCTURE:
   - Emerald Green (#10B981) for Revenue & Sales Wins
   - Indigo (#6366F1) for Walk-ins, Quotations & Customer Inquiries
   - Rose Red (#EF4444) for Competitor Losses & Price Undercuts
   - Amber Gold (#F59E0B) for Conversion Rates & Sales Targets
3. HIGH COMMERCIAL IMPACT:
   - Never recommend blindly cutting prices. In tiles and sanitary ware, price matching destroys margins.
   - Teach staff to bundle essential accessories (Tile + Polymer Adhesive + Epoxy Grout + Leveling Spacers) so rival bare-tile quotes look incomplete.
   - Emphasize speed-to-quote (under 90-minute digital WhatsApp quote dispatch with itemized wastage).
   - Address Mason / Plumber trade dynamics with ethical loyalty and technical laying guarantees.
4. STRICT PRIVACY: Never mention individual customer names or phone numbers.
5. STRICT JSON OUTPUT: Return strictly valid, parseable JSON matching the exact schema specified below.`;

  const userPrompt = `Generate the ${periodLabel} using this compact showroom operational dataset:

=== 1. FINANCIAL & FOOTFALL KPI SNAPSHOT ===
- Total Revenue: ₹${summary.totalRevenue.toLocaleString('en-IN')}
- Sales Target: ₹${summary.targetRevenue.toLocaleString('en-IN')} (Achievement: ${summary.targetAchievementPct}%)
- Total Orders Closed: ${summary.totalOrders} (Avg Order Value: ₹${summary.avgOrderValue.toLocaleString('en-IN')})
- Walk-in Visits: ${summary.totalWalkins}
- Quotations Given: ${summary.totalQuotes} (Visit-to-Quote: ${summary.visitToQuoteRate})
- Overall Walk-in Conversion: ${summary.overallConversionRate}
- Customer Follow-ups Logged: ${summary.totalFollowups}
- Repeat Customers Welcomed: ${summary.repeatCustomersCount}

=== 2. CUSTOMER LEADS & INQUIRIES (${summary.totalCustomerInquiries} Total) ===
- Customer Types: ${JSON.stringify(summary.customerTypeBreakdown)}
- Pipeline Status: ${JSON.stringify(summary.customerStatusBreakdown)}

=== 3. COMPETITIVE LEAKAGE & LOST DEALS ===
- Total Lost Deals: ${summary.lostSalesSummary.totalDeals}
- Total Lost Revenue Exposure: ₹${summary.lostSummary?.totalLostValue ? summary.lostSummary.totalLostValue.toLocaleString('en-IN') : summary.lostSalesSummary.totalLostValue.toLocaleString('en-IN')}
- Top Drop Reason: ${summary.lostSalesSummary.topLostReason}
- Chief Competitor: ${summary.lostSalesSummary.topCompetitor}
- Average Price Gap on Lost Deals: ₹${summary.lostSalesSummary.avgOverallPriceGap.toLocaleString('en-IN')}
- Root Causes Breakdown: ${JSON.stringify(summary.lostSalesSummary.reasonsBreakdown.slice(0, 5))}
- Competitors Breakdown: ${JSON.stringify(summary.lostSalesSummary.competitorBreakdown.slice(0, 5))}
- Product Categories Lost: ${JSON.stringify(summary.lostSalesSummary.productBreakdown.slice(0, 5))}

=== 4. STAFF PERFORMANCE SNAPSHOT ===
${JSON.stringify(summary.staffPerformance, null, 2)}

=== REQUIRED JSON OUTPUT SCHEMA ===
Return a pure JSON object adhering strictly to this schema:
{
  "title": "${periodLabel}",
  "summary": "Crisp 2-sentence executive overview in simple words summarizing showroom revenue, footfall conversion, and main opportunity.",
  "showroomOverview": "Concise 3-bullet points overview explaining: (1) Total Sales vs Target; (2) Walk-in to Quote to Order funnel; (3) Lost revenue risk.",
  "strengths": [
    "Simple words bullet 1 highlighting a positive showroom win (e.g. good footfall, repeat buyers)",
    "Simple words bullet 2 highlighting another operational strength"
  ],
  "areasToImprove": [
    {
      "title": "Clear Action Title (e.g., Fast 90-Min Quotation Dispatch)",
      "category": "Quotation Turnaround / Product Bundling / Trade Influencer / Follow-up",
      "problem": "Simple explanation of what is hurting sales in plain words.",
      "solution": "Clear step-by-step fix that sales staff can execute immediately.",
      "impact": "Concrete business benefit (e.g., +₹1.5 Lakh monthly sales)",
      "color": "#6366F1"
    },
    {
      "title": "Clear Action Title 2 (e.g., Bundle Tile Adhesive & Epoxy Grout)",
      "category": "Quotation Turnaround / Product Bundling / Trade Influencer / Follow-up",
      "problem": "Simple explanation of what is hurting sales.",
      "solution": "Clear fix for sales staff.",
      "impact": "Concrete business benefit",
      "color": "#10B981"
    },
    {
      "title": "Clear Action Title 3 (e.g., Mason & Plumber Partner Program)",
      "category": "Quotation Turnaround / Product Bundling / Trade Influencer / Follow-up",
      "problem": "Simple explanation of what is hurting sales.",
      "solution": "Clear fix for sales staff.",
      "impact": "Concrete business benefit",
      "color": "#F59E0B"
    },
    {
      "title": "Clear Action Title 4 (e.g., Counter Competitor Cash Discounts)",
      "category": "Quotation Turnaround / Product Bundling / Trade Influencer / Follow-up",
      "problem": "Simple explanation of why customers lean towards rival discounts.",
      "solution": "How to frame total project cost and transit guarantees instead of dropping price.",
      "impact": "Concrete business benefit",
      "color": "#EF4444"
    }
  ],
  "staffPerformance": "Brief 2-sentence observation on staff conversion and floor quotation discipline.",
  "actionRoadmap": [
    "Week 1: Concrete floor action for sales executives",
    "Week 2: Concrete quotation or customer follow-up standard",
    "Week 3: Mason & contractor relationship outreach",
    "Week 4: Review conversion rates and monthly sales growth"
  ],
  "rootCauses": [
    {
      "reason": "Top loss reason",
      "percentage": 40,
      "lostValue": "₹X,XX,XXX",
      "analysis": "Simple explanation of why customers dropped this deal.",
      "commercialRemedy": "Concrete showroom script/action to win this deal."
    }
  ],
  "competitorAnalysis": [
    {
      "competitor": "Top competitor showroom",
      "observedStrength": "Why customers went there in simple words.",
      "vulnerability": "Their trade weakness (e.g. batch shade mismatch, unrectified edges).",
      "counterStrategy": "How Vasantham staff wins without cutting price.",
      "floorScript": "Exact 1-line script for sales staff when customer mentions competitor price."
    }
  ],
  "serviceImprovements": [
    {
      "area": "Sales Floor Standard",
      "impact": "High",
      "recommendation": "Simple operational standard to follow.",
      "implementationSteps": "Step 1, Step 2"
    }
  ],
  "proposalInclusions": [
    "Itemized 8-10% tile wastage coverage",
    "Transit zero-breakage replacement guarantee",
    "Tile adhesive and epoxy grout coverage guarantee"
  ],
  "rawMarkdown": "A complete, modern Markdown document with bold headings, colorful badges, and clear simple words explanations."
}`;

  let rawText;

  if (isUsingOpenAi) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 75000);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const errorMsg =
          errorBody?.error?.message ||
          `OpenAI API Error (HTTP ${response.status}): ${response.statusText}`;
        throw new Error(errorMsg);
      }

      const data = await response.json();
      rawText = data?.choices?.[0]?.message?.content;
    } catch (netErr) {
      clearTimeout(timeoutId);
      if (netErr.name === 'AbortError') {
        throw new Error('OpenAI report generation timed out. Please try again.');
      }
      throw new Error(`Error calling OpenAI API: ${netErr.message}`);
    } finally {
      clearTimeout(timeoutId);
    }
  } else {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
      apiKey
    )}`;

    const payload = {
      contents: [
        {
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 8192,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 65000);

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
    rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  }

  if (!rawText) {
    throw new Error('Received an empty response from AI engine. Please try again.');
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
    console.warn('Could not parse pure JSON from AI, wrapping in structured fallback:', parseErr.message);
    parsedContent = {
      title: `${periodLabel} - Business Overview & Improvement Plan`,
      summary: `Showroom Performance Audit for ${period}. Total Revenue: ₹${summary.totalRevenue.toLocaleString('en-IN')}, Walk-in Conversion: ${summary.overallConversionRate}.`,
      showroomOverview: `Achieved ₹${summary.totalRevenue.toLocaleString('en-IN')} in sales across ${summary.totalOrders} closed orders with ${summary.totalWalkins} walk-ins.`,
      strengths: [
        `Maintained steady customer footfall with ${summary.totalWalkins} walk-in visits.`,
        `Welcomed ${summary.repeatCustomersCount} loyal repeat customers during this period.`,
      ],
      areasToImprove: [
        {
          title: 'Speed Up Quotation Response',
          category: 'Quotation Turnaround',
          problem: 'Customers leave without a printed or WhatsApp quote and visit competitors.',
          solution: 'Send itemized WhatsApp PDF quotation within 90 minutes of showroom visit.',
          impact: '+15% to 20% quote conversion rate',
          color: '#6366F1',
        },
        {
          title: 'Bundle Tile Adhesive & Epoxy Grout',
          category: 'Product Bundling',
          problem: 'Competitors quote bare tile prices, making our full solution look expensive.',
          solution: 'Highlight that rival quotes miss mandatory adhesives, spacers, and waterproof epoxy.',
          impact: '+₹1,00,000 to ₹2,50,000 added revenue',
          color: '#10B981',
        },
        {
          title: 'Mason & Contractor Outreach',
          category: 'Trade Influencer',
          problem: 'Masons steer homeowners to rival dealers who offer secret kickbacks.',
          solution: 'Establish a transparent Mason Loyalty Program with certified laying support.',
          impact: 'Reclaims 3 to 5 lost project deals monthly',
          color: '#F59E0B',
        },
      ],
      staffPerformance: 'Encourage sales team to follow up on every quote within 24 hours.',
      actionRoadmap: [
        'Week 1: Enforce 90-minute digital WhatsApp quote SLA.',
        'Week 2: Train staff to bundle adhesive & epoxy with every tile quote.',
        'Week 3: Visit 10 local civil contractors and tile masons.',
        'Week 4: Review conversion rates in weekly management meeting.',
      ],
      rawMarkdown: rawText,
    };
  }

  // Cross-normalize all fields
  const rootCauses = (parsedContent.rootCauses || parsedContent.lossDrivers || []).map((rc) => ({
    reason: rc.reason || 'Pricing',
    percentage: rc.percentage || 0,
    lostValue: rc.lostValue || '',
    analysis: rc.analysis || '',
    commercialRemedy: rc.commercialRemedy || '',
    impact: rc.impact || 'High',
  }));

  const competitorAnalysis = (parsedContent.competitorAnalysis || []).map((c) => ({
    competitor: c.competitor || 'Competitor',
    observedStrength: c.observedStrength || c.competitorStrengths || 'Lower prices',
    vulnerability: c.vulnerability || 'Product quality or batch inconsistency',
    counterStrategy: c.counterStrategy || 'Value bundling and transit guarantee',
    floorScript: c.floorScript || 'Our quotes include genuine grade-A lots and transit protection.',
    marketThreat: 'High',
  }));

  const areasToImprove = (parsedContent.areasToImprove || []).map((item) => ({
    title: item.title || 'Actionable Improvement',
    category: item.category || 'Operations',
    problem: item.problem || '',
    solution: item.solution || '',
    impact: item.impact || 'High Impact',
    color: item.color || '#6366F1',
  }));

  const serviceImprovements = (parsedContent.serviceImprovements || []).map((si) => ({
    area: si.area || 'Sales Floor Standard',
    recommendation: si.recommendation || '',
    impact: si.impact || 'High',
    implementationSteps: si.implementationSteps || '',
  }));

  const proposalInclusions = parsedContent.proposalInclusions || parsedContent.whatToInclude || [
    'Itemized tile coverage with 8-10% standard wastage calculation',
    'Certified polymer adhesive and waterproof epoxy grout recommendation',
    'Zero-breakage transit replacement guarantee',
  ];

  const actionRoadmap = parsedContent.actionRoadmap || [
    'Enforce 90-minute WhatsApp quotation turnaround standard.',
    'Bundle adhesives and grouts on all tile quotations.',
    'Conduct contractor and mason loyalty engagement visits.',
  ];

  return {
    title: parsedContent.title || `${periodLabel} - Business Report`,
    summary: parsedContent.summary || `Showroom performance and strategic improvement report for ${period}`,
    metrics: {
      totalRevenue: summary.totalRevenue,
      totalOrders: summary.totalOrders,
      totalQuotes: summary.totalQuotes,
      totalWalkins: summary.totalWalkins,
      conversionRate: summary.overallConversionRate,
      totalFollowups: summary.totalFollowups,
      repeatCustomersCount: summary.repeatCustomersCount,
      totalCustomerInquiries: summary.totalCustomerInquiries,
      totalLostDeals: summary.lostSalesSummary.totalDeals,
      totalLostValue: summary.lostSalesSummary.totalLostValue,
      avgDealSize: summary.lostSalesSummary.avgDealSize,
      topLostReason: summary.lostSalesSummary.topLostReason,
      topCompetitor: summary.lostSalesSummary.topCompetitor,
      analyzedAt: new Date(),
    },
    content: {
      showroomOverview: parsedContent.showroomOverview || parsedContent.summary || '',
      strengths: parsedContent.strengths || [],
      areasToImprove,
      staffPerformance: parsedContent.staffPerformance || '',
      actionRoadmap,
      executiveSummary: parsedContent.executiveSummary || parsedContent.summary || '',
      rootCauses,
      lossDrivers: rootCauses,
      competitorAnalysis,
      serviceImprovements,
      serviceGaps: serviceImprovements.map((s) => s.area),
      waysToImprove: areasToImprove.map((a) => a.solution),
      proposalInclusions,
      whatToInclude: proposalInclusions,
      rawMarkdown: parsedContent.rawMarkdown || rawText,
    },
    generatedBy: isUsingOpenAi ? `OpenAI ChatGPT (${model})` : `Gemini AI (${model})`,
  };
}

/**
 * Build a minimalistic, executive-grade prompt formatted for pasting into chatgpt.com
 * Feeds compact showroom data (Revenue, Walkins, Inquiries, Lost Sales) and requests a modern PDF report
 */
function buildChatGPTWebPrompt({
  kpis = [],
  customers = [],
  lostSales = [],
  target = null,
  reportType = 'monthly',
  period,
}) {
  const summary = aggregateShowroomBusinessData({
    kpis,
    customers,
    lostSales,
    target,
    reportType,
    period,
  });

  const periodLabel =
    reportType === 'monthly'
      ? `Monthly Showroom Business & Insights Report (${period})`
      : `Annual Showroom Business & Insights Report (${period})`;

  const reasonsTable = summary.lostSalesSummary.reasonsBreakdown
    .map((r) => `| ${r.reason} | ${r.count} | ₹${r.totalLostValue.toLocaleString('en-IN')} | ${r.percentage}% |`)
    .join('\n');

  const competitorTable = summary.lostSalesSummary.competitorBreakdown
    .map((c) => `| ${c.competitor} | ${c.count} | ₹${c.totalValue.toLocaleString('en-IN')} | ₹${c.avgPriceDifference.toLocaleString('en-IN')} |`)
    .join('\n');

  const productTable = summary.lostSalesSummary.productBreakdown
    .map((p) => `| ${p.product} | ${p.dealsAffected} | ₹${p.totalLostValue.toLocaleString('en-IN')} | ${p.shareOfLostRevenue} |`)
    .join('\n');

  const staffTable = summary.staffPerformance
    .map((s) => `| ${s.staffName} | ${s.walkinVisits} | ${s.quotesGiven} | ${s.ordersClosed} | ₹${s.revenueGenerated.toLocaleString('en-IN')} | ${s.conversionRate} | ${s.lostDeals} |`)
    .join('\n');

  return `# PROMPT: MINIMALISTIC SHOWROOM BUSINESS REPORT & PDF GENERATION

**Role & Objective:**
You are an expert Showroom Commercial Director and Retail Growth Advisor.
This analysis is specifically for getting direct business insights from our showroom operational data ("Vasantham Tiles & Sanitary Wares" — selling Vitrified/Ceramic Tiles, Sanitary Ware, Bath Fittings, and Allied Building Materials) for: **${periodLabel}**.

**Core Instruction:**
Generate a **MINIMALISTIC, CLEAR, MODERN BUSINESS REPORT** formatted as a **PRINT-READY PDF DOCUMENT**.
⚠️ **STRICT CONSTRAINT: NO LONG ESSAYS. NO ACADEMIC FLUFF OR VERBOSE PARAGRAPHS.**
Use **CLEAR, SIMPLE WORDS** with a vibrant, modern layout:
- 🟢 **Emerald Green** for Revenue & Sales Wins
- 🔵 **Indigo** for Walk-ins, Quotations & Customer Inquiries
- 🔴 **Rose Red** for Competitor Losses & Price Undercuts
- 🟡 **Amber Gold** for Conversion Rates & Sales Targets

---

### COMPACT SHOWROOM OPERATIONAL DATASET (${period.toUpperCase()}):

#### 1. 📊 Executive Financial & Footfall Snapshot:
- **Total Revenue:** ₹${summary.totalRevenue.toLocaleString('en-IN')} / Target: ₹${summary.targetRevenue.toLocaleString('en-IN')} (${summary.targetAchievementPct}% achieved)
- **Closed Orders:** ${summary.totalOrders} (Average Order Value: ₹${summary.avgOrderValue.toLocaleString('en-IN')})
- **Walk-in Customer Visits:** ${summary.totalWalkins}
- **Quotations Issued:** ${summary.totalQuotes} (Visit-to-Quote Rate: ${summary.visitToQuoteRate})
- **Overall Walk-in Conversion:** ${summary.overallConversionRate}
- **Follow-up Calls / Visits:** ${summary.totalFollowups}
- **Repeat Customers:** ${summary.repeatCustomersCount}
- **Customer Inquiries Logged:** ${summary.totalCustomerInquiries}

#### 2. 👥 Customer Lead Types & Pipeline:
- Customer Types: ${Object.entries(summary.customerTypeBreakdown).map(([k, v]) => `${k} (${v})`).join(', ') || 'Retail Homeowners'}
- Deal Stages: ${Object.entries(summary.customerStatusBreakdown).map(([k, v]) => `${k} (${v})`).join(', ') || 'Active'}

#### 3. 📉 Lost Sales & Competitive Leakage:
- **Total Lost Deals:** ${summary.lostSalesSummary.totalDeals}
- **Lost Revenue Exposure:** ₹${summary.lostSalesSummary.totalLostValue.toLocaleString('en-IN')}
- **Top Loss Reason:** ${summary.lostSalesSummary.topLostReason}
- **Chief Competitor:** ${summary.lostSalesSummary.topCompetitor}
- **Average Price Undercut:** ₹${summary.lostSalesSummary.avgOverallPriceGap.toLocaleString('en-IN')}

${summary.lostSalesSummary.reasonsBreakdown.length > 0 ? `| Primary Drop Reason | Deals | Value Lost | % Share |\n|---|---|---|---|\n${reasonsTable}\n` : ''}
${summary.lostSalesSummary.competitorBreakdown.length > 0 ? `| Competing Dealer | Deals Won | Value Lost | Avg Price Gap |\n|---|---|---|---|\n${competitorTable}\n` : ''}
${summary.lostSalesSummary.productBreakdown.length > 0 ? `| Product Category | Deals | Value Lost | Revenue Share |\n|---|---|---|---|\n${productTable}\n` : ''}

${summary.staffPerformance.length > 0 ? `#### 4. 👨‍💼 Sales Executive Performance:\n| Staff Member | Visits | Quotes | Orders | Revenue | Conv % | Lost Deals |\n|---|---|---|---|---|---|---|\n${staffTable}\n` : ''}

---

### REQUIRED REPORT STRUCTURE (MODERN, CLEAN, PRINT-READY PDF):

#### 1. 📊 Executive Overview (Simple Numbers & Plain English)
- KPI Scorecard Table summarizing Revenue, Footfall, Conversion %, and Lost Revenue.
- A concise 2-sentence summary in simple words explaining overall showroom health.

#### 2. 🌟 Key Strengths & Wins
- 2-3 bullet points highlighting positive trends (e.g. footfall, repeat buyers, top product categories).

#### 3. 🎯 Areas to Improve (Actionable Showroom Floor Fixes)
Provide 3 to 4 clear, high-impact improvements with this structure:
- **Title:** Punchy action name (e.g., "Fast 90-Minute WhatsApp Quotations", "Bundle Tile Adhesive & Epoxy Grout", "Mason & Plumber Loyalty Program").
- **Problem (in plain words):** 1 sentence explaining what is currently costing the showroom money.
- **Solution (for sales staff):** 1-2 sentences with concrete action sales staff must take.
- **Expected Impact:** Estimated revenue gain or conversion increase.

#### 4. 💬 On-Floor Verbal Scripts (For Sales Executives)
- Two 1-line verbal scripts for showroom sales staff when customers say: "Competitor is cheaper." (Focus on grade-A lots, transit zero-breakage guarantee, and adhesive bundling).

#### 5. ✅ Quick-Win Management Action Checklist
- A 4-point immediate management checklist for this month.

  Generate the complete, modern, colorful, minimalistic PDF-ready report now.`;
}

/**
 * Build a minimalistic, executive-grade prompt formatted for pasting into Google Gemini (gemini.google.com)
 */
function buildGeminiWebPrompt(params) {
  // Uses the exact same comprehensive dataset structure optimized for Gemini AI model input
  const basePrompt = buildChatGPTWebPrompt(params);
  return basePrompt.replace('# PROMPT: MINIMALISTIC SHOWROOM BUSINESS REPORT & PDF GENERATION', '# GEMINI AI PROMPT: SHOWROOM BUSINESS INTELLIGENCE & PDF REPORT GENERATION');
}

// Backward compatibility alias: generateLostSalesReport calls generateComprehensiveAiReport
const generateLostSalesReport = generateComprehensiveAiReport;

module.exports = {
  getAiProvider,
  getOpenAiApiKey,
  getOpenAiModel,
  testOpenAiApiKey,
  getGeminiApiKey,
  getGeminiModel,
  testApiKey,
  aggregateLostSalesData,
  aggregateShowroomBusinessData,
  generateComprehensiveAiReport,
  generateLostSalesReport,
  buildChatGPTWebPrompt,
  buildGeminiWebPrompt,
};
