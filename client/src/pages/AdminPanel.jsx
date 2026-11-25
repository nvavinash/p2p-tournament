import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.API_URL;

// ─── Utility Components ───────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const configs = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    approved: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    paid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    banned: "bg-red-500/20 text-red-400 border-red-500/30",
    upcoming: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    open: "bg-green-500/20 text-green-400 border-green-500/30",
    full: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    live: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${configs[status] || "bg-zinc-700 text-zinc-400 border-zinc-600"}`}>
      {status}
    </span>
  );
};

const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, confirmLabel = "Confirm", danger = false }) => (
  <AnimatePresence>
    {open && (
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm"
          initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
          <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
          <p className="text-zinc-400 text-sm mb-6">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white transition-colors text-sm">Cancel</button>
            <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-lg font-semibold text-white text-sm transition-colors ${danger ? "bg-red-600 hover:bg-red-500" : "bg-violet-600 hover:bg-violet-500"}`}>
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const Input2 = ({ label, ...props }) => (
  <div>
    {label && <label className="text-xs text-zinc-500 block mb-1">{label}</label>}
    <input className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors" {...props} />
  </div>
);

const Select2 = ({ label, children, ...props }) => (
  <div>
    {label && <label className="text-xs text-zinc-500 block mb-1">{label}</label>}
    <select className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors" {...props}>
      {children}
    </select>
  </div>
);

const Textarea2 = ({ label, ...props }) => (
  <div>
    {label && <label className="text-xs text-zinc-500 block mb-1">{label}</label>}
    <textarea className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors resize-none" rows={3} {...props} />
  </div>
);

// ─── Main AdminPanel Component ────────────────────────────────────────────────

