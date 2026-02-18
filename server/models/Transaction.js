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
      enum: ["deposit", "withdraw"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentProof: {
      type: String, // Cloudinary URL — only for deposits
      default: null,
    },
    status: {
      type: String,
      default: "pending",
    },
    editedByAdmin: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Transaction", transactionSchema);
