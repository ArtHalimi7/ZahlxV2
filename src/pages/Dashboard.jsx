import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import ShitjeEShpejte from '../components/ShitjeEShpejte';

/**
 * Dashboard Page — "Paneli"
 * 
 * The main view users see after opening the app.
 * 
 * Layout:
 *   - Page header with greeting + quick-sale CTA
 *   - 3 metric cards in a responsive grid
 *   - Recent transactions table
 * 
 * Data: fetches from /api/dashboard and /api/transactions.
 * Falls back to mock data when the backend isn't running,
 * so the UI is always presentable during development.
 */

// ── Format currency (Kosovo/DE locale for Euro) ──
const formatEuro = (amount) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
};

// ── Format date/time for the table ──
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('sq-AL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatTime = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('sq-AL', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ── Status badge styles ──
const statusMap = {
  paguar:    { label: 'Paguar',    cls: 'badge-success' },
  ne_pritje: { label: 'Në Pritje', cls: 'badge-pending' },
  anuluar:   { label: 'Anuluar',   cls: 'badge-error' },
};

// ── Mock data fallback when API is unavailable ──
const MOCK_METRICS = {
  fitimi_total: 12450.00,
  shitjet_sot_nr: 8,
  shitjet_sot_vlera: 342.60,
  total_produkte: 47,
  stoku_total: 1240,
  stoku_ulet: 3,
};

const MOCK_TRANSACTIONS = [
  { id: 1, numri_fatures: 'FAT-20260605-0001', klienti: 'Arben Krasniqi',            data_krijimit: '2026-06-05T10:30:00Z', totali: 45.60,  statusi: 'paguar' },
  { id: 2, numri_fatures: 'FAT-20260605-0002', klienti: 'Drita Berisha',              data_krijimit: '2026-06-05T11:15:00Z', totali: 128.00, statusi: 'paguar' },
  { id: 3, numri_fatures: 'FAT-20260604-0003', klienti: 'Klient i përgjithshëm',      data_krijimit: '2026-06-04T15:45:00Z', totali: 23.40,  statusi: 'paguar' },
  { id: 4, numri_fatures: 'FAT-20260604-0004', klienti: 'Fitim Gashi',                data_krijimit: '2026-06-04T09:20:00Z', totali: 67.50,  statusi: 'ne_pritje' },
  { id: 5, numri_fatures: 'FAT-20260603-0005', klienti: 'Vlora Hoxha',                data_krijimit: '2026-06-03T14:00:00Z', totali: 210.00, statusi: 'paguar' },
];

const Dashboard = () => {
  const [metrics, setMetrics] = useState(MOCK_METRICS);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [saleModalOpen, setSaleModalOpen] = useState(false);

  // ── Fetch data from the API ──
  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, txRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/transactions?limit=8'),
      ]);

      if (metricsRes.ok) {
        const m = await metricsRes.json();
        setMetrics(m);
      }

      if (txRes.ok) {
        const t = await txRes.json();
        if (t.length > 0) setTransactions(t);
      }
    } catch {
      // Silently fall back to mock data — the UI stays usable
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh data after a sale completes
  const handleSaleComplete = () => {
    fetchData();
  };

  // ── Greeting based on time of day ──
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Mirëmëngjes' : hour < 18 ? 'Mirëdita' : 'Mirëmbrëma';

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-100 tracking-tight">
            {greeting} 👋
          </h1>
          <p className="text-[13px] sm:text-[14px] text-zinc-500 mt-1">
            Ja ku qëndron biznesi yt sot.
          </p>
        </div>

        <button
          onClick={() => setSaleModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-[13px] sm:text-[14px] font-semibold text-white hover:bg-emerald-500 active:bg-emerald-700 transition-colors shrink-0"
          id="quick-sale-button"
        >
          <Plus size={16} strokeWidth={2.5} />
          Shitje e Shpejtë
        </button>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8 stagger-children">
        <MetricCard
          label="Fitimi Total"
          value={formatEuro(metrics.fitimi_total)}
          detail="Nga të gjitha shitjet"
        />
        <MetricCard
          label="Shitjet Sot"
          value={formatEuro(metrics.shitjet_sot_vlera)}
          detail={`${metrics.shitjet_sot_nr} fatura`}
        />
        <MetricCard
          label="Produktet në Stok"
          value={metrics.total_produkte}
          detail={
            metrics.stoku_ulet > 0
              ? `${metrics.stoku_ulet} me stok të ulët`
              : 'Stoku në rregull'
          }
        />
      </div>

      {/* ── Transactions table ── */}
      <div className="glass overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-[14px] sm:text-[15px] font-semibold text-zinc-200">
            Transaksionet e Fundit
          </h2>
        </div>

        {/* Desktop table view */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="px-6 py-3 text-left text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
                  Fatura
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
                  Klienti
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-right text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
                  Totali
                </th>
                <th className="px-6 py-3 text-right text-[11px] font-medium text-zinc-600 uppercase tracking-wider">
                  Statusi
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => {
                const status = statusMap[tx.statusi] || statusMap.paguar;
                return (
                  <tr
                    key={tx.id}
                    className="border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] transition-colors"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <td className="px-6 py-3.5">
                      <span className="text-[13px] font-mono text-zinc-400">
                        {tx.numri_fatures}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-[13px] text-zinc-300">
                        {tx.klienti}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div>
                        <span className="text-[13px] text-zinc-400">
                          {formatDate(tx.data_krijimit)}
                        </span>
                        <span className="text-[11px] text-zinc-600 ml-2">
                          {formatTime(tx.data_krijimit)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="text-[13px] font-semibold text-zinc-200 tabular-nums">
                        {formatEuro(tx.totali)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className={`badge ${status.cls}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile list view — stacked cards instead of a cramped table */}
        <div className="sm:hidden divide-y divide-white/[0.04]">
          {transactions.map((tx) => {
            const status = statusMap[tx.statusi] || statusMap.paguar;
            return (
              <div key={tx.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-zinc-200 truncate">
                      {tx.klienti}
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-0.5 font-mono">
                      {tx.numri_fatures}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-semibold text-zinc-200 tabular-nums">
                      {formatEuro(tx.totali)}
                    </p>
                    <span className={`badge ${status.cls} mt-1`}>
                      {status.label}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-600 mt-1.5">
                  {formatDate(tx.data_krijimit)} · {formatTime(tx.data_krijimit)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick-sale modal */}
      <ShitjeEShpejte
        isOpen={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        onSaleComplete={handleSaleComplete}
      />
    </div>
  );
};

export default Dashboard;
