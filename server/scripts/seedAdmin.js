/**
 * Admin Seed Script
 * Run: node scripts/seedAdmin.js
 * 
 * Creates the first admin account and default platform settings.
 * Only run this once — subsequent runs will update the existing admin.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const PlatformSettings = require("../models/PlatformSettings");

const ADMIN_PHONE = process.env.ADMIN_PHONE || "9999999999";
const ADMIN_PIN = process.env.ADMIN_PIN || "123456";
const ADMIN_NAME = process.env.ADMIN_NAME || "Super Admin";
const ADMIN_UPI = process.env.ADMIN_UPI || "admin@upi";

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log("✅ Connected to MongoDB");

    const salt = await bcrypt.genSalt(12);
    const hashedPin = await bcrypt.hash(ADMIN_PIN, salt);

    const admin = await User.findOneAndUpdate(
      { phone: ADMIN_PHONE },
      {
        name: ADMIN_NAME,
        phone: ADMIN_PHONE,
        pin: hashedPin,
        upiId: ADMIN_UPI,
        role: "admin",
        status: "active",
        isBanned: false,
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Admin account ready:`);
    console.log(`   Phone: ${ADMIN_PHONE}`);
    console.log(`   PIN:   ${ADMIN_PIN}`);
    console.log(`   Name:  ${ADMIN_NAME}`);
    console.log(`   ID:    ${admin._id}`);

    // Default platform settings
    const defaults = [
      { key: "upiId", value: "platform@phonepe", description: "Platform UPI ID for deposits" },
      { key: "depositInstructions", value: "1. Open PhonePe app\n2. Tap 'Send Money'\n3. Enter the UPI ID shown above\n4. Enter the amount and complete payment\n5. Copy your UTR number from the transaction\n6. Submit it below", description: "Deposit instructions shown to players" },
      { key: "depositsEnabled", value: true, description: "Whether deposits are currently enabled" },
      { key: "minWithdrawal", value: 100, description: "Minimum withdrawal amount in INR" },
    ];

    for (const setting of defaults) {
      await PlatformSettings.findOneAndUpdate(
        { key: setting.key },
        { $setOnInsert: setting },
        { upsert: true }
      );
    }

    console.log("✅ Default platform settings initialized");
    console.log("\n⚠️  IMPORTANT: Change the admin PIN before going live!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seed();
