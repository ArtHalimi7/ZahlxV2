import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Minus, Plus, Search, Check, AlertCircle } from 'lucide-react';

/**
 * ShitjeEShpejte — Quick Sale Component
 * 
 * A full-screen overlay optimized for speed:
 *   Step 1: Search & select product
 *   Step 2: Set quantity
 *   Step 3: Confirm sale
 *
 * Design intent: dead-simple for non-tech users. Big touch targets,
 * large text, clear visual hierarchy. No unnecessary decoration.
 */

// ── Format currency the Kosovar way ──
const formatEuro = (amount) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
};

// ── Mock products for when the backend isn't running ──
const MOCK_PRODUCTS = [
  { id: 1, emri: 'Coca-Cola 0.5L',       kodi_bar: 'BAR-001', cmimi_shitjes: 1.20, stoku_aktual: 48 },
  { id: 2, emri: 'Ujë Rugove 1.5L',      kodi_bar: 'BAR-002', cmimi_shitjes: 0.40, stoku_aktual: 120 },
  { id: 3, emri: 'Kafe Turke 200g',      kodi_bar: 'BAR-003', cmimi_shitjes: 3.50, stoku_aktual: 35 },
  { id: 4, emri: 'Çokollatë Milka 100g', kodi_bar: 'BAR-004', cmimi_shitjes: 1.80, stoku_aktual: 60 },
  { id: 5, emri: 'Bukë e bardhë',        kodi_bar: 'BAR-005', cmimi_shitjes: 0.60, stoku_aktual: 25 },
  { id: 6, emri: 'Qumësht 1L',           kodi_bar: 'BAR-006', cmimi_shitjes: 0.95, stoku_aktual: 40 },
  { id: 7, emri: 'Djathë i bardhë 1kg',  kodi_bar: 'BAR-007', cmimi_shitjes: 6.00, stoku_aktual: 15 },
  { id: 8, emri: 'Vezë (10 copë)',       kodi_bar: 'BAR-008', cmimi_shitjes: 2.20, stoku_aktual: 30 },
  { id: 9, emri: 'Vaj Ulliri 1L',        kodi_bar: 'BAR-009', cmimi_shitjes: 7.50, stoku_aktual: 18 },
  { id: 10, emri: 'Birrë Peja 0.5L',     kodi_bar: 'BAR-010', cmimi_shitjes: 1.10, stoku_aktual: 72 },
];

