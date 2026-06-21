import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  BarChart2,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Clock,
  Copy,
  Info,
  Package,
  Plus,
  QrCode,
  Receipt,
  RefreshCw,
  ScanLine,
  Search,
  ShoppingBag,
  Trash2,
  TrendingDown,
  Wallet,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const currency = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const STATUS_LABELS = {
  paguar: 'Paguar',
  ne_pritje: 'Në Pritje',
  anuluar: 'Anuluar',
};

const STATUS_COLORS = {
  paguar: 'border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400',
  ne_pritje: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  anuluar: 'border-neutral-500/20 bg-neutral-500/10 text-neutral-600 dark:text-neutral-400',
};

const METRIC_COLORS = {
  indigo: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400',
  rose: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:border-rose-500/15 dark:text-rose-400',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/15 dark:text-amber-400',
  green: 'border-green-500/20 bg-green-500/10 text-green-600 dark:border-green-500/15 dark:text-green-400',
};

const emptyItem = { emri: '', kodi_bar: '', sasia: 1, cmimi_per_njesi: '' };

// ─── Barcode Scanner input (same UX as InventoryPage) ───────────────────────
const ScannerPanel = ({ onScan, scanResult, scanError, scanning }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    const code = value.trim();
    if (code) {
      onScan(code);
      setValue('');
    }
  };

  return (
    <div className="rounded-[2.5rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-6 sm:p-7 shadow-sm backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200/40 dark:border-transparent pb-5 mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Importo automatikisht</p>
          <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Skano Faturën e Furnitorit</h2>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <QrCode size={18} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <ScanLine size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
          <input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Skano barkoden e faturës ZahlX ose fut kodin manual..."
            className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] py-3.5 pl-11 pr-4 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
          />
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={scanning}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 dark:bg-indigo-500/15 px-5 py-3.5 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 shadow-[0_4px_14px_rgba(99,102,241,0.12)] transition hover:bg-indigo-500/20 disabled:opacity-50"
        >
          {scanning ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
          {scanning ? 'Duke lexuar...' : 'Lexo'}
        </button>
      </div>

      {scanResult && (
        <div className="mt-4 rounded-2xl border border-green-500/20 bg-green-500/8 dark:bg-green-500/[0.06] px-4 py-3 text-[13px] text-green-700 dark:text-green-400 font-medium">
          <Check size={14} className="inline mr-1.5 -mt-0.5" />
          Fatura e gjet: <span className="font-bold">{scanResult.numri_fatures}</span> nga <span className="font-bold">{scanResult.furnitori}</span>
        </div>
      )}
      {scanError && (
        <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/8 dark:bg-rose-500/[0.06] px-4 py-3 text-[13px] text-rose-700 dark:text-rose-400 font-medium">
          <AlertTriangle size={14} className="inline mr-1.5 -mt-0.5" />
          {scanError}
        </div>
      )}

      <p className="mt-4 text-[12px] text-slate-400 dark:text-zinc-500 leading-relaxed">
        Skano barkoden e faturës nga një furnitor tjetër ZahlX për të importuar automatikisht artikujt. Mund të përdorni scanner fizik ose ta shkruani kodin manual.
      </p>
    </div>
  );
};

