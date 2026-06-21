import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { AlertCircle, Check, Minus, Plus, Search, X, QrCode } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';

const formatEuro = (amount) => new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
}).format(amount);

const STATES = {
  SELECTING: 'selecting',
  CONFIRMING: 'confirming',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

const ShitjeEShpejte = ({ isOpen, onClose, onSaleComplete }) => {
  const { user } = useAuth();
  const [state, setState] = useState(STATES.SELECTING);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const [paymentTerms, setPaymentTerms] = useState('immediate');
  const [invoiceStatus, setInvoiceStatus] = useState('paguar');
  const [paymentMethod, setPaymentMethod] = useState('KESH');
  const [discountRate, setDiscountRate] = useState('0');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState('Klient i përgjithshëm');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const controller = new AbortController();
    const originalOverflow = document.body.style.overflow;

    setState(STATES.SELECTING);
    setSelected(null);
    setQuantity(1);
    setSearch('');
    setErrorMsg('');
    setReceiptData(null);
    setPaymentTerms('immediate');
    setInvoiceStatus('paguar');
    setPaymentMethod('KESH');
    setDiscountRate('0');
    setClientSearch('Klient i përgjithshëm');

    document.body.style.overflow = 'hidden';

    fetch('/api/products', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('API unavailable');
        return response.json();
      })
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));

    fetch('/api/clients', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]));

    setSelectedClient(null);
    setClientSearch('Klient i përgjithshëm');

    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 120);

    return () => {
      controller.abort();
      window.clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) => (
      product.emri.toLowerCase().includes(query)
      || (product.kodi_bar && product.kodi_bar.toLowerCase().includes(query))
    ));
  }, [products, search]);

  const taxRate = selected ? Number(selected.tax_rate || 0) : 0;
  const subtotal = selected ? selected.cmimi_shitjes * quantity : 0;
  const discountAmount = subtotal * (Number(discountRate || 0) / 100);
  const total = subtotal - discountAmount;
  const taxAmount = taxRate > 0 ? total * (taxRate / (100 + taxRate)) : 0;

  const handleSelect = (product) => {
    setSelected(product);
    setQuantity(1);
    setState(STATES.CONFIRMING);
  };

  const handleBack = () => {
    setSelected(null);
    setState(STATES.SELECTING);
    setErrorMsg('');
  };

  const adjustQty = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (selected && next > selected.stoku_aktual) return selected.stoku_aktual;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!selected) return;

    setState(STATES.LOADING);

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          klienti: selectedClient ? selectedClient.emri : (clientSearch || 'Klient i përgjithshëm'),
          klient_email: selectedClient?.email || null,
          klient_telefoni: selectedClient?.telefoni || null,
          klient_adresa: selectedClient?.adresa || null,
          items: [{ product_id: selected.id, sasia: Number(quantity) || 1, tax_rate: Number(selected.tax_rate || 0) }],
          tax_rate: 0,
          payment_terms: paymentTerms,
          statusi: invoiceStatus,
          menyra_pageses: paymentMethod,
          discount_rate: Number(discountRate || 0),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Gabim gjatë ruajtjes së shitjes');
      }

      setReceiptData({
        ...data.invoice,
        qrUrl: `${window.location.origin}/fature/${data.invoice.secure_code}`,
      });
      setState(STATES.SUCCESS);
      onSaleComplete?.();
    } catch (error) {
      setErrorMsg(error.message);
      setState(STATES.ERROR);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[200] flex justify-end" initial={false}>
        <motion.button
          type="button"
          aria-label="Mbyll panelin"
          className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-[6px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.aside
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={{ left: 0, right: 0.7 }}
          onDragEnd={(event, info) => {
            if (info.offset.x > 120) {
              onClose();
            }
          }}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="relative z-10 flex h-full w-full max-w-[32rem] flex-col border-l border-slate-200/60 dark:border-transparent bg-[#f4f4f5] dark:bg-black/95 shadow-[0_0_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-200/60 dark:border-transparent px-5 py-4 sm:px-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-600">POS i shpejtë</p>
              <h2 className="mt-2 text-[18px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
                {state === STATES.SELECTING && 'Shitje e Shpejtë'}
                {state === STATES.CONFIRMING && 'Konfirmo Shitjen'}
                {state === STATES.LOADING && 'Duke procesuar'}
                {state === STATES.SUCCESS && 'Shitje e Regjistruar'}
                {state === STATES.ERROR && 'Gabim në procesim'}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="inline-flex rounded-xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] p-2 text-slate-500 dark:text-zinc-400 transition hover:border-slate-300 dark:border-transparent hover:text-slate-900 dark:text-zinc-100"
              aria-label="Mbyll"
            >
              <X size={16} />
            </button>
          </div>

          <div className="border-b border-slate-200/60 dark:border-transparent px-5 py-4 sm:px-6">
            <div className="grid grid-cols-3 gap-2 text-[11px] uppercase tracking-[0.24em]">
              <span className={`rounded-full border px-3 py-2 text-center ${state === STATES.SELECTING || state === STATES.CONFIRMING ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400' : 'border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] text-slate-400 dark:text-zinc-500'}`}>Zgjedhja</span>
              <span className={`rounded-full border px-3 py-2 text-center ${state === STATES.CONFIRMING ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400' : 'border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] text-slate-400 dark:text-zinc-500'}`}>Konfirmimi</span>
              <span className={`rounded-full border px-3 py-2 text-center ${state === STATES.SUCCESS ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400' : 'border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] text-slate-400 dark:text-zinc-500'}`}>Përfundimi</span>
            </div>
          </div>

          {state === STATES.SELECTING && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="px-5 pt-5 sm:px-6">
                <div className="relative">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Kërko produkt ose barkod..."
                    className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] py-3 pl-10 pr-4 text-[14px] text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:text-zinc-500 outline-none transition focus:border-indigo-500/30 focus:bg-white/50 dark:bg-white/[0.04]"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-4 pt-4 sm:px-4">
                {filteredProducts.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
                    <p className="text-[15px] font-medium text-slate-800 dark:text-zinc-200">Katalogu është bosh</p>
                    <p className="mt-2 text-[13px] text-slate-400 dark:text-zinc-500">Shto produkte në inventar që POS-i i shpejtë të mund t&apos;i përdorë.</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSelect(product)}
                        disabled={product.stoku_aktual <= 0}
                        className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${product.stoku_aktual <= 0 ? 'cursor-not-allowed border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] opacity-40' : 'border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] hover:border-indigo-500/20 hover:bg-indigo-500/[0.08]'}`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-medium text-slate-900 dark:text-zinc-100">{product.emri}</p>
                          <p className="mt-1 text-[12px] text-slate-400 dark:text-zinc-500">Stoku: {product.stoku_aktual}</p>
                        </div>
                        <span className="shrink-0 text-[14px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">{formatEuro(product.cmimi_shitjes)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {state === STATES.CONFIRMING && selected && (
            <div className="flex min-h-0 flex-1 flex-col px-5 py-6 sm:px-6">
              {/* Scrollable Form Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1.5 space-y-5">
                <div className="rounded-[1.5rem] border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] p-4">
                  <p className="text-[12px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Produkti i përzgjedhur</p>
                  <h3 className="mt-2 text-[20px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{selected.emri}</h3>
                  <p className="mt-2 text-[13px] text-slate-400 dark:text-zinc-500">
                    {formatEuro(selected.cmimi_shitjes)} për copë · {selected.stoku_aktual} në stok
                  </p>
                </div>

                <div className="mt-6">
                  <p className="text-[12px] font-medium uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Sasia</p>
                  <div className="mt-3 flex items-center gap-4">
                    <button
                      onClick={() => adjustQty(-1)}
                      disabled={quantity <= 1}
                      className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] text-slate-500 dark:text-zinc-400 transition hover:border-slate-300 dark:border-transparent hover:text-slate-900 dark:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Minus size={18} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={selected.stoku_aktual}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setQuantity(isNaN(val) ? '' : Math.max(1, Math.min(selected.stoku_aktual, val)));
                      }}
                      onBlur={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setQuantity(isNaN(val) || val < 1 ? 1 : Math.min(selected.stoku_aktual, val));
                      }}
                      className="w-24 text-center text-3xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums bg-white/50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-2xl py-2 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-white/[0.05] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => adjustQty(1)}
                      disabled={quantity >= selected.stoku_aktual}
                      className="grid h-12 w-12 place-items-center rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] text-slate-500 dark:text-zinc-400 transition hover:border-slate-300 dark:border-transparent hover:text-slate-900 dark:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Klienti</label>
                    <input
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                      placeholder="Kërko ose zgjidh klient..."
                      className="w-full rounded-xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] px-3 py-2.5 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30"
                    />
                    {showClientDropdown && (
                      <div className="absolute z-[100] mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl custom-scrollbar py-1.5 text-left">
                        <div 
                          onMouseDown={() => {
                            setSelectedClient(null);
                            setClientSearch('Klient i përgjithshëm');
                            setShowClientDropdown(false);
                          }}
                          className="px-3 py-1.5 text-[12px] hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer font-semibold text-indigo-600 dark:text-indigo-400"
                        >
                          Klient i përgjithshëm
                        </div>
                        {clients
                          .filter(c => c.emri.toLowerCase().includes(clientSearch.toLowerCase()))
                          .map(c => (
                            <div
                              key={c.id}
                              onMouseDown={() => {
                                  setSelectedClient(c);
                                  setClientSearch(c.emri);
                                  setShowClientDropdown(false);
                                }}
                              className="px-3 py-1.5 text-[12px] hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-slate-800 dark:text-zinc-200"
                            >
                              <p className="font-semibold">{c.emri}</p>
                              {(c.email || c.telefoni) && (
                                <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                                  {c.email} {c.telefoni && `· ${c.telefoni}`}
                                </p>
                              )}
                            </div>
                          ))}
                        {clients.filter(c => c.emri.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-1.5 text-[11px] text-slate-450 dark:text-zinc-500">
                            Nuk u gjet asnjë klient.
                            <div 
                              onMouseDown={() => {
                                setSelectedClient({ emri: clientSearch });
                                setShowClientDropdown(false);
                              }}
                              className="mt-1 text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-semibold"
                            >
                              Përdor "{clientSearch}"
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Afati</label>
                      <select
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="w-full rounded-xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] px-2 py-2 text-[12px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 dark:bg-zinc-900"
                      >
                        <option value="immediate">Menjëherë</option>
                        <option value="net_15">Net 15</option>
                        <option value="net_30">Net 30</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Mënyra</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full rounded-xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] px-2 py-2 text-[12px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 dark:bg-zinc-900"
                      >
                        <option value="KESH">Kesh</option>
                        <option value="KARTE">Kartë</option>
                        <option value="BANKE">Bankë</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Statusi</label>
                      <select
                        value={invoiceStatus}
                        onChange={(e) => setInvoiceStatus(e.target.value)}
                        className="w-full rounded-xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] px-2 py-2 text-[12px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-550/30 dark:bg-zinc-900"
                      >
                        <option value="paguar">Paguar</option>
                        <option value="ne_pritje">Draft</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500 block mb-1">Zbritje (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={discountRate}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (val >= 0 && val <= 100) {
                            setDiscountRate(e.target.value);
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] px-2 py-2 text-[12px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 dark:bg-zinc-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] p-4 space-y-1.5">
                  <div className="flex justify-between text-[12px] text-slate-500 dark:text-zinc-400">
                    <span>Nëntotali (para zbritjes):</span>
                    <span className="font-semibold tabular-nums">{formatEuro(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[12px] text-slate-500 dark:text-zinc-400">
                      <span>Zbritja ({discountRate}%):</span>
                      <span className="font-semibold tabular-nums text-rose-600 font-mono">-{formatEuro(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[12px] text-slate-500 dark:text-zinc-400">
                    <span>Nëntotali (pa TVSH):</span>
                    <span className="font-semibold tabular-nums">{formatEuro(total - taxAmount)}</span>
                  </div>
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-[12px] text-slate-500 dark:text-zinc-400">
                      <span>TVSH ({taxRate}%):</span>
                      <span className="font-semibold tabular-nums">{formatEuro(taxAmount)}</span>
                    </div>
                  )}
                  <div className="flex items-end justify-between border-t border-slate-200/30 dark:border-transparent pt-1.5">
                    <span className="text-[13px] text-slate-400 dark:text-zinc-500">Totali (përfshirë TVSH)</span>
                    <span className="text-[30px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">{formatEuro(total)}</span>
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="shrink-0 grid gap-3 pt-4 border-t border-slate-200/40 dark:border-transparent mt-4 sm:grid-cols-2">
                <button
                  onClick={handleBack}
                  className="rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[14px] font-medium text-slate-700 dark:text-zinc-300 transition hover:border-slate-300 dark:border-transparent hover:text-slate-900 dark:text-zinc-100"
                >
                  Kthehu
                </button>
                <button
                  onClick={handleSubmit}
                  className="rounded-2xl bg-indigo-600 px-4 py-3 text-[14px] font-semibold text-white shadow-[0_18px_40px_rgba(var(--accent-rgb),0.35)] transition hover:bg-indigo-500"
                >
                  Përfundo Shitjen
                </button>
              </div>
            </div>
          )}

          {state === STATES.LOADING && (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200/60 dark:border-transparent border-t-indigo-500" />
              <p className="mt-4 text-[14px] text-slate-400 dark:text-zinc-500">Po regjistrohet shitja...</p>
            </div>
          )}

          {state === STATES.SUCCESS && receiptData && (
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-600 dark:border-green-500/15 dark:text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.12)]">
                  <Check size={26} />
                </div>
                <p className="mt-5 text-[18px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Shitja u regjistrua me sukses</p>
                <p className="mt-2 text-[14px] text-slate-500 dark:text-zinc-400 tabular-nums">Totali: {formatEuro(total)}</p>

                <div className="mt-8 w-full max-w-sm rounded-[1.5rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-5 text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-indigo-600">Fatura</p>
                      <p className="mt-1 text-[15px] font-medium text-slate-900 dark:text-zinc-100">{receiptData.numri_fatures}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200/60 dark:border-transparent bg-white p-2">
                      <QRCodeSVG value={receiptData.qrUrl} size={48} fgColor="#09090b" bgColor="#ffffff" />
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      onClick={onClose}
                      className="flex justify-center rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[13px] font-medium text-slate-700 dark:text-zinc-300 transition hover:border-slate-300 dark:border-transparent hover:text-slate-900 dark:text-zinc-100"
                    >
                      Mbyll
                    </button>
                    <Link
                      to={`/fature/${receiptData.secure_code || receiptData.id}`}
                      onClick={onClose}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-[13px] font-semibold text-white shadow-[0_18px_40px_rgba(var(--accent-rgb),0.35)] transition hover:bg-indigo-500"
                    >
                      <QrCode size={16} />
                      Hap Faturën
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {state === STATES.ERROR && (
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:border-rose-500/15 dark:text-rose-400">
                  <AlertCircle size={26} />
                </div>
                <p className="mt-5 text-[16px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Diçka shkoi keq</p>
                <p className="mt-2 max-w-sm text-[13px] leading-6 text-slate-400 dark:text-zinc-500">{errorMsg}</p>
                <button
                  onClick={handleBack}
                  className="mt-6 rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] px-5 py-3 text-[13px] font-medium text-slate-700 dark:text-zinc-300 transition hover:border-slate-300 dark:border-transparent hover:text-slate-900 dark:text-zinc-100"
                >
                  Provo përsëri
                </button>
              </div>
            </div>
          )}
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShitjeEShpejte;

ShitjeEShpejte.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaleComplete: PropTypes.func,
};
