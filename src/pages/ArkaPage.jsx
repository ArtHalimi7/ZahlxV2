import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, RefreshCcw, Wallet, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const currency = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const ArkaPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ balance: 0, totalIn: 0, totalOut: 0, todayIn: 0, todayOut: 0, entries: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tax payment modal state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [pershkrimi, setPershkrimi] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchArka = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/arka');
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Gabim gjatë leximit');
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArka();
  }, []);

  const handlePayTax = async (e) => {
    e.preventDefault();
    setFormError('');
    const payVal = parseFloat(amount);
    if (isNaN(payVal) || payVal <= 0) {
      setFormError('Vlera e pagesës duhet të jetë një numër pozitiv.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/taxes/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: payVal, pershkrimi }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Gabim gjatë regjistrimit të pagesës.');
      
      setIsPayModalOpen(false);
      setAmount('');
      setPershkrimi('');
      await fetchArka();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(var(--accent-rgb),0.08),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.01),transparent_18%)]" />
      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* Page Title */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-3 flex items-center gap-3 text-[2rem] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[2.8rem] leading-[1.15]">
              Arka
              {loading && <RefreshCcw size={20} className="animate-spin text-slate-450 dark:text-zinc-500" />}
            </h1>
            <p className="mt-2 text-[14px] text-slate-500 dark:text-zinc-400 max-w-xl">
              Gjendja aktuale e arkës, paratë që kanë hyrë dhe dalë, dhe historiku i plotë i lëvizjeve.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === 'owner' && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setFormError('');
                  setIsPayModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 dark:bg-white px-5 py-3 text-[13px] font-bold text-white dark:text-zinc-950 shadow-sm transition hover:bg-zinc-800 dark:hover:bg-zinc-200"
              >
                Paguaj Tatimin
              </motion.button>
            )}
            <button
              onClick={fetchArka}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[13px] font-semibold text-slate-700 dark:text-zinc-300 transition hover:border-slate-350 hover:bg-white/60 dark:hover:bg-white/[0.03] backdrop-blur-xl"
            >
              <RefreshCcw size={16} />
              Rifresko
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-rose-600">
            <p className="text-[14px] font-medium">{error}</p>
          </div>
        ) : (
          <>
            {/* Top metrics grid */}
            <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[2rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">Balanca Totale</p>
                    <h3 className="mt-2 text-[26px] font-bold text-indigo-600 dark:text-indigo-400 tracking-tight font-mono">
                      {currency.format(data.balance)}
                    </h3>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400">
                    <Wallet size={18} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-[2rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">Hyrje Sot</p>
                    <h3 className="mt-2 text-[26px] font-bold text-slate-900 dark:text-zinc-100 tracking-tight font-mono">
                      {currency.format(data.todayIn)}
                    </h3>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-500">
                    <ArrowDownLeft size={18} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-[2rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">Dalje Sot</p>
                    <h3 className="mt-2 text-[26px] font-bold text-slate-900 dark:text-zinc-100 tracking-tight font-mono">
                      {currency.format(data.todayOut)}
                    </h3>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-500">
                    <ArrowUpRight size={18} />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-[2rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">Totali Hyrjeve</p>
                    <h3 className="mt-2 text-[26px] font-bold text-slate-900 dark:text-zinc-100 tracking-tight font-mono">
                      {currency.format(data.totalIn)}
                    </h3>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.03] text-slate-500 dark:text-zinc-405">
                    <ArrowDownLeft size={18} />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Ledger table card */}
            <div className="overflow-hidden rounded-[2.5rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] shadow-sm backdrop-blur-xl">
              <div className="border-b border-slate-200/40 dark:border-transparent px-6 py-5 bg-white/60 dark:bg-white/[0.02]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Regjistri i Arkës</p>
                <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Lëvizjet e fundit</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px] text-slate-700 dark:text-zinc-300">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.02]">
                      <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Data & Ora</th>
                      <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Përshkrimi</th>
                      <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Fatura</th>
                      <th className="px-6 py-4 font-semibold text-green-600 text-[12px] uppercase tracking-wider">Hyrje (+)</th>
                      <th className="px-6 py-4 font-semibold text-rose-600 text-[12px] uppercase tracking-wider">Dalje (-)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40 dark:divide-transparent">
                    {data.entries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 dark:text-zinc-500">
                          {loading ? 'Duke ngarkuar...' : 'Nuk ka lëvizje në arkë.'}
                        </td>
                      </tr>
                    ) : (
                      data.entries.map((entry) => (
                        <tr key={entry.id} className="transition-colors hover:bg-white/60 dark:hover:bg-white/[0.03]">
                          <td className="px-6 py-4 text-slate-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                            {new Date(entry.data).toLocaleString('sq-AL', { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-zinc-100">
                            {entry.pershkrimi}
                          </td>
                          <td className="px-6 py-4">
                            {entry.numri_fatures ? (
                              entry.numri_fatures.startsWith('BLR') ? (
                                <Link to="/libri-blerjes" className="font-mono font-semibold text-amber-600 dark:text-amber-400 hover:underline">
                                  {entry.numri_fatures}
                                </Link>
                              ) : (
                                <Link to={`/fature/${entry.invoice_secure_code || entry.invoice_id}`} className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                                  {entry.numri_fatures}
                                </Link>
                              )
                            ) : (
                              <span className="text-slate-400 dark:text-zinc-500">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold tabular-nums">
                            {entry.debit > 0 ? (
                              <span className="text-green-600">+{currency.format(entry.debit)}</span>
                            ) : (
                              <span className="text-slate-400 dark:text-zinc-500">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold tabular-nums">
                            {entry.kredit > 0 ? (
                              <span className="text-rose-600">-{currency.format(entry.kredit)}</span>
                            ) : (
                              <span className="text-slate-400 dark:text-zinc-500">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {isPayModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPayModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-md rounded-[2rem] border border-slate-200/60 dark:border-zinc-800 bg-[#f0f0f2] dark:bg-zinc-900 shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900">
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                    Paguaj Tatimin
                  </h3>
                  <p className="text-[12px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    Regjistro pagesën e TVSH-së ose detyrimeve tjera tatimore.
                  </p>
                </div>
                <button
                  onClick={() => setIsPayModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal body */}
              <form onSubmit={handlePayTax} className="px-6 py-5 space-y-4">
                {formError && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-[12px] text-rose-600 dark:text-rose-400 font-medium">
                    {formError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                    Vlera e Pagesës (€) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-slate-400 dark:text-zinc-500">
                      €
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full rounded-2xl border border-slate-200/60 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800 py-3 pl-9 pr-4 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-zinc-400/40 focus:bg-white dark:focus:bg-zinc-750"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                    Përshkrimi
                  </label>
                  <input
                    type="text"
                    value={pershkrimi}
                    onChange={(e) => setPershkrimi(e.target.value)}
                    placeholder="P.sh. Pagesa e TVSH-së Q1"
                    className="w-full rounded-2xl border border-slate-200/60 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800 py-3 px-4 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-zinc-400/40 focus:bg-white dark:focus:bg-zinc-750"
                  />
                </div>

                {/* Modal footer */}
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsPayModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl border border-slate-200/60 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800 text-[13px] font-semibold text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition"
                  >
                    Anulo
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[13px] hover:bg-slate-800 dark:hover:bg-zinc-200 transition shadow-sm disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      'Regjistro'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ArkaPage;
