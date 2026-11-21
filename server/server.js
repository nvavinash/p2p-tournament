require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
let rateLimit, helmet;
try { rateLimit = require("express-rate-limit"); } catch(e) { rateLimit = null; }
try { helmet = require("helmet"); } catch(e) { helmet = null; }

const app = express();
const PORT = process.env.PORT || 5001;

// ─── Security Middleware ──────────────────────────────────────────────────────
if (helmet) app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
let loginLimiter = (req, res, next) => next();
let globalLimiter = (req, res, next) => next();
if (rateLimit) {
  loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many login attempts. Please try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  globalLimiter = rateLimit({ windowMs: 60 * 1000, max: 200 });
}
app.use(globalLimiter);

// ─── Database ─────────────────────────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    try {
      console.log("Attempting in-memory MongoDB fallback...");
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log("✅ Connected to in-memory MongoDB at:", uri);
    } catch (fallbackErr) {
      console.error("Fallback failed:", fallbackErr);
      process.exit(1);
    }
  }
};

connectDB();

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth/login", loginLimiter);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/wallet", require("./routes/walletRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/matches", require("./routes/matchRoutes"));
app.use("/api/settings", require("./routes/settingsRoutes"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is healthy", timestamp: new Date().toISOString() });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
