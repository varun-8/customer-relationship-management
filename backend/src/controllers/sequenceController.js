const Sequence = require('../models/Sequence');
const { previewNextId } = require('../utils/idGenerator');

// @desc Get current sequence config for customer ID
// @route GET /api/sequence/customer-id
const getSequenceConfig = async (req, res) => {
  try {
    let sequence = await Sequence.findOne({ key: 'customer_id' });
    if (!sequence) {
      sequence = await Sequence.create({
        key: 'customer_id',
        prefix: 'VAS-',
        currentValue: 0,
        startValue: 1,
        padding: 6,
        step: 1,
      });
    }

    const preview = await previewNextId('customer_id');

    res.json({
      success: true,
      data: {
        key: sequence.key,
        prefix: sequence.prefix,
        currentValue: sequence.currentValue,
        startValue: sequence.startValue,
        padding: sequence.padding,
        step: sequence.step,
        nextPreview: preview,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update sequence configuration (Owner/Admin only)
// @route PUT /api/sequence/customer-id
const updateSequenceConfig = async (req, res) => {
  try {
    const { prefix, startValue, padding, step, currentValue } = req.body;

    let sequence = await Sequence.findOne({ key: 'customer_id' });
    if (!sequence) {
      sequence = new Sequence({ key: 'customer_id' });
    }

    if (prefix !== undefined) sequence.prefix = String(prefix).trim().toUpperCase();
    if (startValue !== undefined && !isNaN(Number(startValue)) && Number(startValue) >= 0) {
      sequence.startValue = Number(startValue);
    }
    if (padding !== undefined && !isNaN(Number(padding)) && Number(padding) >= 1 && Number(padding) <= 12) {
      sequence.padding = Number(padding);
    }
    if (step !== undefined && !isNaN(Number(step)) && Number(step) >= 1) {
      sequence.step = Number(step);
    }
    if (currentValue !== undefined && !isNaN(Number(currentValue)) && Number(currentValue) >= 0) {
      sequence.currentValue = Number(currentValue);
    }

    sequence.updatedAt = new Date();
    await sequence.save();

    const preview = await previewNextId('customer_id');

    res.json({
      success: true,
      message: 'Customer ID sequence settings updated successfully',
      data: {
        key: sequence.key,
        prefix: sequence.prefix,
        currentValue: sequence.currentValue,
        startValue: sequence.startValue,
        padding: sequence.padding,
        step: sequence.step,
        nextPreview: preview,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update sequence' });
  }
};

module.exports = {
  getSequenceConfig,
  updateSequenceConfig,
};
