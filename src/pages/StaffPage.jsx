import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Users, Trash2, Key, Mail, ShieldAlert, Sparkles, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StaffPage = () => {
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
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
    <div className="relative min-h-full bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-3">
              <Users className="h-8 w-8 text-indigo-400" />
              Menaxhimi i Stafit
            </h1>
            <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400">
              Krijoni llogari për punëtorët tuaj dhe shikoni statusin e tyre.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 text-[11px] font-medium text-zinc-650 dark:text-zinc-400">
            <Activity className="h-3.5 w-3.5 text-green-500 animate-pulse" />
            Cashiers limituar në POS
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left: Register Form */}
          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-zinc-200/50 dark:border-white/[0.06] bg-white dark:bg-black p-6 shadow-sm"
            >
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-zinc-100 mb-5 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Shto Punëtor të Ri
              </h2>

              {error && (
                <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-[12px] text-rose-450 font-medium">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-[12px] text-green-450 font-medium">
                  {success}
                </div>
              )}

              <form onSubmit={handleAddWorker} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Emri i Punëtorit
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="P.sh. Valon Shaqiri"
                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-[13px] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Email Adresa
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="punetori@biznesi.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-[13px] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                    Fjalëkalimi
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Krijo fjalëkalim të sigurt"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-[13px] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 font-bold text-[13px] hover:bg-zinc-900 dark:hover:bg-zinc-200 transition shadow-sm disabled:opacity-50"
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
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl border border-zinc-200/50 dark:border-white/[0.06] bg-white dark:bg-black p-6 shadow-sm overflow-hidden"
            >
              <h2 className="text-[16px] font-bold text-slate-900 dark:text-zinc-100 mb-5">
                Stafi Aktiv ({workers.length})
              </h2>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-500">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  <p className="text-[13px]">Duke ngarkuar listën e stafit...</p>
                </div>
              ) : workers.length === 0 ? (
                <div className="text-center py-16 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/20 dark:bg-zinc-900/10">
                  <Users className="h-10 w-10 mx-auto text-zinc-650 mb-3" />
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-zinc-350">Nuk ka punëtorë të regjistruar</p>
                  <p className="text-[11px] text-zinc-500 mt-1 max-w-[280px] mx-auto">
                    Krijoni llogarinë e parë të cashier-it në anën e majtë për të filluar punën në POS.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-100 dark:border-white/[0.04] text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        <th className="pb-3 pl-2">Emri</th>
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Roli</th>
                        <th className="pb-3">Data e Krijimit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.04]">
                      <AnimatePresence>
                        {workers.map((worker) => (
                          <motion.tr
                            key={worker.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[13px] text-slate-700 dark:text-zinc-350 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors"
                          >
                            <td className="py-4 pl-2 font-semibold text-slate-900 dark:text-white">
                              {worker.emri}
                            </td>
                            <td className="py-4">{worker.email}</td>
                            <td className="py-4">
                              <span className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400">
                                Cashier (POS)
                              </span>
                            </td>
                            <td className="py-4">
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
