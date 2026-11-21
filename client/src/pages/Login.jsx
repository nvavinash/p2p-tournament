import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import { motion } from "framer-motion";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^\d{10}$/.test(phone)) {
      return setError("Phone number must be exactly 10 digits");
    }
    if (!/^\d{6}$/.test(pin)) {
      return setError("PIN must be exactly 6 digits");
    }

    setLoading(true);
    const res = await login(phone, pin);
    setLoading(false);

    if (res.success) {
      navigate(res.user?.role === "admin" ? "/admin" : from, { replace: true });
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans text-text relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-heading font-bold text-primary tracking-wider">
            INITIATE LOGIN
          </h2>
          <p className="text-muted text-sm mt-2">Enter your phone number and 6-digit PIN</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-center text-sm font-medium"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="PHONE NUMBER"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            required
            placeholder="10-digit mobile number"
            maxLength={10}
            inputMode="numeric"
          />
          <Input
            label="6-DIGIT PIN"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            placeholder="••••••"
            maxLength={6}
            inputMode="numeric"
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "AUTHENTICATING..." : "LOGIN"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New Player?{" "}
          <Link to="/register" className="text-primary hover:text-secondary transition-colors font-semibold">
            REGISTER
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Login;
