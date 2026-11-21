const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "deposit",
        "withdraw",
        "match_entry",
        "match_refund",
        "prize_credit",
        "admin_credit",
        "admin_debit",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    prevBalance: {
      type: Number,
      default: 0,
    },
    newBalance: {
      type: Number,
      default: 0,
    },
    utr: {
      type: String,
      default: null,
      trim: true,
    },
    paymentProof: {
      type: String, // Cloudinary URL
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "paid", "failed", "refunded"],
      default: "pending",
    },
    description: {
      type: String,
      default: "",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    payoutUtr: {
      type: String,
      default: null,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    editedByAdmin: {
      type: Boolean,
      default: false,
    },
    // legacy
    name: { type: String },
    playerId: { type: String },
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ utr: 1 }, { sparse: true });

module.exports = mongoose.model("Transaction", transactionSchema);
