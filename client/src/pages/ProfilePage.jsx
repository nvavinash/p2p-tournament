import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Phone, CreditCard, Shield } from "lucide-react";
import { motion } from "framer-motion";

const InfoRow = ({ icon: Icon, label, value, color = "text-white" }) => (
  <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
    <div className="p-3 bg-zinc-800 rounded-lg">
      <Icon size={20} className={color} />
    </div>
    <div>
      <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${color}`}>{value || "—"}</p>
    </div>
  </div>
);

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Your account information</p>
          </div>
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-zinc-400 hover:text-white text-sm transition-colors">
            <ArrowLeft size={16} /> Dashboard
          </button>
        </div>

        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center mb-6"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-700 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || "P"}
          </div>
          <h2 className="text-xl font-bold text-white">{user?.name}</h2>
          <p className="text-zinc-500 text-sm mt-1">Player Account</p>
          <span className={`inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-semibold border ${
            user?.status === "banned"
              ? "bg-red-500/20 text-red-400 border-red-500/30"
              : "bg-green-500/20 text-green-400 border-green-500/30"
          }`}>
            {user?.status === "banned" ? "⛔ Banned" : "✅ Active"}
          </span>
        </motion.div>

        {/* Info */}
        <div className="space-y-3 mb-6">
          <InfoRow icon={User} label="Full Name" value={user?.name} color="text-white" />
          <InfoRow icon={Phone} label="Phone Number" value={user?.phone} color="text-blue-400" />
          <InfoRow icon={CreditCard} label="UPI ID" value={user?.upiId} color="text-purple-400" />
          <InfoRow icon={Shield} label="Role" value={user?.role?.toUpperCase()} color="text-orange-400" />
        </div>

        {/* Wallet */}
        <div className="bg-gradient-to-br from-green-900/30 to-zinc-900 border border-green-500/20 rounded-2xl p-6 mb-6">
          <p className="text-zinc-400 text-sm uppercase tracking-widest mb-2">Wallet Balance</p>
          <p className="text-4xl font-bold text-green-400">
            ₹{(user?.walletBalance ?? 0).toLocaleString("en-IN")}
          </p>
        </div>

        {/* Note */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <p className="text-zinc-500 text-sm">
            💡 To update your UPI ID or other account details, please contact support.
            Your wallet balance is managed by the platform and cannot be modified directly.
          </p>
        </div>

        {/* Logout */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { logout(); navigate("/login"); }}
          className="w-full mt-6 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-semibold transition-colors"
        >
          Logout
        </motion.button>
      </div>
    </div>
  );
}
