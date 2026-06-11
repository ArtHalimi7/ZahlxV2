import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, RefreshCcw, Wallet, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const currency = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const ArkaPage = () => {
  const [data, setData] = useState({ balance: 0, totalIn: 0, totalOut: 0, todayIn: 0, todayOut: 0, entries: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          <button
            onClick={fetchArka}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[13px] font-semibold text-slate-700 dark:text-zinc-300 transition hover:border-slate-350 hover:bg-white/60 dark:hover:bg-white/[0.03] backdrop-blur-xl"
          >
            <RefreshCcw size={16} />
            Rifresko
          </button>
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
                className="rounded-[2rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
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
                className="rounded-[2rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
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
                className="rounded-[2rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
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
                className="rounded-[2rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">Totali Hyrjeve</p>
                    <h3 className="mt-2 text-[26px] font-bold text-slate-900 dark:text-zinc-100 tracking-tight font-mono">
                      {currency.format(data.totalIn)}
                    </h3>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.03] text-slate-500 dark:text-zinc-405">
                    <ArrowDownLeft size={18} />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Ledger table card */}
            <div className="overflow-hidden rounded-[2.5rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] shadow-sm backdrop-blur-xl">
              <div className="border-b border-slate-200/40 dark:border-white/[0.04] px-6 py-5 bg-white/60 dark:bg-white/[0.02]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Regjistri i Arkës</p>
                <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Lëvizjet e fundit</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px] text-slate-700 dark:text-zinc-300">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02]">
                      <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Data & Ora</th>
                      <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Përshkrimi</th>
                      <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Fatura</th>
                      <th className="px-6 py-4 font-semibold text-green-600 text-[12px] uppercase tracking-wider">Hyrje (+)</th>
                      <th className="px-6 py-4 font-semibold text-rose-600 text-[12px] uppercase tracking-wider">Dalje (-)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40 dark:divide-white/[0.04]">
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
                              <Link to={`/fature/${entry.invoice_id}`} className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                                {entry.numri_fatures}
                              </Link>
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
    </div>
  );
};

export default ArkaPage;
