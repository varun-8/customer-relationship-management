const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { requireEmployeeOrAbove } = require('../middlewares/roleMiddleware');

router.get('/', getUsers);
router.post('/', protect, requireEmployeeOrAbove, createUser);
router.put('/:id', protect, requireEmployeeOrAbove, updateUser);
router.delete('/:id', protect, requireEmployeeOrAbove, deleteUser);

module.exports = router;
