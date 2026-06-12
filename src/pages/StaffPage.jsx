import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Users, Trash2, Key, Mail, ShieldAlert, Activity, Info, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StaffPage = () => {
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWorkers = async () => {
    try {
      const res = await fetch('/api/auth/workers');
      if (res.ok) {
        const data = await res.json();
        setWorkers(data);
      }
    } catch (err) {
      console.error('Error fetching workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleAddWorker = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emri_punetorit: name, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Dështoi regjistrimi i punëtorit');
      }

      const newWorker = await res.json();
      setWorkers([newWorker, ...workers]);
      setSuccess(`Llogaria për ${name} u krijua me sukses!`);
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Gabim gjatë krijimit të llogarisë.');
    } finally {
      setSubmitting(false);
    }
  };

  if (user?.role !== 'owner') {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center select-none">
        <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-450 flex items-center justify-center mb-4">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h3 className="text-[18px] font-bold text-white">Qasje e Kufizuar</h3>
        <p className="mt-2 text-[13px] text-zinc-450 max-w-sm">
          Vetëm pronari i biznesit mund të menaxhojë stafin dhe llogaritë e punëtorëve.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(var(--accent-rgb),0.08),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.01),transparent_18%)]" />
      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-600/90 font-medium">Personeli</p>
            <h1 className="mt-3 text-[2rem] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[2.8rem] leading-[1.15]">
              Menaxhimi i Stafit
            </h1>
            <p className="mt-2 text-[14px] text-slate-500 dark:text-zinc-400 max-w-xl">
              Krijoni llogari për punëtorët tuaj dhe shikoni statusin e tyre.
            </p>
          </div>
          <button
            onClick={fetchWorkers}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[13px] font-semibold text-slate-700 dark:text-zinc-300 transition hover:border-slate-350 hover:bg-white/60 dark:hover:bg-white/[0.03] backdrop-blur-xl"
          >
            <RefreshCcw size={16} />
            Rifresko
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* Left: Register Form */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
            >
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-zinc-100 mb-5">
                Shto Punëtor të Ri
              </h2>

              {error && (
                <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-[12px] text-rose-600 dark:text-rose-400 font-medium">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-[12px] text-green-600 dark:text-green-400 font-medium">
                  {success}
                </div>
              )}

              <form onSubmit={handleAddWorker} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                    Emri i Punëtorit
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="P.sh. Valon Shaqiri"
                    className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                    Email Adresa
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="punetori@biznesi.com"
                      className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] py-3 pl-10 pr-4 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                    Fjalëkalimi
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Krijo fjalëkalim të sigurt"
                      className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] py-3 pl-10 pr-4 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[13px] hover:bg-slate-800 dark:hover:bg-zinc-200 transition shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Regjistro Punëtorin
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          </div>

          {/* Right: Workers List */}
          <div className="lg:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-[2rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] shadow-sm backdrop-blur-xl overflow-hidden"
            >
              <div className="px-6 py-6 pb-0">
                <h2 className="text-[16px] font-bold text-slate-900 dark:text-zinc-100">
                  Stafi Aktiv ({workers.length})
                </h2>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500 dark:text-zinc-500">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  <p className="text-[13px]">Duke ngarkuar listën e stafit...</p>
                </div>
              ) : workers.length === 0 ? (
                <div className="mx-6 my-6 text-center py-16 text-slate-500 dark:text-zinc-500 border border-dashed border-slate-200/60 dark:border-white/[0.06] rounded-[1.5rem] bg-white/20 dark:bg-white/[0.01]">
                  <Users className="h-10 w-10 mx-auto text-slate-400 dark:text-zinc-500 mb-3" />
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-zinc-300">Nuk ka punëtorë të regjistruar</p>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1 max-w-[280px] mx-auto">
                    Krijoni llogarinë e parë të cashier-it në anën e majtë për të filluar punën në POS.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[14px] text-slate-700 dark:text-zinc-300">
                    <thead>
                      <tr className="border-b border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.02]">
                        <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Emri</th>
                        <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Roli</th>
                        <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Data e Krijimit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/40 dark:divide-transparent">
                      <AnimatePresence>
                        {workers.map((worker) => (
                          <motion.tr
                            key={worker.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="transition-colors hover:bg-white/60 dark:hover:bg-white/[0.03]"
                          >
                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-zinc-100">
                              {worker.emri}
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-zinc-400">{worker.email}</td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 dark:bg-indigo-500/5 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                Cashier (POS)
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-zinc-400 font-medium">
                              {new Date(worker.created_at).toLocaleDateString('sq-AL', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StaffPage;
