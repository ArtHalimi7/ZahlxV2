import { motion } from 'framer-motion';
import { QrCode, ReceiptText, Save, ScanBarcode, Plus, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const currency = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const emptyReceiptItem = (product) => ({
  id: product.id,
  emri: product.emri,
  kodi_bar: product.kodi_bar,
  cmimi_shitjes: Number(product.cmimi_shitjes),
  tax_rate: Number(product.tax_rate || 0),
  quantity: 1,
});

const PosPage = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientSearch, setClientSearch] = useState('Klient i përgjithshëm');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [receiptBarcode, setReceiptBarcode] = useState('');
  const [receiptItems, setReceiptItems] = useState([]);
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);
  const [receiptResult, setReceiptResult] = useState(null);
  const [receiptError, setReceiptError] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('immediate');
  const [invoiceStatus, setInvoiceStatus] = useState('paguar');
  const [paymentMethod, setPaymentMethod] = useState('KESH');
  const [discountRate, setDiscountRate] = useState('0');
  const barcodeRef = useRef(null);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));

    fetch('/api/clients')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]));
      
    // Focus the barcode input on load
    window.setTimeout(() => barcodeRef.current?.focus(), 100);
  }, []);

  const productIndex = useMemo(() => {
    const map = new Map();
    products.forEach((product) => {
      if (product.kodi_bar) {
        map.set(String(product.kodi_bar).trim().toLowerCase(), product);
      }
    });
    return map;
  }, [products]);

  const receiptSubtotal = useMemo(
    () => receiptItems.reduce((total, item) => total + item.cmimi_shitjes * item.quantity, 0),
    [receiptItems]
  );

  const discountAmount = useMemo(
    () => receiptSubtotal * (Number(discountRate || 0) / 100),
    [receiptSubtotal, discountRate]
  );

  const receiptTotal = useMemo(
    () => receiptSubtotal - discountAmount,
    [receiptSubtotal, discountAmount]
  );

  const receiptTaxAmount = useMemo(
    () => {
      const baseTax = receiptItems.reduce((total, item) => {
        const rate = Number(item.tax_rate || 0);
        const itemTotal = item.cmimi_shitjes * item.quantity;
        return total + (rate > 0 ? itemTotal * (rate / (100 + rate)) : 0);
      }, 0);
      return baseTax * (1 - Number(discountRate || 0) / 100);
    },
    [receiptItems, discountRate]
  );

  const addReceiptProduct = (barcode) => {
    const normalized = barcode.trim().toLowerCase();
    if (!normalized) return;

    const product = productIndex.get(normalized);
    if (!product) {
      setReceiptError('Ky barkod nuk u gjet në katalog.');
      return;
    }

    setReceiptError('');
    setReceiptItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => (
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      }
      return [...current, emptyReceiptItem(product)];
    });
  };

  const updateReceiptQuantity = (id, delta) => {
    setReceiptItems((current) => current
      .map((item) => {
        if (item.id !== id) return item;
        const next = item.quantity + delta;
        if (next < 1) return item;
        return { ...item, quantity: next };
      })
      .filter((item) => item.quantity > 0));
  };

  const submitReceipt = async () => {
    if (receiptItems.length === 0) {
      setReceiptError('Shto së paku një produkt për të gjeneruar faturën.');
      return;
    }

    setReceiptSubmitting(true);
    setReceiptError('');

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          klienti: selectedClient ? selectedClient.emri : (clientSearch || 'Klient i përgjithshëm'),
          klient_email: selectedClient?.email || null,
          klient_telefoni: selectedClient?.telefoni || null,
          klient_adresa: selectedClient?.adresa || null,
          items: receiptItems.map((item) => ({ product_id: item.id, sasia: item.quantity, tax_rate: item.tax_rate })),
          tax_rate: 0,
          payment_terms: paymentTerms,
          statusi: invoiceStatus,
          menyra_pageses: paymentMethod,
          discount_rate: Number(discountRate || 0),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Fatura nuk u krijua');
      }

      setReceiptResult({
        ...data.invoice,
        qrUrl: `${window.location.origin}/fature/${data.invoice.secure_code}`,
      });
      setReceiptItems([]);
      setReceiptBarcode('');
      setPaymentTerms('immediate');
      setInvoiceStatus('paguar');
      setPaymentMethod('KESH');
      setDiscountRate('0');
      setSelectedClient(null);
      setClientSearch('Klient i përgjithshëm');
      
      // Focus back to barcode to be ready for next sale
      window.setTimeout(() => barcodeRef.current?.focus(), 100);
      
    } catch (error) {
      setReceiptError(error.message);
    } finally {
      setReceiptSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(var(--accent-rgb),0.08),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.01),transparent_18%)]" />
      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        
        {/* Page title */}
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-600/90 font-medium">Regjistro Shitje</p>
          <h1 className="mt-3 text-[2rem] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[2.8rem] leading-[1.15]">
            Shitje e Re
          </h1>
          <p className="mt-2 text-[14px] text-slate-500 dark:text-zinc-400 max-w-xl">
            Shto produkte duke skanuar barkodin, vendos sasinë, dhe regjistro shitjen. Fatura gjenerohet automatikisht.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px] items-start">
          <div className="rounded-[2.5rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-6 sm:p-8 shadow-sm backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400">
                <ReceiptText size={16} />
              </div>
              <div className="w-full">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Ndërto Faturën</p>
                
                <div className="mt-6 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="relative">
                      <label className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Klienti</label>
                      <input
                        value={clientSearch}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                          setShowClientDropdown(true);
                        }}
                        onFocus={() => setShowClientDropdown(true)}
                        onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                        placeholder="Kërko ose zgjidh klient..."
                        className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
                      />
                      {showClientDropdown && (
                        <div className="absolute z-[100] mt-1 w-full max-h-60 overflow-y-auto rounded-2xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl custom-scrollbar py-2 text-left">
                          <div 
                            onMouseDown={() => {
                              setSelectedClient(null);
                              setClientSearch('Klient i përgjithshëm');
                              setShowClientDropdown(false);
                            }}
                            className="px-4 py-2 text-[13px] hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer font-semibold text-indigo-600 dark:text-indigo-400"
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
                                className="px-4 py-2 text-[13px] hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer text-slate-800 dark:text-zinc-200"
                              >
                                <p className="font-semibold">{c.emri}</p>
                                {(c.email || c.telefoni) && (
                                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">
                                    {c.email} {c.telefoni && `· ${c.telefoni}`}
                                  </p>
                                )}
                              </div>
                            ))}
                          {clients.filter(c => c.emri.toLowerCase().includes(clientSearch.toLowerCase())).length === 0 && (
                            <div className="px-4 py-2 text-[12px] text-slate-400 dark:text-zinc-500">
                              Nuk u gjet asnjë klient. Shtypni për ta përdorur këtë emër:
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
                  </div>
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Afati i Pagesës</label>
                      <select
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3.5 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 dark:bg-zinc-900"
                      >
                        <option value="immediate">Menjëherë</option>
                        <option value="net_15">Net 15 Ditë</option>
                        <option value="net_30">Net 30 Ditë</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Mënyra e Pagesës</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3.5 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 dark:bg-zinc-900"
                      >
                        <option value="KESH">Kesh (Cash)</option>
                        <option value="KARTE">Kartë (Card)</option>
                        <option value="BANKE">Bankë (Bank)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Statusi</label>
                      <select
                        value={invoiceStatus}
                        onChange={(e) => setInvoiceStatus(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3.5 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 dark:bg-zinc-900"
                      >
                        <option value="paguar">Paguar (Paid)</option>
                        <option value="ne_pritje">Në Pritje (Draft)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Zbritje (%)</label>
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
                        className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3.5 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="relative">
                      <label className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest ml-1 mb-2 block">Shto Produkt (Skano)</label>
                      <div className="relative">
                        <ScanBarcode size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                        <input
                          ref={barcodeRef}
                          value={receiptBarcode}
                          onChange={(event) => setReceiptBarcode(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              addReceiptProduct(receiptBarcode);
                              setReceiptBarcode('');
                            }
                          }}
                          placeholder="Skano ose shtyp barkodin dhe jep Enter..."
                          className="w-full rounded-2xl border border-indigo-500/20 bg-indigo-500/5 py-4 pl-12 pr-4 text-[15px] font-mono text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/40 focus:bg-indigo-500/10 placeholder:text-slate-400 dark:placeholder:text-zinc-600 placeholder:font-sans"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Zgjidh Produktin (Manuale)</label>
                      <select
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            const product = products.find(p => p.id === Number(val));
                            if (product) {
                              setReceiptError('');
                              setReceiptItems((current) => {
                                const existing = current.find((item) => item.id === product.id);
                                if (existing) {
                                  return current.map((item) => (
                                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                                  ));
                                }
                                return [...current, emptyReceiptItem(product)];
                              });
                            }
                          }
                        }}
                        className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3.5 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 dark:bg-zinc-900"
                      >
                        <option value="">-- Zgjidh produkt pa barkod --</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id} disabled={p.stoku_aktual <= 0}>
                            {p.emri} - {currency.format(p.cmimi_shitjes)} {p.stoku_aktual <= 0 ? '(Jashtë stokut)' : `(Stoku: ${p.stoku_aktual})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1 block">Artikujt në Faturë</p>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-zinc-400">{receiptItems.length} artikuj</p>
                  </div>
                  
                  <div className="space-y-3 min-h-[220px] max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {receiptItems.length === 0 ? (
                      <div className="flex h-[220px] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-200/60 dark:border-transparent text-center">
                        <ScanBarcode size={24} className="text-slate-400 dark:text-zinc-500 mb-3" />
                        <p className="text-[14px] font-medium text-slate-500 dark:text-zinc-400">Fatura është bosh.</p>
                        <p className="text-[12px] text-slate-400 dark:text-zinc-500 mt-1">Skano një produkt për të filluar.</p>
                      </div>
                    ) : (
                      receiptItems.map((item) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={item.id} 
                          className="rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3.5 hover:bg-white/60 dark:hover:bg-white/[0.03] transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-semibold text-slate-900 dark:text-zinc-100">{item.emri}</p>
                              <p className="mt-1 text-[11px] font-mono text-slate-400 dark:text-zinc-500">{item.kodi_bar}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[15px] font-bold text-slate-900 dark:text-zinc-100 tabular-nums">{currency.format(item.cmimi_shitjes * item.quantity)}</p>
                              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">{currency.format(item.cmimi_shitjes)} / copë (TVSH {item.tax_rate}%)</p>
                            </div>
                          </div>
                          
                          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200/40 dark:border-transparent pt-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateReceiptQuantity(item.id, -1)}
                                className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] text-slate-500 dark:text-zinc-400 transition hover:text-slate-900 dark:hover:text-zinc-100 hover:border-slate-300 dark:hover:border-white/[0.12]"
                              >
                                -
                              </button>
                              <span className="min-w-[32px] text-center text-[14px] font-bold text-slate-900 dark:text-zinc-100 tabular-nums">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateReceiptQuantity(item.id, 1)}
                                className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] text-slate-500 dark:text-zinc-400 transition hover:text-slate-900 dark:hover:text-zinc-100 hover:border-slate-300 dark:hover:border-white/[0.12]"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setReceiptItems((current) => current.filter((entry) => entry.id !== item.id))}
                              className="rounded-full px-3 py-1 text-[12px] font-medium text-rose-600 transition hover:bg-rose-500/10"
                            >
                              Hiq
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {receiptError && (
                  <div className="mt-4 rounded-2xl border border-rose-500/15 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-600 font-medium">
                    {receiptError}
                  </div>
                )}
                
                <div className="mt-6 border-t border-slate-200/60 dark:border-transparent pt-6 space-y-2">
                  <div className="flex justify-between text-[13px] text-slate-500 dark:text-zinc-400">
                    <span>Nëntotali (para zbritjes):</span>
                    <span className="font-semibold tabular-nums text-slate-700 dark:text-zinc-300">{currency.format(receiptSubtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-[13px] text-slate-500 dark:text-zinc-400">
                      <span>Zbritja ({discountRate}%):</span>
                      <span className="font-semibold tabular-nums text-rose-600 font-mono">-{currency.format(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[13px] text-slate-500 dark:text-zinc-400">
                    <span>Nëntotali (pa TVSH):</span>
                    <span className="font-semibold tabular-nums text-slate-700 dark:text-zinc-300">{currency.format(receiptTotal - receiptTaxAmount)}</span>
                  </div>
                  {receiptTaxAmount > 0 && (
                    <div className="flex justify-between text-[13px] text-slate-500 dark:text-zinc-400">
                      <span>TVSH:</span>
                      <span className="font-semibold tabular-nums text-slate-700 dark:text-zinc-300">{currency.format(receiptTaxAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-3 border-t border-slate-200/30 dark:border-transparent mt-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Totali (përfshirë TVSH)</p>
                      <p className="mt-1 text-[30px] font-bold tracking-tight text-indigo-600 dark:text-indigo-400 tabular-nums">{currency.format(receiptTotal)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={submitReceipt}
                      disabled={receiptSubmitting || receiptItems.length === 0}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-[14px] font-bold text-white shadow-[0_12px_30px_rgba(var(--accent-rgb),0.25)] transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none w-full sm:w-auto"
                    >
                      <Save size={18} />
                      {receiptSubmitting ? 'Duke procesuar...' : 'Regjistro & Gjenero Faturë'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {receiptResult ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-8 shadow-sm backdrop-blur-xl"
              >
                {/* Soft success light glow top right */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-green-500/10 dark:bg-green-500/5 blur-3xl" />
                
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-600 dark:text-green-400">Sukses</p>
                    <h3 className="text-[15px] font-mono font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{receiptResult.numri_fatures}</h3>
                  </div>
                </div>
                
                <div className="mt-6 flex flex-col items-center justify-center p-6 rounded-3xl border border-slate-200/40 dark:border-transparent bg-white dark:bg-zinc-900 shadow-inner">
                  <QRCodeSVG value={receiptResult.qrUrl} size={160} fgColor="#09090b" bgColor="#ffffff" className="dark:hidden" />
                  <QRCodeSVG value={receiptResult.qrUrl} size={160} fgColor="#ffffff" bgColor="#09090b" className="hidden dark:block" />
                  <p className="mt-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Skano për faturën</p>
                </div>
                
                <p className="mt-5 text-center text-[13px] leading-relaxed text-slate-600 dark:text-zinc-300">
                  Fatura u ruajt. Skano kodin për t'i dërguar klientit faturën dixhitale ose shtyp butonin më poshtë.
                </p>
                
                <Link
                  to={`/fature/${receiptResult.secure_code}`}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-[13px] font-bold text-white shadow-[0_12px_30px_rgba(var(--accent-rgb),0.25)] transition hover:bg-indigo-500"
                >
                  <ReceiptText size={16} />
                  Shiko & Printo Faturën
                </Link>
                <Link
                  to="/libri-shitjes"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] px-4 py-3.5 text-[13px] font-semibold text-slate-700 dark:text-zinc-300 transition hover:border-slate-300 dark:hover:border-white/[0.12]"
                >
                  Shko te Libri i Shitjes →
                </Link>
              </motion.div>
            ) : (
              <div className="rounded-[2.5rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-8 text-center opacity-70 shadow-sm backdrop-blur-xl">
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] text-slate-400 dark:text-zinc-500">
                  <QrCode size={20} />
                </div>
                <h3 className="text-[14px] font-semibold text-slate-850 dark:text-zinc-200">Gjeneratori i QR</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-450 dark:text-zinc-400">
                  Pas regjistrimit të shitjes, kodi QR dhe detajet e faturës do të shfaqen këtu për klientin.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PosPage;
