const Sequence = require('../models/Sequence');

/**
 * Atomically generates the next formatted sequence ID (e.g. VAS-000001)
 * Guaranteed unique and concurrency-safe across multiple mobile & desktop clients.
 */
const generateNextId = async (sequenceKey = 'customer_id') => {
  let sequence = await Sequence.findOne({ key: sequenceKey });

  if (!sequence) {
    sequence = await Sequence.create({
      key: sequenceKey,
      prefix: 'VAS-',
      currentValue: 0,
      startValue: 1,
      padding: 6,
      step: 1,
    });
  }

  // Atomically increment the sequence counter
  const updated = await Sequence.findOneAndUpdate(
    { key: sequenceKey },
    {
      $inc: { currentValue: sequence.step || 1 },
      $set: { updatedAt: new Date() },
    },
    { new: true, upsert: true }
  );

  const num = Math.max(updated.currentValue, updated.startValue);
  const paddedNum = String(num).padStart(updated.padding || 6, '0');
  const formattedId = `${updated.prefix || ''}${paddedNum}`;

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
  const prefix = sequence?.prefix ?? 'VAS-';
  const padding = sequence?.padding ?? 6;
  const nextNum = sequence ? sequence.currentValue + (sequence.step || 1) : 1;
  const paddedNum = String(nextNum).padStart(padding, '0');
  return `${prefix}${paddedNum}`;
};

module.exports = {
  generateNextId,
  previewNextId,
};