const TABS = [
  { id: "dashboard", label: "📊 Dashboard" },
  { id: "players", label: "👥 Players" },
  { id: "matches", label: "🎮 Matches" },
  { id: "deposits", label: "💰 Deposits" },
  { id: "withdrawals", label: "🏧 Withdrawals" },
  { id: "wallet", label: "✏️ Wallet" },
  { id: "transactions", label: "📋 Transactions" },
  { id: "upi-settings", label: "⚙️ UPI Settings" },
  { id: "activity", label: "📝 Activity Logs" },
];

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Data state
  const [stats, setStats] = useState({});
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({});
  const [activityLogs, setActivityLogs] = useState([]);
  const [playerSearch, setPlayerSearch] = useState("");

  // Confirm dialog
  const [confirm, setConfirm] = useState({ open: false });

  // Forms
  const [matchForm, setMatchForm] = useState({ name: "", game: "", description: "", matchDate: "", entryFee: "", prizePool: "", totalSlots: "", status: "upcoming" });
  const [editingMatch, setEditingMatch] = useState(null);
  const [upiForm, setUpiForm] = useState({ upiId: "", instructions: "", depositsEnabled: true, minWithdrawal: 100 });
  const [walletAdjust, setWalletAdjust] = useState({ userId: "", amount: "", type: "credit", reason: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [payoutUtr, setPayoutUtr] = useState("");

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: "", text: "" }), 4000); };

  const fetchTab = async (tab) => {
    setLoading(true);
    try {
      switch (tab) {
        case "dashboard":
          const dRes = await axios.get(`${API}/admin/dashboard`);
          setStats(dRes.data);
          break;
        case "players":
          const pRes = await axios.get(`${API}/admin/players`);
          setPlayers(pRes.data);
          break;
        case "matches":
          const mRes = await axios.get(`${API}/admin/matches`);
          setMatches(mRes.data);
          break;
        case "deposits":
          const depRes = await axios.get(`${API}/admin/deposits`);
          setDeposits(depRes.data);
          break;
        case "withdrawals":
          const wdRes = await axios.get(`${API}/admin/withdrawals`);
          setWithdrawals(wdRes.data);
          const pAll = await axios.get(`${API}/admin/players`);
          setPlayers(pAll.data);
          break;
        case "wallet":
          const usersRes = await axios.get(`${API}/admin/users`);
          setPlayers(usersRes.data);
          break;
        case "transactions":
          const txRes = await axios.get(`${API}/admin/transactions`);
          setTransactions(txRes.data);
          break;
        case "upi-settings":
          const sRes = await axios.get(`${API}/admin/settings`);
          setSettings(sRes.data);
          setUpiForm({
            upiId: sRes.data.upiId || "",
            instructions: sRes.data.depositInstructions || "",
            depositsEnabled: sRes.data.depositsEnabled !== false,
            minWithdrawal: sRes.data.minWithdrawal || 100,
          });
          break;
        case "activity":
          const aRes = await axios.get(`${API}/admin/activity-logs`);
          setActivityLogs(aRes.data);
          break;
      }
    } catch (err) {
      showMsg("error", err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTab(activeTab); }, [activeTab]);

  const changeTab = (tab) => { setActiveTab(tab); };

  // ── Deposit Actions ─────────────────────────────────────────────────
  const approveDeposit = (id, amount, utr) => {
    setConfirm({
      open: true,
      title: "Approve Deposit",
      message: `Approve ₹${amount} deposit? UTR: ${utr}. Have you verified this in PhonePe/bank records?`,
      confirmLabel: "Yes, Approve",
      onConfirm: async () => {
        setConfirm({ open: false });
        try {
          await axios.patch(`${API}/admin/deposits/${id}/approve`);
          showMsg("success", "Deposit approved successfully!");
          fetchTab("deposits");
        } catch (err) {
          showMsg("error", err.response?.data?.message || "Failed");
        }
      },
      onCancel: () => setConfirm({ open: false }),
    });
  };

  const rejectDeposit = (id) => {
    const reason = window.prompt("Rejection reason:");
    if (reason === null) return;
    setConfirm({
      open: true, danger: true,
      title: "Reject Deposit",
      message: `Reject this deposit request? Reason: ${reason || "No reason provided"}`,
      confirmLabel: "Reject",
      onConfirm: async () => {
        setConfirm({ open: false });
        try {
          await axios.patch(`${API}/admin/deposits/${id}/reject`, { reason });
          showMsg("success", "Deposit rejected");
          fetchTab("deposits");
        } catch (err) {
          showMsg("error", err.response?.data?.message || "Failed");
        }
      },
      onCancel: () => setConfirm({ open: false }),
    });
  };

  // ── Withdrawal Actions ──────────────────────────────────────────────
  const approveWithdrawal = (id, amount) => {
    setConfirm({
      open: true,
      title: "Approve Withdrawal",
      message: `Approve ₹${amount} withdrawal? This will deduct from the player's balance.`,
      confirmLabel: "Approve",
      onConfirm: async () => {
        setConfirm({ open: false });
        try {
          await axios.patch(`${API}/admin/withdrawals/${id}/approve`);
          showMsg("success", "Withdrawal approved. Please complete the manual transfer.");
          fetchTab("withdrawals");
        } catch (err) {
          showMsg("error", err.response?.data?.message || "Failed");
        }
      },
      onCancel: () => setConfirm({ open: false }),
    });
  };

  const rejectWithdrawal = (id) => {
    const reason = window.prompt("Rejection reason:");
    if (reason === null) return;
    setConfirm({
      open: true, danger: true,
      title: "Reject Withdrawal",
      message: `Reject this withdrawal? Balance will be refunded if already deducted.`,
      confirmLabel: "Reject",
      onConfirm: async () => {
        setConfirm({ open: false });
        try {
          await axios.patch(`${API}/admin/withdrawals/${id}/reject`, { reason });
          showMsg("success", "Withdrawal rejected");
          fetchTab("withdrawals");
        } catch (err) {
          showMsg("error", err.response?.data?.message || "Failed");
        }
      },
      onCancel: () => setConfirm({ open: false }),
    });
  };

  const markPaid = (id, amount) => {
    const utr = window.prompt("Enter payout UTR/reference number:");
    if (!utr) return;
    setConfirm({
      open: true,
      title: "Mark as Paid",
      message: `Mark ₹${amount} withdrawal as PAID with UTR: ${utr}? Ensure you have already transferred the money.`,
      confirmLabel: "Mark Paid",
      onConfirm: async () => {
        setConfirm({ open: false });
        try {
          await axios.patch(`${API}/admin/withdrawals/${id}/paid`, { payoutUtr: utr });
          showMsg("success", "Withdrawal marked as paid!");
          fetchTab("withdrawals");
        } catch (err) {
          showMsg("error", err.response?.data?.message || "Failed");
        }
      },
      onCancel: () => setConfirm({ open: false }),
    });
  };

  // ── Player Actions ──────────────────────────────────────────────────
  const togglePlayerStatus = (player) => {
    const action = player.status === "banned" ? "Unban" : "Ban";
    setConfirm({
      open: true, danger: action === "Ban",
      title: `${action} Player`,
      message: `${action} ${player.name} (${player.phone})?`,
      confirmLabel: action,
      onConfirm: async () => {
        setConfirm({ open: false });
        try {
          await axios.patch(`${API}/admin/players/${player._id}/status`);
          showMsg("success", `Player ${action.toLowerCase()}ned successfully`);
          fetchTab("players");
        } catch (err) {
          showMsg("error", err.response?.data?.message || "Failed");
        }
      },
      onCancel: () => setConfirm({ open: false }),
    });
  };

  // ── Match Actions ───────────────────────────────────────────────────
  const handleMatchSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMatch) {
        await axios.put(`${API}/admin/matches/${editingMatch}`, matchForm);
        showMsg("success", "Match updated!");
      } else {
        await axios.post(`${API}/admin/matches`, matchForm);
        showMsg("success", "Match created!");
      }
      setMatchForm({ name: "", game: "", description: "", matchDate: "", entryFee: "", prizePool: "", totalSlots: "", status: "upcoming" });
      setEditingMatch(null);
      fetchTab("matches");
    } catch (err) {
      showMsg("error", err.response?.data?.message || "Failed");
    }
  };

  const deleteMatch = (id, name) => {
    setConfirm({
      open: true, danger: true,
      title: "Delete Match",
      message: `Delete "${name}"? This cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        setConfirm({ open: false });
        try {
          await axios.delete(`${API}/admin/matches/${id}`);
          showMsg("success", "Match deleted");
          fetchTab("matches");
        } catch (err) {
          showMsg("error", err.response?.data?.message || "Failed");
        }
      },
      onCancel: () => setConfirm({ open: false }),
    });
  };

  // ── Wallet Adjust ───────────────────────────────────────────────────
  const handleWalletAdjust = async (e) => {
    e.preventDefault();
    if (!window.confirm(`${walletAdjust.type === "credit" ? "Credit" : "Debit"} ₹${walletAdjust.amount} to player? Reason: ${walletAdjust.reason}`)) return;
    try {
      await axios.post(`${API}/admin/wallet/adjust`, walletAdjust);
      showMsg("success", `Wallet ${walletAdjust.type}ed successfully!`);
      setWalletAdjust({ userId: "", amount: "", type: "credit", reason: "" });
      fetchTab("wallet");
    } catch (err) {
      showMsg("error", err.response?.data?.message || "Failed");
    }
  };

  // ── UPI Settings ────────────────────────────────────────────────────
  const handleUpiSave = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/admin/settings/upi`, {
        upiId: upiForm.upiId,
        instructions: upiForm.instructions,
        depositsEnabled: upiForm.depositsEnabled,
      });
      await axios.put(`${API}/admin/settings`, { minWithdrawal: Number(upiForm.minWithdrawal) });
      showMsg("success", "Settings updated successfully!");
    } catch (err) {
      showMsg("error", err.response?.data?.message || "Failed");
    }
  };

  const filteredPlayers = players.filter((p) =>
    p.role === "user" &&
    (!playerSearch || p.name?.toLowerCase().includes(playerSearch.toLowerCase()) || p.phone?.includes(playerSearch))
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30 bg-zinc-950">
        <div>
          <h1 className="text-xl font-heading font-bold text-violet-400 tracking-widest">ADMIN PANEL</h1>
          <p className="text-zinc-500 text-xs">P2P Tournament Platform</p>
        </div>
        <button onClick={() => navigate("/dashboard")} className="text-zinc-400 hover:text-white text-sm transition-colors">
          ← Dashboard
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 min-h-screen border-r border-zinc-800 p-4 flex-shrink-0 sticky top-16 h-fit">
          <nav className="space-y-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                    : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 min-w-0">
          {/* Global Message */}
          <AnimatePresence>
            {msg.text && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                  msg.type === "success"
                    ? "bg-green-500/10 border border-green-500/30 text-green-400"
                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                }`}
              >
                {msg.text}
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-zinc-600">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mr-3" />
              Loading...
            </div>
          ) : (
            <>
              {/* ── DASHBOARD ─────────────────────────────── */}
              {activeTab === "dashboard" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-bold mb-6">Dashboard Overview</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Total Players", value: stats.totalPlayers, color: "text-white" },
                      { label: "Active Players", value: stats.activePlayers, color: "text-green-400" },
                      { label: "Banned Players", value: stats.bannedPlayers, color: "text-red-400" },
                      { label: "Total Matches", value: stats.totalMatches, color: "text-blue-400" },
                      { label: "Upcoming Matches", value: stats.upcomingMatches, color: "text-orange-400" },
                      { label: "Pending Deposits", value: stats.pendingDeposits, color: "text-yellow-400" },
                      { label: "Pending Withdrawals", value: stats.pendingWithdrawals, color: "text-yellow-400" },
                      { label: "Total Approved ₹", value: `₹${(stats.totalApprovedDeposits || 0).toLocaleString("en-IN")}`, color: "text-green-400" },
                      { label: "Total Paid Out ₹", value: `₹${(stats.totalPaidWithdrawals || 0).toLocaleString("en-IN")}`, color: "text-orange-400" },
                    ].map((s) => (
                      <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value ?? 0}</p>
                        <p className="text-zinc-500 text-xs mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── PLAYERS ───────────────────────────────── */}
              {activeTab === "players" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Player Management</h2>
                    <input
                      value={playerSearch}
                      onChange={(e) => setPlayerSearch(e.target.value)}
                      placeholder="Search name or phone..."
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 w-56"
                    />
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-zinc-900 text-zinc-400 text-left">
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Phone</th>
                          <th className="px-4 py-3">UPI ID</th>
                          <th className="px-4 py-3">Balance</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Joined</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPlayers.length === 0 ? (
                          <tr><td colSpan={7} className="text-center text-zinc-600 py-12">No players found</td></tr>
                        ) : filteredPlayers.map((p, i) => (
                          <tr key={p._id} className={`border-t border-zinc-800 hover:bg-zinc-900/50 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/30"}`}>
                            <td className="px-4 py-3 text-white font-medium">{p.name}</td>
                            <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{p.phone}</td>
                            <td className="px-4 py-3 text-zinc-500 text-xs">{p.upiId}</td>
                            <td className="px-4 py-3 text-green-400 font-bold">₹{p.walletBalance?.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3"><StatusBadge status={p.status || "active"} /></td>
                            <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(p.createdAt).toLocaleDateString("en-IN")}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => togglePlayerStatus(p)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                  p.status === "banned"
                                    ? "bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20"
                                    : "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                                }`}
                              >
                                {p.status === "banned" ? "Unban" : "Ban"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* ── MATCHES ───────────────────────────────── */}
              {activeTab === "matches" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-bold mb-6">Match Management</h2>
                  {/* Create / Edit Form */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
                    <h3 className="font-semibold text-white mb-4">{editingMatch ? "✏️ Edit Match" : "➕ Create Match"}</h3>
                    <form onSubmit={handleMatchSubmit} className="grid grid-cols-2 gap-3">
                      <Input2 label="Match Name *" value={matchForm.name} onChange={(e) => setMatchForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Friday Night BGMI" required />
                      <Input2 label="Game *" value={matchForm.game} onChange={(e) => setMatchForm(p => ({ ...p, game: e.target.value }))} placeholder="e.g. BGMI, FreeFire" required />
                      <div className="col-span-2">
                        <Textarea2 label="Description" value={matchForm.description} onChange={(e) => setMatchForm(p => ({ ...p, description: e.target.value }))} placeholder="Optional match details..." />
                      </div>
                      <Input2 label="Match Date & Time *" type="datetime-local" value={matchForm.matchDate} onChange={(e) => setMatchForm(p => ({ ...p, matchDate: e.target.value }))} required />
                      <Input2 label="Entry Fee (₹)" type="number" min="0" value={matchForm.entryFee} onChange={(e) => setMatchForm(p => ({ ...p, entryFee: e.target.value }))} placeholder="0 for free" />
                      <Input2 label="Prize Pool (₹)" type="number" min="0" value={matchForm.prizePool} onChange={(e) => setMatchForm(p => ({ ...p, prizePool: e.target.value }))} placeholder="Total prize" required />
                      <Input2 label="Total Slots" type="number" min="2" value={matchForm.totalSlots} onChange={(e) => setMatchForm(p => ({ ...p, totalSlots: e.target.value }))} required />
                      <Select2 label="Status" value={matchForm.status} onChange={(e) => setMatchForm(p => ({ ...p, status: e.target.value }))}>
                        {["upcoming", "open", "full", "live", "completed", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                      </Select2>
                      <div className="col-span-2 flex gap-3">
                        <button type="submit" className="px-6 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors">
                          {editingMatch ? "Update Match" : "Create Match"}
                        </button>
                        {editingMatch && (
                          <button type="button" onClick={() => { setEditingMatch(null); setMatchForm({ name: "", game: "", description: "", matchDate: "", entryFee: "", prizePool: "", totalSlots: "", status: "upcoming" }); }}
                            className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white text-sm transition-colors">
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* Matches List */}
                  <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-zinc-900 text-zinc-400 text-left">
                          <th className="px-4 py-3">Match</th>
                          <th className="px-4 py-3">Game</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Entry/Prize</th>
                          <th className="px-4 py-3">Slots</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matches.length === 0 ? (
                          <tr><td colSpan={7} className="text-center text-zinc-600 py-12">No matches created yet</td></tr>
                        ) : matches.map((m, i) => (
                          <tr key={m._id} className={`border-t border-zinc-800 hover:bg-zinc-900/50 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/30"}`}>
                            <td className="px-4 py-3 text-white font-medium">{m.name}</td>
                            <td className="px-4 py-3 text-zinc-400">{m.game}</td>
                            <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(m.matchDate).toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3">
                              <span className="text-orange-400 text-xs">₹{m.entryFee}</span>
                              <span className="text-zinc-500 text-xs"> / </span>
                              <span className="text-green-400 text-xs">₹{m.prizePool}</span>
                            </td>
                            <td className="px-4 py-3 text-zinc-400 text-xs">{m.filledSlots}/{m.totalSlots}</td>
                            <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button onClick={() => { setEditingMatch(m._id); setMatchForm({ name: m.name, game: m.game, description: m.description, matchDate: m.matchDate ? new Date(m.matchDate).toISOString().slice(0, 16) : "", entryFee: m.entryFee, prizePool: m.prizePool, totalSlots: m.totalSlots, status: m.status }); }}
                                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors">Edit</button>
                                <button onClick={() => deleteMatch(m._id, m.name)}
                                  className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition-colors">Del</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* ── DEPOSITS ──────────────────────────────── */}
              {activeTab === "deposits" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-bold mb-6">Deposit Verification</h2>
                  <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-zinc-900 text-zinc-400 text-left">
                          <th className="px-4 py-3">Player</th>
                          <th className="px-4 py-3">Phone</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">UTR</th>
                          <th className="px-4 py-3">Proof</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deposits.length === 0 ? (
                          <tr><td colSpan={8} className="text-center text-zinc-600 py-12">No deposit requests</td></tr>
                        ) : deposits.map((d, i) => (
                          <tr key={d._id} className={`border-t border-zinc-800 hover:bg-zinc-900/50 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/30"}`}>
                            <td className="px-4 py-3 text-white font-medium">{d.name}</td>
                            <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{d.phone}</td>
                            <td className="px-4 py-3 text-green-400 font-bold">₹{d.amount?.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-zinc-300 font-mono text-xs">{d.utr || "—"}</td>
                            <td className="px-4 py-3">
                              {d.paymentProof ? (
                                <a href={d.paymentProof} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-300 underline text-xs">View 🔗</a>
                              ) : <span className="text-zinc-600 text-xs">—</span>}
                            </td>
                            <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                            <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(d.createdAt).toLocaleDateString("en-IN")}</td>
                            <td className="px-4 py-3">
                              {d.status === "pending" && (
                                <div className="flex gap-2">
                                  <button onClick={() => approveDeposit(d._id, d.amount, d.utr)}
                                    className="px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 text-xs font-semibold transition-colors">
                                    Approve
                                  </button>
                                  <button onClick={() => rejectDeposit(d._id)}
                                    className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors">
                                    Reject
                                  </button>
                                </div>
                              )}
                              {d.status === "rejected" && d.rejectionReason && (
                                <span className="text-xs text-red-400">{d.rejectionReason}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* ── WITHDRAWALS ───────────────────────────── */}
              {activeTab === "withdrawals" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-bold mb-6">Withdrawal Management</h2>
                  <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-zinc-900 text-zinc-400 text-left">
                          <th className="px-4 py-3">Player</th>
                          <th className="px-4 py-3">Phone</th>
                          <th className="px-4 py-3">UPI ID</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Payout UTR</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.length === 0 ? (
                          <tr><td colSpan={8} className="text-center text-zinc-600 py-12">No withdrawal requests</td></tr>
                        ) : withdrawals.map((w, i) => (
                          <tr key={w._id} className={`border-t border-zinc-800 hover:bg-zinc-900/50 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/30"}`}>
                            <td className="px-4 py-3 text-white font-medium">{w.name}</td>
                            <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{w.phone}</td>
                            <td className="px-4 py-3 text-zinc-500 text-xs">{w.upiId}</td>
                            <td className="px-4 py-3 text-orange-400 font-bold">₹{w.amount?.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
                            <td className="px-4 py-3 text-zinc-500 font-mono text-xs">{w.payoutUtr || "—"}</td>
                            <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(w.createdAt).toLocaleDateString("en-IN")}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1.5 flex-wrap">
                                {w.status === "pending" && (
                                  <>
                                    <button onClick={() => approveWithdrawal(w._id, w.amount)}
                                      className="px-2 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 text-xs font-semibold transition-colors">
                                      Approve
                                    </button>
                                    <button onClick={() => rejectWithdrawal(w._id)}
                                      className="px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-colors">
                                      Reject
                                    </button>
                                  </>
                                )}
                                {w.status === "approved" && (
                                  <button onClick={() => markPaid(w._id, w.amount)}
                                    className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-xs font-semibold transition-colors">
                                    Mark Paid
                                  </button>
                                )}
                                {w.status === "paid" && (
                                  <span className="text-xs text-emerald-400">✅ Paid</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* ── WALLET MANAGEMENT ─────────────────────── */}
              {activeTab === "wallet" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-bold mb-6">Wallet Management</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Manual Adjust Form */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                      <h3 className="font-semibold text-white mb-4">Manual Wallet Adjustment</h3>
                      <form onSubmit={handleWalletAdjust} className="space-y-3">
                        <Select2 label="Select Player *" value={walletAdjust.userId} onChange={(e) => setWalletAdjust(p => ({ ...p, userId: e.target.value }))} required>
                          <option value="">— Select player —</option>
                          {players.filter(p => p.role === "user").map(p => (
                            <option key={p._id} value={p._id}>{p.name} — ₹{p.walletBalance}</option>
                          ))}
                        </Select2>
                        <Input2 label="Amount (₹) *" type="number" min="1" value={walletAdjust.amount} onChange={(e) => setWalletAdjust(p => ({ ...p, amount: e.target.value }))} placeholder="Amount" required />
                        <Select2 label="Type *" value={walletAdjust.type} onChange={(e) => setWalletAdjust(p => ({ ...p, type: e.target.value }))}>
                          <option value="credit">Credit (Add)</option>
                          <option value="debit">Debit (Deduct)</option>
                        </Select2>
                        <Input2 label="Reason * (mandatory)" value={walletAdjust.reason} onChange={(e) => setWalletAdjust(p => ({ ...p, reason: e.target.value }))} placeholder="Reason for adjustment" required />
                        <button type="submit" className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors">
                          {walletAdjust.type === "credit" ? "⬆️ Credit Wallet" : "⬇️ Debit Wallet"}
                        </button>
                      </form>
                    </div>

                    {/* Players List */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                      <h3 className="font-semibold text-white mb-4">Player Balances</h3>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {players.filter(p => p.role === "user").map(p => (
                          <div key={p._id} className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2.5">
                            <div>
                              <p className="text-white text-sm font-medium">{p.name}</p>
                              <p className="text-zinc-500 text-xs font-mono">{p.phone}</p>
                            </div>
                            <p className="text-green-400 font-bold text-sm">₹{p.walletBalance?.toLocaleString("en-IN")}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── ALL TRANSACTIONS ──────────────────────── */}
              {activeTab === "transactions" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-bold mb-6">All Transactions</h2>
                  <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-zinc-900 text-zinc-400 text-left">
                          <th className="px-4 py-3">Player</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">UTR</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Description</th>
                          <th className="px-4 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.length === 0 ? (
                          <tr><td colSpan={7} className="text-center text-zinc-600 py-12">No transactions found</td></tr>
                        ) : transactions.map((t, i) => (
                          <tr key={t._id} className={`border-t border-zinc-800 hover:bg-zinc-900/50 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/30"}`}>
                            <td className="px-4 py-3">
                              <p className="text-white font-medium">{t.name}</p>
                              <p className="text-zinc-500 font-mono text-xs">{t.phone}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`capitalize font-medium text-xs ${t.type === "deposit" || t.type === "admin_credit" ? "text-green-400" : "text-orange-400"}`}>
                                {t.type?.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-white font-bold">₹{t.amount?.toLocaleString("en-IN")}</td>
                            <td className="px-4 py-3 text-zinc-500 text-xs font-mono">{t.utr || "—"}</td>
                            <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                            <td className="px-4 py-3 text-zinc-500 text-xs max-w-[200px] truncate">{t.description || "—"}</td>
                            <td className="px-4 py-3 text-zinc-500 text-xs">{new Date(t.createdAt).toLocaleDateString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* ── UPI SETTINGS ──────────────────────────── */}
              {activeTab === "upi-settings" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-bold mb-6">UPI & Payment Settings</h2>
                  <div className="max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                    <form onSubmit={handleUpiSave} className="space-y-4">
                      <div>
                        <label className="text-xs text-zinc-500 block mb-1">Platform UPI ID *</label>
                        <input
                          value={upiForm.upiId}
                          onChange={(e) => setUpiForm(p => ({ ...p, upiId: e.target.value }))}
                          placeholder="e.g. yourname@phonepe"
                          required
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm font-mono placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                        />
                        <p className="text-xs text-zinc-600 mt-1">This UPI ID will be shown to players on the Add Money screen</p>
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 block mb-1">Payment Instructions</label>
                        <textarea
                          value={upiForm.instructions}
                          onChange={(e) => setUpiForm(p => ({ ...p, instructions: e.target.value }))}
                          rows={5}
                          placeholder="Step-by-step payment instructions for players..."
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="depositsEnabled"
                          checked={upiForm.depositsEnabled}
                          onChange={(e) => setUpiForm(p => ({ ...p, depositsEnabled: e.target.checked }))}
                          className="w-4 h-4 accent-violet-500"
                        />
                        <label htmlFor="depositsEnabled" className="text-sm text-zinc-300">Deposits Enabled</label>
                      </div>
                      <Input2 label="Minimum Withdrawal Amount (₹)" type="number" min="1" value={upiForm.minWithdrawal} onChange={(e) => setUpiForm(p => ({ ...p, minWithdrawal: e.target.value }))} />

                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                        <p className="text-xs text-yellow-400">⚠️ Changing the UPI ID will only affect new deposit requests. Historical deposits retain the original UPI reference.</p>
                      </div>

                      <button type="submit" className="w-full py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors">
                        💾 Save Settings
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* ── ACTIVITY LOGS ─────────────────────────── */}
              {activeTab === "activity" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h2 className="text-xl font-bold mb-6">Admin Activity Logs</h2>
                  <div className="overflow-x-auto rounded-xl border border-zinc-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-zinc-900 text-zinc-400 text-left">
                          <th className="px-4 py-3">Admin</th>
                          <th className="px-4 py-3">Action</th>
                          <th className="px-4 py-3">Target</th>
                          <th className="px-4 py-3">Details</th>
                          <th className="px-4 py-3">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityLogs.length === 0 ? (
                          <tr><td colSpan={5} className="text-center text-zinc-600 py-12">No activity logs</td></tr>
                        ) : activityLogs.map((log, i) => (
                          <tr key={log._id} className={`border-t border-zinc-800 hover:bg-zinc-900/50 ${i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/30"}`}>
                            <td className="px-4 py-3 text-violet-400 text-xs font-medium">{log.adminId?.name || "Admin"}</td>
                            <td className="px-4 py-3 text-white text-xs font-mono">{log.action}</td>
                            <td className="px-4 py-3 text-zinc-500 text-xs">{log.targetType} {log.targetId?.slice(-6)}</td>
                            <td className="px-4 py-3 text-zinc-500 text-xs max-w-[200px] truncate">{JSON.stringify(log.details)}</td>
                            <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </main>
      </div>

      <ConfirmDialog {...confirm} />
    </div>
  );
}
