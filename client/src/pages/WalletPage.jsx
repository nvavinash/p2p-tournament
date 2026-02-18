import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001/api";

const Modal = ({ open, onClose, title, children }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const StatusBadge = ({ transaction }) => {
  if (transaction.editedByAdmin && transaction.type === "deposit") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
        ✅ Deposit Done
      </span>
    );
  }
  if (transaction.editedByAdmin && transaction.type === "withdraw") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30">
        🏧 Withdraw Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-zinc-700/60 text-zinc-400 border border-zinc-600/30">
      ⏳ Pending
    </span>
  );
};

export default function WalletPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(true);

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const [depositAmount, setDepositAmount] = useState("");
  const [depositFile, setDepositFile] = useState(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMsg, setDepositMsg] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState("");

  const fetchBalance = async () => {
    try {
      const res = await axios.get(`${API}/wallet/balance`);
      setBalance(res.data.walletBalance);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get(`${API}/wallet/transactions`);
      setTransactions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const handleDeposit = async (e) => {
    e.preventDefault();
    setDepositLoading(true);
    setDepositMsg("");
    try {
      const formData = new FormData();
      formData.append("amount", depositAmount);
      formData.append("paymentProof", depositFile);
      await axios.post(`${API}/wallet/deposit-request`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDepositMsg("✅ Deposit request submitted!");
      setDepositAmount("");
      setDepositFile(null);
      fetchTransactions();
    } catch (err) {
      setDepositMsg(err.response?.data?.message || "Failed to submit deposit");
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setWithdrawLoading(true);
    setWithdrawMsg("");
    try {
      await axios.post(`${API}/wallet/withdraw-request`, {
        amount: withdrawAmount,
      });
      setWithdrawMsg("✅ Withdrawal request submitted!");
      setWithdrawAmount("");
      fetchTransactions();
    } catch (err) {
      setWithdrawMsg(
        err.response?.data?.message || "Failed to submit withdrawal",
      );
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              My Wallet
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Manage your funds</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            ← Dashboard
          </button>
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-2xl p-8 mb-6 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
          <p className="text-zinc-400 text-sm uppercase tracking-widest mb-2">
            Available Balance
          </p>
          {loadingBalance ? (
            <div className="h-12 w-40 bg-zinc-700 animate-pulse rounded-lg" />
          ) : (
            <p className="text-5xl font-bold text-white">
              ₹
              <span className="tabular-nums">
                {balance?.toLocaleString("en-IN") ?? "—"}
              </span>
            </p>
          )}
          <p className="text-zinc-500 text-xs mt-3">
            Balance updated by admin only
          </p>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setDepositOpen(true);
              setDepositMsg("");
            }}
            className="flex flex-col items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 text-green-400 rounded-2xl py-6 font-semibold transition-all"
          >
            <span className="text-3xl">💰</span>
            <span>Deposit</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setWithdrawOpen(true);
              setWithdrawMsg("");
            }}
            className="flex flex-col items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/50 text-orange-400 rounded-2xl py-6 font-semibold transition-all"
          >
            <span className="text-3xl">🏧</span>
            <span>Withdraw</span>
          </motion.button>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-300 mb-4">
            Transaction History
          </h2>
          {transactions.length === 0 ? (
            <div className="text-center text-zinc-600 py-12 border border-zinc-800 rounded-2xl">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((t) => (
                <motion.div
                  key={t._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {t.type === "deposit" ? "💰" : "🏧"}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white capitalize">
                        {t.type}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {new Date(t.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="font-bold text-white">
                      ₹{t.amount.toLocaleString("en-IN")}
                    </p>
                    <StatusBadge transaction={t} />
                    {t.editedByAdmin && (
                      <span className="text-xs text-violet-400 font-medium">
                        Updated by Admin
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      <Modal
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
        title="💰 Deposit Request"
      >
        <form onSubmit={handleDeposit} className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 block mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              min="1"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="e.g. 103"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-sm text-zinc-400 block mb-1">
              Payment Screenshot
            </label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-zinc-700 hover:border-violet-500 rounded-lg cursor-pointer transition-colors bg-zinc-800/50">
              <input
                type="file"
                accept="image/*"
                required
                className="hidden"
                onChange={(e) => setDepositFile(e.target.files[0])}
              />
              {depositFile ? (
                <span className="text-green-400 text-sm">
                  ✅ {depositFile.name}
                </span>
              ) : (
                <>
                  <span className="text-2xl mb-1">📷</span>
                  <span className="text-zinc-500 text-sm">
                    Click to upload screenshot
                  </span>
                </>
              )}
            </label>
          </div>
          {depositMsg && (
            <p
              className={`text-sm ${depositMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}
            >
              {depositMsg}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDepositOpen(false)}
              className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={depositLoading}
              className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {depositLoading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        open={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
        title="🏧 Withdrawal Request"
      >
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 block mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              min="1"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="e.g. 500"
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          {withdrawMsg && (
            <p
              className={`text-sm ${withdrawMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}
            >
              {withdrawMsg}
            </p>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setWithdrawOpen(false)}
              className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={withdrawLoading}
              className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {withdrawLoading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
