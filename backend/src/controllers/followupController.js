const Customer = require('../models/Customer');

// Helper to format Date to 'YYYY-MM-DD'
const toDateString = (d) => {
  if (!d) return new Date().toISOString().split('T')[0];
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
  return dateObj.toISOString().split('T')[0];
};

/**
 * Helper to safely extract Customer fields whether Map or Object
 */
const extractCustomerData = (customerDoc) => {
  const c = customerDoc.toObject ? customerDoc.toObject() : customerDoc;
  const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
  
  // Calculate lead temperature if not explicitly set
  let temp = d.leadTemperature || d.temperature;
  const qVal = Number(d.quotationValue) || Number(d.orderValue) || Number(d.tileBudget) || 0;
  
  if (!temp) {
    if (d.status === 'Negotiation' || qVal >= 100000) {
      temp = 'Hot';
    } else if (d.status === 'Quotation' || d.status === 'Follow-up') {
      temp = 'Warm';
    } else {
      temp = 'Future';
    }
  }

  return {
    _id: c._id,
    customerId: c.customerId,
    customerName: d.customerName || 'Unnamed Customer',
    phone: d.phone || '',
    customerType: d.customerType || 'Building Owner',
    status: d.status || 'Newly Contacted',
    salesperson: d.salesperson || (c.createdBy?.name || 'Showroom Staff'),
    requirement: d.requirement || 'Tiles & Sanitary',
    approxQuantity: d.approxQuantity || '',
    quotationValue: qVal,
    nextFollowUp: d.nextFollowUp || '',
    lastFollowUp: d.lastFollowUp || '',
    lastReason: d.lastReason || '',
    leadTemperature: temp, // 'Hot', 'Warm', 'Future'
    notes: d.notes || '',
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
};

/**
 * Get Follow-ups List segmented by Time-Horizons (Today, Upcoming 7 Days, Overdue, All)
 */
exports.getFollowupsList = async (req, res) => {
  try {
    const {
      tab = 'today', // 'today', 'upcoming', 'overdue', 'all'
      temperature, // 'Hot', 'Warm', 'Future', 'all'
      salesperson,
      search,
    } = req.query;

    const todayStr = toDateString(new Date());

    // Calculate 7 days ahead
    const next7DaysDate = new Date();
    next7DaysDate.setDate(next7DaysDate.getDate() + 7);
    const next7DaysStr = toDateString(next7DaysDate);

    // Fetch all active, non-archived, non-closed, non-lost customers
    const rawCustomers = await Customer.find({
      status: { $nin: ['archived'] },
    }).sort({ updatedAt: -1 });

    const allFollowups = [];
    let todayCount = 0;
    let upcomingCount = 0;
    let overdueCount = 0;
    let hotCount = 0;
    let totalPipelineValue = 0;

    rawCustomers.forEach((doc) => {
      const c = extractCustomerData(doc);

      // Skip closed or lost deals from active follow-up queue
      const statusLower = (c.status || '').toLowerCase();
      if (c.status === 'Order Confirmed' || statusLower.includes('lost')) return;

      const qVal = c.quotationValue || 0;
      totalPipelineValue += qVal;
      if (c.leadTemperature === 'Hot') hotCount += 1;

      // Determine Time-Horizon Bucket
      let bucket = 'upcoming';
      let daysDiff = 0;

      if (!c.nextFollowUp) {
        // If no date is set, default to today's active calling queue if in Follow-up or Newly Contacted
        bucket = 'today';
      } else if (c.nextFollowUp < todayStr) {
        bucket = 'overdue';
        const diffTime = Math.abs(new Date(todayStr) - new Date(c.nextFollowUp));
        daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else if (c.nextFollowUp === todayStr) {
        bucket = 'today';
        daysDiff = 0;
      } else if (c.nextFollowUp > todayStr && c.nextFollowUp <= next7DaysStr) {
        bucket = 'upcoming';
        const diffTime = Math.abs(new Date(c.nextFollowUp) - new Date(todayStr));
        daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else {
        bucket = 'future';
        const diffTime = Math.abs(new Date(c.nextFollowUp) - new Date(todayStr));
        daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Count metrics
      if (bucket === 'today') todayCount += 1;
      if (bucket === 'upcoming' || bucket === 'future') upcomingCount += 1;
      if (bucket === 'overdue') overdueCount += 1;

      allFollowups.push({
        ...c,
        bucket,
        daysDiff,
      });
    });

    // Apply Filter by Tab
    let filtered = allFollowups;
    if (tab === 'today') {
      filtered = filtered.filter((f) => f.bucket === 'today');
    } else if (tab === 'overdue') {
      filtered = filtered.filter((f) => f.bucket === 'overdue');
    } else if (tab === 'upcoming') {
      filtered = filtered.filter((f) => f.bucket === 'upcoming' || f.bucket === 'future');
    }

    // Apply Temperature Filter
    if (temperature && temperature !== 'all') {
      filtered = filtered.filter((f) => f.leadTemperature === temperature);
    }

    // Apply Salesperson Filter
    if (salesperson && salesperson !== 'all') {
      filtered = filtered.filter((f) => f.salesperson === salesperson);
    }

    // Apply Search Query
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.customerName.toLowerCase().includes(q) ||
          f.phone.includes(q) ||
          (f.customerId && f.customerId.toLowerCase().includes(q)) ||
          f.requirement.toLowerCase().includes(q) ||
          (f.lastReason && f.lastReason.toLowerCase().includes(q))
      );
    }

    // Sort: Overdue sorted by most overdue first; Today sorted by quotation value; Upcoming sorted by nearest date
    if (tab === 'overdue') {
      filtered.sort((a, b) => b.daysDiff - a.daysDiff);
    } else if (tab === 'today') {
      filtered.sort((a, b) => (b.leadTemperature === 'Hot' ? 1 : 0) - (a.leadTemperature === 'Hot' ? 1 : 0) || b.quotationValue - a.quotationValue);
    } else {
      filtered.sort((a, b) => (a.nextFollowUp || '9999').localeCompare(b.nextFollowUp || '9999'));
    }

    res.status(200).json({
      success: true,
      data: filtered,
      counts: {
        today: todayCount,
        upcoming: upcomingCount,
        overdue: overdueCount,
        hot: hotCount,
        total: allFollowups.length,
        totalPipelineValue,
      },
    });
  } catch (error) {
    console.error('Error in getFollowupsList:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch follow-ups list' });
  }
};

/**
 * Log Follow-up Activity & Reschedule
 */
exports.logFollowupActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      outcome,
      discussionNotes,
      nextFollowUp,
      leadTemperature,
      statusUpdate,
      quotationValue,
    } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer record not found' });
    }

    const currentData = customer.data instanceof Map ? Object.fromEntries(customer.data) : (customer.data || {});

    const todayStr = toDateString(new Date());

    // Update last follow-up history
    currentData.lastFollowUp = todayStr;
    if (nextFollowUp) {
      currentData.nextFollowUp = toDateString(nextFollowUp);
    }
    if (leadTemperature) {
      currentData.leadTemperature = leadTemperature;
      currentData.temperature = leadTemperature;
    }
    if (statusUpdate) {
      currentData.status = statusUpdate;
    }
    if (quotationValue !== undefined && Number(quotationValue) >= 0) {
      currentData.quotationValue = Number(quotationValue);
    }

    // Build discussion notes snippet
    const newNote = `[${todayStr}] ${outcome || 'Follow-up'}: ${discussionNotes || 'Discussion recorded'}`;
    currentData.lastReason = newNote;
    currentData.notes = currentData.notes ? `${currentData.notes}\n${newNote}` : newNote;

    customer.data = currentData;
    await customer.save();

    res.status(200).json({
      success: true,
      message: `Follow-up activity logged for ${currentData.customerName || 'customer'}`,
      data: extractCustomerData(customer),
    });
  } catch (error) {
    console.error('Error in logFollowupActivity:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to log follow-up activity' });
  }
};
