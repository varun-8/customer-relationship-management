const User = require('../models/User');
const Customer = require('../models/Customer');
let LostSale;
try {
  LostSale = require('../models/LostSale');
} catch (e) {
  // Model may be dynamic
}
const bcrypt = require('bcryptjs');

const DEFAULT_SHOWROOM_STAFF = [
  { name: 'Karthik Raja', email: 'karthik@vasantham.com', role: 'employee', phone: '9840112233' },
  { name: 'Senthil Kumar', email: 'senthil@vasantham.com', role: 'employee', phone: '9840223344' },
  { name: 'Priya Dharshini', email: 'priya@vasantham.com', role: 'employee', phone: '9840334455' },
  { name: 'Manoj Kumar', email: 'manoj@vasantham.com', role: 'employee', phone: '9840445566' },
];

/**
 * @desc Get all showroom employees and owners
 * @route GET /api/users
 */
const getUsers = async (req, res) => {
  try {
    let users = await User.find({}).select('-password').sort({ role: 1, name: 1 }).lean();

    // If database has 0 users, ensure standard showroom staff are seeded initially
    if (users.length === 0) {
      for (const staff of DEFAULT_SHOWROOM_STAFF) {
        const exists = users.some((u) => u.email.toLowerCase() === staff.email.toLowerCase() || u.name.toLowerCase() === staff.name.toLowerCase());
        if (!exists) {
          try {
            await User.create({
              name: staff.name,
              email: staff.email,
              password: 'password123',
              role: staff.role,
              phone: staff.phone,
              active: true,
            });
          } catch (seedErr) {
            console.warn('Staff seeding note:', seedErr.message);
          }
        }
      }
      users = await User.find({}).select('-password').sort({ role: 1, name: 1 }).lean();
    }

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch users' });
  }
};

/**
 * @desc Create a new employee / showroom login
 * @route POST /api/users
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'employee', phone, active = true } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Staff name is required' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Login email is required' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: `A user with email "${normalizedEmail}" already exists` });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: password.trim(),
      role: role === 'owner' ? 'owner' : 'employee',
      phone: phone ? phone.trim() : '',
      active: Boolean(active),
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    res.status(201).json({
      success: true,
      message: `Employee "${newUser.name}" registered successfully with mobile login credentials`,
      data: userObj,
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create employee' });
  }
};

/**
 * @desc Update existing employee / mobile credentials
 * @route PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, phone, active } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee record not found' });
    }

    const oldName = user.name;
    const newName = name ? name.trim() : oldName;

    if (name) user.name = newName;
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
        if (existing) {
          return res.status(400).json({ success: false, message: `Email "${normalizedEmail}" is already in use by another user` });
        }
        user.email = normalizedEmail;
      }
    }
    if (role && (role === 'owner' || role === 'employee' || role === 'admin')) {
      user.role = role;
    }
    if (phone !== undefined) user.phone = phone ? phone.trim() : '';
    if (active !== undefined) user.active = Boolean(active);

    // If a new password was provided
    if (password && password.trim().length >= 6) {
      user.password = password.trim();
    }

    await user.save();

    // If staff name changed, cascade update assigned leads in background
    if (newName !== oldName) {
      try {
        await Customer.updateMany(
          { 'data.salesperson': oldName },
          { $set: { 'data.salesperson': newName } }
        );
        if (LostSale) {
          await LostSale.updateMany(
            { salesperson: oldName },
            { $set: { salesperson: newName } }
          );
        }
      } catch (cascadeErr) {
        console.warn('Lead salesperson cascade update warning:', cascadeErr.message);
      }
    }

    const userObj = user.toObject();
    delete userObj.password;

    res.json({
      success: true,
      message: `Employee "${user.name}" updated successfully`,
      data: userObj,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update employee' });
  }
};

/**
 * @desc Delete employee and automatically reassign all active leads to Showroom Owner
 * @route DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee record not found' });
    }

    // Protect primary owner account from deletion
    if (user.email === 'owner@vasantham.com') {
      return res.status(400).json({ success: false, message: 'Cannot delete the primary showroom owner account' });
    }

    const deletedUserName = user.name;

    // 1. Locate Showroom Owner for automatic lead reassignment
    let owner = await User.findOne({ role: 'owner' }).lean();
    if (!owner) {
      owner = await User.findOne({ email: 'owner@vasantham.com' }).lean();
    }
    const reassignedToName = owner ? owner.name : 'Showroom Owner';

    // 2. Automatically reassign all active leads from deleted employee to Showroom Owner
    const custUpdateResult = await Customer.updateMany(
      { 'data.salesperson': deletedUserName },
      { $set: { 'data.salesperson': reassignedToName, 'updatedBy.name': 'System (Reassigned on Deletion)' } }
    );

    // 3. Reassign any records in LostSale collection
    if (LostSale) {
      try {
        await LostSale.updateMany(
          { salesperson: deletedUserName },
          { $set: { salesperson: reassignedToName } }
        );
      } catch (lostErr) {
        console.warn('LostSale reassignment warning:', lostErr.message);
      }
    }

    // 4. Delete the employee record
    await User.findByIdAndDelete(id);

    const reassignedCount = custUpdateResult.modifiedCount || custUpdateResult.nModified || 0;

    res.json({
      success: true,
      message: `Employee "${deletedUserName}" removed successfully. ${reassignedCount} lead(s) automatically reassigned to ${reassignedToName}.`,
      reassignedCount,
      reassignedTo: reassignedToName,
    });
  } catch (error) {
    console.error('Error deleting user and reassigning leads:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete employee' });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
