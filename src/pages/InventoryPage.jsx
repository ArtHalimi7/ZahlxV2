import { AnimatePresence, motion } from 'framer-motion';
import {
  Barcode,
  Copy,
  Package,
  PencilLine,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  ScanBarcode,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Link } from 'react-router-dom';

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

const emptyReceiptItem = (product) => ({
  id: product.id,
  emri: product.emri,
  kodi_bar: product.kodi_bar,
  cmimi_shitjes: Number(product.cmimi_shitjes),
  quantity: 1,
});

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
  const [receiptClient, setReceiptClient] = useState('Klient i përgjithshëm');
  const [receiptBarcode, setReceiptBarcode] = useState('');
  const [receiptItems, setReceiptItems] = useState([]);
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);
  const [receiptResult, setReceiptResult] = useState(null);
  const [receiptError, setReceiptError] = useState('');
  const scannerRef = useRef(null);
  const receiptRef = useRef(null);

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

  const receiptTotal = useMemo(
    () => receiptItems.reduce((total, item) => total + item.cmimi_shitjes * item.quantity, 0),
    [receiptItems]
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

  const addReceiptProduct = (barcode) => {
    const normalized = barcode.trim().toLowerCase();
    if (!normalized) return;

    const product = productIndex.get(normalized);
    if (!product) {
      setReceiptError('Ky barkod nuk u gjet në katalog. Regjistro produktin fillimisht.');
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
      await fetchProducts();
      receiptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      setReceiptError(error.message);
    } finally {
      setReceiptSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-full overflow-hidden bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%)]" />
      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-400/90">Stoku dhe faturimi</p>
            <h1 className="mt-3 text-[2rem] font-semibold tracking-tight text-zinc-100 sm:text-[2.8rem]">Produktet, barkodet dhe rechnung</h1>
            <p className="mt-3 max-w-2xl text-[14px] leading-7 text-zinc-400">
              Skano një barkod për të regjistruar ose hapur një produkt, menaxho CRUD-in e katalogut dhe gjenero një faturë të organizuar me QR që hap të gjithë përmbajtjen e saj.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openCreateForm('')}
            className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-500/20 bg-emerald-500/12 px-4 py-3 text-[13px] font-semibold text-emerald-300 shadow-[0_18px_45px_rgba(16,185,129,0.16)] transition hover:border-emerald-500/30 hover:bg-emerald-500/16"
          >
            <Plus size={16} />
            Produkt i ri
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[1.75rem] border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Scanner hyrës</p>
                <h2 className="mt-2 text-[15px] font-semibold tracking-tight text-zinc-100">Skano, hap, regjistro</h2>
              </div>
              <div className="rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12px] text-zinc-400">
                Hardware scanner ose tastierë me Enter
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <ScanBarcode size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
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
                  className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] py-3 pl-10 pr-4 text-[14px] text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/[0.04]"
                />
              </div>
              <button
                type="button"
                onClick={() => handleScannerSubmit(scannerValue)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-[13px] font-medium text-zinc-200 transition hover:border-white/[0.12] hover:text-zinc-100"
              >
                <Barcode size={16} />
                Hap produktin
              </button>
            </div>

            {scannerFeedback && (
              <div className="mt-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-300">
                {scannerFeedback}
              </div>
            )}

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">Produkte</p>
                <p className="mt-2 text-[22px] font-semibold tracking-tight text-zinc-100 tabular-nums">{products.length}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">Stok total</p>
                <p className="mt-2 text-[22px] font-semibold tracking-tight text-zinc-100 tabular-nums">{stockValue}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-600">Nën 5 copë</p>
                <p className="mt-2 text-[22px] font-semibold tracking-tight text-zinc-100 tabular-nums">{lowStockCount}</p>
              </div>
            </div>
          </div>

          <div ref={receiptRef} className="rounded-[1.75rem] border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-300">
                <ReceiptText size={16} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Rechnung</p>
                <h2 className="mt-2 text-[15px] font-semibold tracking-tight text-zinc-100">Faturë e organizuar me QR</h2>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <input
                value={receiptClient}
                onChange={(event) => setReceiptClient(event.target.value)}
                placeholder="Klienti"
                className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-[14px] text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/[0.04]"
              />
              <div className="relative">
                <ScanBarcode size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  value={receiptBarcode}
                  onChange={(event) => setReceiptBarcode(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addReceiptProduct(receiptBarcode);
                      setReceiptBarcode('');
                    }
                  }}
                  placeholder="Shto produkt me barkod"
                  className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] py-3 pl-10 pr-4 text-[14px] text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/[0.04]"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {receiptItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/[0.08] px-4 py-6 text-center text-[13px] text-zinc-500">
                  Skano produkte për të ndërtuar faturën.
                </div>
              ) : (
                receiptItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-zinc-100">{item.emri}</p>
                        <p className="mt-1 text-[11px] font-mono text-zinc-600">{item.kodi_bar}</p>
                      </div>
                      <p className="text-[13px] font-semibold text-zinc-100 tabular-nums">{currency.format(item.cmimi_shitjes * item.quantity)}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateReceiptQuantity(item.id, -1)}
                          className="grid h-8 w-8 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-zinc-400 transition hover:text-zinc-100"
                        >
                          -
                        </button>
                        <span className="min-w-8 text-center text-[13px] text-zinc-100 tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateReceiptQuantity(item.id, 1)}
                          className="grid h-8 w-8 place-items-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-zinc-400 transition hover:text-zinc-100"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReceiptItems((current) => current.filter((entry) => entry.id !== item.id))}
                        className="text-[12px] text-rose-300 transition hover:text-rose-200"
                      >
                        Hiq
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {receiptError && (
              <div className="mt-3 rounded-2xl border border-rose-500/15 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-300">
                {receiptError}
              </div>
            )}

            <div className="mt-4 flex items-end justify-between border-t border-white/[0.06] pt-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Totali</p>
                <p className="mt-2 text-[26px] font-semibold tracking-tight text-zinc-100 tabular-nums">{currency.format(receiptTotal)}</p>
              </div>
              <button
                type="button"
                onClick={submitReceipt}
                disabled={receiptSubmitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-[13px] font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={16} />
                {receiptSubmitting ? 'Duke gjeneruar...' : 'Gjenero faturën'}
              </button>
            </div>

            {receiptResult && (
              <div className="mt-4 rounded-[1.5rem] border border-white/[0.06] bg-zinc-950/60 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-400">Fatura e fundit</p>
                    <h3 className="mt-2 text-[16px] font-semibold tracking-tight text-zinc-100">{receiptResult.numri_fatures}</h3>
                    <p className="mt-2 text-[13px] text-zinc-400">Hape ose skano QR për të parë përmbajtjen e plotë.</p>
                  </div>
                  <Link
                    to={`/fature/${receiptResult.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12px] text-zinc-200 transition hover:border-white/[0.12] hover:text-zinc-100"
                  >
                    <QrCode size={14} />
                    Hape
                  </Link>
                </div>
                <div className="mt-4 grid place-items-center rounded-[1.25rem] border border-white/[0.06] bg-white p-4">
                  <QRCodeSVG value={receiptResult.qrUrl} size={152} fgColor="#09090b" bgColor="#ffffff" />
                </div>
                <div className="mt-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12px] text-zinc-400">
                  <span className="block truncate">{receiptResult.qrUrl}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
          <div className="rounded-[1.75rem] border border-white/[0.06] bg-white/[0.03] shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Katalogu i produkteve</p>
                <h2 className="mt-2 text-[15px] font-semibold tracking-tight text-zinc-100">CRUD i organizuar</h2>
              </div>
              <div className="relative w-full sm:w-72">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Kërko emër, barkod ose kategori"
                  className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-9 pr-4 text-[13px] text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/[0.04]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/[0.04] text-left text-[11px] uppercase tracking-[0.24em] text-zinc-500">
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
                      <td colSpan={7} className="px-6 py-16 text-center text-[13px] text-zinc-500">
                        Duke ngarkuar katalogun...
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-16 text-center text-[13px] text-zinc-500">
                        Nuk u gjet asnjë produkt.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-[13px] font-medium text-zinc-100">{product.emri}</p>
                            <p className="mt-1 text-[11px] text-zinc-600">ID #{product.id}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-[13px] text-zinc-300">{product.kodi_bar}</td>
                        <td className="px-6 py-4 text-[13px] text-zinc-300 tabular-nums">{currency.format(product.cmimi_blerjes)}</td>
                        <td className="px-6 py-4 text-[13px] text-zinc-100 tabular-nums">{currency.format(product.cmimi_shitjes)}</td>
                        <td className="px-6 py-4 text-[13px] text-zinc-300 tabular-nums">{product.stoku_aktual}</td>
                        <td className="px-6 py-4 text-[13px] text-zinc-400">{product.kategoria || 'Pa kategori'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(product)}
                              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12px] text-zinc-200 transition hover:border-white/[0.12] hover:text-zinc-100"
                            >
                              <PencilLine size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product)}
                              className="inline-flex items-center gap-2 rounded-xl border border-rose-500/15 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-300 transition hover:bg-rose-500/15"
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
            <div className="rounded-[1.75rem] border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Lista e shpejtë</p>
                  <h3 className="mt-2 text-[15px] font-semibold tracking-tight text-zinc-100">Top artikujt sipas stokut</h3>
                </div>
                <Package size={18} className="text-emerald-400" />
              </div>

              <div className="mt-4 space-y-3">
                {products.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between rounded-2xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-zinc-100">{product.emri}</p>
                      <p className="mt-1 text-[11px] text-zinc-600">{product.kodi_bar}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-semibold text-zinc-100 tabular-nums">{product.stoku_aktual}</p>
                      <p className="text-[11px] text-zinc-500">në stok</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/[0.06] bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-300">
                  <Copy size={16} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Skeno dhe ruaj</p>
                  <p className="mt-2 text-[13px] leading-6 text-zinc-300">
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
              className="relative z-10 flex h-full w-full max-w-[28rem] flex-col border-l border-white/[0.08] bg-zinc-950/95 shadow-[0_0_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-400">{formMode === 'create' ? 'Regjistrim' : 'Modifiko produktin'}</p>
                  <h3 className="mt-2 text-[18px] font-semibold tracking-tight text-zinc-100">{formMode === 'create' ? 'Produkt i ri' : 'Editim produkti'}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2 text-zinc-400 transition hover:border-white/[0.12] hover:text-zinc-100"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="flex min-h-0 flex-1 flex-col px-5 py-5">
                <div className="grid gap-4 overflow-y-auto pr-1">
                  <input
                    value={productForm.emri}
                    onChange={(event) => handleProductChange('emri', event.target.value)}
                    placeholder="Emri i produktit"
                    className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-[14px] text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/[0.04]"
                  />
                  <input
                    value={productForm.kodi_bar}
                    onChange={(event) => handleProductChange('kodi_bar', event.target.value)}
                    placeholder="Barkodi"
                    className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-[14px] font-mono text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/[0.04]"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.cmimi_blerjes}
                      onChange={(event) => handleProductChange('cmimi_blerjes', event.target.value)}
                      placeholder="Çmimi blerjes"
                      className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-[14px] text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/[0.04]"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={productForm.cmimi_shitjes}
                      onChange={(event) => handleProductChange('cmimi_shitjes', event.target.value)}
                      placeholder="Çmimi shitjes"
                      className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-[14px] text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/[0.04]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      value={productForm.stoku_aktual}
                      onChange={(event) => handleProductChange('stoku_aktual', event.target.value)}
                      placeholder="Stoku"
                      className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-[14px] text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/[0.04]"
                    />
                    <input
                      value={productForm.kategoria}
                      onChange={(event) => handleProductChange('kategoria', event.target.value)}
                      placeholder="Kategoria"
                      className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-[14px] text-zinc-100 outline-none transition focus:border-emerald-500/30 focus:bg-white/[0.04]"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="mt-4 rounded-2xl border border-rose-500/15 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-300">
                    {formError}
                  </div>
                )}

                <div className="mt-5 flex gap-3 border-t border-white/[0.06] pt-4">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[13px] font-medium text-zinc-300 transition hover:border-white/[0.14] hover:text-zinc-100"
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
