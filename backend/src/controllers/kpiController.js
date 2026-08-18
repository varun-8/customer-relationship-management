const DailyKPI = require('../models/DailyKPI');
const Customer = require('../models/Customer');

// Helper to format Date to 'YYYY-MM-DD'
const toDateString = (d) => {
  if (!d) return new Date().toISOString().split('T')[0];
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
  return dateObj.toISOString().split('T')[0];
};

/**
 * Helper: Extract Customer fields safely whether Map or Object
 */
const extractCustomerData = (customerDoc) => {
  const c = customerDoc.toObject ? customerDoc.toObject() : customerDoc;
  const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
  return {
    _id: c._id,
    customerId: c.customerId,
    customerName: d.customerName || 'Unnamed Customer',
    phone: d.phone || '',
    customerType: d.customerType || 'Building Owner',
    status: d.status || 'Newly Contacted',
    leadSource: d.leadSource || 'Walk-in',
    salesperson: d.salesperson || (c.createdBy?.name || 'Showroom Staff'),
    entryDate: d.entryDate || (c.createdAt ? toDateString(c.createdAt) : toDateString(new Date())),
    quotationValue: Number(d.quotationValue) || Number(d.orderValue) || Number(d.tileBudget) || 0,
    orderValue: Number(d.orderValue) || (d.status === 'Order Confirmed' ? (Number(d.quotationValue) || Number(d.tileBudget) || 0) : 0),
    requirement: d.requirement || '',
    approxQuantity: d.approxQuantity || '',
    sanitaryRequirement: d.sanitaryRequirement || '',
    adhesiveRequirement: d.adhesiveRequirement || '',
    crossSell: d.crossSell || '',
    followUpCount: Number(d.followUpCount) || 0,
    lastFollowUp: d.lastFollowUp || '',
    nextFollowUp: d.nextFollowUp || '',
    lastReason: d.lastReason || '',
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
};

/**
 * Helper: Automatically compute KPI metrics from CRM Customers for a given date
 */
const calculateCrmKpiForDate = async (targetDateStr, staffFilter = null) => {
  const allCustomers = await Customer.find({ status: { $ne: 'archived' } });

  const matched = [];
  allCustomers.forEach((doc) => {
    const cust = extractCustomerData(doc);
    const isDateMatch = cust.entryDate === targetDateStr || toDateString(cust.createdAt) === targetDateStr;
    const isStaffMatch = !staffFilter || staffFilter === 'all' || cust.salesperson.toLowerCase().includes(staffFilter.toLowerCase());

    if (isDateMatch && isStaffMatch) {
      matched.push(cust);
    }
  });

  let visits = 0;
  let quotes = 0;
  let orders = 0;
  let salesValue = 0;
  let oldCustomersCount = 0;
  let engineerCallsCount = 0;
  let followUpsCount = 0;
  const crossSellItems = new Set();

  matched.forEach((c) => {
    // 1. Footfall / Walk-ins
    if (c.leadSource === 'Walk-in' || !c.leadSource) {
      visits += 1;
    } else {
      visits += 1; // Any direct showroom customer interaction
    }

    // 2. Quotes given
    if (c.status === 'Quotation' || c.status === 'Negotiation' || c.quotationValue > 0) {
      quotes += 1;
    }

    // 3. Orders closed & Revenue
    if (c.status === 'Order Confirmed') {
      orders += 1;
      salesValue += (c.orderValue || c.quotationValue || 0);
    }

    // 4. Repeat / Old Customers
    if (c.leadSource === 'Existing Customer' || c.customerType === 'Existing Customer') {
      oldCustomersCount += 1;
    }

    // 5. Engineer Calls
    if (c.leadSource === 'Engineer' || c.leadSource === 'Architect' || c.customerType === 'Architect' || c.customerType === 'Mason') {
      engineerCallsCount += 1;
    }

    // 6. Cross-sell items
    if (Array.isArray(c.crossSell)) {
      c.crossSell.forEach((item) => crossSellItems.add(item));
    } else if (typeof c.crossSell === 'string' && c.crossSell) {
      c.crossSell.split(',').forEach((item) => crossSellItems.add(item.trim()));
    }

    // 7. Follow-ups
    followUpsCount += (c.followUpCount || 1);
  });

  const conversionRate = visits > 0 ? Number(((orders / visits) * 100).toFixed(1)) : 0;
  const quoteRate = visits > 0 ? Number(((quotes / visits) * 100).toFixed(1)) : 0;

  return {
    date: new Date(targetDateStr),
    dateString: targetDateStr,
    staffName: staffFilter && staffFilter !== 'all' ? staffFilter : 'Showroom Team',
    walkins: {
      visits: visits || matched.length,
      quotes,
      orders,
    },
    conversionRate,
    quoteRate,
    followUpsCount,
    ordersCount: orders,
    salesValue,
    oldCustomers: oldCustomersCount > 0,
    oldCustomersCount,
    engineerCalls: engineerCallsCount > 0,
    engineerCallsCount,
    crossSell: crossSellItems.size > 0,
    crossSellItems: Array.from(crossSellItems),
    customers: matched,
  };
};

/**
 * Log or update a Daily KPI entry (Upsert by dateString + staffName)
 */
exports.createOrUpdateKPI = async (req, res) => {
  try {
    const {
      date,
      staffName,
      staffId,
      walkins = {},
      followUpsCount = 0,
      ordersCount = 0,
      salesValue = 0,
      oldCustomers = false,
      oldCustomersCount = 0,
      oldCustomerNotes = '',
      engineerCalls = false,
      engineerCallsCount = 0,
      engineerNotes = '',
      crossSell = false,
      crossSellItems = [],
      crossSellNotes = '',
      notes = '',
    } = req.body;

    if (!staffName) {
      return res.status(400).json({ success: false, message: 'Staff name is required' });
    }

    const targetDate = date ? new Date(date) : new Date();
    const dateString = toDateString(targetDate);

    const updateDoc = {
      date: targetDate,
      dateString,
      staffName: staffName.trim(),
      staffId: staffId || undefined,
      walkins: {
        visits: Number(walkins.visits) || 0,
        quotes: Number(walkins.quotes) || 0,
        orders: Number(walkins.orders) || 0,
      },
      followUpsCount: Number(followUpsCount) || 0,
      ordersCount: Number(ordersCount) || 0,
      salesValue: Number(salesValue) || 0,
      oldCustomers: Boolean(oldCustomers),
      oldCustomersCount: Number(oldCustomersCount) || (oldCustomers ? 1 : 0),
      oldCustomerNotes: String(oldCustomerNotes || '').trim(),
      engineerCalls: Boolean(engineerCalls),
      engineerCallsCount: Number(engineerCallsCount) || (engineerCalls ? 1 : 0),
      engineerNotes: String(engineerNotes || '').trim(),
      crossSell: Boolean(crossSell),
      crossSellItems: Array.isArray(crossSellItems) ? crossSellItems : [],
      crossSellNotes: String(crossSellNotes || '').trim(),
      notes: String(notes || '').trim(),
      submittedBy: {
        userId: req.user?._id,
        name: req.user?.name || staffName,
        role: req.user?.role || 'employee',
      },
      updatedAt: new Date(),
    };

    const kpiRecord = await DailyKPI.findOneAndUpdate(
      { dateString, staffName: staffName.trim() },
      { $set: updateDoc },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Daily KPI for ${staffName} (${dateString}) saved successfully`,
      data: kpiRecord,
    });
  } catch (error) {
    console.error('Error in createOrUpdateKPI:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to save Daily KPI' });
  }
};

/**
 * Get list of Daily KPI logs (combining manual logs + auto-CRM synthesis)
 */
exports.getKPIList = async (req, res) => {
  try {
    const { date, startDate, endDate, staffName, month, limit = 100, page = 1 } = req.query;
    const query = {};

    if (date) {
      query.dateString = date;
    } else if (startDate && endDate) {
      query.dateString = { $gte: startDate, $lte: endDate };
    } else if (month) {
      query.dateString = { $regex: `^${month}` };
    }

    if (staffName && staffName !== 'all') {
      query.staffName = staffName;
    }

    const records = await DailyKPI.find(query).sort({ dateString: -1, staffName: 1 });

    // Map existing records
    const formattedRecords = records.map((rec) => {
      const doc = rec.toObject();
      const visits = doc.walkins?.visits || 0;
      const walkinOrders = doc.walkins?.orders || 0;
      const walkinQuotes = doc.walkins?.quotes || 0;

      doc.conversionRate = visits > 0 ? Number(((walkinOrders / visits) * 100).toFixed(1)) : 0;
      doc.quoteRate = visits > 0 ? Number(((walkinQuotes / visits) * 100).toFixed(1)) : 0;
      doc.source = 'logged';
      return doc;
    });

    // Check if today has a log; if not, automatically synthesize from CRM
    const todayStr = toDateString(new Date());
    const hasToday = formattedRecords.some((r) => r.dateString === todayStr);
    if (!hasToday && (!month || todayStr.startsWith(month))) {
      const autoToday = await calculateCrmKpiForDate(todayStr, staffName);
      if (autoToday.walkins.visits > 0 || autoToday.salesValue > 0 || autoToday.followUpsCount > 0) {
        autoToday.source = 'auto_crm';
        formattedRecords.unshift(autoToday);
      }
    }

    res.status(200).json({
      success: true,
      data: formattedRecords,
      total: formattedRecords.length,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Error in getKPIList:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to retrieve KPI list' });
  }
};

/**
 * Get Specific Day Performance Breakdown (Deep Dive per Day)
 */
exports.getDayPerformance = async (req, res) => {
  try {
    const { date, staffName } = req.query;
    const targetDateStr = date ? toDateString(date) : toDateString(new Date());

    // 1. Fetch saved DailyKPI record if any
    const kpiQuery = { dateString: targetDateStr };
    if (staffName && staffName !== 'all') {
      kpiQuery.staffName = staffName;
    }
    const savedKpis = await DailyKPI.find(kpiQuery);

    // 2. Fetch live CRM calculation for that day
    const liveCrmCalc = await calculateCrmKpiForDate(targetDateStr, staffName);

    // 3. Compute day KPI: Merge saved KPI with CRM customer details
    let finalKpi;
    if (savedKpis.length > 0) {
      // Sum up if multiple staff logs exist
      const totalVisits = savedKpis.reduce((acc, k) => acc + (k.walkins?.visits || 0), 0);
      const totalQuotes = savedKpis.reduce((acc, k) => acc + (k.walkins?.quotes || 0), 0);
      const totalOrders = savedKpis.reduce((acc, k) => acc + (k.walkins?.orders || 0), 0);
      const totalSales = savedKpis.reduce((acc, k) => acc + (Number(k.salesValue) || 0), 0);
      const totalFollowups = savedKpis.reduce((acc, k) => acc + (Number(k.followUpsCount) || 0), 0);
      const totalBills = savedKpis.reduce((acc, k) => acc + (Number(k.ordersCount) || 0), 0);

      const crossSellSet = new Set();
      savedKpis.forEach((k) => (k.crossSellItems || []).forEach((item) => crossSellSet.add(item)));
      liveCrmCalc.crossSellItems.forEach((item) => crossSellSet.add(item));

      finalKpi = {
        dateString: targetDateStr,
        staffName: staffName && staffName !== 'all' ? staffName : (savedKpis.length === 1 ? savedKpis[0].staffName : 'Showroom Team'),
        walkins: {
          visits: totalVisits || liveCrmCalc.walkins.visits,
          quotes: totalQuotes || liveCrmCalc.walkins.quotes,
          orders: totalOrders || liveCrmCalc.walkins.orders,
        },
        conversionRate: totalVisits > 0 ? Number(((totalOrders / totalVisits) * 100).toFixed(1)) : liveCrmCalc.conversionRate,
        quoteRate: totalVisits > 0 ? Number(((totalQuotes / totalVisits) * 100).toFixed(1)) : liveCrmCalc.quoteRate,
        followUpsCount: totalFollowups || liveCrmCalc.followUpsCount,
        ordersCount: totalBills || liveCrmCalc.ordersCount,
        salesValue: totalSales || liveCrmCalc.salesValue,
        oldCustomers: savedKpis.some((k) => k.oldCustomers) || liveCrmCalc.oldCustomers,
        oldCustomersCount: savedKpis.reduce((acc, k) => acc + (k.oldCustomersCount || 0), 0) || liveCrmCalc.oldCustomersCount,
        engineerCalls: savedKpis.some((k) => k.engineerCalls) || liveCrmCalc.engineerCalls,
        engineerCallsCount: savedKpis.reduce((acc, k) => acc + (k.engineerCallsCount || 0), 0) || liveCrmCalc.engineerCallsCount,
        crossSell: savedKpis.some((k) => k.crossSell) || liveCrmCalc.crossSell,
        crossSellItems: Array.from(crossSellSet),
        notes: savedKpis.map((k) => k.notes).filter(Boolean).join(' • '),
        isSaved: true,
      };
    } else {
      finalKpi = {
        ...liveCrmCalc,
        isSaved: false,
        source: 'auto_crm',
      };
    }

    // 4. Compute Comparison with Previous Day
    const prevDateObj = new Date(new Date(targetDateStr).getTime() - 86400000);
    const prevDateStr = toDateString(prevDateObj);
    const prevCrmCalc = await calculateCrmKpiForDate(prevDateStr, staffName);

    const salesDiff = finalKpi.salesValue - prevCrmCalc.salesValue;
    const ordersDiff = finalKpi.ordersCount - prevCrmCalc.ordersCount;
    const visitsDiff = finalKpi.walkins.visits - prevCrmCalc.walkins.visits;

    res.status(200).json({
      success: true,
      data: {
        date: targetDateStr,
        kpi: finalKpi,
        customers: liveCrmCalc.customers,
        comparison: {
          previousDate: prevDateStr,
          salesDiff,
          ordersDiff,
          visitsDiff,
          salesGrowthPercent: prevCrmCalc.salesValue > 0
            ? Number(((salesDiff / prevCrmCalc.salesValue) * 100).toFixed(1))
            : (finalKpi.salesValue > 0 ? 100 : 0),
        },
      },
    });
  } catch (error) {
    console.error('Error in getDayPerformance:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to retrieve day performance' });
  }
};

/**
 * Get Day-by-Day Monthly Performance Trends (for Day-wise Bar / Matrix charts)
 */
exports.getDailyTrends = async (req, res) => {
  try {
    const { month, staffName } = req.query;
    const targetMonth = month || toDateString(new Date()).substring(0, 7); // 'YYYY-MM'

    const [year, mon] = targetMonth.split('-').map(Number);
    const daysInMonth = new Date(year, mon, 0).getDate();

    // Fetch all customers & saved KPIs for this month
    const [allCustomers, savedKpis] = await Promise.all([
      Customer.find({ status: { $ne: 'archived' } }),
      DailyKPI.find({ dateString: { $regex: `^${targetMonth}` } }),
    ]);

    const dailyTrends = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${targetMonth}-${String(day).padStart(2, '0')}`;

      // Check saved KPI
      const daySavedKpis = savedKpis.filter((k) => k.dateString === dayStr && (!staffName || staffName === 'all' || k.staffName === staffName));

      // Check CRM customers
      const dayCustomers = allCustomers.filter((doc) => {
        const c = extractCustomerData(doc);
        const isDateMatch = c.entryDate === dayStr || toDateString(c.createdAt) === dayStr;
        const isStaffMatch = !staffName || staffName === 'all' || c.salesperson.toLowerCase().includes(staffName.toLowerCase());
        return isDateMatch && isStaffMatch;
      });

      let salesValue = 0;
      let ordersCount = 0;
      let visits = 0;
      let quotes = 0;
      let followUps = 0;

      if (daySavedKpis.length > 0) {
        daySavedKpis.forEach((k) => {
          salesValue += (Number(k.salesValue) || 0);
          ordersCount += (Number(k.ordersCount) || 0);
          visits += (Number(k.walkins?.visits) || 0);
          quotes += (Number(k.walkins?.quotes) || 0);
          followUps += (Number(k.followUpsCount) || 0);
        });
      } else {
        dayCustomers.forEach((c) => {
          const cust = extractCustomerData(c);
          visits += 1;
          if (cust.status === 'Quotation' || cust.quotationValue > 0) quotes += 1;
          if (cust.status === 'Order Confirmed') {
            ordersCount += 1;
            salesValue += (cust.orderValue || cust.quotationValue || 0);
          }
          followUps += (cust.followUpCount || 1);
        });
      }

      const conversionRate = visits > 0 ? Number(((ordersCount / visits) * 100).toFixed(1)) : 0;

      dailyTrends.push({
        date: dayStr,
        dayNumber: day,
        dayOfWeek: new Date(dayStr).toLocaleDateString('en-US', { weekday: 'short' }),
        salesValue,
        ordersCount,
        visits,
        quotes,
        followUps,
        conversionRate,
        customerCount: dayCustomers.length,
        hasActivity: salesValue > 0 || ordersCount > 0 || visits > 0 || dayCustomers.length > 0,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        month: targetMonth,
        totalDays: daysInMonth,
        trends: dailyTrends,
      },
    });
  } catch (error) {
    console.error('Error in getDailyTrends:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate daily trends' });
  }
};

