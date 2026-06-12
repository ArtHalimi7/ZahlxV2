import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';
import Logo from '../assets/X.png';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Email ose fjalëkalim i gabuar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-zinc-950 px-4 py-12 overflow-hidden select-none">
      {/* Background visual design */}
      <div className="pointer-events-none absolute -inset-10 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.08),transparent_50%)]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/5 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-[440px] rounded-3xl border border-white/[0.08] bg-black/40 backdrop-blur-2xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08] mb-4 shadow-inner">
            <img src={Logo} alt="Zahlx Logo" className="h-10 w-auto object-contain brightness-0 invert" />
          </div>
          <h2 className="text-[24px] font-bold tracking-tight text-white">Identifikohuni në Zahlx</h2>
          <p className="mt-2 text-[13px] text-zinc-400">Mirëseerdhët përsëri! Ju lutem shkruani të dhënat tuaja.</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-[13px] font-medium text-rose-400"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[12px] font-semibold tracking-wide text-zinc-450 uppercase" htmlFor="email">
              Email Adresa
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-500" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="emri@biznesi.com"
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-[14px] text-white placeholder-zinc-650 transition focus:outline-none focus:border-indigo-500 focus:bg-white/[0.05]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[12px] font-semibold tracking-wide text-zinc-450 uppercase" htmlFor="password">
                Fjalëkalimi
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-zinc-500" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] text-[14px] text-white placeholder-zinc-650 transition focus:outline-none focus:border-indigo-500 focus:bg-white/[0.05]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01, y: -1 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-black font-semibold text-[14px] transition hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
            ) : (
              <>
                Identifikohu
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>
        </form>

        <p className="mt-8 text-center text-[13px] text-zinc-400">
          Nuk keni një llogari?{' '}
          <Link to="/signup" className="font-semibold text-white hover:text-indigo-400 transition">
            Regjistrohuni këtu
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