// ── Feedback states ──
const STATES = {
  SELECTING: 'selecting',
  CONFIRMING: 'confirming',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

const ShitjeEShpejte = ({ isOpen, onClose, onSaleComplete }) => {
  const [state, setState] = useState(STATES.SELECTING);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const searchRef = useRef(null);

  // Fetch products when the modal opens (falls back to mock data)
  useEffect(() => {
    if (!isOpen) return;
    // Reset state on open
    setState(STATES.SELECTING);
    setSelected(null);
    setQuantity(1);
    setSearch('');
    setErrorMsg('');

    fetch('/api/products')
      .then(r => {
        if (!r.ok) throw new Error('API unavailable');
        return r.json();
      })
      .then(data => setProducts(data.length > 0 ? data : MOCK_PRODUCTS))
      .catch(() => setProducts(MOCK_PRODUCTS));

    // Auto-focus search on desktop
    setTimeout(() => searchRef.current?.focus(), 100);
  }, [isOpen]);

  // Filter products by search term
  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p =>
      p.emri.toLowerCase().includes(q) || (p.kodi_bar && p.kodi_bar.toLowerCase().includes(q))
    );
  }, [products, search]);

  // Select a product -> move to confirm step
  const handleSelect = (product) => {
    setSelected(product);
    setQuantity(1);
    setState(STATES.CONFIRMING);
  };

  // Go back to product selection
  const handleBack = () => {
    setSelected(null);
    setState(STATES.SELECTING);
    setErrorMsg('');
  };

  // Adjust quantity with bounds checking
  const adjustQty = (delta) => {
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (selected && next > selected.stoku_aktual) return selected.stoku_aktual;
      return next;
    });
  };

  // Submit the sale
  const handleSubmit = async () => {
    if (!selected) return;
    setState(STATES.LOADING);

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ product_id: selected.id, sasia: quantity }],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gabim');
      }

      setState(STATES.SUCCESS);

      // Auto-close after success
      setTimeout(() => {
        onSaleComplete?.();
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message);
      setState(STATES.ERROR);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const total = selected ? selected.cmimi_shitjes * quantity : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-md mx-auto sm:mx-4 bg-zinc-950 border border-white/[0.08] sm:rounded-2xl rounded-t-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-[15px] font-semibold text-zinc-100">
            {state === STATES.SELECTING && 'Shitje e Shpejtë'}
            {state === STATES.CONFIRMING && 'Konfirmo Shitjen'}
            {state === STATES.LOADING && 'Duke procesuar...'}
            {state === STATES.SUCCESS && 'Sukses'}
            {state === STATES.ERROR && 'Gabim'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04] transition-colors"
            aria-label="Mbyll"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Step 1: Product Selection ── */}
        {state === STATES.SELECTING && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Search bar */}
            <div className="px-5 pt-4 pb-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Kërko produkt..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-[14px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-white/[0.12] transition-colors"
                />
              </div>
            </div>

            {/* Product list */}
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              {filtered.length === 0 ? (
                <p className="text-center text-[13px] text-zinc-600 py-8">
                  Asnjë produkt nuk u gjet
                </p>
              ) : (
                <div className="space-y-1">
                  {filtered.map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleSelect(product)}
                      disabled={product.stoku_aktual <= 0}
                      className={`
                        w-full flex items-center justify-between px-3 py-3 rounded-xl text-left
                        transition-colors duration-150
                        ${product.stoku_aktual <= 0
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:bg-white/[0.04] active:bg-white/[0.06]'
                        }
                      `}
                    >
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-zinc-200 truncate">
                          {product.emri}
                        </p>
                        <p className="text-[12px] text-zinc-600 mt-0.5">
                          Stoku: {product.stoku_aktual}
                        </p>
                      </div>
                      <span className="text-[14px] font-semibold text-zinc-300 tabular-nums ml-4 shrink-0">
                        {formatEuro(product.cmimi_shitjes)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Confirm quantity & sale ── */}
        {state === STATES.CONFIRMING && selected && (
          <div className="px-5 py-6 space-y-6">
            {/* Selected product info */}
            <div>
              <p className="text-[18px] font-semibold text-zinc-100">
                {selected.emri}
              </p>
              <p className="text-[13px] text-zinc-500 mt-1">
                {formatEuro(selected.cmimi_shitjes)} për copë · {selected.stoku_aktual} në stok
              </p>
            </div>

            {/* Quantity selector */}
            <div>
              <p className="text-[12px] font-medium text-zinc-500 uppercase tracking-wider mb-3">
                Sasia
              </p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => adjustQty(-1)}
                  disabled={quantity <= 1}
                  className="w-12 h-12 rounded-xl border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:border-white/[0.15] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus size={18} />
                </button>
                <span className="text-4xl font-semibold text-zinc-100 tabular-nums w-20 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => adjustQty(1)}
                  disabled={quantity >= selected.stoku_aktual}
                  className="w-12 h-12 rounded-xl border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:border-white/[0.15] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Total preview */}
            <div className="pt-4 border-t border-white/[0.06]">
              <div className="flex items-end justify-between">
                <span className="text-[13px] text-zinc-500">Totali</span>
                <span className="text-3xl font-semibold text-zinc-100 tabular-nums">
                  {formatEuro(total)}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleBack}
                className="flex-1 py-3 rounded-xl border border-white/[0.08] text-[14px] font-medium text-zinc-400 hover:text-zinc-200 hover:border-white/[0.15] transition-colors"
              >
                Kthehu
              </button>
              <button
                onClick={handleSubmit}
                className="flex-[2] py-3 rounded-xl bg-emerald-600 text-[14px] font-semibold text-white hover:bg-emerald-500 active:bg-emerald-700 transition-colors"
              >
                Përfundo Shitjen
              </button>
            </div>
          </div>
        )}

        {/* ── Loading state ── */}
        {state === STATES.LOADING && (
          <div className="px-5 py-16 flex flex-col items-center">
            <div className="w-8 h-8 border-2 border-white/[0.1] border-t-emerald-500 rounded-full animate-spin" />
            <p className="mt-4 text-[13px] text-zinc-500">Duke procesuar shitjen...</p>
          </div>
        )}

        {/* ── Success state ── */}
        {state === STATES.SUCCESS && (
          <div className="px-5 py-16 flex flex-col items-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Check size={24} className="text-emerald-400" />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-zinc-100">Shitja u regjistrua</p>
            <p className="mt-1 text-[13px] text-zinc-500">{formatEuro(total)}</p>
          </div>
        )}

        {/* ── Error state ── */}
        {state === STATES.ERROR && (
          <div className="px-5 py-12 flex flex-col items-center animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle size={24} className="text-red-400" />
            </div>
            <p className="mt-4 text-[15px] font-semibold text-zinc-100">Diçka shkoi keq</p>
            <p className="mt-1 text-[13px] text-zinc-500 text-center max-w-xs">{errorMsg}</p>
            <button
              onClick={handleBack}
              className="mt-6 px-6 py-2.5 rounded-xl border border-white/[0.08] text-[13px] font-medium text-zinc-400 hover:text-zinc-200 hover:border-white/[0.15] transition-colors"
            >
              Provo përsëri
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShitjeEShpejte;
