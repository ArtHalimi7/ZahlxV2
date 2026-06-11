import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Boxes, Clock3, Flame, Lightbulb, Plus, ReceiptText, Sparkles, TrendingUp, BrainCircuit, ArrowRight, RefreshCw, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import MetricCard from '../components/MetricCard';
import ShitjeEShpejte from '../components/ShitjeEShpejte';
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton';
import DashboardTransactions from '../components/dashboard/DashboardTransactions';

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
  paguar: { label: 'Paguar', cls: 'border-green-500/20 bg-green-500/10 text-green-600 dark:border-green-500/15 dark:text-green-400' },
  ne_pritje: { label: 'Në Pritje', cls: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/15 dark:text-amber-400' },
  anuluar: { label: 'Anuluar', cls: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:border-rose-500/15 dark:text-rose-400' },
};

const Dashboard = () => {
  const [metrics, setMetrics] = useState({
    fitimi_total: 0,
    shitjet_sot_nr: 0,
    shitjet_sot_vlera: 0,
    total_produkte: 0,
    stoku_total: 0,
    stoku_ulet: 0,
    revenue_excl_tax: 0,
    total_cost: 0,
    tax_liability: 0,
    net_profit: 0,
    profit_margin: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [saleDrawerOpen, setSaleDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [arkaBalance, setArkaBalance] = useState(0);
  const [aiTab, setAiTab] = useState('insight');
  const [isAiCalculating, setIsAiCalculating] = useState(false);
  const [aiDailyInsight, setAiDailyInsight] = useState('');
  const [isAiDailyLoading, setIsAiDailyLoading] = useState(false);
  const [aiTabInsights, setAiTabInsights] = useState({ insight: '', stock: '', liquidity: '' });
  const [isAiTabLoading, setIsAiTabLoading] = useState(false);
  const aiTabCache = useRef({ insight: '', stock: '', liquidity: '' });

  const fetchData = useCallback(async ({ initial = false, silent = false } = {}) => {
    if (initial) {
      setIsLoading(true);
    } else if (!silent) {
      setIsRefreshing(true);
    }

    try {
      const [metricsRes, txRes, arkaRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/transactions?limit=8'),
        fetch('/api/arka'),
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
          revenue_excl_tax: 0,
          total_cost: 0,
          tax_liability: 0,
          net_profit: 0,
          profit_margin: 0,
        });
      }

      if (txRes.ok) {
        const t = await txRes.json();
        setTransactions(Array.isArray(t) ? t : []);
      } else {
        setTransactions([]);
      }

      if (arkaRes.ok) {
        const a = await arkaRes.json();
        setArkaBalance(a.balance || 0);
      }
    } catch {
      setTransactions([]);
    } finally {
      if (initial) {
        setIsLoading(false);
      }
      if (!silent) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData({ initial: true });

    // Autopilot Silent Background Sync every 6 seconds
    const intervalId = setInterval(() => {
      fetchData({ silent: true });
    }, 6000);

    return () => clearInterval(intervalId);
  }, [fetchData]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Mirëmëngjes';
    if (hour < 18) return 'Mirëdita';
    return 'Mirëmbrëma';
  }, []);

  // Static fallback daily note
  const aiDailyNoteFallback = useMemo(() => {
    if (metrics.shitjet_sot_nr > 0) {
      return `Zahlx AI Autopiloti: Sot keni regjistruar ${metrics.shitjet_sot_nr} shitje me vlerë ${euroFormatter.format(metrics.shitjet_sot_vlera)}. Ecuria e sotme është e shkëlqyer. Mbani në vëmendje nivelin e stokut.`;
    }
    if (metrics.stoku_ulet > 0) {
      return `Zahlx AI Autopiloti: Kujdes! Keni ${metrics.stoku_ulet} artikuj me sasi kritike në stok. Skanoni ose regjistroni furnizimet e reja për të mos ndërprerë shitjet.`;
    }
    return `Zahlx AI Autopiloti: Ecuria e biznesit është e qëndrueshme. Autopiloti është aktiv dhe po sinkronizon transaksionet në kohë reale.`;
  }, [metrics]);

  const aiDailyNote = aiDailyInsight || aiDailyNoteFallback;

  // Fetch real AI daily insight from Gemini
  useEffect(() => {
    if (isLoading) return;
    const fetchAiDaily = async () => {
      setIsAiDailyLoading(true);
      try {
        const res = await fetch('/api/ai/daily-insight');
        if (res.ok) {
          const data = await res.json();
          if (data.insight) {
            setAiDailyInsight(`Zahlx AI Autopiloti: ${data.insight}`);
          }
        }
      } catch (err) {
        console.error('AI daily insight error:', err);
      } finally {
        setIsAiDailyLoading(false);
      }
    };
    fetchAiDaily();
  }, [isLoading]);

  const aiInsights = useMemo(() => {
    const lastTx = transactions[0];
    const stockReorderCost = metrics.stoku_ulet * 120;
    const isLiquiditySafe = arkaBalance >= metrics.tax_liability;
    const liquidityGap = metrics.tax_liability - arkaBalance;

    let insightText = '';
    if (lastTx) {
      insightText = `Sapo u regjistrua një shitje prej ${euroFormatter.format(lastTx.totali)} (${lastTx.klienti || 'POS Checkout'}). Përqindja e fitimit bruto është në nivel optimal prej ${metrics.profit_margin.toFixed(0)}%. Biznesi po operon me efikasitet të lartë.`;
    } else {
      insightText = `Nuk është regjistruar asnjë shitje për sot. Aktivitetet operative janë të qeta. Këshillë: Sigurohuni që produktet tuaja kryesore kanë të regjistruar koston e mallit për përllogaritje të saktë të fitimit.`;
    }

    return {
      insight: {
        title: 'Operacionet Live',
        badge: metrics.shitjet_sot_nr > 0 ? 'Ecuri e Lartë' : 'Qetë',
        badgeColor: metrics.shitjet_sot_nr > 0 ? 'border-green-500/20 bg-green-500/10 text-green-600' : 'border-zinc-500/20 bg-zinc-500/10 text-zinc-500',
        text: insightText,
        cta: 'Hap POS',
        link: '/arka',
        prompt: 'Analizo operacionet e sotme dhe jep rekomandime konkrete për përmirësim të shitjeve.'
      },
      stock: {
        title: 'Stoku & Furnizimi',
        badge: metrics.stoku_ulet > 0 
          ? 'Rimbushje' 
          : metrics.total_produkte === 0 
            ? 'Zbrazët' 
            : 'Nivel Stabil',
        badgeColor: metrics.stoku_ulet > 0 
          ? 'border-amber-500/20 bg-amber-500/10 text-amber-600' 
          : metrics.total_produkte === 0 
            ? 'border-zinc-500/20 bg-zinc-500/10 text-zinc-500' 
            : 'border-green-500/20 bg-green-500/10 text-green-600',
        text: metrics.stoku_ulet > 0
          ? `Kujdes: Sasia e ${metrics.stoku_ulet} artikujve ka rënë nën nivelin kritik. Rekomandohet një buxhet prej afërsisht ${euroFormatter.format(stockReorderCost)} për furnizim të ri përpara se sasia të shterojë plotësisht.`
          : metrics.total_produkte === 0
            ? 'Katalogu juaj është i zbrazët. Regjistroni produktet e para për të filluar menaxhimin e stokut dhe shitjet.'
            : `Gjendja e stokut është e shëndetshme. Keni ${metrics.total_produkte} produkte aktive dhe asnjëra nuk ka rënë nën kufirin kritik. Vazhdoni kështu!`,
        cta: 'Menaxho Stokun',
        link: '/produktet',
        prompt: 'Analizo gjendjen e stokut dhe sugjerojmë strategji furnizimi.'
      },
      liquidity: {
        title: 'Rezerva & Likuiditeti',
        badge: isLiquiditySafe ? 'Mbulim i Plotë' : 'Deficit',
        badgeColor: isLiquiditySafe ? 'border-green-500/20 bg-green-500/10 text-green-600' : 'border-rose-500/20 bg-rose-500/10 text-rose-600',
        text: isLiquiditySafe
          ? `Likuiditeti juaj është i sigurt. Gjendja aktuale në arkë prej ${euroFormatter.format(arkaBalance)} e mbulon plotësisht rezervën tatimore prej ${euroFormatter.format(metrics.tax_liability)}.`
          : `Kujdes: Rezerva e vlerësuar tatimore prej ${euroFormatter.format(metrics.tax_liability)} e tejkalon gjendjen aktuale në arkë prej ${euroFormatter.format(arkaBalance)}. Deficiti është ${euroFormatter.format(liquidityGap)}. Rekomandohet të reduktoni shpenzimet.`,
        cta: 'Hap Analitikën',
        link: '/raportet',
        prompt: 'Analizo likuiditetin dhe rezervën tatimore, dhe sugjerojmë hapa për përmirësim.'
      }
    };
  }, [metrics, transactions, arkaBalance]);

  const aiInsightsRef = useRef(aiInsights);
  useEffect(() => {
    aiInsightsRef.current = aiInsights;
  }, [aiInsights]);

  // Fetch AI insight for the active tab
  const fetchAiTabInsight = useCallback(async (tab, prompt) => {
    // If already cached, use that
    if (aiTabCache.current[tab]) {
      setAiTabInsights(prev => ({ ...prev, [tab]: aiTabCache.current[tab] }));
      setIsAiCalculating(false);
      return;
    }

    setIsAiTabLoading(true);
    setIsAiCalculating(true);
    try {
      if (!prompt) {
        setIsAiCalculating(false);
        setIsAiTabLoading(false);
        return;
      }

      const res = await fetch('/api/ai/tab-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, tab }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.insight) {
          aiTabCache.current[tab] = data.insight;
          setAiTabInsights(prev => ({ ...prev, [tab]: data.insight }));
        }
      }
    } catch (err) {
      console.error('AI tab insight error:', err);
    } finally {
      setIsAiTabLoading(false);
      setIsAiCalculating(false);
    }
  }, []);

  // Trigger AI calculation when tab changes
  useEffect(() => {
    setIsAiCalculating(true);
    const prompt = aiInsightsRef.current[aiTab]?.prompt;
    // Small delay to show loading animation, then fetch real AI
    const timer = setTimeout(() => {
      fetchAiTabInsight(aiTab, prompt);
    }, 300);
    return () => clearTimeout(timer);
  }, [aiTab, fetchAiTabInsight]);

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
      label: 'Shitjet Totale',
      value: euroFormatter.format(metrics.fitimi_total),
      detail: 'Shitjet totale me TVSH',
      icon: TrendingUp,
      tone: 'zinc',
      delta: isRefreshing ? 'Rifreskim...' : 'Stabil',
      tooltip: 'Shuma totale e të gjitha shitjeve të kryera (me TVSH të përfshirë).',
    },
    {
      label: 'Fitimi i Pastër',
      value: euroFormatter.format(metrics.net_profit),
      detail: `Përqindja e fitimit: ${metrics.profit_margin.toFixed(1)}%`,
      icon: TrendingUp,
      tone: 'indigo',
      delta: 'Neto',
      tooltip: 'Paratë e mbetura pasi zbresim koston e mallit dhe detyrimet tatimore.',
    },
    {
      label: 'Rezerva për Taksa',
      value: euroFormatter.format(metrics.tax_liability),
      detail: 'TVSH & Tatim i vlerësuar',
      icon: ReceiptText,
      tone: 'zinc',
      delta: 'Tatimet',
      tooltip: 'Shuma e rezervuar për të paguar TVSH-në dhe tatimin mbi fitimin sipas shitjeve të kryera.',
    },
    {
      label: 'Gjendja e Stokut',
      value: metrics.total_produkte,
      detail: metrics.stoku_ulet > 0 ? `${metrics.stoku_ulet} me stok të ulët` : 'Stoku i shëndetshëm',
      icon: Boxes,
      tone: 'zinc',
      delta: metrics.stoku_ulet > 0 ? 'Vëmendje' : 'Normal',
      tooltip: 'Numri i produkteve unike që keni të regjistruara në katalogun tuaj.',
    },
  ]), [isRefreshing, metrics.fitimi_total, metrics.net_profit, metrics.profit_margin, metrics.tax_liability, metrics.total_produkte, metrics.stoku_ulet]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(var(--accent-rgb),0.08),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.01),transparent_18%)]" />
      <div className="relative w-full px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto grid w-full max-w-[1600px] gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
          <div className="min-w-0">
            <div className="mb-8 grid gap-4">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-8 sm:p-10 md:p-12 shadow-sm backdrop-blur-xl"
          >
            {/* Soft decorative backdrops */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.15),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(var(--accent-rgb),0.06),transparent_30%)]" />
            
            <div className="relative grid grid-cols-1 gap-8 md:grid-cols-12 md:items-center">
              {/* Left Column: Text & Actions */}
              <div className="md:col-span-7 flex flex-col items-start text-left">
                
                <h1 className="mt-5 text-[1.8rem] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-[2.6rem] leading-[1.15]">
                  {greeting},
                  <span className="block bg-gradient-to-r from-zinc-950 to-zinc-500 bg-clip-text text-transparent dark:from-zinc-50 dark:to-zinc-400">
                    panoramë e qartë e biznesit.
                  </span>
                </h1>
                
                <p className="mt-4 max-w-xl text-[14px] leading-relaxed text-slate-500 dark:text-zinc-400">
                  Ky panel është menduar të ndihet si një workspace i qetë dhe i kontrolluar, ku fitimi, shitjet dhe stoku lexohen pa zhurmë vizuale.
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-zinc-200 dark:border-zinc-805 bg-zinc-50 dark:bg-zinc-900 px-3 py-1 text-[11px] text-zinc-900 dark:text-zinc-50">Live</span>
                  <span className="rounded-full border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-3 py-1 text-[11px] text-slate-500 dark:text-zinc-400">Qartësi financiare</span>
                  <span className="rounded-full border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-3 py-1 text-[11px] text-slate-500 dark:text-zinc-400">Shitje të shpejta</span>
                </div>

                <div className="mt-8">
                  <motion.button
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSaleDrawerOpen(true)}
                    className="inline-flex items-center justify-center gap-3 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-950 dark:bg-zinc-50 px-6 py-3.5 text-[13px] font-semibold text-zinc-50 dark:text-zinc-950 shadow-[0_12px_40px_rgba(var(--accent-rgb),0.15)] transition hover:bg-zinc-900 dark:hover:bg-zinc-100"
                    id="quick-sale-button"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-zinc-900 dark:bg-zinc-200 text-zinc-50 dark:text-zinc-950 shadow-sm">
                      <Plus size={14} strokeWidth={2.8} />
                    </span>
                    Shitje e Shpejtë
                  </motion.button>
                </div>
              </div>

              {/* Right Column: Floating CSS cards decoration (Hidden on mobile) */}
              <div className="hidden md:col-span-5 md:flex items-center justify-center relative min-h-[200px]">
                {/* Visual Glow Layer */}
                <div className="pointer-events-none absolute -inset-4 rounded-full bg-zinc-500/10 dark:bg-zinc-500/5 blur-3xl" />
                
                {/* The Tilted Card Stack */}
                <div className="relative w-64 h-40">
                  {/* Underlay / Back Card */}
                  <div className="absolute inset-0 rounded-2xl border border-slate-200/30 dark:border-white/5 bg-slate-100/10 dark:bg-zinc-900/10 shadow-lg transform -rotate-12 -translate-x-3 -translate-y-2 scale-95 backdrop-blur-md transition-all duration-500 hover:-translate-x-4 hover:-translate-y-3 hover:-rotate-6" />
                  
                  {/* Middle Card */}
                  <div className="absolute inset-0 rounded-2xl border border-zinc-500/20 dark:border-zinc-500/10 bg-zinc-500/[0.04] shadow-xl transform -rotate-6 -translate-x-1 -translate-y-1 scale-98 backdrop-blur-md transition-all duration-500 hover:-translate-x-2 hover:-translate-y-1.5 hover:-rotate-3" />
                  
                  {/* Foreground / Active Glass Card */}
                  <div className="absolute inset-0 rounded-2xl border border-white/20 dark:border-white/[0.08] bg-gradient-to-br from-white/30 to-white/5 dark:from-white/[0.06] dark:to-white/[0.01] shadow-2xl p-5 flex flex-col justify-between backdrop-blur-lg transition-all duration-500 hover:-translate-y-2 hover:rotate-2 hover:shadow-zinc-500/10 dark:hover:shadow-zinc-500/5">
                    <div className="flex justify-between items-start">
                      <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                        <Bot size={16} className="text-zinc-900 dark:text-zinc-100" />
                      </div>
                      <span className="text-[9px] uppercase tracking-widest text-slate-400 dark:text-zinc-500 font-mono">Zahlx Premium</span>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 tracking-wider font-mono">SHITJET TOTALE</p>
                      <p className="text-[18px] font-semibold text-slate-800 dark:text-zinc-100 tracking-tight font-mono">
                        {euroFormatter.format(metrics.fitimi_total)}
                      </p>
                    </div>

                    <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-200/40 dark:border-white/[0.04]">
                      <div className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono">
                        SHITJET SOT: {metrics.shitjet_sot_nr}
                      </div>
                      <div className="h-4 w-6 rounded-md bg-gradient-to-r from-zinc-500/30 to-zinc-700/30" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <div className="grid grid-cols-1 divide-y divide-slate-200/60 dark:divide-white/[0.06] lg:grid-cols-[1.2fr_0.8fr] lg:divide-x lg:divide-y-0 border-y border-slate-200/60 dark:border-white/[0.06]">
            <div className="px-4 py-8 lg:px-8">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400">
                  <Bot size={18} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500 font-semibold">Zahlx AI Autopiloti</p>
                    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                      <span className="h-1 w-1 rounded-full bg-indigo-500 animate-pulse" />
                      Gemini
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] leading-7 text-slate-700 dark:text-zinc-300 font-medium">
                    {isAiDailyLoading ? (
                      <span className="flex items-center gap-2 text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce" />
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.15s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.3s]" />
                        <span className="text-[12px] ml-1">Duke gjeneruar analizën me AI...</span>
                      </span>
                    ) : (
                      <TypewriterText text={aiDailyNote} />
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 py-8 lg:px-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Ritmi i sotëm</p>
                  <p className="mt-2 text-[15px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Fokus: qartësi dhe shpejtësi</p>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] text-slate-500 dark:text-zinc-400">
                  <Clock3 size={16} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Në pritje</p>
                  <p className="mt-2 text-[15px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{transactions.filter((transaction) => transaction.statusi === 'ne_pritje').length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Paguar</p>
                  <p className="mt-2 text-[15px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{transactions.filter((transaction) => transaction.statusi === 'paguar').length}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Total</p>
                  <p className="mt-2 text-[15px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{transactions.length}</p>
                </div>
              </div>
            </div>
          </div>


            </div>

            <div className="mb-12 mt-8 grid grid-cols-1 divide-y divide-slate-200/60 dark:divide-white/[0.06] border-y border-slate-200/60 dark:border-white/[0.06] lg:grid-cols-4 lg:divide-x lg:divide-y-0">
              {metricCards.map((card) => (
                <MetricCard key={card.label} {...card} />
              ))}
            </div>

            <DashboardTransactions transactions={preparedTransactions} />
          </div>

          <aside className="grid grid-cols-1 divide-y divide-slate-200/60 dark:divide-white/[0.06] xl:sticky xl:top-8 xl:border-l xl:border-slate-200/60 dark:xl:border-white/[0.06] xl:pl-8">
            <div className="py-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Pulse i sotëm</p>
                  <h3 className="mt-2 text-[15px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Çfarë po lëviz tani</h3>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400">
                  <Flame size={16} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Shitjet në pritje</p>
                  <p className="mt-2 text-[24px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">
                    {transactions.filter((transaction) => transaction.statusi === 'ne_pritje').length}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Pagesat e konfirmuara</p>
                  <p className="mt-2 text-[24px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">
                    {transactions.filter((transaction) => transaction.statusi === 'paguar').length}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Produktet me vëmendje</p>
                  <p className="mt-2 text-[24px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">{metrics.stoku_ulet}</p>
                </div>
              </div>
            </div>

            <div className="py-8 relative overflow-hidden">
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-zinc-900 dark:text-zinc-100" />
                  <h4 className="text-[14px] font-bold text-slate-900 dark:text-zinc-100">
                    Zahlx AI CFO Copilot
                  </h4>
                </div>
              </div>

              {/* Mini Tabs */}
              <div className="flex gap-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-0.5 mb-4">
                {['insight', 'stock', 'liquidity'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setAiTab(tab)}
                    className={`flex-1 rounded-lg py-1.5 text-[9px] font-bold uppercase tracking-wider transition ${aiTab === tab ? 'bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 shadow-sm' : 'text-zinc-550 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100'}`}
                  >
                    {tab === 'insight' && 'Live'}
                    {tab === 'stock' && 'Stoku'}
                    {tab === 'liquidity' && 'Taksat'}
                  </button>
                ))}
              </div>

              <div className="min-h-[140px] flex flex-col justify-between">
                <AnimatePresence mode="wait">
                  {isAiCalculating ? (
                    <motion.div
                      key="loader"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-6"
                    >
                      <div className="flex gap-1 mb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-950 dark:bg-zinc-100 animate-bounce" />
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-950 dark:bg-zinc-100 animate-bounce [animation-delay:0.15s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-950 dark:bg-zinc-100 animate-bounce [animation-delay:0.3s]" />
                      </div>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-mono">Duke analizuar...</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="content"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-semibold text-slate-800 dark:text-zinc-200">
                          {aiInsights[aiTab].title}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${aiInsights[aiTab].badgeColor}`}>
                          {aiInsights[aiTab].badge}
                        </span>
                      </div>
                      
                      <p className="text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-300 font-medium">
                        <TypewriterText text={aiTabInsights[aiTab] || aiInsights[aiTab].text} />
                      </p>
                      {aiTabInsights[aiTab] && (
                        <p className="mt-2 text-[10px] text-zinc-500 italic flex items-center gap-1">
                          Gjeneruar nga Gemini AI
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-4 border-t border-slate-200/40 dark:border-white/[0.04] pt-3 flex justify-end">
                  <Link
                    to={aiInsights[aiTab].link}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-1.5 text-[11px] font-bold transition hover:bg-zinc-950 hover:text-zinc-50 dark:hover:bg-zinc-50 dark:hover:text-zinc-950"
                  >
                    {aiInsights[aiTab].cta}
                    <ArrowRight size={12} />
                  </Link>
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
