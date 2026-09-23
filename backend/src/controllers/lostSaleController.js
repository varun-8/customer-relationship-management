const LostSale = require('../models/LostSale');
const Customer = require('../models/Customer');

// Helper to format Date to 'YYYY-MM-DD'
const toDateString = (d) => {
  if (!d) return new Date().toISOString().split('T')[0];
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
  return dateObj.toISOString().split('T')[0];
};

/**
 * Record a new Lost Sale
 */
exports.createLostSale = async (req, res) => {
  try {
    const {
      customerId,
      customerRef,
      customerName,
      customerType,
      requirements,
      phone,
      quoteValue,
      products = ['Tile'],
      salesperson,
      lostReason,
      competitor,
      priceDifference = 0,
      priceDiffPercentage = 0,
      date,
      notes,
    } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }
    if (quoteValue === undefined || quoteValue === null || Number(quoteValue) < 0) {
      return res.status(400).json({ success: false, message: 'Valid quote value is required' });
    }
    if (!salesperson || !salesperson.trim()) {
      return res.status(400).json({ success: false, message: 'Salesperson name is required' });
    }
    if (!lostReason || !lostReason.trim()) {
      return res.status(400).json({ success: false, message: 'Lost reason is required' });
    }

    const targetDate = date ? new Date(date) : new Date();
    const dateString = toDateString(targetDate);

    // Calculate percentage if not provided but difference is given
    let calculatedPercent = Number(priceDiffPercentage) || 0;
    const numQuoteVal = Number(quoteValue) || 0;
    const numPriceDiff = Number(priceDifference) || 0;

    if (!calculatedPercent && numQuoteVal > 0 && numPriceDiff > 0) {
      calculatedPercent = Number(((numPriceDiff / numQuoteVal) * 100).toFixed(1));
    }

    // Resolve customerType and requirements from Customer collection if not passed explicitly
    let resolvedCustomerType = customerType ? String(customerType).trim() : null;
    let resolvedRequirements = Array.isArray(requirements) && requirements.length > 0 ? requirements : null;

    if ((!resolvedCustomerType || !resolvedRequirements) && (customerId || customerRef)) {
      try {
        const query = customerRef ? { _id: customerRef } : { customerId };
        const cDoc = await Customer.findOne(query).lean();
        if (cDoc) {
          const cData = cDoc.data instanceof Map ? Object.fromEntries(cDoc.data) : (cDoc.data || {});
          if (!resolvedCustomerType) {
            resolvedCustomerType = cDoc.customerType || cData.customerType || 'Direct Client';
          }
          if (!resolvedRequirements) {
            const reqVal = cDoc.requirements || cData.requirements || cData.requirement || cData.productRequirement;
            if (Array.isArray(reqVal) && reqVal.length > 0) resolvedRequirements = reqVal;
            else if (typeof reqVal === 'string' && reqVal.trim()) resolvedRequirements = reqVal.split(',').map((s) => s.trim()).filter(Boolean);
          }
        }
      } catch (err) {
        console.warn('Auto-resolving customer data for lost sale failed:', err.message);
      }
    }

    const newLostSale = new LostSale({
      customerId: customerId ? customerId.trim() : undefined,
      customerRef: customerRef || undefined,
      customerName: customerName.trim(),
      customerType: resolvedCustomerType || 'Direct Client',
      requirements: resolvedRequirements || (Array.isArray(products) && products.length > 0 ? products : ['Tile']),
      phone: phone ? phone.trim() : undefined,
      quoteValue: numQuoteVal,
      products: Array.isArray(products) && products.length > 0 ? products : ['Tile'],
      salesperson: salesperson.trim(),
      lostReason: lostReason.trim(),
      competitor: competitor ? competitor.trim() : 'Unknown / Local Dealer',
      priceDifference: numPriceDiff,
      priceDiffPercentage: calculatedPercent,
      date: targetDate,
      dateString,
      notes: notes ? notes.trim() : '',
      status: 'lost',
      createdBy: {
        userId: req.user?._id,
        name: req.user?.name || salesperson,
        role: req.user?.role || 'employee',
      },
    });

    await newLostSale.save();

    // If customerId is provided, update customer status to 'Lost' in Customer collection
    if (customerId || customerRef) {
      try {
        const query = customerRef ? { _id: customerRef } : { customerId };
        const customer = await Customer.findOne(query);
        if (customer) {
          customer.status = 'Lost';
          const currentData = customer.data instanceof Map ? Object.fromEntries(customer.data) : (customer.data || {});
          currentData.status = 'Lost';
          currentData.lostReason = lostReason.trim();
          currentData.lostCompetitor = competitor ? competitor.trim() : '';
          currentData.lostDate = dateString;
          currentData.lastReason = `Lost Deal to ${competitor || 'competitor'}: ${lostReason.trim()}`;

          customer.data = currentData;
          customer.markModified('data');
          await customer.save();
        }
      } catch (err) {
        console.warn('Could not sync status to Customer document:', err.message);
      }
    }

    res.status(201).json({
      success: true,
      message: `Lost sale record for ${customerName} logged successfully`,
      data: newLostSale,
    });
  } catch (error) {
    console.error('Error in createLostSale:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to record lost sale' });
  }
};

