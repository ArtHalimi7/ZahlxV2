import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { BotMessageSquare, ChevronUp, Send, Bot, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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

const generateLocalFallbackReply = (text, metrics) => {
  const query = text.toLowerCase();
  const m = metrics || { total_produkte: 0, shitjet_sot_nr: 0, shitjet_sot_vlera: 0, stoku_ulet: 0 };
  
  if (query.includes('përmbledhj') || query.includes('ecin shitjet') || query.includes('sot')) {
    if (m.total_produkte === 0) {
      return "Dështoi lidhja me serverin për përditësimin e të dhënave, burimi i katalogut tuaj është ende i zbrazët. Ju lutem regjistroni produktet e para te faqja e produkteve për të filluar shitjet.";
    }
    return `Sot keni regjistruar ${m.shitjet_sot_nr || 0} shitje me vlerë totale prej ${(m.shitjet_sot_vlera || 0).toFixed(2)} EUR. ${m.stoku_ulet > 0 ? `Keni ${m.stoku_ulet} produkte me stok kritik.` : 'Stoku është i qëndrueshëm.'}`;
  }
  
  if (query.includes('stok') || query.includes('kontrolloj') || query.includes('artikull') || query.includes('produkt')) {
    if (m.total_produkte === 0) {
      return "Nuk keni asnjë produkt në katalog. Vizitoni seksionin 'Produktet' për të shtuar artikujt tuaj të parë.";
    }
    if (m.stoku_ulet > 0) {
      return `Duhet të kontrolloni ${m.stoku_ulet} artikuj me stok të ulët (sasia <= 5). Rekomandohet furnizimi i tyre sa më shpejt.`;
    }
    return `Stoku juaj është në gjendje të rregullt. Të gjitha ${m.total_produkte} produktet kanë nivele të mjaftueshme.`;
  }
  
  if (m.total_produkte === 0) {
    return "Sistemi është jashtë linje (offline). Gjithashtu, vumë re se nuk keni asnjë produkt në katalog. Pasi të ktheheni online, mund të bisedoni me asistentin dhe të kryeni shitje.";
  }

  return `Aktualisht jeni offline dhe nuk mund të lidheni me shërbimin AI. Këtu janë të dhënat e fundit lokale: Shitje sot: ${m.shitjet_sot_nr || 0}, Produkte totale: ${m.total_produkte || 0}.`;
};

const AssistantChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(defaultMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [localMetrics, setLocalMetrics] = useState(null);
  const messagesEndRef = useRef(null);
  const dragControls = useDragControls();
  const isDraggingRef = useRef(false);

  const [viewportConstraints, setViewportConstraints] = useState({ left: -800, right: 0, top: -600, bottom: 0 });

  useEffect(() => {
    const updateConstraints = () => {
      setViewportConstraints({
        left: -window.innerWidth + 400,
        right: 16,
        top: -window.innerHeight + 450,
        bottom: 16
      });
    };
    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    return () => window.removeEventListener('resize', updateConstraints);
  }, []);

  const canSend = input.trim().length > 0 && !isTyping;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Fetch local metrics for chat when widget opens
  useEffect(() => {
    if (open) {
      fetch('/api/dashboard')
        .then(res => res.json())
        .then(data => setLocalMetrics(data))
        .catch(err => console.error("Error fetching local metrics for chat:", err));
    }
  }, [open]);

  const handlePointerDown = (e) => {
    dragControls.start(e);
  };

  const handleSend = async (messageText = input) => {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg = { id: Date.now(), role: 'user', text: trimmed };
    const updatedHistory = [...messages, userMsg];

    setMessages(updatedHistory);
    setInput('');
    setIsTyping(true);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          history: updatedHistory,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === 'api_key_required') {
          setMessages((current) => [
            ...current,
            {
              id: Date.now() + 1,
              role: 'assistant',
              text: data.message || "Konfiguro çelësin e Gemini API (GEMINI_API_KEY) në skedarin .env.",
            }
          ]);
          setIsTyping(false);
          return;
        }
        setMessages((current) => [
          ...current,
          {
            id: Date.now() + 1,
            role: 'assistant',
            text: data.message || "Ndodhi një gabim gjatë bisedës me Zahlx AI. Provoni përsëri.",
          }
        ]);
        setIsTyping(false);
        return;
      }

      const data = await res.json();
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: 'assistant', text: data.reply }
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      const offlineReply = generateLocalFallbackReply(trimmed, localMetrics);
      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: offlineReply,
        }
      ]);
    } finally {
      setIsTyping(false);
    }
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

      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragConstraints={viewportConstraints}
        onDragStart={() => {
          isDraggingRef.current = true;
        }}
        onDragEnd={() => {
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 50);
        }}
        className="fixed bottom-4 right-4 z-[160] sm:bottom-6 sm:right-6 flex flex-col items-end"
      >
        <AnimatePresence>
          {!open && (
            <motion.button
              type="button"
              onClick={() => {
                if (!isDraggingRef.current) {
                  setOpen(true);
                }
              }}
              onPointerDown={handlePointerDown}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center justify-center rounded-full border border-zinc-200 dark:border-transparent bg-white dark:bg-zinc-900 text-left text-zinc-950 dark:text-zinc-50 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700 px-4 py-3 gap-3 cursor-grab active:cursor-grabbing select-none"
              aria-label="Hap asistentin AI"
            >
              <span className="relative grid h-11 w-11 place-items-center rounded-full border border-zinc-200 dark:border-transparent bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 shadow-sm shrink-0">
                <BotMessageSquare size={19} />
              </span>

              <span className="hidden sm:flex flex-col pr-1 overflow-hidden whitespace-nowrap">
                <span className="block text-[11px] uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500 font-semibold">Zahlx AI</span>
                <span className="mt-1 block text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">Pyetje për panelin?</span>
              </span>

              <ChevronUp size={14} className="text-zinc-400 dark:text-zinc-500 transition duration-300 shrink-0" />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="w-[min(92vw,24rem)] overflow-hidden rounded-[1.75rem] border border-zinc-200 dark:border-transparent bg-white dark:bg-zinc-950 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"
            >
              <div 
                onPointerDown={handlePointerDown}
                className="flex items-start justify-between border-b border-zinc-200 dark:border-transparent px-4 py-4 cursor-move select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl border border-zinc-200 dark:border-transparent bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                    <Bot size={16} />
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400 font-semibold">Asistent inteligjent</p>
                    <p className="mt-1 text-[14px] font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">Zahlx AI</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="rounded-xl border border-zinc-200 dark:border-transparent bg-zinc-50 dark:bg-zinc-900 p-2 text-zinc-600 dark:text-zinc-300 transition hover:border-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50"
                    aria-label="Mbyll asistentin AI"
                  >
                    <X size={16} />
                  </button>
                </div>
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
                          ? 'bg-zinc-950 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 font-medium border border-transparent dark:border-transparent shadow-sm' 
                          : 'border border-zinc-200 dark:border-transparent bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100'
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
                    <div className="max-w-[82%] rounded-2xl px-4 py-3 text-[13px] border border-zinc-200 dark:border-transparent bg-zinc-50 dark:bg-zinc-900 text-zinc-400 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-950 dark:bg-zinc-100 animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-950 dark:bg-zinc-100 animate-bounce [animation-delay:0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-950 dark:bg-zinc-100 animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-zinc-200 dark:border-transparent px-4 py-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="rounded-full border border-zinc-200 dark:border-transparent bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-[11px] font-semibold text-zinc-650 dark:text-zinc-300 transition hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-zinc-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 dark:border-transparent bg-zinc-50 dark:bg-zinc-900 p-2">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Pyet Pyetjet këtu..."
                    rows={1}
                    className="max-h-28 flex-1 resize-none bg-transparent px-2 py-2 text-[13px] text-zinc-950 dark:text-zinc-50 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!canSend}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-950 hover:bg-zinc-900 dark:hover:bg-zinc-200 transition disabled:cursor-not-allowed disabled:opacity-40 shrink-0"
                    aria-label="Dërgo mesazhin"
                  >
                    <Send size={15} />
                  </button>
                </div>

                <p className="mt-3 text-[11px] text-slate-400 dark:text-zinc-550 italic text-center">
                  Fuqizuar nga Gemini AI — përgjigje inteligjente me kontekst real.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};

export default AssistantChatWidget;