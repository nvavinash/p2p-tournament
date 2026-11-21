const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const ctrl = require("../controllers/adminController");

const admin = [protect, adminOnly];

// Dashboard
router.get("/dashboard", ...admin, ctrl.getDashboard);

// Players
router.get("/players", ...admin, ctrl.getAllPlayers);
router.get("/players/:id", ...admin, ctrl.getPlayerDetail);
router.patch("/players/:id/status", ...admin, ctrl.togglePlayerStatus);

// Transactions
router.get("/transactions", ...admin, ctrl.getAllTransactions);

// Deposits
router.get("/deposits", ...admin, ctrl.getDeposits);
router.patch("/deposits/:id/approve", ...admin, ctrl.approveDeposit);
router.patch("/deposits/:id/reject", ...admin, ctrl.rejectDeposit);

// Withdrawals
router.get("/withdrawals", ...admin, ctrl.getWithdrawals);
router.patch("/withdrawals/:id/approve", ...admin, ctrl.approveWithdrawal);
router.patch("/withdrawals/:id/reject", ...admin, ctrl.rejectWithdrawal);
router.patch("/withdrawals/:id/paid", ...admin, ctrl.markWithdrawalPaid);

// Wallet management
router.post("/wallet/adjust", ...admin, ctrl.adjustWallet);
router.get("/users", ...admin, ctrl.getAllUsers);
router.patch("/user/:id/wallet", ...admin, ctrl.updateUserWallet);

// Matches
router.get("/matches", ...admin, ctrl.getMatches);
router.post("/matches", ...admin, ctrl.createMatch);
router.put("/matches/:id", ...admin, ctrl.updateMatch);
router.delete("/matches/:id", ...admin, ctrl.deleteMatch);
router.get("/matches/:id/registrations", ...admin, ctrl.getMatchRegistrations);

// Settings
router.get("/settings", ...admin, ctrl.getSettings);
router.put("/settings/upi", ...admin, ctrl.updateUpiSettings);
router.put("/settings", ...admin, ctrl.updateSettings);

// Activity logs
router.get("/activity-logs", ...admin, ctrl.getActivityLogs);

module.exports = router;
