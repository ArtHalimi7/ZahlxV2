import { useCallback, useEffect, useMemo, useState } from 'react';
import { Boxes, Clock3, Flame, Lightbulb, Plus, ReceiptText, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import MetricCard from '../components/MetricCard';
import ShitjeEShpejte from '../components/ShitjeEShpejte';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import DashboardTransactions from '../components/dashboard/DashboardTransactions';

const euroFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('sq-AL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('sq-AL', {
  hour: '2-digit',
  minute: '2-digit',
});

const statusMap = {
  paguar: { label: 'Paguar', cls: 'border-emerald-500/15 bg-emerald-500/10 text-emerald-400' },
  ne_pritje: { label: 'Në Pritje', cls: 'border-amber-500/15 bg-amber-500/10 text-amber-300' },
  anuluar: { label: 'Anuluar', cls: 'border-rose-500/15 bg-rose-500/10 text-rose-300' },
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    fitimi_total: 0,
    shitjet_sot_nr: 0,
    shitjet_sot_vlera: 0,
    total_produkte: 0,
    stoku_total: 0,
    stoku_ulet: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [saleDrawerOpen, setSaleDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async ({ initial = false } = {}) => {
    if (initial) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const [metricsRes, txRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/transactions?limit=8'),
      ]);

      if (metricsRes.ok) {
        const m = await metricsRes.json();
        setMetrics(m);
      } else {
        setMetrics({
          fitimi_total: 0,
          shitjet_sot_nr: 0,
          shitjet_sot_vlera: 0,
          total_produkte: 0,
          stoku_total: 0,
          stoku_ulet: 0,
        });
      }

      if (txRes.ok) {
        const t = await txRes.json();
        setTransactions(Array.isArray(t) ? t : []);
      } else {
        setTransactions([]);
      }
    } catch {
      setTransactions([]);
    } finally {
      if (initial) {
        setIsLoading(false);
      }
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData({ initial: true });
  }, [fetchData]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Mirëmëngjes';
    if (hour < 18) return 'Mirëdita';
    return 'Mirëmbrëma';
  }, []);

  const preparedTransactions = useMemo(() => (
    transactions.map((transaction) => {
      const parsedDate = new Date(transaction.data_krijimit);
      return {
        ...transaction,
        formattedTotal: euroFormatter.format(transaction.totali),
        dateLabel: dateFormatter.format(parsedDate),
        timeLabel: timeFormatter.format(parsedDate),
        statusMeta: statusMap[transaction.statusi] || statusMap.paguar,
      };
    })
  ), [transactions]);

  const metricCards = useMemo(() => ([
    {
      label: 'Fitimi Total',
      value: euroFormatter.format(metrics.fitimi_total),
      detail: 'Nga të gjitha shitjet e konfirmuara',
      icon: TrendingUp,
      tone: 'emerald',
      delta: isRefreshing ? 'Duke rifreskuar' : 'Stabil',
    },
    {
      label: 'Shitjet Sot',
      value: euroFormatter.format(metrics.shitjet_sot_vlera),
      detail: `${metrics.shitjet_sot_nr} fatura të lëshuara sot`,
      icon: ReceiptText,
      tone: 'zinc',
      delta: `${metrics.shitjet_sot_nr} transaksione`,
    },
    {
      label: 'Produktet në Stok',
      value: metrics.total_produkte,
      detail: metrics.stoku_ulet > 0 ? `${metrics.stoku_ulet} produkte me stok të ulët` : 'Stoku është i shëndetshëm',
      icon: Boxes,
      tone: 'zinc',
      delta: metrics.stoku_ulet > 0 ? 'Kërkon vëmendje' : 'Normal',
    },
  ]), [isRefreshing, metrics.fitimi_total, metrics.shitjet_sot_nr, metrics.shitjet_sot_vlera, metrics.stoku_ulet, metrics.total_produkte]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%)]" />
      <div className="relative w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto grid w-full max-w-[1600px] gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
          <div className="min-w-0">
            <div className="mb-8 grid gap-4">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden rounded-[2rem] border border-white/[0.06] bg-white/[0.035] px-5 py-6 text-center shadow-[0_22px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-8 sm:py-8"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.15),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.08),transparent_28%)]" />
            <div className="relative mx-auto max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-zinc-950/40 px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-zinc-500">
                <Sparkles size={12} className="text-emerald-400" />
                Përmbledhje operative e ditës
              </div>
              <h1 className="mt-5 text-[2.1rem] font-semibold tracking-tight text-zinc-100 sm:text-[3rem]">
                {greeting},
                <span className="block text-zinc-300">panoramë e qartë e biznesit.</span>
              </h1>
              <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-7 text-zinc-400">
                Ky panel është menduar të ndihet si një workspace i qetë dhe i kontrolluar, ku fitimi, shitjet dhe stoku lexohen pa zhurmë vizuale.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">Live</span>
                <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[11px] text-zinc-400">Qartësi financiare</span>
                <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[11px] text-zinc-400">Shitje të shpejta</span>
              </div>
            </div>
          </motion.section>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.75rem] border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-300">
                  <Lightbulb size={18} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Shënimi i ditës</p>
                  <p className="mt-2 text-[14px] leading-7 text-zinc-300">
                    Mbaj ritmin te shitjet e shpejta, pastaj shiko stokun me prioritet te artikujt më të nxehtë. Një panel i mirë nuk të ngarkon, të orienton.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Ritmi i sotëm</p>
                  <p className="mt-2 text-[15px] font-semibold tracking-tight text-zinc-100">Fokus: qartësi dhe shpejtësi</p>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/[0.06] bg-white/[0.03] text-zinc-400">
                  <Clock3 size={16} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">Në pritje</p>
                  <p className="mt-2 text-[15px] font-semibold tracking-tight text-zinc-100">{transactions.filter((transaction) => transaction.statusi === 'ne_pritje').length}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">Paguar</p>
                  <p className="mt-2 text-[15px] font-semibold tracking-tight text-zinc-100">{transactions.filter((transaction) => transaction.statusi === 'paguar').length}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">Total</p>
                  <p className="mt-2 text-[15px] font-semibold tracking-tight text-zinc-100">{transactions.length}</p>
                </div>
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSaleDrawerOpen(true)}
            className="mx-auto inline-flex items-center justify-center gap-3 rounded-full border border-emerald-500/20 bg-emerald-500/12 px-5 py-4 text-[14px] font-semibold text-emerald-300 shadow-[0_24px_70px_rgba(16,185,129,0.18)] backdrop-blur-xl transition hover:border-emerald-500/30 hover:bg-emerald-500/16"
            id="quick-sale-button"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-zinc-950 shadow-[0_0_24px_rgba(16,185,129,0.42)]">
              <Plus size={16} strokeWidth={2.8} />
            </span>
            Shitje e Shpejtë
          </motion.button>
            </div>

            <div className="mb-8 grid gap-4 lg:grid-cols-3">
              {metricCards.map((card) => (
                <MetricCard key={card.label} {...card} />
              ))}
            </div>

            <DashboardTransactions transactions={preparedTransactions} />
          </div>

          <aside className="grid gap-4 xl:sticky xl:top-8">
            <div className="rounded-[1.75rem] border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Pulse i sotëm</p>
                  <h3 className="mt-2 text-[15px] font-semibold tracking-tight text-zinc-100">Çfarë po lëviz tani</h3>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-300">
                  <Flame size={16} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-600">Shitjet në pritje</p>
                  <p className="mt-2 text-[24px] font-semibold tracking-tight text-zinc-100 tabular-nums">
                    {transactions.filter((transaction) => transaction.statusi === 'ne_pritje').length}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-600">Pagesat e konfirmuara</p>
                  <p className="mt-2 text-[24px] font-semibold tracking-tight text-zinc-100 tabular-nums">
                    {transactions.filter((transaction) => transaction.statusi === 'paguar').length}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-600">Produktet me vëmendje</p>
                  <p className="mt-2 text-[24px] font-semibold tracking-tight text-zinc-100 tabular-nums">{metrics.stoku_ulet}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-300">
                  <Lightbulb size={16} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Fokus i shpejtë</p>
                  <p className="mt-2 text-[13px] leading-6 text-zinc-300">
                    Mbaj vëmendjen te artikujt me stok të ulët. Ky panel i vogël është aty për të të mbajtur të orientuar, jo për të të zënë hapësirë.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ShitjeEShpejte
        isOpen={saleDrawerOpen}
        onClose={() => setSaleDrawerOpen(false)}
        onSaleComplete={() => fetchData({ initial: false })}
      />
    </div>
  );
};

export default Dashboard;
