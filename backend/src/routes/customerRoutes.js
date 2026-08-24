const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  lookupCustomerByPhone,
  bulkImportCustomers,
} = require('../controllers/customerController');
const { protect } = require('../middlewares/authMiddleware');
const { validateCustomerData } = require('../middlewares/validateCustomer');

// Protect all customer routes
router.use(protect);

router.get('/', getCustomers);
router.get('/lookup-phone/:phone', lookupCustomerByPhone);
router.get('/:id', getCustomerById);
router.post('/', validateCustomerData, createCustomer);
router.post('/bulk-import', bulkImportCustomers);
router.put('/:id', validateCustomerData, updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
