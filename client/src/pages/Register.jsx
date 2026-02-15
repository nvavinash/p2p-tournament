import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    playerId: '',
  });
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.playerId
    );
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans text-text relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md z-10">
        <h2 className="text-3xl font-heading font-bold mb-6 text-center text-primary tracking-wider">NEW OPERATIVE</h2>
        {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-md mb-4 text-center text-sm font-semibold">
                {error}
            </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="CODENAME"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your alias"
          />
          <Input
            label="EMAIL FREQUENCY"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="operative@example.com"
          />
          <Input
            label="SECURE KEY"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
          />
          <Input
            label="PLAYER ID"
            type="text"
            name="playerId"
            value={formData.playerId}
            onChange={handleChange}
            required
            placeholder="Unique In-Game ID"
          />
          <Button
            type="submit"
            className="w-full mt-4"
          >
            INITIATE REGISTRATION
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          Already Active?{' '}
          <Link to="/login" className="text-primary hover:text-secondary transition-colors font-semibold">
            ACCESS TERMINAL
          </Link>
        </p>
      </Card>
    </div>
  );
};

export default Register;
