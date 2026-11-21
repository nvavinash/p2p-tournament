const Match = require("../models/Match");
const MatchRegistration = require("../models/MatchRegistration");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const mongoose = require("mongoose");

// GET /api/matches — available matches
const getMatches = async (req, res) => {
  try {
    const matches = await Match.find({
      status: { $in: ["upcoming", "open", "full", "live"] },
    }).sort({ matchDate: 1 });

    // Add registrationCount
    const matchIds = matches.map((m) => m._id);
    const regCounts = await MatchRegistration.aggregate([
      { $match: { matchId: { $in: matchIds }, status: "registered" } },
      { $group: { _id: "$matchId", count: { $sum: 1 } } },
    ]);
    const countMap = {};
    regCounts.forEach((r) => { countMap[String(r._id)] = r.count; });

    // Check which matches the user is registered for
    const myRegs = await MatchRegistration.find({ userId: req.user._id, status: "registered" });
    const myRegMatchIds = new Set(myRegs.map((r) => String(r.matchId)));

    const result = matches.map((m) => ({
      ...m.toObject(),
      registeredCount: countMap[String(m._id)] || 0,
      availableSlots: m.totalSlots - (countMap[String(m._id)] || 0),
      isRegistered: myRegMatchIds.has(String(m._id)),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/matches/:id/register — register for a match
const registerForMatch = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const match = await Match.findById(req.params.id).session(session);
    if (!match) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Match not found" });
    }

    if (!["open", "upcoming"].includes(match.status)) {
      await session.abortTransaction();
      return res.status(400).json({ message: `Cannot register for a ${match.status} match` });
    }

    // Check slots
    const regCount = await MatchRegistration.countDocuments({ matchId: match._id, status: "registered" }).session(session);
    if (regCount >= match.totalSlots) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Match is full" });
    }

    // Check duplicate registration
    const alreadyRegistered = await MatchRegistration.findOne({ matchId: match._id, userId: req.user._id }).session(session);
    if (alreadyRegistered) {
      await session.abortTransaction();
      return res.status(400).json({ message: "You are already registered for this match" });
    }

    // Check wallet
    const user = await User.findById(req.user._id).session(session);
    if (user.walletBalance < match.entryFee) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Insufficient wallet balance. Please add funds." });
    }

    const prevBalance = user.walletBalance;
    const newBalance = prevBalance - match.entryFee;

    // Deduct entry fee
    await User.findByIdAndUpdate(user._id, { walletBalance: newBalance }, { session });

    // Create transaction record
    const tx = await Transaction.create([{
      userId: user._id,
      type: "match_entry",
      amount: match.entryFee,
      prevBalance,
      newBalance,
      status: "completed",
      description: `Entry fee for match: ${match.name} (${match.game})`,
    }], { session });

    // Create registration
    await MatchRegistration.create([{
      matchId: match._id,
      userId: user._id,
      entryFeePaid: match.entryFee,
      transactionId: tx[0]._id,
      status: "registered",
    }], { session });

    // Update filled slots
    await Match.findByIdAndUpdate(match._id, { filledSlots: regCount + 1 }, { session });

    // Auto-mark as full
    if (regCount + 1 >= match.totalSlots) {
      await Match.findByIdAndUpdate(match._id, { status: "full" }, { session });
    }

    await session.commitTransaction();

    res.status(201).json({
      message: `Successfully registered for "${match.name}"! Entry fee of ₹${match.entryFee} deducted.`,
      newBalance,
    });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    session.endSession();
  }
};

module.exports = { getMatches, registerForMatch };
