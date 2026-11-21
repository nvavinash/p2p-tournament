const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { sendTelegramMessage } = require("../utils/telegram");

// Helper: log activity
const AdminActivityLog = require("../models/AdminActivityLog");
const logActivity = async (adminId, action, targetType, targetId, details, ip) => {
  try {
    await AdminActivityLog.create({ adminId, action, targetType, targetId: String(targetId), details, ip });
  } catch (e) { /* non-critical */ }
};

// GET /api/wallet/balance
const getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("walletBalance");
    res.json({ walletBalance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/wallet/deposit-request
const depositRequest = async (req, res) => {
  try {
    const { amount, utr } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    if (!utr || utr.trim().length < 6) {
      return res.status(400).json({ message: "UTR number is mandatory and must be at least 6 characters" });
    }

    const cleanUtr = utr.trim().toUpperCase();

    // Duplicate UTR check
    const utrExists = await Transaction.findOne({ utr: cleanUtr, type: "deposit", status: { $ne: "rejected" } });
    if (utrExists) {
      return res.status(400).json({ message: "This UTR number has already been submitted. Contact admin if this is a mistake." });
    }

    const paymentProof = req.file ? req.file.path : null;

    const transaction = await Transaction.create({
      userId: req.user._id,
      type: "deposit",
      amount: Number(amount),
      utr: cleanUtr,
      paymentProof,
      status: "pending",
      description: `Deposit request via PhonePe — UTR: ${cleanUtr}`,
    });

    // Telegram notification
    await sendTelegramMessage(
      `💰 <b>New Deposit Request</b>\nName: ${req.user.name}\nPhone: ${req.user.phone}\nAmount: ₹${amount}\nUTR: ${cleanUtr}`
    );

    res.status(201).json({ message: "Deposit request submitted. Awaiting admin approval.", transaction });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/wallet/withdraw-request
const withdrawRequest = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const withdrawAmt = Number(amount);
    const user = await User.findById(req.user._id);

    if (user.walletBalance < withdrawAmt) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    // Check pending withdrawals (prevent double-dipping)
    const pendingTotal = await Transaction.aggregate([
      { $match: { userId: user._id, type: "withdraw", status: "pending" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const pendingAmt = pendingTotal[0]?.total || 0;

    if (user.walletBalance - pendingAmt < withdrawAmt) {
      return res.status(400).json({ message: "Insufficient available balance (accounting for pending withdrawals)" });
    }

    const prevBalance = user.walletBalance;
    const transaction = await Transaction.create({
      userId: user._id,
      type: "withdraw",
      amount: withdrawAmt,
      prevBalance,
      newBalance: prevBalance, // actual debit only on approval
      status: "pending",
      description: `Withdrawal request to UPI: ${user.upiId}`,
    });

    await sendTelegramMessage(
      `🏧 <b>Withdrawal Request</b>\nName: ${user.name}\nPhone: ${user.phone}\nUPI: ${user.upiId}\nAmount: ₹${withdrawAmt}`
    );

    res.status(201).json({ message: "Withdrawal request submitted. Awaiting admin approval.", transaction });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/wallet/transactions
const getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { getBalance, depositRequest, withdrawRequest, getMyTransactions };
