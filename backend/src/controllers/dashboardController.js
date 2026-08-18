const Customer = require('../models/Customer');
const DailyKPI = require('../models/DailyKPI');
const LostSale = require('../models/LostSale');
const SalesTarget = require('../models/SalesTarget');

// Helper to format Date to 'YYYY-MM-DD'
const toDateString = (d) => {
  if (!d) return new Date().toISOString().split('T')[0];
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
  return dateObj.toISOString().split('T')[0];
};

const DEFAULT_STAFF = ['Karthik Raja', 'Senthil Kumar', 'Priya Dharshini', 'Manoj Kumar'];

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
    nextFollowUp: d.nextFollowUp || '',
    lastFollowUp: d.lastFollowUp || '',
    lastReason: d.lastReason || '',
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
};

/**
 * Get Comprehensive Executive Dashboard Metrics
 */
exports.getDashboardMetrics = async (req, res) => {
  try {
    const { month } = req.query;
    const targetMonth = month || toDateString(new Date()).substring(0, 7); // 'YYYY-MM'
    const todayStr = toDateString(new Date());

    // 1. Fetch Sales Target config for the month
    let targetDoc = await SalesTarget.findOne({ month: targetMonth });
    if (!targetDoc) {
      targetDoc = {
        month: targetMonth,
        showroomTarget: 2500000,
        staffTargets: DEFAULT_STAFF.map((name) => ({ staffName: name, target: 625000 })),
      };
    }

    // 2. Fetch all active customers, KPIs, and Lost Sales
    const [allCustomers, allKpis, allLostSales] = await Promise.all([
      Customer.find({ status: { $ne: 'archived' } }).lean(),
      DailyKPI.find({ dateString: { $regex: `^${targetMonth}` } }).lean(),
      LostSale.find({ dateString: { $regex: `^${targetMonth}` } }).lean(),
    ]);

    // 3. Process Customer records for the target month
    let monthActualSales = 0;
    let monthOrdersCount = 0;
    let monthQuotesCount = 0;
    let monthWalkinsCount = 0;
    let totalPipelineValue = 0;
    let hotPipelineValue = 0;
    let pendingFollowupsCount = 0;
    let overdueFollowupsCount = 0;

    const overdueFollowupList = [];
    const recentDealWins = [];

    // Map for staff tracking
    const staffMap = {};
    (targetDoc.staffTargets || []).forEach((st) => {
      staffMap[st.staffName] = {
        staff: st.staffName,
        target: st.target || 625000,
        sales: 0,
        quotes: 0,
        orders: 0,
      };
    });
    DEFAULT_STAFF.forEach((name) => {
      if (!staffMap[name]) {
        staffMap[name] = {
          staff: name,
          target: 625000,
          sales: 0,
          quotes: 0,
          orders: 0,
        };
      }
    });

    // Merge saved KPI records if available
    allKpis.forEach((k) => {
      const sVal = Number(k.salesValue) || 0;
      const oCount = Number(k.ordersCount) || 0;
      const v = Number(k.walkins?.visits) || 0;
      const q = Number(k.walkins?.quotes) || 0;

      if (k.staffName && staffMap[k.staffName]) {
        staffMap[k.staffName].sales += sVal;
        staffMap[k.staffName].orders += oCount;
        staffMap[k.staffName].quotes += q;
      }
    });

    allCustomers.forEach((doc) => {
      const c = extractCustomerData(doc);
      const cMonth = c.entryDate.substring(0, 7);

      // Check if lead belongs to this month
      const isThisMonth = cMonth === targetMonth;

      if (isThisMonth) {
        monthWalkinsCount += 1;
        if (c.status === 'Quotation' || c.status === 'Negotiation' || c.quotationValue > 0) {
          monthQuotesCount += 1;
        }
        if (c.status === 'Order Confirmed') {
          monthOrdersCount += 1;
          const val = c.orderValue || c.quotationValue || 0;
          monthActualSales += val;

          recentDealWins.push({
            customerId: c.customerId,
            customerName: c.customerName,
            phone: c.phone,
            orderValue: val,
            salesperson: c.salesperson,
            date: c.entryDate,
          });
        }

        // Staff attribution
        const sName = c.salesperson || 'Showroom Staff';
        if (!staffMap[sName]) {
          staffMap[sName] = { staff: sName, target: 500000, sales: 0, quotes: 0, orders: 0 };
        }
        if (c.status === 'Order Confirmed') {
          staffMap[sName].sales += (c.orderValue || c.quotationValue || 0);
          staffMap[sName].orders += 1;
        }
        if (c.status === 'Quotation' || c.status === 'Negotiation' || c.quotationValue > 0) {
          staffMap[sName].quotes += 1;
        }
      }

      // Pipeline Intelligence (All open active deals in CRM regardless of entry month)
      if (c.status !== 'Order Confirmed' && c.status !== 'Lost') {
        const dealVal = c.quotationValue || 0;
        totalPipelineValue += dealVal;

        // Hot Pipeline: Deals in Negotiation stage or budget >= 1 Lakh
        if (c.status === 'Negotiation' || dealVal >= 100000) {
          hotPipelineValue += dealVal;
        }

        // Follow-up Tracking
        if (c.nextFollowUp) {
          if (c.nextFollowUp < todayStr) {
            overdueFollowupsCount += 1;
            const diffTime = Math.abs(new Date(todayStr) - new Date(c.nextFollowUp));
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            overdueFollowupList.push({
              customerId: c.customerId,
              customerName: c.customerName,
              phone: c.phone,
              salesperson: c.salesperson,
              nextFollowUp: c.nextFollowUp,
              daysOverdue: diffDays,
              quotationValue: dealVal,
              status: c.status,
              requirement: c.requirement,
            });
          } else {
            pendingFollowupsCount += 1;
          }
        } else if (c.status === 'Follow-up' || c.status === 'Newly Contacted') {
          pendingFollowupsCount += 1;
        }
      }
    });

    // If actualSales from DailyKPI is higher, use the higher verified total
    const kpiTotalSales = allKpis.reduce((acc, k) => acc + (Number(k.salesValue) || 0), 0);
    const kpiTotalOrders = allKpis.reduce((acc, k) => acc + (Number(k.ordersCount) || 0), 0);
    const kpiTotalVisits = allKpis.reduce((acc, k) => acc + (Number(k.walkins?.visits) || 0), 0);
    const kpiTotalQuotes = allKpis.reduce((acc, k) => acc + (Number(k.walkins?.quotes) || 0), 0);

    const finalActualSales = Math.max(monthActualSales, kpiTotalSales);
    const finalOrdersCount = Math.max(monthOrdersCount, kpiTotalOrders);
    const finalWalkinsCount = Math.max(monthWalkinsCount, kpiTotalVisits);
    const finalQuotesCount = Math.max(monthQuotesCount, kpiTotalQuotes);

    // Compute Rates
    const salesTarget = targetDoc.showroomTarget || 2500000;
    const achievementPercent = salesTarget > 0 ? Number(((finalActualSales / salesTarget) * 100).toFixed(1)) : 0;

    const conversionRate = finalWalkinsCount > 0
      ? Number(((finalOrdersCount / finalWalkinsCount) * 100).toFixed(1))
      : (finalQuotesCount > 0 ? Number(((finalOrdersCount / finalQuotesCount) * 100).toFixed(1)) : 0);

    const quoteRate = finalWalkinsCount > 0 ? Number(((finalQuotesCount / finalWalkinsCount) * 100).toFixed(1)) : 0;
    const averageBillValue = finalOrdersCount > 0 ? Math.round(finalActualSales / finalOrdersCount) : 0;

    // 4. Compile 7-Column Salesperson Performance Matrix
    const salespersonPerformance = Object.values(staffMap).map((s) => {
      const staffTarget = s.target || 625000;
      const achieved = staffTarget > 0 ? Number(((s.sales / staffTarget) * 100).toFixed(1)) : 0;
      const conversion = s.quotes > 0
        ? Number(((s.orders / s.quotes) * 100).toFixed(1))
        : (s.orders > 0 ? 100 : 0);

      return {
        staff: s.staff,
        target: staffTarget,
        sales: s.sales,
        achieved,
        quotes: s.quotes,
        orders: s.orders,
        conversion,
      };
    }).sort((a, b) => b.sales - a.sales);

    // Sort overdue follow-ups by urgency (most overdue first)
    overdueFollowupList.sort((a, b) => b.daysOverdue - a.daysOverdue);

    // Sort recent deal wins (newest first)
    recentDealWins.sort((a, b) => (b.date > a.date ? 1 : -1));

    res.status(200).json({
      success: true,
      data: {
        month: targetMonth,
        todayStr,
        kpi: {
          salesTarget,
          actualSales: finalActualSales,
          achievementPercent,
          totalWalkins: finalWalkinsCount,
          quotations: finalQuotesCount,
          orders: finalOrdersCount,
          conversionRate,
          quoteRate,
          pendingFollowups: pendingFollowupsCount,
          overdueFollowups: overdueFollowupsCount,
          totalPipelineValue,
          hotPipelineValue,
          averageBillValue,
        },
        salespersonPerformance,
        overdueFollowupsList: overdueFollowupList.slice(0, 6),
        recentDealWins: recentDealWins.slice(0, 5),
        lostSalesSummary: {
          totalLostDeals: allLostSales.length,
          totalLostValue: allLostSales.reduce((acc, s) => acc + (Number(s.quoteValue) || 0), 0),
        },
      },
    });
  } catch (error) {
    console.error('Error in getDashboardMetrics:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to compute dashboard metrics' });
  }
};

/**
 * Update Monthly Sales Target and Staff Allocations
 */
exports.updateSalesTargets = async (req, res) => {
  try {
    const { month, showroomTarget, staffTargets = [] } = req.body;
    const targetMonth = month || toDateString(new Date()).substring(0, 7);

    if (!showroomTarget || Number(showroomTarget) < 0) {
      return res.status(400).json({ success: false, message: 'Valid showroom target is required' });
    }

    const updated = await SalesTarget.findOneAndUpdate(
      { month: targetMonth },
      {
        $set: {
          month: targetMonth,
          showroomTarget: Number(showroomTarget),
          staffTargets: staffTargets.map((st) => ({
            staffName: st.staffName.trim(),
            target: Number(st.target) || 0,
          })),
          updatedBy: {
            userId: req.user?._id,
            name: req.user?.name || 'Admin',
          },
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Sales targets for ${targetMonth} updated successfully`,
      data: updated,
    });
  } catch (error) {
    console.error('Error in updateSalesTargets:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update sales targets' });
  }
};
