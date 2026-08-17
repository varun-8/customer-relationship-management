const express = require('express');
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { protect } = require('../middlewares/authMiddleware');
const { validateCustomerData } = require('../middlewares/validateCustomer');

// Protect all customer routes
router.use(protect);

router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.post('/', validateCustomerData, createCustomer);
router.put('/:id', validateCustomerData, updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
