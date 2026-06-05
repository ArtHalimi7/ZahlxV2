import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, RefreshCcw, Wallet } from 'lucide-react';
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.01),transparent_18%)]" />
      <div className="relative mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-600/90">Qarkullimi Ditor</p>
            <h1 className="mt-3 flex items-center gap-3 text-[2rem] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-[2.8rem]">
              Arka
              {loading && <RefreshCcw size={20} className="animate-spin text-slate-400 dark:text-zinc-500" />}
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-slate-500 dark:text-zinc-400">
              Gjendja aktuale e arkës, paratë që kanë hyrë dhe dalë, dhe historiku i plotë i lëvizjeve.
            </p>
          </div>
          <button
            onClick={fetchArka}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[13px] font-medium text-slate-700 dark:text-zinc-300 transition hover:border-slate-300 dark:hover:border-white/[0.12] hover:text-slate-900 dark:hover:text-zinc-100"
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
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/15 dark:text-emerald-400">
                    <Wallet size={18} />
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Balanca Totale</p>
                </div>
                <p className="text-[28px] font-bold tracking-tight text-emerald-600 tabular-nums">
                  {currency.format(data.balance)}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/15 dark:text-emerald-400">
                    <ArrowDownLeft size={18} />
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Hyrje Sot</p>
                </div>
                <p className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">
                  {currency.format(data.todayIn)}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:border-rose-500/15 dark:text-rose-400">
                    <ArrowUpRight size={18} />
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Dalje Sot</p>
                </div>
                <p className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">
                  {currency.format(data.todayOut)}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] text-slate-500 dark:text-zinc-400">
                    <ArrowDownLeft size={18} />
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Totali Hyrjeve</p>
                </div>
                <p className="text-[22px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">
                  {currency.format(data.totalIn)}
                </p>
              </motion.div>
            </div>

            <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="border-b border-slate-200/60 dark:border-white/[0.06] px-6 py-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Regjistri i Arkës</p>
                <h2 className="mt-1 text-[15px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Lëvizjet e fundit</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px] text-slate-700 dark:text-zinc-300">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02]">
                      <th className="px-6 py-4 font-medium text-slate-500 dark:text-zinc-400">Data & Ora</th>
                      <th className="px-6 py-4 font-medium text-slate-500 dark:text-zinc-400">Përshkrimi</th>
                      <th className="px-6 py-4 font-medium text-slate-500 dark:text-zinc-400">Fatura</th>
                      <th className="px-6 py-4 font-medium text-emerald-600">Hyrje (Debit)</th>
                      <th className="px-6 py-4 font-medium text-rose-600">Dalje (Kredit)</th>
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
                        <tr key={entry.id} className="transition-colors hover:bg-white/40 dark:hover:bg-white/[0.02]">
                          <td className="px-6 py-4 text-slate-500 dark:text-zinc-400 whitespace-nowrap">
                            {new Date(entry.data).toLocaleString('sq-AL', { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                          <td className="px-6 py-4 text-slate-900 dark:text-zinc-100">
                            {entry.pershkrimi}
                          </td>
                          <td className="px-6 py-4">
                            {entry.numri_fatures ? (
                              <Link to={`/fature/${entry.invoice_id}`} className="font-mono text-emerald-600 hover:underline">
                                {entry.numri_fatures}
                              </Link>
                            ) : (
                              <span className="text-slate-400 dark:text-zinc-500">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 tabular-nums">
                            {entry.debit > 0 ? (
                              <span className="font-medium text-emerald-600">+{currency.format(entry.debit)}</span>
                            ) : (
                              <span className="text-slate-400 dark:text-zinc-500">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 tabular-nums">
                            {entry.kredit > 0 ? (
                              <span className="font-medium text-rose-600">-{currency.format(entry.kredit)}</span>
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
