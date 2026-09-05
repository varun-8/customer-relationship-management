const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// @desc Auth user & get token (supports email or username)
// @route POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const identifier = (username || email || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username/email and password' });
    }

    const lowerId = identifier.toLowerCase();
    const adminUserEnv = (process.env.ADMIN_USERNAME || 'vasantham').trim().toLowerCase();

    // Search user by email, username match, or if it's the admin username
    let user = await User.findOne({
      $or: [
        { email: lowerId },
        { email: `${lowerId}@vasantham.com` },
        { name: new RegExp(`^${identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        ...(lowerId === adminUserEnv ? [{ role: 'owner' }, { email: 'owner@vasantham.com' }] : []),
      ],
    });

    // If user is admin/owner and password matches .env password, or hash matches
    let isMatch = false;
    if (user) {
      isMatch = await user.matchPassword(password);
      if (!isMatch && (user.role === 'owner' || user.role === 'admin') && password === (process.env.ADMIN_PASSWORD || 'vasantham@2026')) {
        // Sync the password hash if environment override matches
        user.password = password;
        await user.save();
        isMatch = true;
      }
    } else if (lowerId === adminUserEnv && password === (process.env.ADMIN_PASSWORD || 'vasantham@2026')) {
      // Auto-create admin user on the fly if not seeded yet
      user = await User.create({
        name: 'Vasantham Admin',
        email: `${adminUserEnv}@vasantham.com`,
        password: password,
        role: 'owner',
        phone: '9840123456',
      });
      isMatch = true;
    }

    if (user && isMatch) {
      if (!user.active) {
        return res.status(403).json({ success: false, message: 'Your account is deactivated' });
      }

      return res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          token: generateToken(user._id),
        },
      });
    }

    res.status(401).json({ success: false, message: 'Invalid credentials. Please check your username and password.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Register a new user
// @route POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'employee',
      phone,
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get current user profile
// @route GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  loginUser,
  registerUser,
  getMe,
};
