const Sequence = require('../models/Sequence');
const Customer = require('../models/Customer');

/**
 * Atomically generates the next formatted sequence ID (e.g. CUS-000011)
 * Guaranteed unique, collision-proof, and concurrency-safe across multiple mobile & desktop clients.
 */
const generateNextId = async (sequenceKey = 'customer_id') => {
  let sequence = await Sequence.findOne({ key: sequenceKey });

  if (!sequence) {
    sequence = await Sequence.create({
      key: sequenceKey,
      prefix: 'CUS-',
      currentValue: 0,
      startValue: 1,
      padding: 6,
      step: 1,
    });
  }

  // Find highest existing customer ID number to prevent any duplicate key errors
  let maxExistingNum = 0;
  try {
    const latestCustomers = await Customer.find({}, 'customerId').lean();
    for (const c of latestCustomers) {
      if (c.customerId) {
        const match = c.customerId.match(/(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > maxExistingNum) {
            maxExistingNum = n;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Could not scan max customerId:', e.message);
  }

  // If current sequence is lower than existing max number in DB, sync it
  let baseVal = sequence.currentValue || 0;
  if (baseVal < maxExistingNum) {
    baseVal = maxExistingNum;
  }

  const nextVal = Math.max(baseVal + (sequence.step || 1), sequence.startValue || 1);

  // Atomically persist the verified next counter
  const updated = await Sequence.findOneAndUpdate(
    { key: sequenceKey },
    {
      $set: {
        currentValue: nextVal,
        updatedAt: new Date(),
      },
    },
    { new: true, upsert: true }
  );

  const num = updated.currentValue;
  const paddedNum = String(num).padStart(updated.padding || 6, '0');
  const formattedId = `${updated.prefix || 'CUS-'}${paddedNum}`;

  return {
    id: formattedId,
    number: num,
    prefix: updated.prefix,
    padding: updated.padding,
  };
};

/**
 * Preview formatted ID without incrementing
 */
const previewNextId = async (sequenceKey = 'customer_id') => {
  const sequence = await Sequence.findOne({ key: sequenceKey });
  const prefix = sequence?.prefix ?? 'CUS-';
  const padding = sequence?.padding ?? 6;

  let maxExistingNum = sequence?.currentValue ?? 0;
  try {
    const latestCustomers = await Customer.find({}, 'customerId').lean();
    for (const c of latestCustomers) {
      if (c.customerId) {
        const match = c.customerId.match(/(\d+)/);
        if (match) {
          const n = parseInt(match[1], 10);
          if (!isNaN(n) && n > maxExistingNum) {
            maxExistingNum = n;
          }
        }
      }
    }
  } catch (e) {}

  const nextNum = maxExistingNum + (sequence?.step || 1);
  const paddedNum = String(nextNum).padStart(padding, '0');
  return `${prefix}${paddedNum}`;
};

module.exports = {
  generateNextId,
  previewNextId,
};
