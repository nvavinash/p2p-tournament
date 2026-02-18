const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { sendTelegramMessage } = require("../utils/telegram");

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
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Payment screenshot is required for deposits" });
    }

    const paymentProof = req.file.path; // Cloudinary URL

    const transaction = await Transaction.create({
      userId: req.user._id,
      type: "deposit",
      amount: Number(amount),
      paymentProof,
      status: "pending",
    });

    // Telegram notification
    const user = req.user;
    await sendTelegramMessage(
      `💰 <b>New Deposit Request</b>\nName: ${user.name}\nPlayerID: ${user.playerId}\nAmount: ₹${amount}`,
    );

    res.status(201).json({ message: "Deposit request submitted", transaction });
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

    const transaction = await Transaction.create({
      userId: req.user._id,
      type: "withdraw",
      amount: Number(amount),
      status: "pending",
    });

    // Telegram notification
    const user = req.user;
    await sendTelegramMessage(
      `🏧 <b>Withdrawal Request</b>\nName: ${user.name}\nPlayerID: ${user.playerId}\nAmount: ₹${amount}`,
    );

    res
      .status(201)
      .json({ message: "Withdrawal request submitted", transaction });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/wallet/transactions — user's own transaction history
const getMyTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getBalance,
  depositRequest,
  withdrawRequest,
  getMyTransactions,
};
