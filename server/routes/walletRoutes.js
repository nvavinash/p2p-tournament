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

router.get("/balance", protect, getBalance);
router.get("/transactions", protect, getMyTransactions);
router.post("/deposit-request", protect, upload.single("paymentProof"), depositRequest);
router.post("/withdraw-request", protect, withdrawRequest);

module.exports = router;
