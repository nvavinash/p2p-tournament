import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5001/api";

const StatusBadge = ({ transaction }) => {
  if (transaction.editedByAdmin && transaction.type === "deposit") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30 whitespace-nowrap">
        ✅ Deposit Done
      </span>
    );
  }
  if (transaction.editedByAdmin && transaction.type === "withdraw") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 whitespace-nowrap">
        🏧 Withdraw Done
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-700/60 text-zinc-400 border border-zinc-600/30 whitespace-nowrap">
      ⏳ Pending
    </span>
  );
};

const AdminBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/20 text-violet-400 border border-violet-500/30 whitespace-nowrap">
    ✏️ Updated by Admin
  </span>
);

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("transactions");
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Wallet editor state
  const [editUserId, setEditUserId] = useState("");
  const [newBalance, setNewBalance] = useState("");
  const [editMsg, setEditMsg] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [txRes, wdRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/transactions`),
        axios.get(`${API}/admin/withdrawals`),
        axios.get(`${API}/admin/users`),
      ]);
      setTransactions(txRes.data);
      setWithdrawals(wdRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchAll();
  }, [user]);

  const handleWalletUpdate = async (e) => {
    e.preventDefault();
    if (!editUserId) return setEditMsg("Please select a user");
    setEditLoading(true);
    setEditMsg("");
    try {
      const res = await axios.patch(`${API}/admin/user/${editUserId}/wallet`, {
        walletBalance: Number(newBalance),
      });
      setEditMsg(`✅ Wallet updated to ₹${res.data.walletBalance}`);
      setNewBalance("");
      fetchAll();
    } catch (err) {
      setEditMsg(err.response?.data?.message || "Failed to update wallet");
    } finally {
      setEditLoading(false);
    }
  };

  const tabs = [
    { id: "transactions", label: "📋 All Transactions" },
    { id: "withdrawals", label: "🏧 Withdrawals" },
    { id: "wallet-editor", label: "✏️ Wallet Editor" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Manage transactions & wallets
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            ← Dashboard
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "Total Transactions",
              value: transactions.length,
              color: "text-white",
            },
            {
              label: "Withdrawals",
              value: withdrawals.length,
              color: "text-orange-400",
            },
            {
              label: "Total Users",
              value: users.length,
              color: "text-violet-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center"
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-zinc-500 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-zinc-700 text-white shadow"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-600">Loading...</div>
        ) : (
          <>
            {/* All Transactions Tab */}
            {activeTab === "transactions" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-900 text-zinc-400 text-left">
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Player ID</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Amount</th>
                        <th className="px-4 py-3 font-medium">Proof</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={7}
                            className="text-center text-zinc-600 py-12"
                          >
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        transactions.map((t, i) => (
                          <tr
                            key={t._id}
                            className={`border-t border-zinc-800 hover:bg-zinc-900/50 transition-colors ${
                              i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/30"
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-white font-medium">
                                  {t.name}
                                </p>
                                {t.editedByAdmin && <AdminBadge />}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                              {t.playerId}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`capitalize font-medium ${
                                  t.type === "deposit"
                                    ? "text-green-400"
                                    : "text-orange-400"
                                }`}
                              >
                                {t.type === "deposit" ? "💰" : "🏧"} {t.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-white font-bold">
                              ₹{t.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-3">
                              {t.paymentProof ? (
                                <a
                                  href={t.paymentProof}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-violet-400 hover:text-violet-300 underline text-xs"
                                >
                                  View 🔗
                                </a>
                              ) : (
                                <span className="text-zinc-600 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge transaction={t} />
                            </td>
                            <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                              {new Date(t.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Withdrawals Tab */}
            {activeTab === "withdrawals" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-900 text-zinc-400 text-left">
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Player ID</th>
                        <th className="px-4 py-3 font-medium">Amount</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center text-zinc-600 py-12"
                          >
                            No withdrawal requests found
                          </td>
                        </tr>
                      ) : (
                        withdrawals.map((w, i) => (
                          <tr
                            key={w._id}
                            className={`border-t border-zinc-800 hover:bg-zinc-900/50 transition-colors ${
                              i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/30"
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-white font-medium">
                                  {w.name}
                                </p>
                                {w.editedByAdmin && <AdminBadge />}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                              {w.playerId}
                            </td>
                            <td className="px-4 py-3 text-orange-400 font-bold">
                              ₹{w.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge
                                transaction={{ ...w, type: "withdraw" }}
                              />
                            </td>
                            <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                              {new Date(w.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* Wallet Editor Tab */}
            {activeTab === "wallet-editor" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-lg"
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-1">
                    Edit User Wallet
                  </h2>
                  <p className="text-zinc-500 text-sm mb-6">
                    Set an absolute wallet balance for any user. This will mark
                    their transactions as "Updated by Admin".
                  </p>
                  <form onSubmit={handleWalletUpdate} className="space-y-4">
                    <div>
                      <label className="text-sm text-zinc-400 block mb-1">
                        Select User
                      </label>
                      <select
                        value={editUserId}
                        onChange={(e) => setEditUserId(e.target.value)}
                        required
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-violet-500 transition-colors"
                      >
                        <option value="">— Choose a user —</option>
                        {users.map((u) => (
                          <option key={u._id} value={u._id}>
                            {u.name} ({u.playerId}) — ₹{u.walletBalance}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-zinc-400 block mb-1">
                        New Wallet Balance (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={newBalance}
                        onChange={(e) => setNewBalance(e.target.value)}
                        placeholder="e.g. 1000"
                        required
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                      />
                    </div>
                    {editMsg && (
                      <p
                        className={`text-sm ${
                          editMsg.startsWith("✅")
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {editMsg}
                      </p>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={editLoading}
                      className="w-full py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors disabled:opacity-50"
                    >
                      {editLoading ? "Updating..." : "✏️ Update Wallet Balance"}
                    </motion.button>
                  </form>

                  {/* Users list */}
                  <div className="mt-8">
                    <h3 className="text-sm font-medium text-zinc-400 mb-3">
                      All Users
                    </h3>
                    <div className="space-y-2">
                      {users.map((u) => (
                        <div
                          key={u._id}
                          className="flex items-center justify-between bg-zinc-800 rounded-lg px-4 py-2.5"
                        >
                          <div>
                            <p className="text-white text-sm font-medium">
                              {u.name}
                            </p>
                            <p className="text-zinc-500 text-xs font-mono">
                              {u.playerId}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold text-sm">
                              ₹{u.walletBalance.toLocaleString("en-IN")}
                            </p>
                            <span
                              className={`text-xs ${
                                u.role === "admin"
                                  ? "text-violet-400"
                                  : "text-zinc-500"
                              }`}
                            >
                              {u.role}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
