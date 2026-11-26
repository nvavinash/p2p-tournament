
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  pin: {
    type: String,
    required: true,
  },
  upiId: {
    type: String,
    // required: true,
    trim: true,
  },
  walletBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['active', 'banned'],
    default: 'active',
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },

  // Legacy fields
  email: {
    type: String,
    sparse: true,
    trim: true,
  },
  password: {
    type: String,
  },
  playerId: {
    type: String,
    sparse: true,
    trim: true,
  },

}, {
  timestamps: true,
});

// Other indexes
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

module.exports = mongoose.model('User', userSchema);
