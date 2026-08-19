const Customer = require('../models/Customer');
const DailyKPI = require('../models/DailyKPI');
const LostSale = require('../models/LostSale');
const Sequence = require('../models/Sequence');

/**
 * Wipe all customer data, follow-ups, KPIs, lost sales, and reset sequences.
 * Requires verification against DEV_KEY in .env.
 */
exports.wipeDatabase = async (req, res) => {
  try {
    const { devKey } = req.body;

    const expectedDevKey = process.env.DEV_KEY;
    if (!expectedDevKey) {
      return res.status(500).json({
        success: false,
        message: 'DEV_KEY is not configured in backend .env file.',
      });
    }

    if (!devKey || String(devKey).trim() !== String(expectedDevKey).trim()) {
      return res.status(403).json({
        success: false,
        message: 'Invalid Developer Key. Verification failed. Check DEV_KEY in backend .env.',
      });
    }

    // 1. Delete all Customer records (including dynamic follow-up states)
    const customerDeleteResult = await Customer.deleteMany({});

    // 2. Delete all Daily KPI tracking entries
    const kpiDeleteResult = await DailyKPI.deleteMany({});

    // 3. Delete all Lost Sale records
    const lostSaleDeleteResult = await LostSale.deleteMany({});

    // 4. Reset Customer ID Sequence generator to 0 and record wipe timestamp
    await Sequence.findOneAndUpdate(
      { key: 'customer_id' },
      { currentValue: 0, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    const wipeTimestamp = Date.now();
    await Sequence.findOneAndUpdate(
      { key: 'last_wiped_at' },
      { currentValue: wipeTimestamp, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    console.log(`🧹 [DEV WIPE] Database wiped by developer key.`);
    console.log(`   - Customers deleted: ${customerDeleteResult.deletedCount}`);
    console.log(`   - KPIs deleted: ${kpiDeleteResult.deletedCount}`);
    console.log(`   - Lost Sales deleted: ${lostSaleDeleteResult.deletedCount}`);
    console.log(`   - Sequence counter reset to 0.`);
    console.log(`   - Wipe timestamp recorded: ${wipeTimestamp}`);

    return res.status(200).json({
      success: true,
      message: 'All CRM data has been successfully wiped and sequence counters reset.',
      summary: {
        customersDeleted: customerDeleteResult.deletedCount,
        kpisDeleted: kpiDeleteResult.deletedCount,
        lostSalesDeleted: lostSaleDeleteResult.deletedCount,
        sequenceReset: true,
      },
    });
  } catch (error) {
    console.error('Error during database wipe:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to wipe database.',
    });
  }
};
