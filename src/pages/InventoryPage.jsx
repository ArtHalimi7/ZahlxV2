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

  useEffect(() => {
    if (!formOpen) {
      window.setTimeout(() => scannerRef.current?.focus(), 0);
    }
  }, [formOpen]);

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



  return (
    <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.01),transparent_18%)]" />
      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-600/90">Menaxho Produktet</p>
            <h1 className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 sm:text-[2.8rem]">Produktet</h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-slate-500 dark:text-zinc-400">
              Shto, edito dhe menaxho të gjitha produktet e biznesit tënd. Skano barkod për të hapur ose regjistruar një produkt.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCreateForm('')}
            className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-500/20 bg-emerald-500/15 px-4 py-3 text-[13px] font-semibold text-emerald-600 shadow-[0_18px_45px_rgba(16,185,129,0.16)] transition hover:border-emerald-500/30 hover:bg-emerald-500/20"
          >
            <Plus size={16} />
            Produkt i ri
          </button>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Scanner hyrës</p>
                <h2 className="mt-2 text-[15px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Skano, hap, regjistro</h2>
              </div>
              <div className="rounded-full border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-3 py-2 text-[12px] text-slate-500 dark:text-zinc-400">
                Hardware scanner ose tastierë me Enter
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <ScanBarcode size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
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
                  placeholder="Skano barkodin dhe shtyp Enter"
                  className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] py-3 pl-10 pr-4 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/50 dark:bg-white/[0.04]"
                />
              </div>
              <button
                type="button"
                onClick={() => handleScannerSubmit(scannerValue)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[13px] font-medium text-slate-800 dark:text-zinc-200 transition hover:border-slate-300 dark:border-white/[0.12] hover:text-slate-900 dark:text-zinc-100"
              >
                <Barcode size={16} />
                Hap produktin
              </button>
            </div>

            {scannerFeedback && (
              <div className="mt-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-600">
                {scannerFeedback}
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Produkte</p>
                <p className="mt-2 text-[22px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">{products.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Stok total</p>
                <p className="mt-2 text-[22px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">{stockValue}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Nën 5 copë</p>
                <p className="mt-2 text-[22px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">{lowStockCount}</p>
              </div>
            </div>
          </div>


        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
          <div className="rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 border-b border-slate-200/60 dark:border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Lista e produkteve</p>
                <h2 className="mt-2 text-[15px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Të gjitha produktet</h2>
              </div>
              <div className="relative w-full sm:w-72">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Kërko emër, barkod ose kategori"
                  className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] py-2.5 pl-9 pr-4 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/50 dark:bg-white/[0.04]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-white/[0.06] text-left text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">
                    <th className="px-6 py-4 font-medium">Produkt</th>
                    <th className="px-6 py-4 font-medium">Barkod</th>
                    <th className="px-6 py-4 font-medium">Çmimi blerjes</th>
                    <th className="px-6 py-4 font-medium">Çmimi shitjes</th>
                    <th className="px-6 py-4 font-medium">Stoku</th>
                    <th className="px-6 py-4 font-medium">Kategori</th>
                    <th className="px-6 py-4 text-right font-medium">Veprime</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-[13px] text-slate-400 dark:text-zinc-500">
                        Duke ngarkuar katalogun...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-[13px] text-slate-400 dark:text-zinc-500">
                        Nuk u gjet asnjë produkt.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-white/[0.03] hover:bg-white/40 dark:bg-white/[0.02]">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-[13px] font-medium text-slate-900 dark:text-zinc-100">{product.emri}</p>
                            <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">ID #{product.id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-[13px] text-slate-700 dark:text-zinc-300">{product.kodi_bar}</td>
                        <td className="px-6 py-4 text-[13px] text-slate-700 dark:text-zinc-300 tabular-nums">{currency.format(product.cmimi_blerjes)}</td>
                        <td className="px-6 py-4 text-[13px] text-slate-900 dark:text-zinc-100 tabular-nums">{currency.format(product.cmimi_shitjes)}</td>
                        <td className="px-6 py-4 text-[13px] text-slate-700 dark:text-zinc-300 tabular-nums">{product.stoku_aktual}</td>
                        <td className="px-6 py-4 text-[13px] text-slate-500 dark:text-zinc-400">{product.kategoria || 'Pa kategori'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(product)}
                              className="inline-flex items-center gap-2 rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-3 py-2 text-[12px] text-slate-800 dark:text-zinc-200 transition hover:border-slate-300 dark:border-white/[0.12] hover:text-slate-900 dark:text-zinc-100"
                            >
                              <PencilLine size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product)}
                              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/15 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-600 transition hover:bg-rose-500/15"
                            >
                              <Trash2 size={14} />
                              Fshi
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Lista e shpejtë</p>
                  <h3 className="mt-2 text-[15px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Top artikujt sipas stokut</h3>
                </div>
                <Package size={18} className="text-emerald-600" />
              </div>

              <div className="mt-4 space-y-3">
                {products.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-slate-900 dark:text-zinc-100">{product.emri}</p>
                      <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500">{product.kodi_bar}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">{product.stoku_aktual}</p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500">në stok</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/15 dark:text-emerald-400">
                  <Copy size={16} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Skeno dhe ruaj</p>
                  <p className="mt-2 text-[13px] leading-6 text-slate-700 dark:text-zinc-300">
                    Ky ekran pranon scanner fizik. Kur barkodi nuk ekziston, formulari hapet menjëherë me atë kod të përgatitur.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.div className="fixed inset-0 z-[120] flex justify-end">
            <motion.button
              type="button"
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFormOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="relative z-10 flex h-full w-full max-w-[28rem] flex-col border-l border-slate-200/60 dark:border-white/[0.06] bg-[#f4f4f5] dark:bg-zinc-950/95 shadow-[0_0_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200/60 dark:border-white/[0.06] px-5 py-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-600">{formMode === 'create' ? 'Regjistrim' : 'Modifiko produktin'}</p>
                  <h3 className="mt-2 text-[18px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{formMode === 'create' ? 'Produkt i ri' : 'Editim produkti'}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-2 text-slate-500 dark:text-zinc-400 transition hover:border-slate-300 dark:border-white/[0.12] hover:text-slate-900 dark:text-zinc-100"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="flex min-h-0 flex-1 flex-col px-5 py-5">
                <div className="grid gap-5 overflow-y-auto pr-1">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-3">Informata Bazë</p>
                    <div className="grid gap-3">
                      <div>
                        <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300 ml-1 mb-1.5 block">Emri i produktit</label>
                        <input
                          value={productForm.emri}
                          onChange={(event) => handleProductChange('emri', event.target.value)}
                          placeholder="p.sh. Coca-Cola 500ml"
                          className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/50 dark:bg-white/[0.04]"
                        />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300 ml-1 mb-1.5 block">Barkodi</label>
                        <input
                          value={productForm.kodi_bar}
                          onChange={(event) => handleProductChange('kodi_bar', event.target.value)}
                          placeholder="p.sh. 5449000000996"
                          className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[14px] font-mono text-slate-900 dark:text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/50 dark:bg-white/[0.04]"
                        />
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300 ml-1 mb-1.5 block">Kategoria</label>
                        <input
                          value={productForm.kategoria}
                          onChange={(event) => handleProductChange('kategoria', event.target.value)}
                          placeholder="p.sh. Pije, Ushqime, Elektrikë"
                          className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/50 dark:bg-white/[0.04]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-3">Çmimet</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300 ml-1 mb-1.5 block">Çmimi blerjes (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={productForm.cmimi_blerjes}
                          onChange={(event) => handleProductChange('cmimi_blerjes', event.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/50 dark:bg-white/[0.04]"
                        />
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 ml-1">Çmimi pa TVSH</p>
                      </div>
                      <div>
                        <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300 ml-1 mb-1.5 block">Çmimi shitjes (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={productForm.cmimi_shitjes}
                          onChange={(event) => handleProductChange('cmimi_shitjes', event.target.value)}
                          placeholder="0.00"
                          className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/50 dark:bg-white/[0.04]"
                        />
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-1 ml-1">Çmimi pa TVSH</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-3">Stoku</p>
                    <div>
                      <label className="text-[12px] font-medium text-slate-700 dark:text-zinc-300 ml-1 mb-1.5 block">Sasia në stok</label>
                      <input
                        type="number"
                        value={productForm.stoku_aktual}
                        onChange={(event) => handleProductChange('stoku_aktual', event.target.value)}
                        placeholder="0"
                        className="w-full rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/50 dark:bg-white/[0.04]"
                      />
                    </div>
                  </div>
                </div>

                {formError && (
                  <div className="mt-4 rounded-2xl border border-rose-500/15 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-600">
                    {formError}
                  </div>
                )}

                <div className="mt-5 flex gap-3 border-t border-slate-200/60 dark:border-white/[0.06] pt-4">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="flex-1 rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[13px] font-medium text-slate-700 dark:text-zinc-300 transition hover:border-slate-300 dark:border-white/[0.12] hover:text-slate-900 dark:text-zinc-100"
                  >
                    Anulo
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-[13px] font-semibold text-white transition hover:bg-emerald-500"
                  >
                    Ruaj
                  </button>
                </div>
              </form>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryPage;
