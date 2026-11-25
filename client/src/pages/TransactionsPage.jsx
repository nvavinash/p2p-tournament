import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const API = import.meta.env.API_URL;

const typeEmoji = {
  deposit: "💰",
  withdraw: "🏧",
  match_entry: "🎮",
  match_refund: "↩",
  prize_credit: "🏆",
  admin_credit: "⬆️",
  admin_debit: "⬇️",
};

const creditTypes = new Set(["deposit", "admin_credit", "prize_credit", "match_refund"]);

const StatusBadge = ({ status }) => {
  const configs = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    approved: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
    completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    paid: "bg-green-500/20 text-green-400 border-green-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    refunded: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${configs[status] || "bg-zinc-700 text-zinc-400 border-zinc-600"}`}>
      {status}
    </span>
  );
};

const typeFilters = ["all", "deposit", "withdraw", "match_entry", "match_refund", "prize_credit", "admin_credit", "admin_debit"];

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    axios.get(`${API}/wallet/transactions`)
      .then((res) => setTransactions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Transaction History
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Your complete ledger</p>
          </div>
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm transition-colors">
            <ArrowLeft size={16} /> Dashboard
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {typeFilters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                filter === f
                  ? "bg-orange-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {f.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-600">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-zinc-800 rounded-2xl text-zinc-600">
            No transactions found
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900 text-zinc-400 text-left">
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">UTR</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr
                    key={t._id}
                    className={`border-t border-zinc-800 hover:bg-zinc-900/50 transition-colors ${
                      i % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/30"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2">
                        <span>{typeEmoji[t.type] || "💫"}</span>
                        <span className="capitalize text-white text-xs">{t.type?.replace(/_/g, " ")}</span>
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-bold ${creditTypes.has(t.type) ? "text-green-400" : "text-orange-400"}`}>
                      {creditTypes.has(t.type) ? "+" : "-"}₹{t.amount?.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs font-mono">
                      {t.utr || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs max-w-[200px] truncate">
                      {t.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
