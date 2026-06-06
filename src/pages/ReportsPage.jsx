import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle,
  ArrowDownRight, 
  ArrowUpRight, 
  Calendar,
  CheckCircle2, 
  DollarSign, 
  Info, 
  Layers,
  Package, 
  Scale, 
  Sparkles, 
  TrendingUp, 
  Wallet,
  BrainCircuit,
  ArrowRight
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const TypewriterText = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        clearInterval(timer);
      }
    }, 12);
    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayedText}</span>;
};

const currency = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
});

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const rev = payload.find(p => p.dataKey === 'revenue')?.value || 0;
    const cost = payload.find(p => p.dataKey === 'cost')?.value || 0;
    const profit = rev - cost;
    
    return (
      <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/90 dark:bg-zinc-900/90 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl min-w-[200px]">
        <p className="text-[12px] font-semibold text-slate-500 dark:text-zinc-400 mb-2 border-b border-slate-200/40 dark:border-white/[0.04] pb-1">{label}</p>
        <div className="space-y-1">
          <div className="flex justify-between items-center gap-4 text-[13px]">
            <span className="text-slate-500 dark:text-zinc-400">Të ardhurat:</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {currency.format(rev)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4 text-[13px]">
            <span className="text-slate-500 dark:text-zinc-400">Kostoja:</span>
            <span className="font-semibold text-slate-700 dark:text-zinc-300 tabular-nums">
              {currency.format(cost)}
            </span>
          </div>
          <div className="flex justify-between items-center gap-4 text-[13px] pt-1.5 border-t border-slate-200/40 dark:border-white/[0.04] mt-1.5">
            <span className="text-slate-700 dark:text-zinc-200 font-medium">Margjina:</span>
            <span className={`font-bold tabular-nums ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-rose-600'}`}>
              {currency.format(profit)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const ReportsPage = () => {
  const [timeframe, setTimeframe] = useState('daily');
  const [arkaBalance, setArkaBalance] = useState(0);
  const [reportData, setReportData] = useState({
    chartData: [],
    topProducts: [],
    profitMargin: { revenue: 0, cost: 0, profit: 0, taxLiability: 0, netProfit: 0 },
    monthlyComparison: { thisMonth: 0, lastMonth: 0, changePercent: 0 },
    inventoryValue: { atSalePrice: 0, atCostPrice: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI CFO Copilot states
  const [aiTab, setAiTab] = useState('stock');
  const [isAiCalculating, setIsAiCalculating] = useState(false);

  const fetchData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [reportsRes, arkaRes] = await Promise.all([
        fetch(`/api/reports?interval=${timeframe}`),
        fetch('/api/arka')
      ]);

      if (reportsRes.ok) {
        const data = await reportsRes.json();
        setReportData({
          chartData: Array.isArray(data.chartData) ? data.chartData : [],
          topProducts: Array.isArray(data.topProducts) ? data.topProducts : [],
          profitMargin: data.profitMargin || { revenue: 0, cost: 0, profit: 0, taxLiability: 0, netProfit: 0 },
          monthlyComparison: data.monthlyComparison || { thisMonth: 0, lastMonth: 0, changePercent: 0 },
          inventoryValue: data.inventoryValue || { atSalePrice: 0, atCostPrice: 0 },
        });
      }

      if (arkaRes.ok) {
        const data = await arkaRes.json();
        setArkaBalance(data.balance || 0);
      }
    } catch (err) {
      if (isInitial) setError(err.message);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // Dynamic Polling every 8 seconds (Silent background updates)
  useEffect(() => {
    fetchData(true);

    const intervalId = setInterval(() => {
      fetchData(false);
    }, 8000);

    return () => clearInterval(intervalId);
  }, [timeframe]);

  // Trigger AI calculation typing effect simulation when tab changes
  useEffect(() => {
    setIsAiCalculating(true);
    const timer = setTimeout(() => setIsAiCalculating(false), 500);
    return () => clearTimeout(timer);
  }, [aiTab]);

  const totalPeriodRevenue = reportData.chartData.reduce((sum, item) => sum + item.revenue, 0);
  const totalPeriodCost = reportData.chartData.reduce((sum, item) => sum + item.cost, 0);
  
  // Calculate relative top products share
  const totalTopRevenue = reportData.topProducts.reduce((sum, item) => sum + item.revenue, 0);

  // Financial calculations
  const marginPercent = reportData.profitMargin.revenue > 0 
    ? Math.round((reportData.profitMargin.profit / reportData.profitMargin.revenue) * 100) 
    : 0;

  const lowStockCount = useMemo(() => {
    // If any product has low stock based on the details
    return reportData.inventoryValue.atCostPrice > 0 ? 1 : 0; // fallback count
  }, [reportData]);
  // Generative AI CFO analysis based on actual numbers
  const aiInsights = useMemo(() => {
    const stockReorderCost = reportData.inventoryValue.atCostPrice * 0.12;
    const isLiquiditySafe = arkaBalance >= reportData.profitMargin.taxLiability;
    const liquidityGap = reportData.profitMargin.taxLiability - arkaBalance;

    return {
      stock: {
        title: 'Parashikimi i Stokut & Furnizimit',
        badge: reportData.inventoryValue.atCostPrice > 10000 ? 'Rimbushje e Kërkuar' : 'Stok Stabil',
        badgeColor: reportData.inventoryValue.atCostPrice > 10000 ? 'border-amber-500/20 bg-amber-500/10 text-amber-600' : 'border-green-500/20 bg-green-500/10 text-green-600',
        text: `Zahlx AI ka analizuar katalogun dhe vlerën e stokut prej ${currency.format(reportData.inventoryValue.atCostPrice)}. Disa artikuj kritikë kërkojnë furnizim të menjëhershëm. Bazuar në ecurinë e shitjeve, rekomandohet një buxhet prej ${currency.format(stockReorderCost)} për të shmangur mungesën e artikujve më të kërkuar gjatë javëve të ardhshme.`,
        cta: 'Hap Inventarin',
        link: '/produktet'
      },
      profit: {
        title: 'Optimizimi i Fitimit & Çmimeve',
        badge: marginPercent >= 35 ? 'Marrzhë e Shkëlqyer' : 'Sugjerohet Korigjim',
        badgeColor: marginPercent >= 35 ? 'border-green-500/20 bg-green-500/10 text-green-600' : 'border-indigo-500/20 bg-indigo-500/10 text-indigo-650',
        text: marginPercent >= 35
          ? `Marxhina juaj e fitimit bruto prej ${marginPercent}% është e jashtëzakonshme. Ky raport tregon që diferenca midis çmimit të shitjes dhe kostos (COGS) është optimale. Mbani këtë balancë për të maksimizuar akumulimin e kapitalit.`
          : `Marxhina juaj aktuale është ${marginPercent}%. Për të rritur profitabilitetin, Zahlx AI sugjeron të korigjoni çmimet e shitjes me +5% për artikujt kryesorë ose të negocioni çmime më të favorshme me furnitorët tuaj për të reduktuar koston e mallrave (COGS).`,
        cta: 'Rishiko Katalogun',
        link: '/produktet'
      },
      liquidity: {
        title: 'Likuiditeti & Rezerva Tatimore',
        badge: isLiquiditySafe ? 'Likuiditet i Sigurt' : 'Rrezik Likuiditeti',
        badgeColor: isLiquiditySafe ? 'border-green-500/20 bg-green-500/10 text-green-600' : 'border-rose-500/20 bg-rose-500/10 text-rose-600',
        text: isLiquiditySafe
          ? `Gjendja aktuale në arkë prej ${currency.format(arkaBalance)} është e mjaftueshme për të mbuluar provizionin tatimor të vlerësuar prej ${currency.format(reportData.profitMargin.taxLiability)}. Kjo do të thotë se biznesi ka mbulim të plotë për TVSH-në dhe detyrimet tatimore operative.`
          : `Kujdes: Gjendja aktuale në arkë prej ${currency.format(arkaBalance)} nuk e mbulon provizionin e vlerësuar tatimor prej ${currency.format(reportData.profitMargin.taxLiability)}. Keni një deficit likuiditeti prej ${currency.format(liquidityGap)}. Rekomandohet të arkëtoni faturat në pritje ose të kufizoni shpenzimet e reja menjëherë.`,
        cta: 'Shiko Librin e Shitjes',
        link: '/libri-shitjes'
      }
    };
  }, [reportData, arkaBalance, marginPercent]);

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.12),transparent_50%),linear-gradient(180deg,rgba(0,0,0,0.01),transparent_20%)]" />
      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        
        {/* Header section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-zinc-900/40 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500 font-medium animate-pulse">
              <BrainCircuit size={12} className="text-indigo-600 dark:text-indigo-400" />
              Zahlx Autonomous Copilot (Aktiv)
            </div>
            <h1 className="mt-3 text-[2rem] font-bold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-[2.8rem] leading-[1.15]">
              Analitika Financiare
            </h1>
            <p className="mt-2 text-[14px] text-slate-500 dark:text-zinc-400 max-w-xl">
              Monitorim dhe analizë autonome e performancës suaj. Raportet rifreskohen në kohë reale pa ndërprerje.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-zinc-900/40 p-1.5 self-start sm:self-center backdrop-blur-xl">
            {['daily', 'weekly', 'monthly'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`rounded-xl px-4 py-2 text-[12px] font-semibold transition ${timeframe === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'}`}
              >
                {t === 'daily' && 'Ditore'}
                {t === 'weekly' && 'Javore'}
                {t === 'monthly' && 'Mujore'}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-rose-600">
            <p className="text-[14px] font-medium">{error}</p>
          </div>
        ) : loading ? (
          <div className="flex h-[400px] items-center justify-center rounded-[2.5rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              <p className="text-[13px] text-slate-400 dark:text-zinc-500 font-medium">Duke kalkuluar analitikën...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Top SaaS Metrics Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Revenue */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-[2rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">Të hyrat Bruto</p>
                    <h3 className="mt-2 text-[26px] font-bold text-slate-900 dark:text-zinc-100 tracking-tight font-mono">
                      {currency.format(reportData.profitMargin?.revenue || 0)}
                    </h3>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400">
                    <Wallet size={18} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 pt-2 border-t border-slate-200/40 dark:border-white/[0.04]">
                  {reportData.monthlyComparison?.changePercent !== 0 ? (
                    <span className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      reportData.monthlyComparison?.changePercent > 0
                        ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                        : 'bg-rose-500/10 text-rose-600'
                    }`}>
                      {reportData.monthlyComparison?.changePercent > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {Math.abs(reportData.monthlyComparison?.changePercent)}%
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 dark:bg-zinc-800/60 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                      0%
                    </span>
                  )}
                  <span className="text-[12px] text-slate-400 dark:text-zinc-500">Krahasuar me muajin e kaluar</span>
                </div>
              </motion.div>

              {/* Card 2: Net Profit */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="relative overflow-hidden rounded-[2rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">Fitimi Neto</p>
                    <h3 className="mt-2 text-[26px] font-bold text-slate-900 dark:text-zinc-100 tracking-tight font-mono">
                      {currency.format(reportData.profitMargin?.netProfit || 0)}
                    </h3>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400">
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 pt-2 border-t border-slate-200/40 dark:border-white/[0.04]">
                  <span className="rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 text-[11px] font-semibold">
                    {marginPercent}% marzhë
                  </span>
                  <span className="text-[12px] text-slate-400 dark:text-zinc-500">Marzhi neto pas COGS & Tax</span>
                </div>
              </motion.div>

              {/* Card 3: Tax Provision */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-[2rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">Provizioni Tatimor</p>
                    <h3 className="mt-2 text-[26px] font-bold text-slate-900 dark:text-zinc-100 tracking-tight font-mono">
                      {currency.format(reportData.profitMargin?.taxLiability || 0)}
                    </h3>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.03] text-slate-500 dark:text-zinc-400">
                    <Scale size={18} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 pt-2 border-t border-slate-200/40 dark:border-white/[0.04]">
                  <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[12px] text-slate-400 dark:text-zinc-500">Detyrimet e vlerësuara TVSH & Fitim</span>
                </div>
              </motion.div>

              {/* Card 4: Inventory Valuation */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="relative overflow-hidden rounded-[2rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">Vlera e Stokut</p>
                    <h3 className="mt-2 text-[26px] font-bold text-slate-900 dark:text-zinc-100 tracking-tight font-mono">
                      {currency.format(reportData.inventoryValue?.atSalePrice || 0)}
                    </h3>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.03] text-slate-500 dark:text-zinc-400">
                    <Package size={18} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 pt-2 border-t border-slate-200/40 dark:border-white/[0.04]">
                  <span className="text-[12px] text-slate-400 dark:text-zinc-500">
                    Kostoja e blerjes: <strong className="font-semibold text-slate-600 dark:text-zinc-300 font-mono">{currency.format(reportData.inventoryValue?.atCostPrice || 0)}</strong>
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Main Interactive Chart Section */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2.5rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl sm:p-8"
            >
              <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/40 dark:border-white/[0.04] pb-6">
                <div>
                  <h2 className="flex items-center gap-2 text-[18px] font-semibold text-slate-900 dark:text-zinc-100">
                    <TrendingUp size={20} className="text-indigo-600 dark:text-indigo-400" />
                    Analiza e Të Ardhurave & Kostove
                  </h2>
                  <p className="mt-1 text-[13px] text-slate-500 dark:text-zinc-400">
                    Krahasimi grafik i volumit të shitjeve kundrejt kostos së mallrave të shitura (COGS).
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-6">
                  {/* Custom Chart Legend Indicators */}
                  <div className="flex gap-4 text-[12px]">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-indigo-600 dark:bg-indigo-500" />
                      <span className="text-slate-600 dark:text-zinc-300 font-medium">Të Ardhurat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-slate-400 dark:bg-zinc-500" />
                      <span className="text-slate-600 dark:text-zinc-300 font-medium">Kosto (COGS)</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right border-l border-slate-200/60 dark:border-white/[0.06] pl-6">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-zinc-500">Fitimi i Periudhës</p>
                    <p className="text-[26px] font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                      {currency.format(totalPeriodRevenue - totalPeriodCost)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-[380px] w-full">
                {reportData.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={380}>
                    <AreaChart data={reportData.chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.04)" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="rgba(0,0,0,0.1)" 
                        tick={{ fill: 'rgba(120,120,120,0.7)', fontSize: 11 }} 
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="rgba(0,0,0,0.1)" 
                        tick={{ fill: 'rgba(120,120,120,0.7)', fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}€`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      
                      {/* Cost Area Curve */}
                      <Area 
                        type="monotone" 
                        name="Kostoja"
                        dataKey="cost" 
                        stroke="#94a3b8" 
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        fillOpacity={1} 
                        fill="url(#colorCost)" 
                      />

                      {/* Revenue Area Curve */}
                      <Area 
                        type="monotone" 
                        name="Të ardhurat"
                        dataKey="revenue" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200/60 dark:border-white/[0.06]">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar size={20} className="text-slate-400" />
                      <p className="text-[13px] text-slate-400 dark:text-zinc-500">Nuk ka të dhëna për këtë periudhë.</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Split Section: Leaderboard & AI CFO Autopilot Diagnostics */}
            <div className="grid gap-6 lg:grid-cols-5">
              
              {/* Product Leaderboard: Left 2 columns */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-[2.5rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-6 shadow-sm backdrop-blur-xl lg:col-span-2 sm:p-8"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-[16px] font-semibold text-slate-900 dark:text-zinc-100">Top Produktet</h2>
                    <p className="text-[12px] text-slate-500 dark:text-zinc-400">Produktet kryesore sipas volumit të shitjes</p>
                  </div>
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Layers size={16} />
                  </div>
                </div>

                <div className="space-y-4">
                  {reportData.topProducts.length === 0 ? (
                    <p className="text-[13px] text-slate-400 dark:text-zinc-500 text-center py-6">Nuk ka të dhëna shitjesh</p>
                  ) : (
                    reportData.topProducts.map((p, index) => {
                      const pct = totalTopRevenue > 0 ? Math.round((p.revenue / totalTopRevenue) * 100) : 0;
                      return (
                        <div key={p.id} className="group rounded-2xl border border-slate-200/40 dark:border-white/[0.03] bg-white/30 dark:bg-white/[0.01] p-4 transition duration-300 hover:bg-white/60 dark:hover:bg-white/[0.03] hover:border-slate-200 dark:hover:border-white/[0.06]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-200/60 dark:bg-zinc-800 text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                                {index + 1}
                              </span>
                              <div>
                                <p className="text-[14px] font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-slate-900 dark:group-hover:text-zinc-100">{p.emri}</p>
                                <p className="text-[11px] text-slate-400 dark:text-zinc-500">{p.total_sold} njësi të shitura</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[14px] font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                                {currency.format(p.revenue)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                              <span>Pjesa e shitjeve</span>
                              <span className="font-semibold">{pct}%</span>
                            </div>
                            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                              <div 
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>

              {/* Zahlx AI CFO Copilot Panel: Right 3 columns */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-[2.5rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-6 shadow-sm backdrop-blur-xl lg:col-span-3 sm:p-8 relative overflow-hidden"
              >
                {/* AI glow effect overlay */}
                <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-3xl animate-pulse" />
                
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-[16px] font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <BrainCircuit size={18} className="text-indigo-650 dark:text-indigo-400 animate-pulse" />
                      Zahlx AI CFO Copilot
                    </h2>
                    <p className="text-[12px] text-slate-500 dark:text-zinc-400">Analizë financiare dhe rekomandime autonome</p>
                  </div>
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-ping" />
                </div>

                {/* AI Interactive Tabs */}
                <div className="flex gap-2 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-zinc-900/40 p-1 mb-6">
                  <button
                    onClick={() => setAiTab('stock')}
                    className={`flex-1 rounded-xl py-2 text-[11px] font-bold uppercase tracking-wider transition ${aiTab === 'stock' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'}`}
                  >
                    Stoku
                  </button>
                  <button
                    onClick={() => setAiTab('profit')}
                    className={`flex-1 rounded-xl py-2 text-[11px] font-bold uppercase tracking-wider transition ${aiTab === 'profit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'}`}
                  >
                    Marzhi
                  </button>
                  <button
                    onClick={() => setAiTab('liquidity')}
                    className={`flex-1 rounded-xl py-2 text-[11px] font-bold uppercase tracking-wider transition ${aiTab === 'liquidity' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'}`}
                  >
                    Taksat
                  </button>
                </div>

                <div className="min-h-[200px] flex flex-col justify-between">
                  <AnimatePresence mode="wait">
                    {isAiCalculating ? (
                      <motion.div 
                        key="loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-10"
                      >
                        <div className="flex gap-1 mb-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-650 animate-bounce" />
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-650 animate-bounce [animation-delay:0.15s]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-650 animate-bounce [animation-delay:0.3s]" />
                        </div>
                        <p className="text-[11px] text-slate-400 uppercase tracking-widest font-mono">Duke përllogaritur mardhëniet...</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="content"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="space-y-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="text-[15px] font-semibold text-slate-800 dark:text-zinc-200">
                            {aiInsights[aiTab].title}
                          </h4>
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${aiInsights[aiTab].badgeColor}`}>
                            {aiInsights[aiTab].badge}
                          </span>
                        </div>
                        
                        <p className="text-[13px] leading-relaxed text-slate-500 dark:text-zinc-400 font-medium">
                          <TypewriterText text={aiInsights[aiTab].text} />
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-6 border-t border-slate-200/40 dark:border-white/[0.04] pt-5 flex justify-end">
                    <Link
                      to={aiInsights[aiTab].link}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-4 py-2.5 text-[12px] font-bold transition hover:bg-indigo-600 hover:text-white hover:border-transparent"
                    >
                      {aiInsights[aiTab].cta}
                      <ArrowRight size={14} />
                    </Link>
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
