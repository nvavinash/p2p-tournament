const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const {
  getAllTransactions,
  getWithdrawals,
  updateUserWallet,
  getAllUsers,
} = require("../controllers/adminController");

// GET /api/admin/transactions
router.get("/transactions", protect, adminOnly, getAllTransactions);

// GET /api/admin/withdrawals
router.get("/withdrawals", protect, adminOnly, getWithdrawals);

// GET /api/admin/users
router.get("/users", protect, adminOnly, getAllUsers);

// PATCH /api/admin/user/:id/wallet
router.patch("/user/:id/wallet", protect, adminOnly, updateUserWallet);

module.exports = router;
