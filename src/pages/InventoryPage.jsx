import { AnimatePresence, motion } from 'framer-motion';
import {
  Barcode,
  Copy,
  Package,
  PencilLine,
  Plus,
  Search,
  ScanBarcode,
  Trash2,
  X,
  Sparkles,
  Layers,
  AlertTriangle,
  Bookmark
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const currency = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const emptyProduct = {
  emri: '',
  kodi_bar: '',
  cmimi_blerjes: '',
  cmimi_shitjes: '',
  stoku_aktual: '0',
  kategoria: '',
};

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [scannerValue, setScannerValue] = useState('');
  const [scannerFeedback, setScannerFeedback] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formError, setFormError] = useState('');
  const [productForm, setProductForm] = useState(emptyProduct);
  const scannerRef = useRef(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Nuk u ngarkuan produktet');
      }
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
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

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products;
    return products.filter((product) => (
      product.emri.toLowerCase().includes(normalized)
      || String(product.kodi_bar || '').toLowerCase().includes(normalized)
      || String(product.kategoria || '').toLowerCase().includes(normalized)
    ));
  }, [products, query]);

  const lowStockCount = useMemo(
    () => products.filter((product) => Number(product.stoku_aktual) <= 5).length,
    [products]
  );

  const stockValue = useMemo(
    () => products.reduce((total, product) => total + Number(product.stoku_aktual || 0), 0),
    [products]
  );

  const openCreateForm = (barcode = '') => {
    setFormMode('create');
    setProductForm({ ...emptyProduct, kodi_bar: barcode });
    setFormError('');
    setFormOpen(true);
  };

  const openEditForm = (product) => {
    setFormMode('edit');
    setProductForm({
      id: product.id,
      emri: product.emri,
      kodi_bar: product.kodi_bar || '',
      cmimi_blerjes: String(product.cmimi_blerjes ?? ''),
      cmimi_shitjes: String(product.cmimi_shitjes ?? ''),
      stoku_aktual: String(product.stoku_aktual ?? 0),
      kategoria: product.kategoria || '',
    });
    setFormError('');
    setFormOpen(true);
  };

  const handleScannerSubmit = (value) => {
    const scanned = value.trim();
    if (!scanned) return;

    const existingProduct = productIndex.get(scanned.toLowerCase());
    if (existingProduct) {
      setScannerFeedback(`U gjet: ${existingProduct.emri}`);
      openEditForm(existingProduct);
    } else {
      setScannerFeedback(`Barkodi ${scanned} është i ri. Hapet formulari i regjistrimit.`);
      openCreateForm(scanned);
    }
    setScannerValue('');
  };

  const handleProductChange = (field, value) => {
    setProductForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveProduct = async (event) => {
    event.preventDefault();
    setFormError('');

    const payload = {
      emri: productForm.emri.trim(),
      kodi_bar: productForm.kodi_bar.trim(),
      cmimi_blerjes: Number(productForm.cmimi_blerjes || 0),
      cmimi_shitjes: Number(productForm.cmimi_shitjes || 0),
      stoku_aktual: Number(productForm.stoku_aktual || 0),
      kategoria: productForm.kategoria.trim() || null,
    };

    try {
      const response = await fetch(formMode === 'create' ? '/api/products' : `/api/products/${productForm.id}`, {
        method: formMode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Produkti nuk u ruajt');
      }

      setFormOpen(false);
      await fetchProducts();
    } catch (error) {
      setFormError(error.message);
    }
  };

  const handleDeleteProduct = async (product) => {
    const confirmed = window.confirm(`Të fshihet produkti "${product.emri}"?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Produkti nuk u fshi');
      }
      await fetchProducts();
    } catch (error) {
      window.alert(error.message);
    }
  };

  // Global Barcode Scan Event Listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      // If modal is open, let user type normally in fields
      if (formOpen) return;

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Printable single character checks
      if (e.key.length === 1) {
        if (diff < 35) {
          buffer += e.key;
        } else {
          buffer = e.key;
        }
      } else if (e.key === 'Enter') {
        if (buffer.length >= 4 && diff < 35) {
          e.preventDefault();
          handleScannerSubmit(buffer);
          buffer = '';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formOpen, products, productIndex]);

  useEffect(() => {
    if (!formOpen) {
      window.setTimeout(() => scannerRef.current?.focus(), 0);
    }
  }, [formOpen]);

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.01),transparent_18%)]" />
      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        
        {/* Header section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-zinc-900/40 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500 font-medium">
              <Sparkles size={11} className="text-indigo-600 dark:text-indigo-400" />
              Menaxhimi i Inventarit
            </div>
            <h1 className="mt-3 text-[2rem] font-bold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-[2.8rem] leading-[1.15]">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300">Produktet</span>
            </h1>
            <p className="mt-2 text-[14px] text-slate-500 dark:text-zinc-400 max-w-xl">
              Shto, edito dhe menaxho të gjitha produktet e katalogut tënd. Skano barkodin për të hapur ose regjistruar një produkt të ri operative.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCreateForm('')}
            className="inline-flex items-center gap-2 self-start rounded-full border border-indigo-500/20 bg-indigo-500/10 dark:bg-indigo-500/15 px-5 py-3.5 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 shadow-[0_12px_30px_rgba(99,102,241,0.15)] transition hover:border-indigo-500/30 hover:bg-indigo-500/20"
          >
            <Plus size={16} />
            Produkt i ri
          </button>
        </div>

        <div className="grid gap-6">
          <div className="rounded-[2.5rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-6 sm:p-8 shadow-sm backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/40 dark:border-white/[0.04] pb-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Scanner hyrës (Lidhur)</p>
                <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Skano, hap, regjistro</h2>
              </div>
              <div className="rounded-full border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
                Hardware scanner apo globalisht nga ekrani
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <ScanBarcode size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  ref={scannerRef}
                  value={scannerValue}
                  onChange={(event) => setScannerValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      handleScannerSubmit(scannerValue);
                    }
                  }}
                  placeholder="Skano barkodin këtu ose skano globalisht..."
                  className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] py-3.5 pl-11 pr-4 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
                />
              </div>
              <button
                type="button"
                onClick={() => handleScannerSubmit(scannerValue)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-6 py-3.5 text-[13px] font-semibold text-slate-800 dark:text-zinc-200 transition hover:border-slate-350 hover:bg-white/60 dark:hover:bg-white/[0.03]"
              >
                <Barcode size={16} />
                Hap produktin
              </button>
            </div>

            {scannerFeedback && (
              <div className="mt-4 rounded-2xl border border-indigo-500/15 bg-indigo-500/10 px-4 py-3 text-[13px] font-medium text-indigo-600 dark:text-indigo-400">
                {scannerFeedback}
              </div>
            )}

            {/* Quick Metrics */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3 pt-6 border-t border-slate-200/40 dark:border-white/[0.04]">
              <div className="rounded-2xl border border-slate-200/40 dark:border-white/[0.03] bg-white/40 dark:bg-white/[0.01] px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Gjithsej Artikuj</p>
                <p className="mt-1 text-[22px] font-bold text-slate-900 dark:text-zinc-100 font-mono">{products.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/40 dark:border-white/[0.03] bg-white/40 dark:bg-white/[0.01] px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Stoku total</p>
                <p className="mt-1 text-[22px] font-bold text-slate-900 dark:text-zinc-100 font-mono">{stockValue}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/40 dark:border-white/[0.03] bg-white/40 dark:bg-white/[0.01] px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Stok i ulët (≤ 5)</p>
                <p className="mt-1 text-[22px] font-bold text-slate-900 dark:text-zinc-100 font-mono">{lowStockCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main inventory list split */}
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
          
          {/* Main products table */}
          <div className="rounded-[2.5rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] shadow-sm backdrop-blur-xl">
            <div className="flex flex-col gap-4 border-b border-slate-200/40 dark:border-white/[0.04] px-6 py-5 sm:flex-row sm:items-center sm:justify-between bg-white/60 dark:bg-white/[0.02]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Lista e produkteve</p>
                <h2 className="mt-1 text-[16px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Të gjitha produktet</h2>
              </div>
              <div className="relative w-full sm:w-72">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Kërko emër, barkod ose kategori..."
                  className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] py-2.5 pl-9 pr-4 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-[14px] text-slate-700 dark:text-zinc-300">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02]">
                    <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Produkt</th>
                    <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Barkod</th>
                    <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Blerja (€)</th>
                    <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Shitja (€)</th>
                    <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Stoku</th>
                    <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Kategori</th>
                    <th className="px-6 py-4 text-right font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Veprime</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 dark:divide-white/[0.04]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-zinc-500">
                        Duke ngarkuar katalogun...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-zinc-500">
                        Nuk u gjet asnjë produkt.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const isLow = Number(product.stoku_aktual) <= 5;
                      return (
                        <tr key={product.id} className="transition-colors hover:bg-white/60 dark:hover:bg-white/[0.03]">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-zinc-100">{product.emri}</p>
                              <p className="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-500">ID #{product.id}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono font-medium text-slate-700 dark:text-zinc-350">{product.kodi_bar}</td>
                          <td className="px-6 py-4 font-medium tabular-nums text-slate-650 dark:text-zinc-300">{currency.format(product.cmimi_blerjes)}</td>
                          <td className="px-6 py-4 font-bold tabular-nums text-slate-900 dark:text-zinc-100">{currency.format(product.cmimi_shitjes)}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-bold font-mono ${
                              isLow ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' : 'text-slate-800 dark:text-zinc-200'
                            }`}>
                              {product.stoku_aktual}
                              {isLow && <AlertTriangle size={12} />}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/60 dark:border-white/[0.06] bg-slate-100/40 dark:bg-white/[0.02] px-2.5 py-0.5 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                              <Bookmark size={10} />
                              {product.kategoria || 'Pa kategori'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditForm(product)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-3 py-2 text-[12px] font-semibold text-slate-750 dark:text-zinc-200 transition hover:border-slate-350 hover:bg-white/60 dark:hover:bg-white/[0.03]"
                              >
                                <PencilLine size={14} />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product)}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-500/15 bg-rose-500/10 px-3 py-2 text-[12px] font-semibold text-rose-600 transition hover:bg-rose-500/15"
                              >
                                <Trash2 size={14} />
                                Fshi
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar cards */}
          <div className="grid gap-6 self-start">
            {/* Top stock card */}
            <div className="rounded-[2.5rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200/40 dark:border-white/[0.04] pb-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Lista e shpejtë</p>
                  <h3 className="mt-1 text-[16px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Artikujt kryesorë</h3>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Layers size={16} />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {products.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between rounded-2xl border border-slate-200/40 dark:border-white/[0.03] bg-white/30 dark:bg-white/[0.01] px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-slate-800 dark:text-zinc-200">{product.emri}</p>
                      <p className="mt-0.5 text-[11px] font-mono text-slate-400 dark:text-zinc-500">{product.kodi_bar}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-slate-900 dark:text-zinc-100 font-mono">{product.stoku_aktual}</p>
                      <p className="text-[11px] text-slate-450 dark:text-zinc-500">në stok</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hint card */}
            <div className="rounded-[2.5rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-indigo-500/25 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400">
                  <Copy size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Skenim Global i Aktivizuar</p>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600 dark:text-zinc-455">
                    Mund të përdorësh skanerin fizik në çdo kohë direkt në këtë faqe pa fokusuar asnjë kuti teksti. Kur skanon një kod të ri, formulari i regjistrimit do të hapet automatikisht me atë kod!
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Centered Modal Form instead of sidebar */}
      <AnimatePresence>
        {formOpen && (
          <motion.div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 md:p-10">
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFormOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative z-10 flex h-auto max-h-[90vh] w-full max-w-[32rem] flex-col border border-slate-200/60 dark:border-white/[0.06] bg-white/95 dark:bg-zinc-950/95 shadow-2xl rounded-[2.5rem] overflow-hidden backdrop-blur-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200/40 dark:border-white/[0.04] px-6 py-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-400">{formMode === 'create' ? 'Regjistrim i ri' : 'Modifiko produktin'}</p>
                  <h3 className="mt-1 text-[18px] font-bold tracking-tight text-slate-900 dark:text-zinc-100">{formMode === 'create' ? 'Produkt i ri' : 'Editim produkti'}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-2 text-slate-500 dark:text-zinc-400 transition hover:border-slate-350 hover:text-slate-900 dark:hover:text-zinc-100"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="flex min-h-0 flex-1 flex-col px-6 py-5 overflow-y-auto custom-scrollbar">
                <div className="grid gap-5 pr-1">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3 border-b border-slate-200/30 dark:border-white/[0.03] pb-1.5">Informata Bazë</p>
                    <div className="grid gap-4">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 ml-1 mb-2 block">Emri i produktit</label>
                        <input
                          value={productForm.emri}
                          onChange={(event) => handleProductChange('emri', event.target.value)}
                          placeholder="p.sh. Coca-Cola 500ml"
                          required
                          className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 ml-1 mb-2 block">Barkodi</label>
                        <input
                          value={productForm.kodi_bar}
                          onChange={(event) => handleProductChange('kodi_bar', event.target.value)}
                          placeholder="p.sh. 5449000000996"
                          required
                          className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[14px] font-mono text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 ml-1 mb-2 block">Kategoria</label>
                        <input
                          value={productForm.kategoria}
                          onChange={(event) => handleProductChange('kategoria', event.target.value)}
                          placeholder="p.sh. Pije, Ushqime, Elektrikë"
                          className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3 border-b border-slate-200/30 dark:border-white/[0.03] pb-1.5">Çmimet (pa TVSH)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 ml-1 mb-2 block">Çmimi blerjes (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={productForm.cmimi_blerjes}
                          onChange={(event) => handleProductChange('cmimi_blerjes', event.target.value)}
                          placeholder="0.00"
                          required
                          className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 ml-1 mb-2 block">Çmimi shitjes (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={productForm.cmimi_shitjes}
                          onChange={(event) => handleProductChange('cmimi_shitjes', event.target.value)}
                          placeholder="0.00"
                          required
                          className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3 border-b border-slate-200/30 dark:border-white/[0.03] pb-1.5">Inventari</p>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 ml-1 mb-2 block">Sasia aktuale në stok</label>
                      <input
                        type="number"
                        value={productForm.stoku_aktual}
                        onChange={(event) => handleProductChange('stoku_aktual', event.target.value)}
                        placeholder="0"
                        required
                        className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
                      />
                    </div>
                  </div>
                </div>

                {formError && (
                  <div className="mt-4 rounded-2xl border border-rose-500/15 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-600 font-semibold">
                    {formError}
                  </div>
                )}

                <div className="mt-6 flex gap-3 border-t border-slate-200/40 dark:border-white/[0.04] pt-5">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="flex-1 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[13px] font-semibold text-slate-700 dark:text-zinc-300 transition hover:border-slate-350 hover:text-slate-900 dark:hover:text-zinc-100"
                  >
                    Anulo
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-[13px] font-bold text-white transition hover:bg-indigo-500 shadow-[0_8px_24px_rgba(99,102,241,0.2)]"
                  >
                    Ruaj
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryPage;
