import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Card from "../components/ui/Card";
import { motion } from "framer-motion";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    pin: "",
    confirmPin: "",
    upiId: "",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      setFormData((p) => ({ ...p, phone: value.replace(/\D/g, "").slice(0, 10) }));
    } else if (name === "pin" || name === "confirmPin") {
      setFormData((p) => ({ ...p, [name]: value.replace(/\D/g, "").slice(0, 6) }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name.trim()) return setError("Full name is required");
    if (!/^\d{10}$/.test(formData.phone)) return setError("Phone number must be exactly 10 digits");
    if (!/^\d{6}$/.test(formData.pin)) return setError("PIN must be exactly 6 digits");
    if (formData.pin !== formData.confirmPin) return setError("PINs do not match");
    if (!/^[\w.\-]+@[\w]+$/.test(formData.upiId)) return setError("Invalid UPI ID format (e.g. name@upi or name@paytm)");

    setLoading(true);
    const res = await register({
      name: formData.name.trim(),
      phone: formData.phone,
      pin: formData.pin,
      upiId: formData.upiId.trim(),
    });
    setLoading(false);

    if (res.success) {
      setSuccess("✅ Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans text-text relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md z-10">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-heading font-bold text-primary tracking-wider">
            NEW OPERATIVE
          </h2>
          <p className="text-muted text-sm mt-2">Create your player account</p>
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
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-lg mb-4 text-center text-sm font-medium"
          >
            {success}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="FULL NAME"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
          />
          <Input
            label="PHONE NUMBER"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="10-digit mobile number"
            maxLength={10}
            inputMode="numeric"
          />
          <Input
            label="6-DIGIT PIN"
            type="password"
            name="pin"
            value={formData.pin}
            onChange={handleChange}
            required
            placeholder="Set a 6-digit PIN"
            maxLength={6}
            inputMode="numeric"
          />
          <Input
            label="CONFIRM PIN"
            type="password"
            name="confirmPin"
            value={formData.confirmPin}
            onChange={handleChange}
            required
            placeholder="Re-enter your PIN"
            maxLength={6}
            inputMode="numeric"
          />
          {/* <Input
            label="UPI ID"
            type="text"
            name="upiId"
            value={formData.upiId}
            onChange={handleChange}
            required
            placeholder="e.g. name@paytm or phone@upi"
          />
          <p className="text-xs text-zinc-500 -mt-1">
            Your UPI ID will be used for withdrawal payments
          </p> */}

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "REGISTERING..." : "INITIATE REGISTRATION"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Already Active?{" "}
          <Link to="/login" className="text-primary hover:text-secondary transition-colors font-semibold">
            ACCESS TERMINAL
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Register;
