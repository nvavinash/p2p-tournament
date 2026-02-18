const Transaction = require("../models/Transaction");
const User = require("../models/User");

// GET /api/admin/transactions
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("userId", "name playerId _id")
      .sort({ createdAt: -1 });

    const result = transactions.map((t) => ({
      _id: t._id,
      name: t.userId?.name || "Unknown",
      userId: t.userId?._id,
      playerId: t.userId?.playerId || "N/A",
      type: t.type,
      amount: t.amount,
      paymentProof: t.paymentProof,
      status: t.status,
      editedByAdmin: t.editedByAdmin,
      createdAt: t.createdAt,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/admin/withdrawals
const getWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Transaction.find({ type: "withdraw" })
      .populate("userId", "name playerId _id")
      .sort({ createdAt: -1 });

    const result = withdrawals.map((t) => ({
      _id: t._id,
      name: t.userId?.name || "Unknown",
      userId: t.userId?._id,
      playerId: t.userId?.playerId || "N/A",
      amount: t.amount,
      editedByAdmin: t.editedByAdmin,
      createdAt: t.createdAt,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/admin/user/:id/wallet
const updateUserWallet = async (req, res) => {
  try {
    const { id } = req.params;
    const { walletBalance } = req.body;

    if (walletBalance === undefined || walletBalance === null) {
      return res.status(400).json({ message: "walletBalance is required" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { walletBalance: Number(walletBalance) },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Mark all of this user's transactions as editedByAdmin
    await Transaction.updateMany({ userId: id }, { editedByAdmin: true });

    res.json({
      message: "Wallet updated successfully",
      walletBalance: user.walletBalance,
      user,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/admin/users — list all users (for wallet editor)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getAllTransactions,
  getWithdrawals,
  updateUserWallet,
  getAllUsers,
};
