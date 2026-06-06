import { AnimatePresence, motion } from 'framer-motion';
import { BotMessageSquare, ChevronUp, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const QUICK_PROMPTS = [
  'Përmbledhja e ditës',
  'Si po ecin shitjet?',
  'Çfarë duhet të kontrolloj?'
];

const defaultMessages = [
  {
    id: 1,
    role: 'assistant',
    text: "Përshëndetje! Unë jam asistentja juaj virtuale, Zahlx AI. Mund t'ju ndihmoj të analizoni shitjet tuaja, t'ju tregoj cilët artikuj kërkojnë vëmendje në stok, ose t'ju udhëzoj rreth provizioneve tatimore dhe likuiditetit të arkës.",
  },
];

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
    }, 10);
    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayedText}</span>;
};

const generateRealReply = (userMessage, currentMetrics, currentArka) => {
  const lower = userMessage.toLowerCase();
  
  const fmtEuro = (val) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(val || 0);

  const m = currentMetrics || {
    fitimi_total: 0,
    shitjet_sot_nr: 0,
    shitjet_sot_vlera: 0,
    total_produkte: 0,
    stoku_total: 0,
    stoku_ulet: 0,
    tax_liability: 0,
    net_profit: 0,
    profit_margin: 0,
  };
  const ab = currentArka || 0;

  // 1. Daily Summary
  if (lower.includes('përmbledh') || lower.includes('dit') || lower.includes('sot')) {
    return `Zahlx AI - Analiza Operative:
• Shitjet e Sotme: ${m.shitjet_sot_nr} transaksione me vlerë ${fmtEuro(m.shitjet_sot_vlera)}.
• Të Hyrat Bruto: ${fmtEuro(m.fitimi_total)}.
• Fitimi Neto: ${fmtEuro(m.net_profit)} (Margjina: ${m.profit_margin.toFixed(1)}%).
• Provizioni Tatimor: ${fmtEuro(m.tax_liability)}.
• Gjendja në Arkë: ${fmtEuro(ab)}.
${ab >= m.tax_liability ? '✅ Biznesi ka likuiditet të plotë për të mbuluar detyrimet e vlerësuara tatimore.' : '⚠️ Kujdes: Gjendja aktuale në arkë nuk e mbulon provizionin e vlerësuar tatimor.'}`;
  }

  // 2. Sales details
  if (lower.includes('shit') || lower.includes('fitim') || lower.includes('marxh')) {
    return `Zahlx AI - Analiza e Fitimit:
• Shitjet e sotme arrijnë vlerën prej ${fmtEuro(m.shitjet_sot_vlera)} me një marxhë neto prej ${m.profit_margin.toFixed(1)}%.
• Fitimi neto i përgjithshëm i regjistruar është ${fmtEuro(m.net_profit)}.
• Sugjerim: Kontrolloni faqen e raporteve për të parë krahasimin grafik ndërmjet kostove (COGS) dhe të hyrave.`;
  }

  // 3. Stock details
  if (lower.includes('stok') || lower.includes('inventar') || lower.includes('furniz')) {
    if (m.stoku_ulet > 0) {
      return `Zahlx AI - Alerta e Stokut:
• Keni ${m.stoku_ulet} artikuj me nivel kritik stoku në katalog!
• Gjithsej keni ${m.total_produkte} produkte të regjistruara në inventar.
• Rekomandohet të vizitoni faqen "Produktet" ose të skanoni barkodet e furnizimit të ri për të rimbushur rezervat operative.`;
    }
    return `Zahlx AI - Analiza e Stokut:
• Nuk keni asnjë artikull me sasi kritike në stok për momentin.
• Katalogu juaj përmban ${m.total_produkte} produkte aktive me sasi të qëndrueshme.`;
  }

  // 4. Liquidity & Arka
  if (lower.includes('ark') || lower.includes('par') || lower.includes('taks') || lower.includes('tvsh')) {
    const isLiquiditySafe = ab >= m.tax_liability;
    return `Zahlx AI - Raporti i Likuiditetit:
• Gjendja në Arkë: ${fmtEuro(ab)}.
• Provizioni Tatimor (TVSH + Tatimi në Fitim): ${fmtEuro(m.tax_liability)}.
• Statusi: ${isLiquiditySafe ? '🟢 I sigurt (Mbulim i plotë i detyrimeve)' : '🔴 Deficit (Gjendja në arkë është më e ulët se provizioni i taksave)'}.
• Sugjerim: Ruani të paktën ${fmtEuro(m.tax_liability)} si rezervë likvide për të shmangur vështirësitë financiare.`;
  }

  // 5. Help / Greeting
  if (lower.includes('përshëndetje') || lower.includes('tung') || lower.includes('hi') || lower.includes('kush je')) {
    return `Përshëndetje! Unë jam Zahlx AI, asistenti juaj financiar autonom. Mund t'ju ndihmoj me informacione rreth shitjeve të ditës, artikujve kritikë në stok, provizioneve tatimore ose gjendjes së arkës. Provoni të më pyesni: "Si po ecin shitjet?" ose "Sa para kemi në arkë?".`;
  }

  // Fallback response with live context
  return `E kuptova kërkesën tuaj. Si asistent inteligjent i Zahlx, kam qasje në kohë reale në të dhënat e biznesit tuaj:
• Shitjet e Sotme: ${m.shitjet_sot_nr} transaksione
• Fitimi Neto: ${fmtEuro(m.net_profit)}
• Artikuj në Stok Kritik: ${m.stoku_ulet} produkte
Cilin aspekt dëshironi të analizojmë më në detaje? (Shitjet, Stokun, apo Taksat dhe Arkën?)`;
};

const AssistantChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(defaultMessages);
  const [metrics, setMetrics] = useState(null);
  const [arkaBalance, setArkaBalance] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const canSend = input.trim().length > 0;

  const recentHint = useMemo(() => {
    const assistantMessages = messages.filter((message) => message.role === 'assistant');
    return assistantMessages.at(-1)?.text || '';
  }, [messages]);

  useEffect(() => {
    if (open) {
      const fetchChatContext = async () => {
        try {
          const [dashRes, arkaRes] = await Promise.all([
            fetch('/api/dashboard'),
            fetch('/api/arka')
          ]);
          if (dashRes.ok) {
            const d = await dashRes.json();
            setMetrics(d);
          }
          if (arkaRes.ok) {
            const a = await arkaRes.json();
            setArkaBalance(a.balance || 0);
          }
        } catch (err) {
          console.error("Error fetching context for chat", err);
        }
      };
      fetchChatContext();
    }
  }, [open]);

  const handleSend = (messageText = input) => {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    // Add user message
    setMessages((current) => [
      ...current,
      { id: Date.now(), role: 'user', text: trimmed }
    ]);
    setInput('');
    setIsTyping(true);

    // Simulate thinking delay
    setTimeout(() => {
      const replyText = generateRealReply(trimmed, metrics, arkaBalance);
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: 'assistant', text: replyText }
      ]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-[2px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-4 right-4 z-[160] sm:bottom-6 sm:right-6">
        <motion.button
          type="button"
          onClick={() => setOpen((value) => !value)}
          whileHover={{ y: -2, scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className={`group flex items-center justify-center rounded-full border border-slate-200/60 dark:border-white/[0.06] bg-[#f4f4f5] dark:bg-zinc-950/90 text-left text-slate-900 dark:text-zinc-100 shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl transition-all duration-300 hover:border-indigo-500/25 hover:bg-zinc-900/95 ${
            open ? 'p-3' : 'px-4 py-3 gap-3'
          }`}
          aria-label="Hap asistentin AI"
        >
          <span className="relative grid h-11 w-11 place-items-center rounded-full border border-indigo-500/20 bg-indigo-500/15 text-indigo-600 shadow-[0_0_26px_rgba(99,102,241,0.18)] shrink-0">
            <BotMessageSquare size={19} />
            <span className="absolute inset-0 rounded-full bg-indigo-400/10 opacity-0 blur-md transition group-hover:opacity-100" />
          </span>

          <AnimatePresence initial={false}>
            {!open && (
              <motion.span
                initial={{ width: 0, opacity: 0, scale: 0.8 }}
                animate={{ width: 'auto', opacity: 1, scale: 1 }}
                exit={{ width: 0, opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="hidden sm:flex flex-col pr-1 overflow-hidden whitespace-nowrap"
              >
                <span className="block text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500 font-semibold">Zahlx AI</span>
                <span className="mt-1 block text-[13px] font-semibold text-indigo-650 dark:text-indigo-400">Pyetje për panelin?</span>
              </motion.span>
            )}
          </AnimatePresence>

          <ChevronUp size={14} className={`text-slate-400 dark:text-zinc-500 transition duration-300 shrink-0 ${open ? 'rotate-180' : ''}`} />
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="mt-4 w-[min(92vw,24rem)] overflow-hidden rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/95 dark:bg-zinc-950/95 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
            >
              <div className="flex items-start justify-between border-b border-slate-200/60 dark:border-white/[0.06] px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-indigo-600 font-semibold">Asistent inteligjent</p>
                    <p className="mt-1 text-[14px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Zahlx AI</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-2 text-slate-500 dark:text-zinc-400 transition hover:border-slate-300 dark:border-white/[0.12] hover:text-slate-900 dark:text-zinc-100"
                  aria-label="Mbyll asistentin AI"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[20rem] space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-[13px] leading-6 whitespace-pre-line ${
                        message.role === 'user' 
                          ? 'border border-indigo-500/20 bg-indigo-500/10 text-indigo-650 dark:text-indigo-300 font-medium' 
                          : 'border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] text-slate-800 dark:text-zinc-200'
                      }`}
                    >
                      {message.role === 'assistant' && index === messages.length - 1 ? (
                        <TypewriterText text={message.text} />
                      ) : (
                        message.text
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-[82%] rounded-2xl px-4 py-3 text-[13px] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] text-slate-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce [animation-delay:0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200/60 dark:border-white/[0.06] px-4 py-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="rounded-full border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-slate-700 dark:text-zinc-300 transition hover:border-indigo-500/20 hover:bg-indigo-500/10 hover:text-indigo-600"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="flex items-end gap-2 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-2">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Pyet Zahlx AI..."
                    rows={1}
                    className="max-h-28 flex-1 resize-none bg-transparent px-2 py-2 text-[13px] text-slate-900 dark:text-zinc-100 outline-none placeholder:text-slate-400 dark:text-zinc-550"
                  />
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!canSend}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 shrink-0"
                    aria-label="Dërgo mesazhin"
                  >
                    <Send size={15} />
                  </button>
                </div>

                <p className="mt-3 text-[11px] text-slate-400 dark:text-zinc-500 italic">
                  {recentHint}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default AssistantChatWidget;