import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Wallet, Swords, LayoutDashboard, User, ScrollText, Shield } from "lucide-react";

const NavItem = ({ icon: Icon, label, onClick, color = "text-zinc-400" }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl p-5 text-left transition-all group w-full"
  >
    <div className={`text-2xl ${color}`}>
      <Icon size={26} />
    </div>
    <div>
      <p className={`font-semibold group-hover:text-white transition-colors ${color}`}>{label}</p>
    </div>
  </motion.button>
);

const StatCard = ({ label, value, color = "text-white", bg = "bg-zinc-900" }) => (
  <div className={`${bg} border border-zinc-800 rounded-xl p-4 text-center`}>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-zinc-500 text-xs mt-1">{label}</p>
  </div>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-bold text-orange-400 tracking-widest">
            P2P BATTLEGROUND
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-heading font-bold text-white">
           YOUR DASHBOARD
          </h2>
          <p className="text-zinc-400 mt-1">
            Welcome back,{" "}
            <span className="text-orange-400 font-semibold">{user?.name}</span>
            {user?.status === "banned" && (
              <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                BANNED
              </span>
            )}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Wallet Balance"
            value={`₹${(user?.walletBalance ?? 0).toLocaleString("en-IN")}`}
            color="text-green-400"
          />
          <StatCard
            label="Phone"
            value={user?.phone || "—"}
            color="text-blue-400"
          />
          
          <div className="bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-center">
            <p className={`text-sm font-bold text-purple-400`}>{user?.upiId || "—"}</p>
            <p className="text-zinc-500 text-xs mt-1">UPI ID</p>
          </div>

          <StatCard
            label="Account Status"
            value={user?.status === "banned" ? "BANNED" : "ACTIVE"}
            color={user?.status === "banned" ? "text-red-400" : "text-green-400"}
          />
        </div>

        {/* Quick Actions */}
        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <NavItem
            icon={Wallet}
            label="My Wallet"
            onClick={() => navigate("/wallet")}
            color="text-green-400"
          />
          <NavItem
            icon={Swords}
            label="Browse Matches"
            onClick={() => navigate("/matches")}
            color="text-orange-400"
          />
          <NavItem
            icon={ScrollText}
            label="Transaction History"
            onClick={() => navigate("/transactions")}
            color="text-blue-400"
          />
          <NavItem
            icon={User}
            label="My Profile"
            onClick={() => navigate("/profile")}
            color="text-purple-400"
          />
          {user?.role === "admin" && (
            <NavItem
              icon={Shield}
              label="Admin Panel"
              onClick={() => navigate("/admin")}
              color="text-violet-400"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