/**
 * Get Lost Sales List with search, filtering, and pagination
 */
exports.getLostSalesList = async (req, res) => {
  try {
    const {
      search,
      month,
      startDate,
      endDate,
      product,
      competitor,
      lostReason,
      salesperson,
      status,
      limit = 50,
      page = 1,
    } = req.query;

    const query = {};

    // Date / Month filter
    if (month) {
      query.dateString = { $regex: `^${month}` };
    } else if (startDate && endDate) {
      query.dateString = { $gte: startDate, $lte: endDate };
    }

    // Specific filters
    if (product && product !== 'all') {
      query.products = product;
    }
    if (competitor && competitor !== 'all') {
      query.competitor = competitor;
    }
    if (lostReason && lostReason !== 'all') {
      query.lostReason = lostReason;
    }
    
    // Role-based salesperson scoping
    if (req.user && req.user.role === 'employee') {
      query.salesperson = req.user.name;
    } else if (salesperson && salesperson !== 'all') {
      query.salesperson = salesperson;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    // Search query (customerName, phone, customerId, competitor, notes)
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { customerName: regex },
        { phone: regex },
        { customerId: regex },
        { competitor: regex },
        { lostReason: regex },
        { notes: regex },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [rawRecords, total] = await Promise.all([
      LostSale.find(query)
        .populate('customerRef', 'customerType requirements data')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      LostSale.countDocuments(query),
    ]);

    // Gather customerIds needing backfilled customerType or requirements
    const missingCustomerIds = rawRecords
      .filter((r) => (!r.customerType || r.customerType === 'Direct Client' || !r.requirements || r.requirements.length === 0) && r.customerId)
      .map((r) => r.customerId);

    let customerMap = {};
    if (missingCustomerIds.length > 0) {
      try {
        const matchedCustomers = await Customer.find({ customerId: { $in: missingCustomerIds } }).lean();
        matchedCustomers.forEach((c) => {
          const d = c.data instanceof Map ? Object.fromEntries(c.data) : (c.data || {});
          customerMap[c.customerId] = {
            customerType: c.customerType || d.customerType || 'Direct Client',
            requirements: c.requirements || d.requirements || d.requirement || d.productRequirement || [],
          };
        });
      } catch (e) {
        console.warn('Could not batch lookup customers for lost sales list:', e.message);
      }
    }

    const records = rawRecords.map((r) => {
      const cData = r.customerId ? customerMap[r.customerId] : null;
      const refData = r.customerRef && typeof r.customerRef === 'object' ? r.customerRef : null;
      const refMapData = refData && refData.data instanceof Map ? Object.fromEntries(refData.data) : (refData?.data || {});

      const finalCustomerType =
        (r.customerType && r.customerType !== 'Direct Client' && r.customerType !== '-')
          ? r.customerType
          : refData?.customerType || refMapData?.customerType || cData?.customerType || r.customerType || 'Direct Client';

      let finalReq = r.requirements;
      if (!finalReq || !Array.isArray(finalReq) || finalReq.length === 0) {
        finalReq = (Array.isArray(r.products) && r.products.length > 0) ? r.products : [];
      }
      if (finalReq.length === 0) {
        const reqFromRef = refData?.requirements || refMapData?.requirements || refMapData?.requirement || cData?.requirements;
        if (Array.isArray(reqFromRef) && reqFromRef.length > 0) finalReq = reqFromRef;
        else if (typeof reqFromRef === 'string' && reqFromRef.trim()) finalReq = reqFromRef.split(',').map((s) => s.trim()).filter(Boolean);
      }
      if (finalReq.length === 0) finalReq = ['Tile'];

      return {
        ...r,
        customerType: finalCustomerType,
        requirements: finalReq,
        requirement: finalReq.join(', '),
      };
    });

    res.status(200).json({
      success: true,
      data: records,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)) || 1,
    });
  } catch (error) {
    console.error('Error in getLostSalesList:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch lost sales list' });
  }
};

