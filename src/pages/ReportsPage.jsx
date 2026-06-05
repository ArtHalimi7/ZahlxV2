import { motion } from 'framer-motion';
import { ChartColumnIncreasing, Package, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const currency = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
});

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/90 dark:bg-zinc-900/90 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
        <p className="text-[13px] text-slate-500 dark:text-zinc-400 mb-1">{label}</p>
        <p className="text-[16px] font-bold text-emerald-600 tabular-nums">
          {currency.format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

const ReportsPage = () => {
  const [reportData, setReportData] = useState({ chartData: [], topProducts: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch('/api/reports');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Gabim gjatë leximit të raporteve');
        
        setReportData({
          chartData: Array.isArray(data.chartData) ? data.chartData : [],
          topProducts: Array.isArray(data.topProducts) ? data.topProducts : [],
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const totalRevenue30Days = reportData.chartData.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.1),transparent_50%),linear-gradient(180deg,rgba(0,0,0,0.01),transparent_20%)]" />
      <div className="relative mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-600/90">Analitika</p>
          <h1 className="mt-3 flex items-center gap-3 text-[2rem] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-[2.8rem]">
            Raportet
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-slate-500 dark:text-zinc-400">
            Analiza vizuale e të dhënave financiare. Ndiq trendet e shitjeve dhe zbulo produktet më të suksesshme.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-rose-600">
            <p className="text-[14px] font-medium">{error}</p>
          </div>
        ) : loading ? (
          <div className="flex h-[400px] items-center justify-center rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02]">
            <p className="text-[14px] text-slate-400 dark:text-zinc-500 animate-pulse">Duke gjeneruar raportet...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-8"
            >
              <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-[18px] font-semibold text-slate-900 dark:text-zinc-100">
                    <TrendingUp size={20} className="text-emerald-600" />
                    Të ardhurat (30 Ditët e Fundit)
                  </h2>
                  <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400">Trendi i shitjeve të realizuara çdo ditë.</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[11px] uppercase tracking-widest text-slate-400 dark:text-zinc-500">Totali i periudhës</p>
                  <p className="text-[28px] font-bold text-emerald-600 tabular-nums">
                    {currency.format(totalRevenue30Days)}
                  </p>
                </div>
              </div>

              <div className="h-[350px] w-full">
                {reportData.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={reportData.chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="rgba(0,0,0,0.1)" 
                        tick={{ fill: 'rgba(0,0,0,0.3)', fontSize: 12 }} 
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="rgba(0,0,0,0.1)" 
                        tick={{ fill: 'rgba(0,0,0,0.3)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}€`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200/60 dark:border-white/[0.06]">
                    <p className="text-[13px] text-slate-400 dark:text-zinc-500">Nuk ka të dhëna shitjesh për 30 ditët e fundit.</p>
                  </div>
                )}
              </div>
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-2">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-600">
                    <ChartColumnIncreasing size={18} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-slate-900 dark:text-zinc-100">Top 5 Produktet</h2>
                    <p className="text-[13px] text-slate-500 dark:text-zinc-400">Më të shiturat sipas sasisë</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {reportData.topProducts.length === 0 ? (
                    <p className="text-[13px] text-slate-400 dark:text-zinc-500 text-center py-4">Nuk ka të dhëna</p>
                  ) : (
                    reportData.topProducts.map((p, index) => (
                      <div key={p.id} className="flex items-center justify-between rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-6 w-6 place-items-center rounded-full bg-white/60 dark:bg-white/[0.03] text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-[14px] font-medium text-slate-900 dark:text-zinc-100">{p.emri}</p>
                            <p className="text-[12px] text-slate-400 dark:text-zinc-500">{p.total_sold} njësi të shitura</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[15px] font-semibold text-emerald-600 tabular-nums">
                            {currency.format(p.revenue)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl sm:p-8"
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/15 dark:text-emerald-400">
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <h2 className="text-[16px] font-semibold text-slate-900 dark:text-zinc-100">Pasqyrë Financiare</h2>
                    <p className="text-[13px] text-slate-500 dark:text-zinc-400">Fitimi, krahasimi mujor, vlera e stokut</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Fitimi Bruto</p>
                    <p className="mt-2 text-[24px] font-bold tracking-tight text-emerald-600 tabular-nums">
                      {currency.format(reportData.profitMargin?.profit || 0)}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">
                      Të ardhura: {currency.format(reportData.profitMargin?.revenue || 0)} — Kosto: {currency.format(reportData.profitMargin?.cost || 0)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Krahasimi Mujor</p>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">
                          {currency.format(reportData.monthlyComparison?.thisMonth || 0)}
                        </p>
                        <p className="text-[12px] text-slate-500 dark:text-zinc-400">Ky muaj</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[16px] font-semibold text-slate-500 dark:text-zinc-400 tabular-nums">
                          {currency.format(reportData.monthlyComparison?.lastMonth || 0)}
                        </p>
                        <p className="text-[12px] text-slate-500 dark:text-zinc-400">Muaji kaluar</p>
                      </div>
                      {reportData.monthlyComparison?.changePercent !== 0 && (
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          reportData.monthlyComparison?.changePercent > 0
                            ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                            : 'border border-rose-500/20 bg-rose-500/10 text-rose-600'
                        }`}>
                          {reportData.monthlyComparison?.changePercent > 0 ? '+' : ''}{reportData.monthlyComparison?.changePercent}%
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Vlera e Stokut</p>
                    <p className="mt-2 text-[20px] font-bold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">
                      {currency.format(reportData.inventoryValue?.atSalePrice || 0)}
                    </p>
                    <p className="mt-1 text-[12px] text-slate-500 dark:text-zinc-400">
                      Me çmim kostoje: {currency.format(reportData.inventoryValue?.atCostPrice || 0)}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
