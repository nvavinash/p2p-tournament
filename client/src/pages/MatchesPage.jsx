import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const API = import.meta.env.API_URL;

const StatusBadge = ({ status }) => {
  const configs = {
    upcoming: { bg: "bg-blue-500/20", text: "text-blue-400", label: "🔜 Upcoming" },
    open: { bg: "bg-green-500/20", text: "text-green-400", label: "🟢 Open" },
    full: { bg: "bg-yellow-500/20", text: "text-yellow-400", label: "🔴 Full" },
    live: { bg: "bg-orange-500/20", text: "text-orange-400", label: "🔴 Live" },
    completed: { bg: "bg-zinc-700/60", text: "text-zinc-400", label: "✅ Completed" },
    cancelled: { bg: "bg-red-500/20", text: "text-red-400", label: "❌ Cancelled" },
  };
  const cfg = configs[status] || { bg: "bg-zinc-700", text: "text-zinc-400", label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
};

export default function MatchesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(null);
  const [messages, setMessages] = useState({});

  const fetchMatches = async () => {
    try {
      const res = await axios.get(`${API}/matches`);
      setMatches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMatches(); }, []);

  const handleRegister = async (matchId) => {
    if (!window.confirm("Confirm registration? Entry fee will be deducted from your wallet.")) return;
    setRegistering(matchId);
    setMessages((p) => ({ ...p, [matchId]: "" }));
    try {
      const res = await axios.post(`${API}/matches/${matchId}/register`);
      setMessages((p) => ({ ...p, [matchId]: { type: "success", text: res.data.message } }));
      fetchMatches();
    } catch (err) {
      setMessages((p) => ({ ...p, [matchId]: { type: "error", text: err.response?.data?.message || "Registration failed" } }));
    } finally {
      setRegistering(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Tournaments
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Browse and register for matches</p>
          </div>
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm transition-colors">
            <ArrowLeft size={16} /> Dashboard
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-600">Loading matches...</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 border border-zinc-800 rounded-2xl">
            <p className="text-6xl mb-4">🎮</p>
            <p className="text-zinc-500">No matches available right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((match) => (
              <motion.div
                key={match._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">{match.name}</h3>
                    <p className="text-zinc-500 text-sm">{match.game}</p>
                  </div>
                  <StatusBadge status={match.status} />
                </div>

                {match.description && (
                  <p className="text-zinc-500 text-sm mb-4">{match.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 mb-1">📅 Match Date</p>
                    <p className="text-white text-sm font-medium">
                      {new Date(match.matchDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-zinc-400 text-xs">
                      {new Date(match.matchDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 mb-1">🏆 Prize Pool</p>
                    <p className="text-green-400 text-sm font-bold">₹{match.prizePool?.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 mb-1">🎫 Entry Fee</p>
                    <p className="text-orange-400 text-sm font-bold">
                      {match.entryFee === 0 ? "FREE" : `₹${match.entryFee}`}
                    </p>
                  </div>
                  <div className="bg-zinc-800 rounded-lg p-3">
                    <p className="text-xs text-zinc-500 mb-1">👥 Slots</p>
                    <p className="text-white text-sm font-medium">
                      {match.availableSlots} / {match.totalSlots} available
                    </p>
                    <div className="mt-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${((match.totalSlots - match.availableSlots) / match.totalSlots) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {messages[match._id] && (
                  <p className={`text-sm mb-3 ${messages[match._id].type === "success" ? "text-green-400" : "text-red-400"}`}>
                    {messages[match._id].text}
                  </p>
                )}

                {match.isRegistered ? (
                  <div className="w-full py-2.5 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-center text-sm font-semibold">
                    ✅ You are registered!
                  </div>
                ) : ["open", "upcoming"].includes(match.status) && match.availableSlots > 0 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRegister(match._id)}
                    disabled={registering === match._id}
                    className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    {registering === match._id ? "Registering..." : `Register — ₹${match.entryFee || "Free"}`}
                  </motion.button>
                ) : (
                  <div className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-500 text-center text-sm">
                    {match.status === "full" ? "Match Full" : match.status === "cancelled" ? "Cancelled" : "Registration Closed"}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
