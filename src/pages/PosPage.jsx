import { motion } from 'framer-motion';
import { QrCode, ReceiptText, Save, ScanBarcode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

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
  quantity: 1,
});

const PosPage = () => {
  const [products, setProducts] = useState([]);
  const [receiptClient, setReceiptClient] = useState('Klient i përgjithshëm');
  const [receiptBarcode, setReceiptBarcode] = useState('');
  const [receiptItems, setReceiptItems] = useState([]);
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);
  const [receiptResult, setReceiptResult] = useState(null);
  const [receiptError, setReceiptError] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [paymentTerms, setPaymentTerms] = useState('immediate');
  const [invoiceStatus, setInvoiceStatus] = useState('paguar');
  const barcodeRef = useRef(null);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
      
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

  const receiptTaxAmount = useMemo(
    () => receiptSubtotal * (Number(taxRate) / 100),
    [receiptSubtotal, taxRate]
  );

  const receiptTotal = useMemo(
    () => receiptSubtotal + receiptTaxAmount,
    [receiptSubtotal, receiptTaxAmount]
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
          klienti: receiptClient,
          items: receiptItems.map((item) => ({ product_id: item.id, sasia: item.quantity })),
          tax_rate: taxRate,
          payment_terms: paymentTerms,
          statusi: invoiceStatus,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Fatura nuk u krijua');
      }

      setReceiptResult({
        ...data.invoice,
        qrUrl: `${window.location.origin}/fature/${data.invoice.id}`,
      });
      setReceiptItems([]);
      setReceiptBarcode('');
      setTaxRate(0);
      setPaymentTerms('immediate');
      setInvoiceStatus('paguar');
      
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.01),transparent_18%)]" />
      <div className="relative mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        
        <div className="mb-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-600/90">Regjistro Shitje</p>
          <h1 className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-[2.8rem]">Shitje e Re</h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-slate-500 dark:text-zinc-400">
            Shto produkte duke skanuar barkodin, vendos sasinë, dhe regjistro shitjen. Fatura gjenerohet automatikisht.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px] items-start">
          <div className="rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/15 dark:text-emerald-400">
                <ReceiptText size={16} />
              </div>
              <div className="w-full">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Ndërto Faturën</p>
                
                <div className="mt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Klienti</label>
                      <input
                        value={receiptClient}
                        onChange={(event) => setReceiptClient(event.target.value)}
                        placeholder="Klienti (Opcionale)"
                        className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/50 dark:bg-white/[0.04]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Statusi</label>
                      <select
                        value={invoiceStatus}
                        onChange={(e) => setInvoiceStatus(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3.5 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-emerald-500/30 dark:bg-zinc-900"
                      >
                        <option value="paguar">Paguar (Paid)</option>
                        <option value="ne_pritje">Në Pritje (Draft)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Shkalla e TVSH</label>
                      <select
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value))}
                        className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3.5 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-emerald-500/30 dark:bg-zinc-900"
                      >
                        <option value={0}>0% TVSH</option>
                        <option value={8}>8% TVSH</option>
                        <option value={18}>18% TVSH</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Afati i Pagesës</label>
                      <select
                        value={paymentTerms}
                        onChange={(e) => setPaymentTerms(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3.5 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-emerald-500/30 dark:bg-zinc-900"
                      >
                        <option value="immediate">Menjëherë</option>
                        <option value="net_15">Net 15 Ditë</option>
                        <option value="net_30">Net 30 Ditë</option>
                      </select>
                    </div>
                  </div>

                  <div className="relative">
                    <label className="text-[11px] font-medium text-emerald-600 uppercase tracking-widest ml-1 mb-2 block">Shto Produkt (Skano)</label>
                    <div className="relative">
                      <ScanBarcode size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
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
                        className="w-full rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 py-4 pl-10 pr-4 text-[15px] font-mono text-slate-900 dark:text-zinc-100 outline-none transition focus:border-emerald-500/40 focus:bg-emerald-500/10 placeholder:text-slate-400 dark:text-zinc-500 placeholder:font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-widest ml-1 block">Artikujt në Faturë</p>
                    <p className="text-[12px] text-slate-500 dark:text-zinc-400">{receiptItems.length} artikuj</p>
                  </div>
                  <div className="space-y-3 min-h-[200px] max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {receiptItems.length === 0 ? (
                      <div className="flex h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/60 dark:border-white/[0.06] text-center">
                        <ScanBarcode size={24} className="text-slate-400 dark:text-zinc-500 mb-3" />
                        <p className="text-[14px] text-slate-500 dark:text-zinc-400">Fatura është bosh.</p>
                        <p className="text-[13px] text-slate-400 dark:text-zinc-500 mt-1">Skano një produkt për të filluar.</p>
                      </div>
                    ) : (
                      receiptItems.map((item) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={item.id} 
                          className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-medium text-slate-900 dark:text-zinc-100">{item.emri}</p>
                              <p className="mt-1 text-[12px] font-mono text-slate-400 dark:text-zinc-500">{item.kodi_bar}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[15px] font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">{currency.format(item.cmimi_shitjes * item.quantity)}</p>
                              <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1">{currency.format(item.cmimi_shitjes)} / copë</p>
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-200/60 dark:border-white/[0.06] pt-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateReceiptQuantity(item.id, -1)}
                                className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] text-slate-500 dark:text-zinc-400 transition hover:text-slate-900 dark:text-zinc-100 hover:border-slate-300 dark:border-white/[0.12]"
                              >
                                -
                              </button>
                              <span className="min-w-[40px] text-center text-[14px] font-medium text-slate-900 dark:text-zinc-100 tabular-nums">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateReceiptQuantity(item.id, 1)}
                                className="grid h-8 w-8 place-items-center rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] text-slate-500 dark:text-zinc-400 transition hover:text-slate-900 dark:text-zinc-100 hover:border-slate-300 dark:border-white/[0.12]"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => setReceiptItems((current) => current.filter((entry) => entry.id !== item.id))}
                              className="rounded-full px-3 py-1 text-[12px] text-rose-600 transition hover:bg-rose-500/10"
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
                  <div className="mt-4 rounded-2xl border border-rose-500/15 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-600">
                    {receiptError}
                  </div>
                )}
                
                <div className="mt-6 border-t border-slate-200/60 dark:border-white/[0.06] pt-6 space-y-2">
                  <div className="flex justify-between text-[13px] text-slate-500 dark:text-zinc-400">
                    <span>Nëntotali:</span>
                    <span className="font-medium tabular-nums">{currency.format(receiptSubtotal)}</span>
                  </div>
                  {receiptTaxAmount > 0 && (
                    <div className="flex justify-between text-[13px] text-slate-500 dark:text-zinc-400">
                      <span>TVSH ({taxRate}%):</span>
                      <span className="font-medium tabular-nums">{currency.format(receiptTaxAmount)}</span>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 border-t border-slate-200/30 dark:border-white/[0.03]">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Totali Faturës</p>
                      <p className="mt-1 text-[32px] font-bold tracking-tight text-emerald-600 tabular-nums">{currency.format(receiptTotal)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={submitReceipt}
                      disabled={receiptSubmitting || receiptItems.length === 0}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-[14px] font-bold text-white shadow-[0_18px_40px_rgba(16,185,129,0.35)] transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none w-full sm:w-auto"
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
                className="rounded-[1.75rem] border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5 p-6 shadow-[0_20px_60px_rgba(16,185,129,0.08)] backdrop-blur-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-500 text-zinc-950">
                    <QrCode size={18} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-600">Sukses</p>
                    <h3 className="text-[16px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{receiptResult.numri_fatures}</h3>
                  </div>
                </div>
                
                <div className="mt-6 grid place-items-center rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white p-6 shadow-inner">
                  <QRCodeSVG value={receiptResult.qrUrl} size={180} fgColor="#09090b" bgColor="#ffffff" />
                </div>
                
                <p className="mt-5 text-center text-[13px] leading-6 text-slate-700 dark:text-zinc-300">
                  Fatura u ruajt. Skano kodin për t'i dërguar klientit faturën dixhitale ose shtyp butonin më poshtë.
                </p>
                
                <Link
                  to={`/fature/${receiptResult.id}`}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[13px] font-medium text-emerald-600 transition hover:bg-emerald-500/20"
                >
                  <ReceiptText size={16} />
                  Shiko & Printo Faturën
                </Link>
                <Link
                  to="/libri-shitjes"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[13px] font-medium text-slate-700 dark:text-zinc-300 transition hover:border-slate-300 dark:hover:border-white/[0.12]"
                >
                  Shko te Libri i Shitjes →
                </Link>
              </motion.div>
            ) : (
              <div className="rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-6 text-center opacity-60">
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] text-slate-400 dark:text-zinc-500">
                  <QrCode size={20} />
                </div>
                <h3 className="text-[14px] font-medium text-slate-700 dark:text-zinc-300">Gjeneratori i QR</h3>
                <p className="mt-2 text-[13px] leading-6 text-slate-400 dark:text-zinc-500">
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