/**
 * Get High-Level KPI Summary & Aggregations
 */
exports.getKPISummary = async (req, res) => {
  try {
    const { startDate, endDate, month, staffName } = req.query;
    const currentMonth = month || toDateString(new Date()).substring(0, 7);

    // Fetch both saved KPIs and all CRM records
    const [allCustomers, savedKpis] = await Promise.all([
      Customer.find({ status: { $ne: 'archived' } }),
      DailyKPI.find({ dateString: { $regex: `^${currentMonth}` } }),
    ]);

    let totalSalesValue = 0;
    let totalOrdersCount = 0;
    let totalVisits = 0;
    let totalQuotes = 0;
    let totalWalkinOrders = 0;
    let totalFollowUps = 0;
    let oldCustomersDays = 0;
    let engineerCallsDays = 0;
    let crossSellDays = 0;

    const staffMap = {};

    // 1. Process saved KPIs
    savedKpis.forEach((r) => {
      if (staffName && staffName !== 'all' && r.staffName !== staffName) return;

      const sVal = Number(r.salesValue) || 0;
      const oCount = Number(r.ordersCount) || 0;
      const fCount = Number(r.followUpsCount) || 0;
      const v = Number(r.walkins?.visits) || 0;
      const q = Number(r.walkins?.quotes) || 0;
      const wo = Number(r.walkins?.orders) || 0;

      totalSalesValue += sVal;
      totalOrdersCount += oCount;
      totalFollowUps += fCount;
      totalVisits += v;
      totalQuotes += q;
      totalWalkinOrders += wo;

      if (r.oldCustomers) oldCustomersDays += 1;
      if (r.engineerCalls) engineerCallsDays += 1;
      if (r.crossSell) crossSellDays += 1;

      if (!staffMap[r.staffName]) {
        staffMap[r.staffName] = {
          staffName: r.staffName,
          salesValue: 0,
          ordersCount: 0,
          visits: 0,
          quotes: 0,
          walkinOrders: 0,
          followUps: 0,
          logsCount: 0,
        };
      }

      staffMap[r.staffName].salesValue += sVal;
      staffMap[r.staffName].ordersCount += oCount;
      staffMap[r.staffName].visits += v;
      staffMap[r.staffName].quotes += q;
      staffMap[r.staffName].walkinOrders += wo;
      staffMap[r.staffName].followUps += fCount;
      staffMap[r.staffName].logsCount += 1;
    });

    // 2. Process CRM customers for days that did not have a manual log
    const savedDates = new Set(savedKpis.map((k) => k.dateString));

    allCustomers.forEach((doc) => {
      const c = extractCustomerData(doc);
      const cMonth = c.entryDate.substring(0, 7);
      if (cMonth !== currentMonth) return;
      if (staffName && staffName !== 'all' && !c.salesperson.toLowerCase().includes(staffName.toLowerCase())) return;

      // If this date is already covered by a saved KPI log, skip to avoid double counting
      if (savedDates.has(c.entryDate)) return;

      totalVisits += 1;
      if (c.status === 'Quotation' || c.quotationValue > 0) totalQuotes += 1;
      if (c.status === 'Order Confirmed') {
        totalOrdersCount += 1;
        totalWalkinOrders += 1;
        totalSalesValue += (c.orderValue || c.quotationValue || 0);
      }
      totalFollowUps += (c.followUpCount || 1);

      const sName = c.salesperson || 'Showroom Staff';
      if (!staffMap[sName]) {
        staffMap[sName] = {
          staffName: sName,
          salesValue: 0,
          ordersCount: 0,
          visits: 0,
          quotes: 0,
          walkinOrders: 0,
          followUps: 0,
          logsCount: 0,
        };
      }
      if (c.status === 'Order Confirmed') {
        staffMap[sName].salesValue += (c.orderValue || c.quotationValue || 0);
        staffMap[sName].ordersCount += 1;
        staffMap[sName].walkinOrders += 1;
      }
      staffMap[sName].visits += 1;
      staffMap[sName].followUps += (c.followUpCount || 1);
    });

    const staffLeaderboard = Object.values(staffMap).map((s) => ({
      ...s,
      conversionRate: s.visits > 0 ? Number(((s.walkinOrders / s.visits) * 100).toFixed(1)) : 0,
    })).sort((a, b) => b.salesValue - a.salesValue);

    const overallConversion = totalVisits > 0
      ? Number(((totalWalkinOrders / totalVisits) * 100).toFixed(1))
      : 0;

    const overallQuoteRate = totalVisits > 0
      ? Number(((totalQuotes / totalVisits) * 100).toFixed(1))
      : 0;

    // Today's snapshot
    const todayString = toDateString(new Date());
    const todayCalc = await calculateCrmKpiForDate(todayString, staffName);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSalesValue,
          totalOrdersCount,
          totalVisits,
          totalQuotes,
          totalWalkinOrders,
          overallConversion,
          overallQuoteRate,
          totalFollowUps,
          oldCustomersDays,
          engineerCallsDays,
          crossSellDays,
          totalLogsCount: savedKpis.length,
        },
        today: {
          todayString,
          todaySales: todayCalc.salesValue,
          todayOrders: todayCalc.ordersCount,
          todayVisits: todayCalc.walkins.visits,
          todayQuotes: todayCalc.walkins.quotes,
          todayFollowUps: todayCalc.followUpsCount,
        },
        staffLeaderboard,
      },
    });
  } catch (error) {
    console.error('Error in getKPISummary:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate KPI summary' });
  }
};

