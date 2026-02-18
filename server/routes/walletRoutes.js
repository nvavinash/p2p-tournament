const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getBalance,
  depositRequest,
  withdrawRequest,
  getMyTransactions,
} = require("../controllers/walletController");

// GET /api/wallet/balance
router.get("/balance", protect, getBalance);

// GET /api/wallet/transactions
router.get("/transactions", protect, getMyTransactions);

// POST /api/wallet/deposit-request
router.post(
  "/deposit-request",
  protect,
  upload.single("paymentProof"),
  depositRequest,
);

// POST /api/wallet/withdraw-request
router.post("/withdraw-request", protect, withdrawRequest);

module.exports = router;
