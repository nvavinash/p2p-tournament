import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { User, Wallet, Shield, Mail, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, logout } = useAuth();

  const stats = [
    { label: 'Player ID', value: user?.playerId, icon: User, color: 'text-blue-400' },
    { label: 'Wallet Balance', value: `$${user?.walletBalance}`, icon: Wallet, color: 'text-green-400' },
    { label: 'Email', value: user?.email, icon: Mail, color: 'text-purple-400' },
    { label: 'Role', value: user?.role?.toUpperCase(), icon: Shield, color: 'text-yellow-400' },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center bg-background p-4 font-sans text-text relative overflow-hidden">
        {/* Subtle Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl z-10 mt-20"
      >
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-4xl font-heading font-bold text-white">OPERATIVE DASHBOARD</h1>
                <p className="text-muted mt-2">Welcome back, <span className="text-primary">{user?.name}</span></p>
            </div>
            <Button onClick={logout} variant="secondary" className="flex items-center gap-2">
                <LogOut size={18} />
                LOGOUT
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
                <Card key={index} className="flex flex-col items-center text-center hover:border-primary/50 transition-colors"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <div className={`p-4 rounded-full bg-surface/80 mb-4 ${stat.color}`}>
                        <stat.icon size={32} />
                    </div>
                    <p className="text-sm text-muted font-bold tracking-wider mb-1 uppercase">{stat.label}</p>
                    <p className="text-xl font-heading font-semibold text-white break-all">{stat.value}</p>
                </Card>
            ))}
        </div>

        <Card className="min-h-[300px] flex items-center justify-center border-dashed border-2 border-white/5 bg-transparent">
            <p className="text-muted text-lg">Active Tournaments Module - Offline</p>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
