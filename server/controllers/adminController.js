const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Match = require("../models/Match");
const MatchRegistration = require("../models/MatchRegistration");
const PlatformSettings = require("../models/PlatformSettings");
const AdminActivityLog = require("../models/AdminActivityLog");
const mongoose = require("mongoose");

const logActivity = async (adminId, action, targetType, targetId, details, ip) => {
  try {
    await AdminActivityLog.create({ adminId, action, targetType, targetId: String(targetId), details, ip });
  } catch (e) {}
};

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [
      totalPlayers,
      activePlayers,
      bannedPlayers,
      totalMatches,
      upcomingMatches,
      pendingDeposits,
      pendingWithdrawals,
      approvedDeposits,
      paidWithdrawals,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", status: "active" }),
      User.countDocuments({ role: "user", status: "banned" }),
      Match.countDocuments(),
      Match.countDocuments({ status: { $in: ["upcoming", "open"] } }),
      Transaction.countDocuments({ type: "deposit", status: "pending" }),
      Transaction.countDocuments({ type: "withdraw", status: "pending" }),
      Transaction.aggregate([{ $match: { type: "deposit", status: "approved" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Transaction.aggregate([{ $match: { type: "withdraw", status: "paid" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    ]);

    res.json({
      totalPlayers,
      activePlayers,
      bannedPlayers,
      totalMatches,
      upcomingMatches,
      pendingDeposits,
      pendingWithdrawals,
      totalApprovedDeposits: approvedDeposits[0]?.total || 0,
      totalPaidWithdrawals: paidWithdrawals[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── PLAYER MANAGEMENT ───────────────────────────────────────────────────────

// GET /api/admin/players
const getAllPlayers = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { role: "user" };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }
    const players = await User.find(query).select("-pin -password").sort({ createdAt: -1 });
    res.json(players);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/admin/players/:id/status — ban/unban toggle
const togglePlayerStatus = async (req, res) => {
  try {
    const player = await User.findById(req.params.id);
    if (!player || player.role === "admin") {
      return res.status(404).json({ message: "Player not found" });
    }

    const newStatus = player.status === "banned" ? "active" : "banned";
    const newIsBanned = newStatus === "banned";

    player.status = newStatus;
    player.isBanned = newIsBanned;
    await player.save();

    await logActivity(req.user._id, `${newStatus === "banned" ? "BAN" : "UNBAN"}_PLAYER`, "user", player._id, { name: player.name, phone: player.phone }, req.ip);

    res.json({ message: `Player ${newStatus === "banned" ? "banned" : "unbanned"} successfully`, player });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/admin/players/:id — player detail
const getPlayerDetail = async (req, res) => {
  try {
    const player = await User.findById(req.params.id).select("-pin -password");
    if (!player) return res.status(404).json({ message: "Player not found" });

    const [transactions, matchHistory] = await Promise.all([
      Transaction.find({ userId: player._id }).sort({ createdAt: -1 }).limit(50),
      MatchRegistration.find({ userId: player._id }).populate("matchId").sort({ createdAt: -1 }).limit(20),
    ]);

    res.json({ player, transactions, matchHistory });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

// GET /api/admin/transactions
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("userId", "name phone upiId")
      .populate("adminId", "name")
      .sort({ createdAt: -1 });

    const result = transactions.map((t) => ({
      _id: t._id,
      name: t.userId?.name || "Unknown",
      phone: t.userId?.phone || "N/A",
      upiId: t.userId?.upiId || "N/A",
      userId: t.userId?._id,
      type: t.type,
      amount: t.amount,
      prevBalance: t.prevBalance,
      newBalance: t.newBalance,
      utr: t.utr,
      paymentProof: t.paymentProof,
      status: t.status,
      description: t.description,
      rejectionReason: t.rejectionReason,
      payoutUtr: t.payoutUtr,
      editedByAdmin: t.editedByAdmin,
      adminName: t.adminId?.name || null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── DEPOSITS ─────────────────────────────────────────────────────────────────

// GET /api/admin/deposits?status=pending
const getDeposits = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { type: "deposit" };
    if (status) query.status = status;

    const deposits = await Transaction.find(query)
      .populate("userId", "name phone upiId")
      .sort({ createdAt: -1 });

    const result = deposits.map((t) => ({
      _id: t._id,
      name: t.userId?.name || "Unknown",
      phone: t.userId?.phone || "N/A",
      upiId: t.userId?.upiId || "N/A",
      userId: t.userId?._id,
      amount: t.amount,
      utr: t.utr,
      paymentProof: t.paymentProof,
      status: t.status,
      rejectionReason: t.rejectionReason,
      createdAt: t.createdAt,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/admin/deposits/:id/approve
const approveDeposit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const deposit = await Transaction.findById(req.params.id).session(session);
    if (!deposit || deposit.type !== "deposit") {
      await session.abortTransaction();
      return res.status(404).json({ message: "Deposit not found" });
    }
    if (deposit.status !== "pending") {
      await session.abortTransaction();
      return res.status(400).json({ message: `Deposit is already ${deposit.status}` });
    }

    // Check UTR not approved before
    const dupUtr = await Transaction.findOne({
      _id: { $ne: deposit._id },
      utr: deposit.utr,
      status: "approved",
    }).session(session);
    if (dupUtr) {
      await session.abortTransaction();
      return res.status(400).json({ message: "This UTR is already associated with an approved deposit" });
    }

    const user = await User.findById(deposit.userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: "User not found" });
    }

    const prevBalance = user.walletBalance;
    const newBalance = prevBalance + deposit.amount;

    // Update user wallet
    await User.findByIdAndUpdate(user._id, { walletBalance: newBalance }, { session });

    // Update deposit record
    await Transaction.findByIdAndUpdate(deposit._id, {
      status: "approved",
      prevBalance,
      newBalance,
      editedByAdmin: true,
      adminId: req.user._id,
      description: `Deposit approved by admin. UTR: ${deposit.utr}`,
    }, { session });

    await session.commitTransaction();

    await logActivity(req.user._id, "APPROVE_DEPOSIT", "transaction", deposit._id, { amount: deposit.amount, utr: deposit.utr, userId: user._id }, req.ip);

    res.json({ message: `Deposit of ₹${deposit.amount} approved. New balance: ₹${newBalance}` });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    session.endSession();
  }
};

// PATCH /api/admin/deposits/:id/reject
const rejectDeposit = async (req, res) => {
  try {
    const { reason } = req.body;
    const deposit = await Transaction.findById(req.params.id);
    if (!deposit || deposit.type !== "deposit") {
      return res.status(404).json({ message: "Deposit not found" });
    }
    if (deposit.status !== "pending") {
      return res.status(400).json({ message: `Deposit is already ${deposit.status}` });
    }

    deposit.status = "rejected";
    deposit.rejectionReason = reason || "Rejected by admin";
    deposit.editedByAdmin = true;
    deposit.adminId = req.user._id;
    await deposit.save();

    await logActivity(req.user._id, "REJECT_DEPOSIT", "transaction", deposit._id, { reason, utr: deposit.utr }, req.ip);

    res.json({ message: "Deposit request rejected" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── WITHDRAWALS ──────────────────────────────────────────────────────────────

// GET /api/admin/withdrawals?status=pending
const getWithdrawals = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { type: "withdraw" };
    if (status) query.status = status;

    const withdrawals = await Transaction.find(query)
      .populate("userId", "name phone upiId")
      .sort({ createdAt: -1 });

    const result = withdrawals.map((t) => ({
      _id: t._id,
      name: t.userId?.name || "Unknown",
      phone: t.userId?.phone || "N/A",
      upiId: t.userId?.upiId || "N/A",
      userId: t.userId?._id,
      amount: t.amount,
      status: t.status,
      rejectionReason: t.rejectionReason,
      payoutUtr: t.payoutUtr,
      editedByAdmin: t.editedByAdmin,
      createdAt: t.createdAt,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/admin/withdrawals/:id/approve
const approveWithdrawal = async (req, res) => {
  try {
    const withdrawal = await Transaction.findById(req.params.id);
    if (!withdrawal || withdrawal.type !== "withdraw") {
      return res.status(404).json({ message: "Withdrawal not found" });
    }
    if (withdrawal.status !== "pending") {
      return res.status(400).json({ message: `Withdrawal is already ${withdrawal.status}` });
    }

    const user = await User.findById(withdrawal.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.walletBalance < withdrawal.amount) {
      return res.status(400).json({ message: "User has insufficient balance for this withdrawal" });
    }

    const prevBalance = user.walletBalance;
    const newBalance = prevBalance - withdrawal.amount;

    await User.findByIdAndUpdate(user._id, { walletBalance: newBalance });
    withdrawal.status = "approved";
    withdrawal.prevBalance = prevBalance;
    withdrawal.newBalance = newBalance;
    withdrawal.editedByAdmin = true;
    withdrawal.adminId = req.user._id;
    withdrawal.description = `Withdrawal approved. Pending payout to UPI: ${user.upiId}`;
    await withdrawal.save();

    await logActivity(req.user._id, "APPROVE_WITHDRAWAL", "transaction", withdrawal._id, { amount: withdrawal.amount, upiId: user.upiId }, req.ip);

    res.json({ message: "Withdrawal approved. Please complete the manual transfer and mark as paid." });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/admin/withdrawals/:id/reject
const rejectWithdrawal = async (req, res) => {
  try {
    const { reason } = req.body;
    const withdrawal = await Transaction.findById(req.params.id);
    if (!withdrawal || withdrawal.type !== "withdraw") {
      return res.status(404).json({ message: "Withdrawal not found" });
    }
    if (!["pending", "approved"].includes(withdrawal.status)) {
      return res.status(400).json({ message: `Cannot reject a ${withdrawal.status} withdrawal` });
    }

    // If already approved (balance was deducted), refund it
    if (withdrawal.status === "approved") {
      await User.findByIdAndUpdate(withdrawal.userId, { $inc: { walletBalance: withdrawal.amount } });
    }

    withdrawal.status = "rejected";
    withdrawal.rejectionReason = reason || "Rejected by admin";
    withdrawal.editedByAdmin = true;
    withdrawal.adminId = req.user._id;
    await withdrawal.save();

    await logActivity(req.user._id, "REJECT_WITHDRAWAL", "transaction", withdrawal._id, { reason, amount: withdrawal.amount }, req.ip);

    res.json({ message: "Withdrawal rejected" + (withdrawal.status === "approved" ? " and balance refunded" : "") });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/admin/withdrawals/:id/paid — mark as paid after manual transfer
const markWithdrawalPaid = async (req, res) => {
  try {
    const { payoutUtr } = req.body;
    if (!payoutUtr) {
      return res.status(400).json({ message: "Payout UTR/reference is required before marking as paid" });
    }

    const withdrawal = await Transaction.findById(req.params.id);
    if (!withdrawal || withdrawal.type !== "withdraw") {
      return res.status(404).json({ message: "Withdrawal not found" });
    }
    if (withdrawal.status !== "approved") {
      return res.status(400).json({ message: "Only approved withdrawals can be marked as paid" });
    }

    withdrawal.status = "paid";
    withdrawal.payoutUtr = payoutUtr.trim();
    withdrawal.editedByAdmin = true;
    withdrawal.adminId = req.user._id;
    withdrawal.description = `Withdrawal paid via UPI. Payout UTR: ${payoutUtr.trim()}`;
    await withdrawal.save();

    await logActivity(req.user._id, "MARK_WITHDRAWAL_PAID", "transaction", withdrawal._id, { payoutUtr, amount: withdrawal.amount }, req.ip);

    res.json({ message: "Withdrawal marked as paid successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── MANUAL WALLET ADJUSTMENT ─────────────────────────────────────────────────

// POST /api/admin/wallet/adjust
const adjustWallet = async (req, res) => {
  try {
    const { userId, amount, type, reason } = req.body; // type: 'credit' | 'debit'

    if (!userId || !amount || !type || !reason) {
      return res.status(400).json({ message: "userId, amount, type (credit/debit), and reason are required" });
    }
    if (!["credit", "debit"].includes(type)) {
      return res.status(400).json({ message: "type must be 'credit' or 'debit'" });
    }

    const adjustAmt = Number(amount);
    if (adjustAmt <= 0) return res.status(400).json({ message: "Amount must be positive" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const prevBalance = user.walletBalance;
    let newBalance;

    if (type === "credit") {
      newBalance = prevBalance + adjustAmt;
    } else {
      if (prevBalance < adjustAmt) {
        return res.status(400).json({ message: "User has insufficient balance for this debit" });
      }
      newBalance = prevBalance - adjustAmt;
    }

    await User.findByIdAndUpdate(userId, { walletBalance: newBalance });

    const txType = type === "credit" ? "admin_credit" : "admin_debit";
    await Transaction.create({
      userId,
      type: txType,
      amount: adjustAmt,
      prevBalance,
      newBalance,
      status: "completed",
      editedByAdmin: true,
      adminId: req.user._id,
      description: `Manual ${type} by admin: ${reason}`,
    });

    await logActivity(req.user._id, `MANUAL_WALLET_${type.toUpperCase()}`, "user", userId, { amount: adjustAmt, reason, prevBalance, newBalance }, req.ip);

    res.json({ message: `Wallet ${type}ed successfully`, prevBalance, newBalance });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/admin/users (legacy)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-pin -password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PATCH /api/admin/user/:id/wallet (legacy absolute set)
const updateUserWallet = async (req, res) => {
  try {
    const { walletBalance, reason } = req.body;
    if (walletBalance === undefined || walletBalance === null) {
      return res.status(400).json({ message: "walletBalance is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const prevBalance = user.walletBalance;
    const newBal = Number(walletBalance);
    const diff = newBal - prevBalance;

    await User.findByIdAndUpdate(req.params.id, { walletBalance: newBal });

    if (diff !== 0) {
      await Transaction.create({
        userId: req.params.id,
        type: diff > 0 ? "admin_credit" : "admin_debit",
        amount: Math.abs(diff),
        prevBalance,
        newBalance: newBal,
        status: "completed",
        editedByAdmin: true,
        adminId: req.user._id,
        description: `Admin wallet update: ${reason || "Balance adjusted by admin"}`,
      });
    }

    await logActivity(req.user._id, "SET_WALLET_BALANCE", "user", req.params.id, { prevBalance, newBalance: newBal }, req.ip);

    res.json({ message: "Wallet updated successfully", walletBalance: newBal });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── MATCH MANAGEMENT ─────────────────────────────────────────────────────────

// GET /api/admin/matches
const getMatches = async (req, res) => {
  try {
    const matches = await Match.find().sort({ matchDate: -1 });
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/admin/matches
const createMatch = async (req, res) => {
  try {
    const { name, game, description, matchDate, entryFee, prizePool, totalSlots, status } = req.body;
    if (!name || !game || !matchDate || entryFee === undefined || !prizePool || !totalSlots) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const match = await Match.create({
      name, game, description, matchDate, entryFee, prizePool, totalSlots,
      status: status || "upcoming",
      createdBy: req.user._id,
    });

    await logActivity(req.user._id, "CREATE_MATCH", "match", match._id, { name, game }, req.ip);

    res.status(201).json({ message: "Match created", match });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/admin/matches/:id
const updateMatch = async (req, res) => {
  try {
    const match = await Match.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!match) return res.status(404).json({ message: "Match not found" });

    await logActivity(req.user._id, "UPDATE_MATCH", "match", match._id, req.body, req.ip);

    res.json({ message: "Match updated", match });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/admin/matches/:id
const deleteMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: "Match not found" });

    const regCount = await MatchRegistration.countDocuments({ matchId: match._id, status: "registered" });
    if (regCount > 0) {
      return res.status(400).json({ message: "Cannot delete a match with active registrations. Cancel it first." });
    }

    await Match.findByIdAndDelete(req.params.id);
    await logActivity(req.user._id, "DELETE_MATCH", "match", req.params.id, { name: match.name }, req.ip);

    res.json({ message: "Match deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/admin/matches/:id/registrations
const getMatchRegistrations = async (req, res) => {
  try {
    const regs = await MatchRegistration.find({ matchId: req.params.id })
      .populate("userId", "name phone upiId")
      .sort({ createdAt: -1 });
    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── UPI SETTINGS ─────────────────────────────────────────────────────────────

// GET /api/admin/settings
const getSettings = async (req, res) => {
  try {
    const settings = await PlatformSettings.find();
    const result = {};
    settings.forEach((s) => { result[s.key] = s.value; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/admin/settings/upi
const updateUpiSettings = async (req, res) => {
  try {
    const { upiId, instructions, depositsEnabled } = req.body;
    if (!upiId) return res.status(400).json({ message: "UPI ID is required" });

    await PlatformSettings.findOneAndUpdate(
      { key: "upiId" },
      { value: upiId, updatedBy: req.user._id, description: "Platform UPI ID for deposits" },
      { upsert: true }
    );

    if (instructions !== undefined) {
      await PlatformSettings.findOneAndUpdate(
        { key: "depositInstructions" },
        { value: instructions, updatedBy: req.user._id },
        { upsert: true }
      );
    }

    if (depositsEnabled !== undefined) {
      await PlatformSettings.findOneAndUpdate(
        { key: "depositsEnabled" },
        { value: Boolean(depositsEnabled), updatedBy: req.user._id },
        { upsert: true }
      );
    }

    await logActivity(req.user._id, "UPDATE_UPI_SETTINGS", "settings", "upiId", { upiId }, req.ip);

    res.json({ message: "UPI settings updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// PUT /api/admin/settings — generic settings update
const updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await PlatformSettings.findOneAndUpdate(
        { key },
        { value, updatedBy: req.user._id },
        { upsert: true }
      );
    }
    await logActivity(req.user._id, "UPDATE_SETTINGS", "settings", null, updates, req.ip);
    res.json({ message: "Settings updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────────

// GET /api/admin/activity-logs
const getActivityLogs = async (req, res) => {
  try {
    const logs = await AdminActivityLog.find()
      .populate("adminId", "name phone")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  getDashboard,
  getAllPlayers,
  togglePlayerStatus,
  getPlayerDetail,
  getAllTransactions,
  getDeposits,
  approveDeposit,
  rejectDeposit,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalPaid,
  adjustWallet,
  getAllUsers,
  updateUserWallet,
  getMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  getMatchRegistrations,
  getSettings,
  updateUpiSettings,
  updateSettings,
  getActivityLogs,
};
