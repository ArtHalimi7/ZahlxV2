import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../assets/X.png';

const slide = {
  hidden: { opacity: 0, x: -30 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } },
};

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <div className="flex min-h-screen w-full bg-[#060608] overflow-hidden select-none">
      {/* Left — Form panel */}
      <div className="relative flex w-full lg:w-[45%] items-center justify-center px-10 py-16 bg-[#08080b]">
        <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />

        <motion.div
          variants={slide}
          initial="hidden"
          animate="show"
          className="w-full max-w-[380px]"
        >
          <div className="mb-14">
            <div className="mb-8">
              <img src={Logo} alt="Zahlx" className="h-10 w-auto brightness-0 invert" />
            </div>
            <h1 className="text-[36px] font-bold tracking-tight text-white leading-[1.1]">
              Mirë se vini
            </h1>
            <p className="mt-3 text-[15px] text-zinc-500 leading-relaxed">
              Identifikohu për të vazhduar menaxhimin e biznesit tënd.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3"
            >
              <p className="text-[13px] text-red-400">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[12px] font-medium tracking-widest text-zinc-500 uppercase mb-3" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="emri@biznesi.com"
                className="block w-full bg-transparent border-b border-white/[0.06] pb-3.5 text-[16px] text-white placeholder:text-zinc-700 transition-all focus:outline-none focus:border-white/30"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium tracking-widest text-zinc-500 uppercase mb-3" htmlFor="password">
                Fjalëkalimi
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full bg-transparent border-b border-white/[0.06] pb-3.5 text-[16px] text-white placeholder:text-zinc-700 transition-all focus:outline-none focus:border-white/30"
              />
            </div>
            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-white text-zinc-950 font-semibold text-[14px] transition-all hover:bg-zinc-200 disabled:opacity-40"
              >
                {loading ? (
                  <div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                ) : (
                  'Identifikohu'
                )}
              </motion.button>
            </div>
          </form>

          <p className="mt-12 text-center text-[14px] text-zinc-600">
            Nuk ke llogari?{' '}
            <Link to="/signup" className="text-zinc-300 hover:text-white transition-colors font-medium">
              Regjistrohu
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right — Brand art panel */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center overflow-hidden bg-[#060608]">
        <div className="absolute inset-0 bg-gradient-to-tl from-indigo-500/[0.03] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] via-transparent to-transparent" />

        {/* Primary glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/[0.04] blur-[120px]" />

        {/* Secondary glow ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-indigo-500/[0.03]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10 flex flex-col items-center"
        >
          {/* X logo as hero art */}
          <div className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-indigo-500/[0.08] blur-[60px]" />
            <img
              src={Logo}
              alt=""
              className="relative h-[180px] w-auto brightness-0 invert opacity-90"
            />
          </div>

          <div className="mt-8 text-center">
            <p className="text-[13px] font-medium tracking-[0.3em] text-zinc-600 uppercase">
              Një platformë
            </p>
            <p className="text-[13px] font-medium tracking-[0.3em] text-zinc-600 uppercase mt-2">
              Çdo gjë
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
