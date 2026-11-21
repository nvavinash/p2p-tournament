const mongoose = require("mongoose");

const adminActivityLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: { type: String, required: true },
    targetType: { type: String, default: null }, // 'user', 'transaction', 'match', 'settings'
    targetId: { type: String, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
  },
  { timestamps: true }
);

adminActivityLogSchema.index({ adminId: 1, createdAt: -1 });

module.exports = mongoose.model("AdminActivityLog", adminActivityLogSchema);