// ─── Purchase Entry Modal ────────────────────────────────────────────────────
const PurchaseModal = ({ isOpen, onClose, onSave, prefill = null }) => {
  const [furnitori, setFurnitori] = useState('');
  const [statusi, setStatusi] = useState('paguar');
  const [taxRate, setTaxRate] = useState('0');
  const [discountRate, setDiscountRate] = useState('0');
  const [updateStock, setUpdateStock] = useState(false);
  const [shenime, setShenime] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset when modal opens, or prefill from scan
  useEffect(() => {
    if (!isOpen) return;
    if (prefill) {
      setFurnitori(prefill.furnitori || '');
      setStatusi('ne_pritje');
      setTaxRate(String(prefill.tax_rate || 0));
      setDiscountRate(String(prefill.discount_rate || 0));
      setUpdateStock(true);
      setShenime(`Importuar nga fatura: ${prefill.numri_fatures}`);
      setItems(
        prefill.items?.map(i => ({
          emri: i.emri,
          kodi_bar: i.kodi_bar || '',
          sasia: Number(i.sasia),
          cmimi_per_njesi: String(i.cmimi_per_njesi),
        })) || [{ ...emptyItem }]
      );
    } else {
      setFurnitori('');
      setStatusi('paguar');
      setTaxRate('0');
      setDiscountRate('0');
      setUpdateStock(false);
      setShenime('');
      setItems([{ ...emptyItem }]);
    }
    setError('');
  }, [isOpen, prefill]);

  const addItem = () => setItems(prev => [...prev, { ...emptyItem }]);
  const removeItem = idx => setItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) =>
    setItems(prev => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + Number(item.sasia || 1) * Number(item.cmimi_per_njesi || 0);
    }, 0);
  }, [items]);

  const discount = subtotal * (Number(discountRate) / 100);
  const taxable = subtotal - discount;
  const tax = taxable * (Number(taxRate) / 100);
  const grandTotal = taxable + tax;

  const handleSave = async () => {
    setError('');
    if (!furnitori.trim()) return setError('Emri i furnitorit është i detyrueshëm.');
    const validItems = items.filter(i => i.emri.trim() && Number(i.cmimi_per_njesi) >= 0);
    if (validItems.length === 0) return setError('Shtoni të paktën një artikull me emër dhe çmim.');

    setSaving(true);
    try {
      await onSave({
        furnitori: furnitori.trim(),
        source_invoice_secure_code: prefill?.secure_code || null,
        source_invoice_numri: prefill?.numri_fatures || null,
        items: validItems,
        tax_rate: Number(taxRate),
        discount_rate: Number(discountRate),
        statusi,
        shenime: shenime.trim() || null,
        update_stock: updateStock,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Gabim gjatë ruajtjes.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-6 md:p-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.button
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative z-10 flex h-auto max-h-[96vh] sm:max-h-[92vh] w-full max-w-[680px] flex-col border border-slate-200/60 dark:border-transparent bg-white/95 dark:bg-black/95 shadow-2xl rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden backdrop-blur-2xl"
        >
          {/* Modal Header */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-200/40 dark:border-transparent px-4 sm:px-6 py-4 sm:py-5 shrink-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-400">
                {prefill ? 'Importuar nga fatura' : 'Regjistrim i ri'}
              </p>
              <h3 className="mt-1 text-[18px] font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                {prefill ? `Blerje nga ${prefill.furnitori}` : 'Blerje e Re'}
              </h3>
              {prefill && (
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 font-mono">{prefill.numri_fatures}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] p-2 text-slate-500 dark:text-zinc-400 transition hover:text-slate-900 dark:hover:text-zinc-100"
            >
              <X size={16} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 custom-scrollbar">
            <div className="grid gap-5">

              {/* Furnitori */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 ml-1 mb-2 block uppercase tracking-wider">Furnitori / Shitësi</label>
                <input
                  value={furnitori}
                  onChange={e => setFurnitori(e.target.value)}
                  placeholder="p.sh. ABC Supplies sh.p.k."
                  className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
                />
              </div>

              {/* Status & Tax row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 ml-1 mb-2 block uppercase tracking-wider">Statusi</label>
                  <select
                    value={statusi}
                    onChange={e => setStatusi(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30"
                  >
                    <option value="paguar">Paguar</option>
                    <option value="ne_pritje">Në Pritje</option>
                    <option value="anuluar">Anuluar</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 ml-1 mb-2 block uppercase tracking-wider">TVSH %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={taxRate}
                    onChange={e => setTaxRate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 ml-1 mb-2 block uppercase tracking-wider">Zbritje %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={discountRate}
                    onChange={e => setDiscountRate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 ml-1 uppercase tracking-wider">Artikujt e Blerjes</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 transition hover:bg-indigo-500/20"
                  >
                    <Plus size={12} />
                    Shto artikull
                  </button>
                </div>

                <div className="space-y-2.5">
                  {items.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl border border-slate-200/40 dark:border-transparent bg-white/20 dark:bg-white/[0.01] space-y-3 sm:space-y-0 sm:bg-transparent sm:dark:bg-transparent sm:border-0 sm:p-0 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:gap-2 sm:items-start">
                      <div className="space-y-2 sm:space-y-0">
                        <input
                          value={item.emri}
                          onChange={e => updateItem(idx, 'emri', e.target.value)}
                          placeholder={`Artikulli ${idx + 1}`}
                          className="w-full rounded-xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-3 py-2.5 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30"
                        />
                        <input
                          value={item.kodi_bar}
                          onChange={e => updateItem(idx, 'kodi_bar', e.target.value)}
                          placeholder="Barkod (opsionale)"
                          className="w-full sm:mt-1.5 rounded-xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-3 py-2 text-[11px] font-mono text-slate-600 dark:text-zinc-400 outline-none transition focus:border-indigo-500/30"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 sm:contents">
                        <div className="flex-1 sm:flex-initial">
                          <label className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider ml-1 mb-1 block sm:hidden">Sasia</label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.sasia}
                            onChange={e => updateItem(idx, 'sasia', e.target.value)}
                            placeholder="Sasia"
                            title="Sasia"
                            className="w-full sm:w-20 rounded-xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-3 py-2.5 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 text-right"
                          />
                        </div>
                        
                        <div className="flex-1 sm:flex-initial">
                          <label className="text-[9px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider ml-1 mb-1 block sm:hidden">Çmimi</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.cmimi_per_njesi}
                            onChange={e => updateItem(idx, 'cmimi_per_njesi', e.target.value)}
                            placeholder="€/njësi"
                            title="Çmimi për njësi"
                            className="w-full sm:w-24 rounded-xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-3 py-2.5 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 text-right"
                          />
                        </div>

                        <div className="shrink-0 self-end sm:self-start">
                          <label className="text-[9px] font-semibold text-transparent uppercase tracking-wider mb-1 block sm:hidden">Fshi</label>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            disabled={items.length === 1}
                            className="p-2.5 rounded-xl border border-rose-500/15 bg-rose-500/8 text-rose-500 transition hover:bg-rose-500/15 disabled:opacity-30"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals summary */}
              <div className="rounded-2xl border border-slate-200/40 dark:border-transparent bg-white/30 dark:bg-white/[0.01] px-5 py-4">
                <div className="space-y-1.5 text-[12px]">
                  <div className="flex justify-between text-slate-500 dark:text-zinc-500">
                    <span>Nëntotali</span>
                    <span className="font-mono">{currency.format(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>Zbritja ({discountRate}%)</span>
                      <span className="font-mono">- {currency.format(discount)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="flex justify-between text-slate-500 dark:text-zinc-500">
                      <span>TVSH ({taxRate}%)</span>
                      <span className="font-mono">{currency.format(tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-slate-900 dark:text-zinc-100 text-[14px] pt-1.5 border-t border-slate-200/40 dark:border-transparent">
                    <span>Totali</span>
                    <span className="font-mono">{currency.format(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Stock update toggle */}
              <div className="flex items-center justify-between rounded-2xl border border-slate-200/40 dark:border-transparent bg-white/30 dark:bg-white/[0.01] px-5 py-3.5">
                <div>
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-zinc-200">Përditëso stokun automatikisht</p>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">Shton sasitë e blerë në stokun e produkteve të njohura nga barkodi</p>
                </div>
                <button
                  type="button"
                  onClick={() => setUpdateStock(v => !v)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${updateStock ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-zinc-700'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${updateStock ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 ml-1 mb-2 block uppercase tracking-wider">Shënime (opsionale)</label>
                <textarea
                  value={shenime}
                  onChange={e => setShenime(e.target.value)}
                  rows={2}
                  placeholder="Çdo informacion shtesë rreth kësaj blerjeje..."
                  className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 resize-none"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-rose-500/15 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-600 font-semibold">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-200/40 dark:border-transparent px-4 sm:px-6 py-3.5 sm:py-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 sm:px-5 py-2.5 sm:py-3 text-[13px] font-semibold text-slate-700 dark:text-zinc-300 transition hover:bg-white/60 dark:hover:bg-white/[0.04]"
            >
              Anulo
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-500/25 bg-indigo-500/15 px-5 sm:px-6 py-2.5 sm:py-3 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 shadow-[0_4px_14px_rgba(99,102,241,0.2)] transition hover:bg-indigo-500/25 disabled:opacity-60"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Duke ruajtur...' : 'Regjistro Blerjen'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const PurchasesPage = () => {
  const [purchases, setPurchases] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalSpend: 0, totalTax: 0, thisMonthSpend: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [scanPrefill, setScanPrefill] = useState(null);

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('statusi', statusFilter);
      const res = await fetch(`/api/purchases?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gabim');
      setPurchases(data.purchases || []);
      setMeta(data.meta || {});
    } catch {
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Barcode scan handler
  const handleScan = async (code) => {
    setScanError('');
    setScanResult(null);
    setScanning(true);
    try {
      const res = await fetch(`/api/purchases/scan/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fatura nuk u gjet');
      setScanResult(data);
      setScanPrefill(data);
      setTimeout(() => setModalOpen(true), 400);
    } catch (err) {
      setScanError(err.message);
    } finally {
      setScanning(false);
    }
  };

  const handleSavePurchase = async (payload) => {
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gabim');
    await fetchPurchases();
    setScanResult(null);
    setScanPrefill(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Të fshihet kjo blerje?')) return;
    await fetch(`/api/purchases/${id}`, { method: 'DELETE' });
    await fetchPurchases();
  };

  const handleStatusChange = async (id, newStatus) => {
    await fetch(`/api/purchases/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statusi: newStatus }),
    });
    await fetchPurchases();
  };

  const openManualModal = () => {
    setScanPrefill(null);
    setScanResult(null);
    setScanError('');
    setModalOpen(true);
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(var(--accent-rgb),0.08),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.01),transparent_18%)]" />

      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* Page Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-600/90 dark:text-indigo-400/90 font-medium">Blerjet &amp; Shpenzimet</p>
            <h1 className="mt-3 text-[2rem] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[2.8rem] leading-[1.15]">
              Libri i Blerjes
            </h1>
            <p className="mt-2 text-[14px] text-slate-500 dark:text-zinc-400 max-w-xl">
              Regjistro blerjet nga furnitorët, importo fatura ZahlX me barkod, dhe menaxho shpenzimet e biznesit.
            </p>
          </div>
          <button
            type="button"
            onClick={openManualModal}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-full border border-indigo-500/20 bg-indigo-500/10 dark:bg-indigo-500/15 px-5 py-3.5 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 shadow-[0_12px_30px_rgba(var(--accent-rgb),0.15)] transition hover:border-indigo-500/30 hover:bg-indigo-500/20"
          >
            <Plus size={16} />
            Blerje e Re
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Totali i Blerjeve',
              value: currency.format(meta.totalSpend),
              sub: `${meta.total} blerje të regjistruara`,
              icon: ShoppingBag,
              color: 'indigo',
            },
            {
              label: 'Blerjet Këtë Muaj',
              value: currency.format(meta.thisMonthSpend),
              sub: 'Muaji aktual',
              icon: TrendingDown,
              color: 'rose',
            },
            {
              label: 'TVSH e Paguar',
              value: currency.format(meta.totalTax),
              sub: 'Gjithsej TVSH blerje',
              icon: Receipt,
              color: 'amber',
            },
            {
              label: 'Shpenzime Neto',
              value: currency.format(meta.totalSpend - meta.totalTax),
              sub: 'Pa TVSH',
              icon: Wallet,
              color: 'green',
            },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-3xl border border-zinc-200/50 dark:border-transparent bg-white dark:bg-black p-4 sm:p-5 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400 truncate">{label}</p>
                  <p className="mt-2 text-[20px] sm:text-[22px] font-bold text-slate-900 dark:text-zinc-100 tracking-tight font-mono">{value}</p>
                </div>
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl border ${METRIC_COLORS[color]}`}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-400 dark:text-zinc-500 pt-2 border-t border-slate-200/40 dark:border-transparent">{sub}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">

          {/* Left: Main Table */}
          <div className="space-y-6">

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Kërko furnitor, numër blerje..."
                  className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/70 dark:bg-white/[0.03] py-2.5 pl-9 pr-4 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none snap-x snap-mandatory" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {['', 'paguar', 'ne_pritje', 'anuluar'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-2xl border px-4 py-2 text-[12px] font-semibold transition shrink-0 snap-start ${statusFilter === s
                      ? 'border-indigo-500/30 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] text-slate-600 dark:text-zinc-400 hover:bg-white/60 dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    {s === '' ? 'Të gjitha' : STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Purchases Table */}
            <div className="rounded-[2.5rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] shadow-sm backdrop-blur-xl overflow-hidden">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200/40 dark:border-transparent px-6 py-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Regjistruar</p>
                  <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
                    Të gjitha blerjet
                    <span className="ml-2 text-[12px] font-normal text-slate-400 dark:text-zinc-500">({purchases.length})</span>
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={fetchPurchases}
                  disabled={loading}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] text-slate-500 dark:text-zinc-400 transition hover:bg-white/60 dark:hover:bg-white/[0.04]"
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Desktop/Tablet Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.02] text-[11px] uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                      <th className="px-6 py-4 font-semibold">Blerja</th>
                      <th className="px-6 py-4 font-semibold">Furnitori</th>
                      <th className="px-6 py-4 font-semibold">Data</th>
                      <th className="px-6 py-4 font-semibold text-right">Totali</th>
                      <th className="px-6 py-4 font-semibold">Statusi</th>
                      <th className="px-6 py-4 text-right font-semibold">Veprime</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/40 dark:divide-transparent">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-zinc-500">
                          <RefreshCw size={20} className="mx-auto mb-2 animate-spin opacity-40" />
                          Duke ngarkuar blerjet...
                        </td>
                      </tr>
                    ) : purchases.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-16 text-center">
                          <ShoppingBag size={32} className="mx-auto mb-3 text-slate-300 dark:text-zinc-600" />
                          <p className="text-[14px] font-semibold text-slate-500 dark:text-zinc-400">Nuk ka blerje të regjistruara</p>
                          <p className="mt-1 text-[12px] text-slate-400 dark:text-zinc-500">Skano një faturë ose shto blerje manuale</p>
                        </td>
                      </tr>
                    ) : (
                      purchases.map(p => (
                        <tr key={p.id} className="transition-colors hover:bg-white/60 dark:hover:bg-white/[0.03]">
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900 dark:text-zinc-100 font-mono text-[12px]">{p.numri_blerjes}</p>
                            {p.source_invoice_numri && (
                              <p className="mt-0.5 text-[10px] text-indigo-500 font-mono flex items-center gap-1">
                                <QrCode size={9} />
                                {p.source_invoice_numri}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-slate-800 dark:text-zinc-200">{p.furnitori}</p>
                          </td>
                          <td className="px-6 py-4 text-slate-500 dark:text-zinc-400 text-[12px] font-mono">
                            {new Date(p.data_blerjes).toLocaleDateString('sq-AL')}
                          </td>
                          <td className="px-6 py-4 text-right font-bold tabular-nums text-slate-900 dark:text-zinc-100">
                            {currency.format(p.totali)}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={p.statusi}
                              onChange={e => handleStatusChange(p.id, e.target.value)}
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold outline-none cursor-pointer bg-white dark:bg-zinc-950 ${STATUS_COLORS[p.statusi]}`}
                            >
                              <option value="paguar">Paguar</option>
                              <option value="ne_pritje">Në Pritje</option>
                              <option value="anuluar">Anuluar</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/15 bg-rose-500/10 px-3 py-2 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-500/15"
                            >
                              <Trash2 size={12} />
                              Fshi
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-slate-200/40 dark:divide-zinc-800/50">
                {loading ? (
                  <div className="px-6 py-12 text-center text-slate-400 dark:text-zinc-500">
                    <RefreshCw size={20} className="mx-auto mb-2 animate-spin opacity-40" />
                    Duke ngarkuar blerjet...
                  </div>
                ) : purchases.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <ShoppingBag size={32} className="mx-auto mb-3 text-slate-300 dark:text-zinc-600" />
                    <p className="text-[14px] font-semibold text-slate-500 dark:text-zinc-400">Nuk ka blerje të regjistruara</p>
                    <p className="mt-1 text-[12px] text-slate-400 dark:text-zinc-500">Skano një faturë ose shto blerje manuale</p>
                  </div>
                ) : (
                  purchases.map(p => (
                    <div key={p.id} className="p-5 flex flex-col gap-4 transition-colors hover:bg-white/40 dark:hover:bg-white/[0.01]">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-zinc-100 font-mono text-[12px]">{p.numri_blerjes}</span>
                            {p.source_invoice_numri && (
                              <span className="text-[10px] text-indigo-500 font-mono bg-indigo-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <QrCode size={10} />
                                {p.source_invoice_numri}
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold text-[14px] text-slate-800 dark:text-zinc-200">{p.furnitori}</h4>
                          <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono block">
                            {new Date(p.data_blerjes).toLocaleDateString('sq-AL')}
                          </span>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2 shrink-0">
                          <p className="font-bold font-mono text-[15px] text-slate-900 dark:text-zinc-100">{currency.format(p.totali)}</p>
                          <select
                            value={p.statusi}
                            onChange={e => handleStatusChange(p.id, e.target.value)}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold outline-none cursor-pointer bg-white dark:bg-zinc-900 ${STATUS_COLORS[p.statusi]}`}
                          >
                            <option value="paguar">Paguar</option>
                            <option value="ne_pritje">Në Pritje</option>
                            <option value="anuluar">Anuluar</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/40 dark:border-zinc-800/40">
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500">Blerje</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/15 bg-rose-500/8 text-rose-500 px-3 py-2 text-[11px] font-semibold transition hover:bg-rose-500/15"
                        >
                          <Trash2 size={12} />
                          Fshi
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: Scanner + Info */}
          <div className="space-y-6 self-start">

            {/* Scanner Panel */}
            <ScannerPanel
              onScan={handleScan}
              scanResult={scanResult}
              scanError={scanError}
              scanning={scanning}
            />

            {/* Info Card */}
            <div className="rounded-[2.5rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-4 sm:p-6 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400">
                  <Info size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Si funksionon?</p>
                </div>
              </div>
              <div>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600 dark:text-zinc-400">
                  Kur marrin faturë nga furnitor tjetër ZahlX, <strong className="text-slate-800 dark:text-zinc-200">skanoni barkoden</strong> e faturës së tyre. Sistemi do të lexojë automatikisht të dhënat e shitjes dhe t'i regjistrojë si blerje tuajën.
                </p>
                <ul className="mt-3 space-y-1.5 text-[12px] text-slate-500 dark:text-zinc-500">
                  <li className="flex items-center gap-2"><ArrowDownLeft size={11} className="text-indigo-500" /> Artikujt importohen automatikisht</li>
                  <li className="flex items-center gap-2"><Package size={11} className="text-green-500" /> Stoku mund të përditësohet direkt</li>
                  <li className="flex items-center gap-2"><BookOpen size={11} className="text-amber-500" /> Regjistrohet në librin kontabël</li>
                  <li className="flex items-center gap-2"><BarChart2 size={11} className="text-rose-500" /> Shpenzimet reflektohen në raporte</li>
                </ul>
              </div>
            </div>

            {/* Recent Summary */}
            {purchases.length > 0 && (
              <div className="rounded-[2.5rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500 mb-4">5 blerjet e fundit</p>
                <div className="space-y-3">
                  {purchases.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between rounded-2xl border border-slate-200/40 dark:border-transparent bg-white/30 dark:bg-white/[0.01] px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-slate-800 dark:text-zinc-200 truncate">{p.furnitori}</p>
                        <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 mt-0.5">{new Date(p.data_blerjes).toLocaleDateString('sq-AL')}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-[13px] font-bold text-slate-900 dark:text-zinc-100 font-mono">{currency.format(p.totali)}</p>
                        <span className={`inline-block text-[9px] rounded-full border px-1.5 py-0.5 font-bold ${STATUS_COLORS[p.statusi]}`}>
                          {STATUS_LABELS[p.statusi]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setScanPrefill(null); }}
        onSave={handleSavePurchase}
        prefill={scanPrefill}
      />
    </div>
  );
};

export default PurchasesPage;
