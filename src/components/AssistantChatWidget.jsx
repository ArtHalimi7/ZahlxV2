import { AnimatePresence, motion } from 'framer-motion';
import { BotMessageSquare, ChevronUp, Send, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';

const QUICK_PROMPTS = [
  'Përmbledhja e ditës',
  'Si po ecin shitjet?',
  'Çfarë duhet të kontrolloj?'
];

const defaultMessages = [
  {
    id: 1,
    role: 'assistant',
    text: 'Përshëndetje. Jam Zahlx AI. Mund të përmbledh shitjet, të tregoj çfarë kërkon vëmendje, ose të të udhëzoj te POS.',
  },
];

const buildReply = (message) => {
  const lower = message.toLowerCase();

  if (lower.includes('shit')) {
    return 'Shitjet duken të qëndrueshme. Nëse dëshiron, mund të hap edhe një përmbledhje ditore me ritmin e transaksioneve.';
  }

  if (lower.includes('stok') || lower.includes('inventar')) {
    return 'Stoku është zona më e mirë për kontroll tani. Artikujt me nivel të ulët duhen rishikuar më parë.';
  }

  if (lower.includes('dit')) {
    return 'Sot ia vlen të shikosh fitimin total, shitjet e ditës dhe çdo transaksion në pritje. Kjo e mban panelin të pastër dhe praktik.';
  }

  return 'E kuptova. Mund të të ndihmoj me shitjet, stokun, ose një përmbledhje të shpejtë të panelit.';
};

const AssistantChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(defaultMessages);

  const canSend = input.trim().length > 0;

  const recentHint = useMemo(() => {
    const assistantMessages = messages.filter((message) => message.role === 'assistant');
    return assistantMessages.at(-1)?.text || '';
  }, [messages]);

  const handleSend = (messageText = input) => {
    const trimmed = messageText.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: 'user', text: trimmed },
      { id: Date.now() + 1, role: 'assistant', text: buildReply(trimmed) },
    ]);
    setInput('');
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
          className="group flex items-center gap-3 rounded-full border border-white/[0.08] bg-zinc-950/90 px-4 py-3 text-left text-zinc-100 shadow-[0_18px_60px_rgba(0,0,0,0.42)] backdrop-blur-xl transition hover:border-emerald-500/25 hover:bg-zinc-900/95"
          aria-label="Hap asistentin AI"
        >
          <span className="relative grid h-11 w-11 place-items-center rounded-full border border-emerald-500/20 bg-emerald-500/12 text-emerald-300 shadow-[0_0_26px_rgba(16,185,129,0.18)]">
            <BotMessageSquare size={19} />
            <span className="absolute inset-0 rounded-full bg-emerald-400/10 opacity-0 blur-md transition group-hover:opacity-100" />
          </span>
          <span className="hidden pr-1 sm:block">
            <span className="block text-[11px] uppercase tracking-[0.24em] text-zinc-500">Zahlx AI</span>
            <span className="mt-1 block text-[13px] font-medium text-zinc-100">Pyetje për panelin?</span>
          </span>
          <ChevronUp size={14} className={`text-zinc-500 transition ${open ? 'rotate-180' : ''}`} />
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="mt-4 w-[min(92vw,24rem)] overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-zinc-950/95 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
            >
              <div className="flex items-start justify-between border-b border-white/[0.06] px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-400">Asistent inteligjent</p>
                    <p className="mt-1 text-[14px] font-semibold tracking-tight text-zinc-100">Zahlx AI</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2 text-zinc-400 transition hover:border-white/[0.12] hover:text-zinc-100"
                  aria-label="Mbyll asistentin AI"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="max-h-[22rem] space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-[13px] leading-6 ${message.role === 'user' ? 'border border-emerald-500/15 bg-emerald-500/10 text-emerald-100' : 'border border-white/[0.06] bg-white/[0.03] text-zinc-200'}`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/[0.06] px-4 py-4">
                <div className="mb-3 flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[11px] text-zinc-300 transition hover:border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-300"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>

                <div className="flex items-end gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder="Pyet Zahlx AI..."
                    rows={1}
                    className="max-h-28 flex-1 resize-none bg-transparent px-2 py-2 text-[13px] text-zinc-100 outline-none placeholder:text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleSend()}
                    disabled={!canSend}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Dërgo mesazhin"
                  >
                    <Send size={15} />
                  </button>
                </div>

                <p className="mt-3 text-[11px] text-zinc-600">
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