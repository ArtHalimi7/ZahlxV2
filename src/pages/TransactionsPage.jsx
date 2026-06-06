import { motion } from 'framer-motion';
import { CheckCircle2, CircleDashed, Filter, RefreshCcw, Search, XCircle, AlertTriangle } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

const currency = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const STATUS_COLORS = {
  paguar: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/15 dark:text-emerald-400',
  ne_pritje: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/15 dark:text-amber-400',
  vonese: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:border-rose-500/15 dark:text-rose-400',
  anuluar: 'border-zinc-500/20 bg-zinc-500/10 text-slate-500 dark:border-zinc-500/15 dark:text-zinc-400',
};

const STATUS_LABELS = {
  paguar: 'Paguar',
  ne_pritje: 'Në Pritje',
  vonese: 'Vonesë',
  anuluar: 'Anuluar',
};

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('te_gjitha'); // te_gjitha, paguar, ne_pritje, anuluar
  const [updatingId, setUpdatingId] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/transactions?limit=100');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Gabim gjatë leximit të transaksioneve');
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/invoices/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusi: newStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Nuk u përditësua statusi');
      
      setTransactions((current) =>
        current.map((t) => (t.id === id ? { ...t, statusi: newStatus } : t))
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = 
        t.numri_fatures.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.klienti.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'te_gjitha' || t.statusi === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchQuery, statusFilter]);

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_25%),linear-gradient(180deg,rgba(0,0,0,0.01),transparent_15%)]" />
      <div className="relative mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-600/90">Regjistri i Shitjeve</p>
            <h1 className="mt-3 flex items-center gap-3 text-[2rem] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-[2.8rem]">
              Libri i Shitjes
              {loading && <RefreshCcw size={20} className="animate-spin text-slate-400 dark:text-zinc-500" />}
            </h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-slate-500 dark:text-zinc-400">
              Pasqyrë kronologjike e çdo shitjeje. Kliko numrin e faturës për të parë detajet.
            </p>
          </div>
          <button
            onClick={fetchTransactions}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[13px] font-medium text-slate-700 dark:text-zinc-300 transition hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-slate-900 dark:text-zinc-100"
          >
            <RefreshCcw size={16} />
            Rifresko
          </button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Gjithsej Fatura</p>
            <p className="mt-2 text-[22px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">{transactions.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Totali i Të Ardhurave</p>
            <p className="mt-2 text-[22px] font-semibold tracking-tight text-emerald-600 tabular-nums">{currency.format(transactions.reduce((s, t) => t.statusi === 'paguar' ? s + Number(t.totali) : s, 0))}</p>
          </div>
          <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Në Pritje</p>
            <p className="mt-2 text-[22px] font-semibold tracking-tight text-amber-600 tabular-nums">{transactions.filter(t => t.statusi === 'ne_pritje').length}</p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Kërko me numër fature ose emër klienti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] py-3.5 pl-11 pr-4 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/60 dark:bg-white/[0.03]"
            />
          </div>
          
          <div className="relative">
            <Filter size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-full min-w-[160px] appearance-none rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] py-3.5 pl-11 pr-10 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/60 dark:bg-white/[0.03]"
            >
              <option value="te_gjitha">Të Gjitha</option>
              <option value="paguar">Paguar</option>
              <option value="ne_pritje">Në Pritje</option>
              <option value="vonese">Vonesë (Overdue)</option>
              <option value="anuluar">Anuluar</option>
            </select>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-rose-600">
            <p className="text-[14px] font-medium">{error}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px] text-slate-700 dark:text-zinc-300">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02]">
                    <th className="px-6 py-4 font-medium text-slate-500 dark:text-zinc-400">Numri Faturës</th>
                    <th className="px-6 py-4 font-medium text-slate-500 dark:text-zinc-400">Data & Ora</th>
                    <th className="px-6 py-4 font-medium text-slate-500 dark:text-zinc-400">Klienti</th>
                    <th className="px-6 py-4 font-medium text-slate-500 dark:text-zinc-400">Totali</th>
                    <th className="px-6 py-4 font-medium text-slate-500 dark:text-zinc-400">Statusi</th>
                    <th className="px-6 py-4 font-medium text-slate-500 dark:text-zinc-400">Veprime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-zinc-500">
                        {loading ? 'Duke ngarkuar të dhënat...' : 'Nuk u gjet asnjë transaksion.'}
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <motion.tr 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={t.id} 
                        className="transition-colors hover:bg-white/40 dark:bg-white/[0.02]"
                      >
                        <td className="px-6 py-4">
                          <Link to={`/fature/${t.id}`} className="font-mono text-slate-900 dark:text-zinc-100 hover:text-emerald-600 transition-colors">
                            {t.numri_fatures}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-zinc-400">
                          {new Date(t.data_krijimit).toLocaleString('sq-AL', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="px-6 py-4">
                          {t.klienti}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-zinc-100 tabular-nums">
                          {currency.format(t.totali)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${STATUS_COLORS[t.statusi] || 'border-zinc-500/20 bg-zinc-500/10 text-slate-500 dark:text-zinc-400'}`}>
                            {t.statusi === 'paguar' && <CheckCircle2 size={12} />}
                            {t.statusi === 'ne_pritje' && <CircleDashed size={12} />}
                            {t.statusi === 'vonese' && <AlertTriangle size={12} />}
                            {t.statusi === 'anuluar' && <XCircle size={12} />}
                            {STATUS_LABELS[t.statusi] || t.statusi}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {updatingId === t.id ? (
                              <span className="text-[12px] text-slate-400 dark:text-zinc-500">Duke përditësuar...</span>
                            ) : (
                              <select
                                value={t.statusi === 'vonese' ? 'ne_pritje' : t.statusi}
                                onChange={(e) => updateStatus(t.id, e.target.value)}
                                className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-2 py-1 text-[12px] text-slate-700 dark:text-zinc-300 outline-none transition focus:border-emerald-500/30"
                              >
                                <option value="paguar">Paguar</option>
                                <option value="ne_pritje">Në Pritje</option>
                                <option value="anuluar">Anuluar</option>
                              </select>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