/**
 * Get Lost Sales Analytics & Competitor Intelligence
 */
exports.getLostSalesAnalytics = async (req, res) => {
  try {
    const { month, startDate, endDate, salesperson } = req.query;
    const query = {};

    const targetMonth = month || toDateString(new Date()).substring(0, 7);

    if (startDate && endDate) {
      query.dateString = { $gte: startDate, $lte: endDate };
    } else if (targetMonth) {
      query.dateString = { $regex: `^${targetMonth}` };
    }

    if (salesperson && salesperson !== 'all') {
      query.salesperson = salesperson;
    }

    const allLostSales = await LostSale.find(query);

    let totalLostValue = 0;
    let totalPriceDifference = 0;
    let priceDiffCount = 0;

    const reasonMap = {};
    const competitorMap = {};
    const productMap = {
      Tile: { count: 0, value: 0 },
      Sanitary: { count: 0, value: 0 },
      CP: { count: 0, value: 0 },
      Adhesive: { count: 0, value: 0 },
      Other: { count: 0, value: 0 },
    };
    const staffLostMap = {};

    allLostSales.forEach((sale) => {
      const qVal = Number(sale.quoteValue) || 0;
      const pDiff = Number(sale.priceDifference) || 0;

      totalLostValue += qVal;

      if (pDiff > 0) {
        totalPriceDifference += pDiff;
        priceDiffCount += 1;
      }

      // 1. Lost Reasons breakdown
      const r = sale.lostReason || 'Other / Unknown';
      if (!reasonMap[r]) {
        reasonMap[r] = { reason: r, count: 0, totalValue: 0 };
      }
      reasonMap[r].count += 1;
      reasonMap[r].totalValue += qVal;

      // 2. Competitors breakdown
      const comp = sale.competitor || 'Unknown Dealer';
      if (!competitorMap[comp]) {
        competitorMap[comp] = { competitor: comp, count: 0, totalValue: 0 };
      }
      competitorMap[comp].count += 1;
      competitorMap[comp].totalValue += qVal;

      // 3. Products breakdown
      (sale.products || ['Tile']).forEach((prod) => {
        const key = productMap[prod] ? prod : 'Other';
        productMap[key].count += 1;
        productMap[key].value += qVal;
      });

      // 4. Staff breakdown
      const sName = sale.salesperson || 'Showroom Staff';
      if (!staffLostMap[sName]) {
        staffLostMap[sName] = { salesperson: sName, count: 0, totalValue: 0 };
      }
      staffLostMap[sName].count += 1;
      staffLostMap[sName].totalValue += qVal;
    });

    const totalDeals = allLostSales.length;

    // Format Reason rankings with percentages
    const reasonsBreakdown = Object.values(reasonMap)
      .map((item) => ({
        ...item,
        percentage: totalDeals > 0 ? Number(((item.count / totalDeals) * 100).toFixed(1)) : 0,
        valuePercentage: totalLostValue > 0 ? Number(((item.totalValue / totalLostValue) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Format Competitor Leaderboard
    const competitorLeaderboard = Object.values(competitorMap)
      .map((item) => ({
        ...item,
        percentage: totalDeals > 0 ? Number(((item.count / totalDeals) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.totalValue - a.totalValue);

    // Format Product Breakdown
    const productBreakdown = Object.entries(productMap).map(([product, data]) => ({
      product,
      count: data.count,
      value: data.value,
      percentage: totalDeals > 0 ? Number(((data.count / totalDeals) * 100).toFixed(1)) : 0,
    }));

    const averagePriceDifference = priceDiffCount > 0 ? Math.round(totalPriceDifference / priceDiffCount) : 0;
    const avgLostDealValue = totalDeals > 0 ? Math.round(totalLostValue / totalDeals) : 0;

    res.status(200).json({
      success: true,
      data: {
        month: targetMonth,
        totalLostDeals: totalDeals,
        totalLostValue,
        averagePriceDifference,
        avgLostDealValue,
        reasonsBreakdown,
        competitorLeaderboard,
        productBreakdown,
        staffBreakdown: Object.values(staffLostMap).sort((a, b) => b.totalValue - a.totalValue),
      },
    });
  } catch (error) {
    console.error('Error in getLostSalesAnalytics:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate lost sales analytics' });
  }
};

/**
 * Update a Lost Sale record & handles pipeline status updates
 */
exports.updateLostSale = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.quoteValue !== undefined) {
      updates.quoteValue = Number(updates.quoteValue) || 0;
    }
    if (updates.priceDifference !== undefined) {
      updates.priceDifference = Number(updates.priceDifference) || 0;
    }
    if (updates.date) {
      updates.dateString = toDateString(updates.date);
    }

    const lostSale = await LostSale.findById(id);
    if (!lostSale) {
      return res.status(404).json({ success: false, message: 'Lost sale record not found' });
    }

    const newStatus = updates.pipelineStatus || updates.customerStatus || updates.status;

    // Check if pipeline status is changed to something OTHER than Lost
    if (newStatus && !String(newStatus).toLowerCase().includes('lost')) {
      // Find linked customer record
      const cQuery = {
        $or: [
          ...(lostSale.customerRef ? [{ _id: lostSale.customerRef }] : []),
          ...(lostSale.customerId ? [{ customerId: lostSale.customerId }] : []),
          ...(lostSale.phone ? [{ 'data.phone': lostSale.phone }] : []),
        ],
      };

      let customerDoc = null;
      if (cQuery.$or.length > 0) {
        customerDoc = await Customer.findOne(cQuery);
      }

      if (customerDoc) {
        customerDoc.status = newStatus;
        const cData = customerDoc.data instanceof Map ? Object.fromEntries(customerDoc.data) : (customerDoc.data || {});
        cData.status = newStatus;
        if (updates.customerName) cData.customerName = updates.customerName.trim();
        if (updates.phone) cData.phone = updates.phone.trim();
        if (updates.salesperson) cData.salesperson = updates.salesperson.trim();
        if (updates.quoteValue !== undefined) cData.quotationValue = Number(updates.quoteValue);
        customerDoc.data = cData;
        customerDoc.markModified('data');
        await customerDoc.save();
      }

      // Delete LostSale record so it moves out of Lost Sales section to the target pipeline section
      await LostSale.findByIdAndDelete(id);

      return res.status(200).json({
        success: true,
        moved: true,
        message: `Customer moved from Lost Sales to ${newStatus} section`,
        data: { _id: id, status: newStatus },
      });
    }

    // Normal Lost Sale record update
    const updatedRecord = await LostSale.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    // Sync changes to Customer document if linked
    if (updatedRecord && (updatedRecord.customerId || updatedRecord.customerRef || updatedRecord.phone)) {
      try {
        const cQuery = {
          $or: [
            ...(updatedRecord.customerRef ? [{ _id: updatedRecord.customerRef }] : []),
            ...(updatedRecord.customerId ? [{ customerId: updatedRecord.customerId }] : []),
            ...(updatedRecord.phone ? [{ 'data.phone': updatedRecord.phone }] : []),
          ],
        };
        if (cQuery.$or.length > 0) {
          const cDoc = await Customer.findOne(cQuery);
          if (cDoc) {
            const cData = cDoc.data instanceof Map ? Object.fromEntries(cDoc.data) : (cDoc.data || {});
            if (updates.customerName) cData.customerName = updates.customerName.trim();
            if (updates.phone) cData.phone = updates.phone.trim();
            if (updates.salesperson) cData.salesperson = updates.salesperson.trim();
            if (updates.quoteValue !== undefined) cData.quotationValue = Number(updates.quoteValue);
            cDoc.data = cData;
            cDoc.markModified('data');
            await cDoc.save();
          }
        }
      } catch (err) {
        console.warn('Sync back to Customer doc failed:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Lost sale record updated successfully',
      data: updatedRecord,
    });
  } catch (error) {
    console.error('Error in updateLostSale:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update lost sale record' });
  }
};

/**
 * Delete a Lost Sale record
 */
exports.deleteLostSale = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user && req.user.role === 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Employees are not permitted to delete lost sales records.',
      });
    }

    const deleted = await LostSale.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Lost sale record not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Lost sale record removed',
    });
  } catch (error) {
    console.error('Error in deleteLostSale:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete lost sale record' });
  }
};

