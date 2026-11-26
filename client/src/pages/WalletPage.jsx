import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Copy, CheckCircle, ArrowLeft } from "lucide-react";

const API = import.meta.env.VITE_API_URL;



const Modal = ({ open, onClose, title, children }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
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



function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

const StatusBadge = ({ status, type }) => {
  const configs = {
    pending: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30", label: "⏳ Pending" },
    approved: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30", label: "✅ Approved" },
    rejected: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", label: "❌ Rejected" },
    completed: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30", label: "✔ Completed" },
    paid: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30", label: "💸 Paid" },
    failed: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", label: "✗ Failed" },
    refunded: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30", label: "↩ Refunded" },
  };
  const cfg = configs[status] || { bg: "bg-zinc-700/60", text: "text-zinc-400", border: "border-zinc-600/30", label: status };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      {cfg.label}
    </span>
  );
};

const typeEmoji = { deposit: "💰", withdraw: "🏧", match_entry: "🎮", match_refund: "↩", prize_credit: "🏆", admin_credit: "⬆️", admin_debit: "⬇️" };

export default function WalletPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [settings, setSettings] = useState({});
  const [copied, setCopied] = useState(false);

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const [depositAmount, setDepositAmount] = useState("");
  const [depositUtr, setDepositUtr] = useState("");
  const [depositFile, setDepositFile] = useState(null);
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMsg, setDepositMsg] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState("");

  const fetchData = async () => {
    try {
      const [balRes, txRes, settingsRes] = await Promise.all([
        axios.get(`${API}/wallet/balance`),
        axios.get(`${API}/wallet/transactions`),
        axios.get(`${API}/settings/public`),
      ]);
      setBalance(balRes.data.walletBalance);
      setTransactions(txRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const copyUpi = async () => {
    if (settings.upiId) {
      await navigator.clipboard.writeText(settings.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositUtr.trim() || depositUtr.trim().length < 6) {
      return setDepositMsg("UTR number is required (minimum 6 characters)");
    }
    setDepositLoading(true);
    setDepositMsg("");
    try {
      const formData = new FormData();
      formData.append("amount", depositAmount);
      formData.append("utr", depositUtr.trim());
      if (depositFile) formData.append("paymentProof", depositFile);

      await axios.post(`${API}/wallet/deposit-request`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDepositMsg("✅ Deposit request submitted! Awaiting admin approval. Balance will update after approval.");
      setDepositAmount("");
      setDepositUtr("");
      setDepositFile(null);
      fetchData();
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
      await axios.post(`${API}/wallet/withdraw-request`, { amount: withdrawAmount });
      setWithdrawMsg("✅ Withdrawal request submitted! Awaiting admin approval.");
      setWithdrawAmount("");
      fetchData();
      refreshUser?.();
    } catch (err) {
      setWithdrawMsg(err.response?.data?.message || "Failed to submit withdrawal");
    } finally {
      setWithdrawLoading(false);
    }
  };

  // const generatedUpiLink = settings.upiId
  //   ? `upi://pay?pa=${settings.upiId}&pn=P2PTournament&cu=INR`
  //   : "";

  const generatedUpiLink = settings.upiId 
  ? `upi://pay?${new URLSearchParams({
      pa: settings.upiId.trim(),
      pn: "P2PTournament",
      cu: "INR",
      tn: "Wallet Deposit",
      tr: `P2P${Date.now()}`
    }).toString()}`
  : "";

  
  // const isMobile = useIsMobile();

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
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm transition-colors">
            <ArrowLeft size={16} />
            Dashboard
          </button>
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 rounded-2xl p-8 mb-6 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
          <p className="text-zinc-400 text-sm uppercase tracking-widest mb-2">Available Balance</p>
          {loadingBalance ? (
            <div className="h-12 w-40 bg-zinc-700 animate-pulse rounded-lg" />
          ) : (
            <p className="text-5xl font-bold text-white">
              ₹<span className="tabular-nums">{balance?.toLocaleString("en-IN") ?? "—"}</span>
            </p>
          )}
          <p className="text-zinc-500 text-xs mt-3">Balance updated after admin approval only</p>
        </motion.div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setDepositOpen(true); setDepositMsg(""); }}
            className="flex flex-col items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 hover:border-green-500/50 text-green-400 rounded-2xl py-6 font-semibold transition-all"
          >
            <span className="text-3xl">💰</span>
            <span>Add Money</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setWithdrawOpen(true); setWithdrawMsg(""); }}
            className="flex flex-col items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/50 text-orange-400 rounded-2xl py-6 font-semibold transition-all"
          >
            <span className="text-3xl">🏧</span>
            <span>Withdraw</span>
          </motion.button>
        </div>

        {/* Transaction History */}
        <div>
          <h2 className="text-lg font-semibold text-zinc-300 mb-4">Transaction History</h2>
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
                    <span className="text-2xl">{typeEmoji[t.type] || "💫"}</span>
                    <div>
                      <p className="text-sm font-medium text-white capitalize">{t.type?.replace(/_/g, " ")}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      {t.utr && <p className="text-xs text-zinc-600 font-mono">UTR: {t.utr}</p>}
                      {t.description && <p className="text-xs text-zinc-600 truncate max-w-[200px]">{t.description}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className={`font-bold ${["deposit", "admin_credit", "prize_credit", "match_refund"].includes(t.type) ? "text-green-400" : "text-orange-400"}`}>
                      {["deposit", "admin_credit", "prize_credit", "match_refund"].includes(t.type) ? "+" : "-"}₹{t.amount?.toLocaleString("en-IN")}
                    </p>
                    <StatusBadge status={t.status} type={t.type} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      <Modal open={depositOpen} onClose={() => setDepositOpen(false)} title="💰 Add Money via PhonePe">
        {settings.depositsEnabled === false ? (
          <div className="text-center py-6">
            <p className="text-red-400 font-medium">Deposits are temporarily disabled. Please check back later.</p>
          </div>
        ) : (
          <form onSubmit={handleDeposit} className="space-y-4">
            {/* UPI ID Display */}
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Send payment to this UPI ID</p>
              <div className="flex items-center justify-between">
                <span className="text-white font-mono font-bold text-lg">{settings.upiId || "Loading..."}</span>
                <button
                  type="button"
                  onClick={copyUpi}
                  className="flex items-center gap-1 text-xs px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-colors text-zinc-300"
                >
                  {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
                <div className="flex flex-col items-center gap-5 py-4">
                  {/* <div className="text-center mb-2">
                    {/* <p className="text-3xl font-black text-zinc-900">
                      ₹{amount}
                    </p> */}
                  {/* </div>  */}
                  <a
                   href={generatedUpiLink || undefined}
                    onClick={(e) => {
                      if (!settings.upiId ) {
                      e.preventDefault();
      alert("Please enter a valid deposit amount");
    }
  }}
  className="w-full text-center bg-slate-800 hover:bg-slate-900 text-white font-semibold py-4 px-6 rounded-xl"
>
  Pay Now via Any UPI
</a>
                 
                </div>

            {/* Instructions */}
            {settings.depositInstructions && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                <p className="text-xs text-blue-300 font-medium mb-1">📋 Payment Instructions</p>
                <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-sans">{settings.depositInstructions}</pre>
              </div>
            )}

            <div>
              <label className="text-sm text-zinc-400 block mb-1">Amount (₹) *</label>
              <input
                type="number" min="1" value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount" required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 block mb-1">UTR Number * <span className="text-red-400">(mandatory)</span></label>
              <input
                type="text" value={depositUtr}
                onChange={(e) => setDepositUtr(e.target.value)}
                placeholder="Enter UTR/transaction reference"
                required minLength={6}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-green-500 transition-colors"
              />
              <p className="text-xs text-red-400 mt-1">Find UTR no. in PhonePe → Transaction History</p>
            </div>

            {/* <div>
              <label className="text-sm text-zinc-400 block mb-1">Payment Screenshot (optional)</label>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-zinc-700 hover:border-green-500 rounded-lg cursor-pointer transition-colors bg-zinc-800/50">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setDepositFile(e.target.files[0])} />
                {depositFile ? (
                  <span className="text-green-400 text-sm">✅ {depositFile.name}</span>
                ) : (
                  <>
                    <span className="text-xl mb-1">📷</span>
                    <span className="text-zinc-500 text-xs">Click to upload screenshot</span>
                  </>
                )}
              </label>
            </div> */}

            {depositMsg && (
              <p className={`text-sm ${depositMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>{depositMsg}</p>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-xs text-yellow-400">⚠️ Your balance will NOT increase automatically. Admin will verify your payment and approve within 24 hours.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setDepositOpen(false)} className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={depositLoading} className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold transition-colors disabled:opacity-50">
                {depositLoading ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Withdraw Modal */}
      <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="🏧 Withdrawal Request">
        <form onSubmit={handleWithdraw} className="space-y-4">
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Withdrawal UPI ID</p>
            <p className="text-white font-mono">{user?.upiId}</p>
          </div>
          <div className="bg-zinc-800 rounded-xl p-3">
            <p className="text-xs text-zinc-500 mb-1">Available Balance</p>
            <p className="text-green-400 font-bold">₹{balance?.toLocaleString("en-IN") ?? 0}</p>
          </div>
          <div>
            <label className="text-sm text-zinc-400 block mb-1">Amount (₹)</label>
            <input
              type="number" min={settings.minWithdrawal || 100} max={balance || 0}
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder={`Min ₹${settings.minWithdrawal || 100}`}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
          {withdrawMsg && (
            <p className={`text-sm ${withdrawMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>{withdrawMsg}</p>
          )}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-xs text-blue-300">💡 Admin will process your withdrawal manually and mark it as paid after transfer. Minimum: ₹{settings.minWithdrawal || 100}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setWithdrawOpen(false)} className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={withdrawLoading} className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-colors disabled:opacity-50">
              {withdrawLoading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
