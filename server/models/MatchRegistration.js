const mongoose = require("mongoose");

const matchRegistrationSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    entryFeePaid: { type: Number, required: true },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
    status: {
      type: String,
      enum: ["registered", "cancelled", "refunded"],
      default: "registered",
    },
  },
  { timestamps: true }
);

matchRegistrationSchema.index({ matchId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("MatchRegistration", matchRegistrationSchema);
