const express = require('express');
const router = express.Router();
const {
  getActiveForm,
  getDraftForm,
  saveDraftForm,
  publishForm,
  deleteDraftForm,
  addField,
  updateField,
  deleteField,
  reorderFields,
  getFormVersions,
} = require('../controllers/formController');
const { protect } = require('../middlewares/authMiddleware');
const { requireOwnerOrAdmin } = require('../middlewares/roleMiddleware');

// Public or Employee/Showroom accessible: gets active form schema for dynamic rendering
router.get('/', getActiveForm);

// Owner/Admin Form Builder management routes
router.get('/draft', protect, requireOwnerOrAdmin, getDraftForm);
router.post('/draft', protect, requireOwnerOrAdmin, saveDraftForm);
router.delete('/draft', protect, requireOwnerOrAdmin, deleteDraftForm);
router.post('/publish', protect, requireOwnerOrAdmin, publishForm);
router.get('/versions', protect, requireOwnerOrAdmin, getFormVersions);

// Field specific modifications in draft
router.post('/fields', protect, requireOwnerOrAdmin, addField);
router.put('/fields/:id', protect, requireOwnerOrAdmin, updateField);
router.delete('/fields/:id', protect, requireOwnerOrAdmin, deleteField);
router.put('/reorder', protect, requireOwnerOrAdmin, reorderFields);

module.exports = router;
