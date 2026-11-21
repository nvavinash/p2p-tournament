const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    game: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    matchDate: { type: Date, required: true },
    entryFee: { type: Number, required: true, min: 0 },
    prizePool: { type: Number, required: true, min: 0 },
    totalSlots: { type: Number, required: true, min: 2 },
    filledSlots: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["upcoming", "open", "full", "live", "completed", "cancelled"],
      default: "upcoming",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

matchSchema.index({ status: 1, matchDate: 1 });

module.exports = mongoose.model("Match", matchSchema);
