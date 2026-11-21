const PlatformSettings = require("../models/PlatformSettings");

// GET /api/settings/public — public settings (UPI ID, instructions, depositsEnabled)
const getPublicSettings = async (req, res) => {
  try {
    const keys = ["upiId", "depositInstructions", "depositsEnabled", "minWithdrawal"];
    const settings = await PlatformSettings.find({ key: { $in: keys } });
    const result = {};
    settings.forEach((s) => { result[s.key] = s.value; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { getPublicSettings };