/**
 * Reopen / Mark Deal as Win-Back Opportunity
 */
exports.reopenLostSale = async (req, res) => {
  try {
    const { id } = req.params;
    const { winBackNotes } = req.body;

    const lostSale = await LostSale.findById(id);
    if (!lostSale) {
      return res.status(404).json({ success: false, message: 'Lost sale record not found' });
    }

    lostSale.status = 'win_back';
    lostSale.winBackDate = new Date();
    if (winBackNotes && winBackNotes.trim()) {
      lostSale.winBackNotes = winBackNotes.trim();
      const dateTag = new Date().toLocaleDateString('en-IN');
      lostSale.notes = `${lostSale.notes ? lostSale.notes + '\n' : ''}[Win-Back Reopened ${dateTag}]: ${winBackNotes.trim()}`;
    }
    await lostSale.save();

    // Reopen in Customer collection if linked (match by customerRef, customerId, or phone)
    const cQuery = {
      $or: [
        ...(lostSale.customerRef ? [{ _id: lostSale.customerRef }] : []),
        ...(lostSale.customerId ? [{ customerId: lostSale.customerId }] : []),
        ...(lostSale.phone ? [{ 'data.phone': lostSale.phone }] : []),
      ],
    };

    if (cQuery.$or.length > 0) {
      try {
        const customer = await Customer.findOne(cQuery);
        if (customer) {
          customer.status = 'Negotiation';
          const currentData = customer.data instanceof Map ? Object.fromEntries(customer.data) : (customer.data || {});
          currentData.status = 'Negotiation';
          currentData.lastReason = `Win-Back Reopened: ${winBackNotes ? winBackNotes.trim() : 'Customer re-engaged for negotiation'}`;
          currentData.winBackNotes = winBackNotes ? winBackNotes.trim() : '';
          currentData.nextFollowUp = new Date().toISOString().split('T')[0];
          customer.data = currentData;
          customer.markModified('data');
          await customer.save();
        }
      } catch (err) {
        console.warn('Could not sync win-back status to Customer document:', err.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Deal for ${lostSale.customerName} recorded as Win-Back Opportunity & moved to Negotiation!`,
      data: lostSale,
    });
  } catch (error) {
    console.error('Error in reopenLostSale:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to reopen deal' });
  }
};