/**
 * Auto-Calculate KPI values from CRM Customer records for a specified date & staff
 */
exports.getAutoFillFromCRM = async (req, res) => {
  try {
    const { date, staffName } = req.query;
    const targetDateStr = date ? toDateString(date) : toDateString(new Date());

    const result = await calculateCrmKpiForDate(targetDateStr, staffName);

    res.status(200).json({
      success: true,
      data: {
        date: targetDateStr,
        staffName: staffName || '',
        matchedCustomersCount: result.customers.length,
        autoValues: {
          walkins: result.walkins,
          followUpsCount: result.followUpsCount,
          ordersCount: result.ordersCount,
          salesValue: result.salesValue,
          oldCustomers: result.oldCustomers,
          oldCustomersCount: result.oldCustomersCount,
          engineerCalls: result.engineerCalls,
          engineerCallsCount: result.engineerCallsCount,
          crossSell: result.crossSell,
          crossSellItems: result.crossSellItems,
        },
        customers: result.customers,
      },
    });
  } catch (error) {
    console.error('Error in getAutoFillFromCRM:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to auto-calculate CRM metrics' });
  }
};

/**
 * Delete a KPI record by ID
 */
exports.deleteKPI = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DailyKPI.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'KPI record not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Daily KPI record removed',
    });
  } catch (error) {
    console.error('Error in deleteKPI:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete KPI record' });
  }
};
