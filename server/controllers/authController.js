const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const AdminActivityLog = require('../models/AdminActivityLog');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new player (phone + PIN + UPI)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, phone, pin } = req.body;

    if (!name || !phone || !pin) {
      return res.status(400).json({ message: 'Please fill all fields: name, phone, PIN' });
    }

    // Validate phone
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
    }

    // Validate PIN
    if (!/^\d{6}$/.test(pin)) {
      return res.status(400).json({ message: 'PIN must be exactly 6 digits' });
    }

    // Validate UPI ID
    // if (!/^[\w.\-]+@[\w]+$/.test(upiId)) {
    //   return res.status(400).json({ message: 'Invalid UPI ID format (e.g. name@upi)' });
    // }

    // Check duplicate phone
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }

    // Hash PIN
    const salt = await bcrypt.genSalt(12);
    const hashedPin = await bcrypt.hash(pin, salt);

    const user = await User.create({
      name,
      phone,
      pin: hashedPin,
      // upiId,
      role: 'user',
      status: 'active',
    });

    res.status(201).json({ message: 'Registration successful! Please login.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Login with phone + 6-digit PIN
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { phone, pin } = req.body;

    if (!phone || !pin) {
      return res.status(400).json({ message: 'Phone and PIN are required' });
    }

    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(401).json({ message: 'Invalid phone number or PIN' });
    }

    if (user.isBanned || user.status === 'banned') {
      return res.status(403).json({ message: 'Your account has been banned. Contact support.' });
    }

    const pinMatch = await bcrypt.compare(pin, user.pin);
    if (!pinMatch) {
      return res.status(401).json({ message: 'Invalid phone number or PIN' });
    }

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      phone: user.phone,
      // upiId: user.upiId,
      walletBalance: user.walletBalance,
      role: user.role,
      status: user.status,
      isBanned: user.isBanned,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-pin -password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerUser, loginUser, getMe };
