import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BrainCircuit,
  Calendar,
  CheckCircle2,
  Copy,
  FileText,
  Plus,
  Printer,
  Search,
  Sparkles,
  Trash2,
  X,
  FileCheck2,
  Clock,
  Ban,
  FileSpreadsheet,
  Filter,
  RefreshCcw,
  CircleDashed,
  AlertTriangle,
  XCircle,
  Info
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Logo from '../assets/X.png';
import { QRCodeSVG } from 'qrcode.react';

const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const STATUS_COLORS = {
  draft: 'border-zinc-500/20 bg-zinc-500/10 text-slate-500 dark:text-zinc-400',
  derguar: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-650 dark:border-indigo-500/15 dark:text-indigo-400',
  pranuar: 'border-green-500/20 bg-green-500/10 text-green-600 dark:border-green-500/15 dark:text-green-400',
  refuzuar: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:border-rose-500/15 dark:text-rose-450',
  skaduar: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:border-amber-500/15 dark:text-amber-400',
};

const STATUS_LABELS = {
  draft: 'Draft',
  derguar: 'Dërguar',
  pranuar: 'Pranuar',
  refuzuar: 'Refuzuar',
  skaduar: 'Skaduar',
};

const OffersPage = () => {
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('te_gjitha'); // te_gjitha, draft, derguar, pranuar, refuzuar, skaduar
  const [loading, setLoading] = useState(true);

  // Modals/Drawers toggle state
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);


  // Quote Creator state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [expiryDays, setExpiryDays] = useState(15);
  const [notes, setNotes] = useState('Kjo ofertë është e vlefshme sipas kushteve të specifikuara më sipër. Ju lutem na kontaktoni për çdo ndryshim.');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);
  const [taxRate, setTaxRate] = useState(18); // 18% standard VAT
  const [addedItems, setAddedItems] = useState([]);

  // Fetch offers and products
  const fetchOffers = useCallback(async () => {
    try {
      const res = await fetch('/api/offers');
      if (res.ok) {
        const data = await res.json();
        setOffers(data);
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  }, []);

  const initPage = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchOffers(), fetchProducts()]);
    setLoading(false);
  }, [fetchOffers, fetchProducts]);

  useEffect(() => {
    initPage();
  }, [initPage]);

  // Statistics
  const statistics = useMemo(() => {
    const totalOfferedValue = offers.reduce((sum, o) => sum + Number(o.totali), 0);
    const acceptedOffers = offers.filter(o => o.statusi === 'pranuar');
    const acceptedValue = acceptedOffers.reduce((sum, o) => sum + Number(o.totali), 0);
    const pendingOffers = offers.filter(o => o.statusi === 'derguar' || o.statusi === 'draft');
    const pendingValue = pendingOffers.reduce((sum, o) => sum + Number(o.totali), 0);
    const expiredDeclinedCount = offers.filter(o => o.statusi === 'refuzuar' || o.statusi === 'skaduar').length;

    const acceptedRate = offers.length > 0
      ? Math.round((acceptedOffers.length / offers.length) * 100)
      : 0;

    return {
      totalOfferedValue,
      acceptedRate,
      acceptedValue,
      pendingValue,
      expiredDeclinedCount
    };
  }, [offers]);

  // Filtered offers list
  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      const matchesTab = statusFilter === 'te_gjitha' || o.statusi === statusFilter;
      const matchesSearch =
        o.numri_ofertes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.klienti.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (o.email_klientit && o.email_klientit.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTab && matchesSearch;
    });
  }, [offers, statusFilter, searchQuery]);

  // Active product item details helper
  const selectedProductDetails = useMemo(() => {
    return products.find(p => p.id === Number(selectedProductId));
  }, [products, selectedProductId]);

  // Add item to offer builder list
  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = selectedProductDetails;
    if (!prod) return;

    // Check duplicate
    const existingIndex = addedItems.findIndex(item => item.product_id === prod.id);
    if (existingIndex > -1) {
      const updated = [...addedItems];
      updated[existingIndex].sasia += Number(selectedQty);
      updated[existingIndex].line_total = updated[existingIndex].sasia * Number(prod.cmimi_shitjes);
      setAddedItems(updated);
    } else {
      setAddedItems([
        ...addedItems,
        {
          product_id: prod.id,
          emri: prod.emri,
          sasia: Number(selectedQty),
          cmimi_per_njesi: Number(prod.cmimi_shitjes),
          line_total: Number(selectedQty) * Number(prod.cmimi_shitjes)
        }
      ]);
    }

    // Reset selector inputs
    setSelectedProductId('');
    setSelectedQty(1);
  };

  // Remove item from builder list
  const handleRemoveItem = (index) => {
    const updated = [...addedItems];
    updated.splice(index, 1);
    setAddedItems(updated);
  };

  // Creator Totals
  const builderTotals = useMemo(() => {
    const subtotal = addedItems.reduce((sum, item) => sum + item.line_total, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    return { subtotal, taxAmount, total };
  }, [addedItems, taxRate]);

  // Submit Offer Creation
  const handleCreateOffer = async (targetStatus) => {
    if (!clientName) {
      alert('Ju lutemi plotësoni emrin e klientit');
      return;
    }
    if (addedItems.length === 0) {
      alert('Ju lutemi shtoni së paku një artikull në ofertë');
      return;
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + Number(expiryDays));

    const payload = {
      klienti: clientName,
      email_klientit: clientEmail || null,
      tax_rate: taxRate,
      data_skadimit: expiryDate.toISOString().slice(0, 19).replace('T', ' '),
      shenime: notes,
      statusi: targetStatus,
      items: addedItems.map(i => ({ product_id: i.product_id, sasia: i.sasia }))
    };

    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Reset Creator Form
        setClientName('');
        setClientEmail('');
        setExpiryDays(15);
        setNotes('Kjo ofertë është e vlefshme sipas kushteve të specifikuara më sipër. Ju lutem na kontaktoni për çdo ndryshim.');
        setAddedItems([]);
        setBuilderOpen(false);
        // Refresh list
        fetchOffers();
      } else {
        const data = await res.json();
        alert(data.error || 'Gabim gjatë krijimit të ofertës');
      }
    } catch (err) {
      console.error(err);
      alert('Ndodhi një gabim gjatë komunikimit me serverin');
    }
  };

  // Fetch Offer Details
  const handleOpenDetails = async (offerId) => {
    try {
      const res = await fetch(`/api/offers/${offerId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedOffer(data);
        setAiPitch(''); // Clear previous pitch
      }
    } catch (err) {
      console.error('Error fetching details:', err);
    }
  };

  // Update Status Manually
  const handleUpdateStatus = async (offerId, newStatus) => {
    try {
      const res = await fetch(`/api/offers/${offerId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusi: newStatus })
      });

      if (res.ok) {
        // Update local detail state
        if (selectedOffer && selectedOffer.id === offerId) {
          setSelectedOffer(prev => ({ ...prev, statusi: newStatus }));
        }
        fetchOffers();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Convert Quote to Final Invoice
  const handleConvertToInvoice = async (offerId) => {
    const confirmation = window.confirm('Dëshironi ta konvertoni këtë ofertë në një Faturë Shitjeje aktive? Kjo do të zbresë stokun dhe do të regjistrojë hyrjet në kontabilitet.');
    if (!confirmation) return;

    try {
      const res = await fetch(`/api/offers/${offerId}/convert`, {
        method: 'POST'
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Sukses! Oferta u konvertua në Faturën: ${data.numri_fatures}`);
        setSelectedOffer(null);
        fetchOffers();
      } else {
        const data = await res.json();
        alert(data.error || 'Gabim gjatë konvertimit të ofertës');
      }
    } catch (err) {
      console.error('Error converting offer:', err);
      alert('Ndodhi një gabim gjatë komunikimit me serverin');
    }
  };

  // Delete Offer
  const handleDeleteOffer = async (offerId) => {
    const confirmDelete = window.confirm('Dëshironi ta fshini përgjithmonë këtë ofertë?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setSelectedOffer(null);
        fetchOffers();
      }
    } catch (err) {
      console.error('Error deleting offer:', err);
    }
  };


  return (
    <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950 print:bg-white print:text-black">
      {/* Decorative gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(var(--accent-rgb),0.08),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.01),transparent_18%)] print:hidden" />

      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:p-0">

        {/* Top Header Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-600/90 font-medium">Menaxhimi i Ofertave</p>
            <h1 className="mt-3 text-[2rem] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[2.8rem] leading-[1.15]">
              Oferta & Kalkulime
              {loading && <RefreshCcw size={20} className="animate-spin text-slate-450 dark:text-zinc-500" />}
            </h1>
            <p className="mt-2 text-[14px] text-slate-500 dark:text-zinc-400 max-w-xl">
              Ndërtoni dhe menaxhoni oferta profesionale për klientët tuaj. Klikoni mbi numrin e ofertës për të parë detajet ose konvertuar në faturë operative.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={initPage}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[13px] font-semibold text-slate-700 dark:text-zinc-300 transition hover:border-slate-350 hover:bg-white/60 dark:hover:bg-white/[0.03] backdrop-blur-xl"
            >
              <RefreshCcw size={16} />
              Rifresko
            </button>
            <button
              onClick={() => setBuilderOpen(true)}
              className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-indigo-650 hover:bg-indigo-600 text-white px-5 py-3 text-[13px] font-semibold shadow-[0_12px_30px_rgba(var(--accent-rgb),0.22)] transition-all"
            >
              <Plus size={15} />
              Krijo Ofertë
            </button>
          </div>
        </div>

        {/* Premium visual metrics row */}
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 print:hidden">
          {/* Card 1: Total Value */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
                  Vlera e Ofertave
                  <span className="group/tooltip relative inline-block cursor-help print:hidden">
                    <Info size={11} className="text-slate-400 dark:text-zinc-500 transition hover:text-indigo-550" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 w-48 -translate-x-1/2 rounded-lg bg-slate-900/95 dark:bg-black/95 border border-slate-200/20 px-2.5 py-2 text-[10px] font-medium leading-normal text-white shadow-xl opacity-0 transition group-hover/tooltip:opacity-100 normal-case tracking-normal">
                      Vlera totale e të gjitha ofertave të gjeneruara (me TVSH).
                    </span>
                  </span>
                </p>
                <h3 className="mt-2 text-[26px] font-bold text-slate-900 dark:text-zinc-100 tracking-tight font-mono">
                  {currencyFormatter.format(statistics.totalOfferedValue)}
                </h3>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.03] text-slate-500 dark:text-zinc-400">
                <FileSpreadsheet size={18} />
              </div>
            </div>
          </motion.div>

          {/* Card 2: Conversion / Acceptance Rate */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-[2rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
                  Shkalla e Pranimit
                  <span className="group/tooltip relative inline-block cursor-help print:hidden">
                    <Info size={11} className="text-slate-400 dark:text-zinc-500 transition hover:text-indigo-550" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 w-48 -translate-x-1/2 rounded-lg bg-slate-900/95 dark:bg-black/95 border border-slate-200/20 px-2.5 py-2 text-[10px] font-medium leading-normal text-white shadow-xl opacity-0 transition group-hover/tooltip:opacity-100 normal-case tracking-normal">
                      Përqindja e ofertave që janë pranuar dhe shndërruar në faturë.
                    </span>
                  </span>
                </p>
                <h3 className="mt-2 text-[26px] font-bold text-slate-900 dark:text-zinc-100 tracking-tight font-mono">
                  {statistics.acceptedRate}%
                </h3>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-600 dark:border-green-500/15 dark:text-green-400">
                <FileCheck2 size={18} />
              </div>
            </div>
          </motion.div>

          {/* Card 3: Pending Value */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[2rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
                  Në Negocim / Draft
                  <span className="group/tooltip relative inline-block cursor-help print:hidden">
                    <Info size={11} className="text-slate-400 dark:text-zinc-500 transition hover:text-indigo-550" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 w-48 -translate-x-1/2 rounded-lg bg-slate-900/95 dark:bg-black/95 border border-slate-200/20 px-2.5 py-2 text-[10px] font-medium leading-normal text-white shadow-xl opacity-0 transition group-hover/tooltip:opacity-100 normal-case tracking-normal">
                      Vlera e ofertave që janë ende në fazë negocimi ose si draft.
                    </span>
                  </span>
                </p>
                <h3 className="mt-2 text-[26px] font-bold text-slate-900 dark:text-zinc-100 tracking-tight font-mono">
                  {currencyFormatter.format(statistics.pendingValue)}
                </h3>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400">
                <Clock size={18} />
              </div>
            </div>
          </motion.div>

          {/* Card 4: Expired / Declined */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-[2rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-6 shadow-sm backdrop-blur-xl"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
                  Refuzuar / Skaduar
                  <span className="group/tooltip relative inline-block cursor-help print:hidden">
                    <Info size={11} className="text-slate-400 dark:text-zinc-500 transition hover:text-indigo-550" />
                    <span className="pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 w-48 -translate-x-1/2 rounded-lg bg-slate-900/95 dark:bg-black/95 border border-slate-200/20 px-2.5 py-2 text-[10px] font-medium leading-normal text-white shadow-xl opacity-0 transition group-hover/tooltip:opacity-100 normal-case tracking-normal">
                      Numri i ofertave të refuzuara ose që u ka kaluar afati i vlefshmërisë.
                    </span>
                  </span>
                </p>
                <h3 className="mt-2 text-[26px] font-bold text-slate-900 dark:text-zinc-100 tracking-tight font-mono">
                  {statistics.expiredDeclinedCount} kuota
                </h3>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:border-rose-500/15 dark:text-rose-450">
                <Ban size={18} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filter Toolbar */}
        <div className="mb-6 grid gap-4 sm:grid-cols-[1fr_auto] print:hidden">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Kërko me numër oferte ose emër klienti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] py-3.5 pl-11 pr-4 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
            />
          </div>

          <div className="relative">
            <Filter size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-full min-w-[180px] appearance-none rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] py-3.5 pl-11 pr-10 text-[14px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04]"
            >
              <option value="te_gjitha">Të Gjitha Statuset</option>
              <option value="draft">Draft</option>
              <option value="derguar">Dërguar</option>
              <option value="pranuar">Pranuar</option>
              <option value="refuzuar">Refuzuar</option>
              <option value="skaduar">Skaduar</option>
            </select>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex h-[300px] items-center justify-center rounded-[2.5rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl print:hidden">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-650 border-t-transparent" />
              <p className="text-[13px] text-slate-400 dark:text-zinc-500 font-medium">Duke ngarkuar të dhënat e ofertave...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-12 print:block">
            {/* Left Hand: Historical List */}
            <div className={`lg:col-span-8 print:hidden ${selectedOffer ? 'hidden md:block' : 'col-span-full'}`}>
              <div className="overflow-hidden rounded-[2.5rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] shadow-sm backdrop-blur-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[14px] text-slate-700 dark:text-zinc-300">
                    <thead>
                      <tr className="border-b border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.02]">
                        <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Numri Ofertës</th>
                        <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Data Krijimit</th>
                        <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Klienti</th>
                        <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Totali</th>
                        <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider">Statusi</th>
                        <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[12px] uppercase tracking-wider text-right">Veprime</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/40 dark:divide-transparent">
                      {filteredOffers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-slate-400 dark:text-zinc-500">
                            Nuk u gjet asnjë ofertë.
                          </td>
                        </tr>
                      ) : (
                        filteredOffers.map((o) => (
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            key={o.id}
                            onClick={() => handleOpenDetails(o.id)}
                            className={`cursor-pointer transition-colors hover:bg-white/60 dark:hover:bg-white/[0.03] ${selectedOffer?.id === o.id ? 'bg-indigo-500/[0.05] dark:bg-indigo-500/[0.03]' : ''}`}
                          >
                            <td className="px-6 py-4">
                              <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                {o.numri_ofertes}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                              {new Date(o.data_krijimit).toLocaleString('sq-AL', { dateStyle: 'medium', timeStyle: 'short' })}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-800 dark:text-zinc-200">
                              <p className="font-semibold text-slate-800 dark:text-zinc-100">{o.klienti}</p>
                              {o.email_klientit && <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">{o.email_klientit}</p>}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900 dark:text-zinc-100 tabular-nums font-mono">
                              {currencyFormatter.format(o.totali)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLORS[o.statusi] || 'border-zinc-500/20 bg-zinc-500/10 text-slate-500'}`}>
                                {o.statusi === 'pranuar' && <CheckCircle2 size={12} />}
                                {o.statusi === 'derguar' && <Clock size={12} />}
                                {o.statusi === 'draft' && <CircleDashed size={12} />}
                                {o.statusi === 'refuzuar' && <XCircle size={12} />}
                                {o.statusi === 'skaduar' && <AlertTriangle size={12} />}
                                {STATUS_LABELS[o.statusi] || o.statusi}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenDetails(o.id)}
                                  className="rounded-xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-2 text-slate-550 dark:text-zinc-400 transition hover:border-slate-350 hover:bg-white/60 dark:hover:bg-white/[0.04]"
                                  title="Detajet"
                                >
                                  <ArrowRight size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteOffer(o.id)}
                                  className="rounded-xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-2 text-slate-550 dark:text-zinc-400 transition hover:border-rose-500/20 hover:text-rose-600 hover:bg-rose-500/10"
                                  title="Fshi"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Hand: Detailed View & Print Format */}
            {selectedOffer && (
              <div className="lg:col-span-4 print:col-span-full print:block">
                <div className="rounded-[2.5rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-zinc-900 shadow-sm backdrop-blur-xl p-6 relative overflow-hidden print:border-none print:bg-white print:p-0 print:shadow-none">
                  {/* Actions Header (Hidden on print) */}
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-transparent pb-4 mb-6 print:hidden">
                    <h3 className="text-[15px] font-bold text-slate-900 dark:text-zinc-100">Detajet e Ofertës</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.print()}
                        className="rounded-xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-2 text-slate-500 dark:text-zinc-400 transition hover:text-slate-900 dark:hover:text-zinc-100"
                        title="Printo Ofertën"
                      >
                        <Printer size={15} />
                      </button>
                      <button
                        onClick={() => setSelectedOffer(null)}
                        className="rounded-xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-2 text-slate-500 dark:text-zinc-400 transition hover:text-slate-900 dark:hover:text-zinc-100"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Print Layout Container */}
                  <div className="print:p-6 print:font-sans">
                    {/* Invoice/Offer Top Bar */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <img src={Logo} alt="Zahlx Logo" className="h-14 w-auto object-contain dark:brightness-0 dark:invert print:brightness-0 print:invert-0" />
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-mono mt-1.5 print:text-black">Oferta Profesionale</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[12px] font-bold font-mono text-slate-900 dark:text-white print:text-black">{selectedOffer.numri_ofertes}</span>
                      </div>
                    </div>

                    {/* Client Information */}
                    <div className="rounded-2xl border border-slate-200/40 dark:border-transparent bg-white/30 dark:bg-zinc-950/40 p-4 mb-6 print:border-none print:bg-transparent print:p-0 print:mb-4">
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1 print:text-black print:font-semibold">OFRUAR PËR:</p>
                      <p className="text-[14px] font-bold text-slate-900 dark:text-white print:text-black">{selectedOffer.klienti}</p>
                      {selectedOffer.email_klientit && (
                        <p className="text-[12px] text-slate-500 dark:text-zinc-400 font-medium mt-1 print:text-black">{selectedOffer.email_klientit}</p>
                      )}
                      {selectedOffer.data_skadimit && (
                        <p className="text-[11px] text-indigo-650 dark:text-indigo-400 font-semibold mt-2 font-mono print:text-black print:mt-1">
                          Valide deri më: {new Date(selectedOffer.data_skadimit).toLocaleDateString('sq-AL')}
                        </p>
                      )}
                    </div>

                    {/* Items List Table */}
                    <table className="w-full text-left mb-6 text-[12px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200/60 dark:border-transparent text-[10px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-semibold print:border-b-2 print:border-black">
                          <th className="py-2 print:py-1">Përshkrimi</th>
                          <th className="py-2 text-center print:py-1">Sasia</th>
                          <th className="py-2 text-right print:py-1">Çmimi</th>
                          <th className="py-2 text-right print:py-1">Totali</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/40 dark:divide-transparent print:divide-zinc-100">
                        {selectedOffer.items && selectedOffer.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-3 font-semibold text-slate-800 dark:text-zinc-200 print:text-black print:py-2">{item.emri}</td>
                            <td className="py-3 text-center font-medium font-mono print:text-black print:py-2">{item.sasia}</td>
                            <td className="py-3 text-right font-medium font-mono print:text-black print:py-2">{currencyFormatter.format(item.cmimi_per_njesi)}</td>
                            <td className="py-3 text-right font-bold font-mono text-slate-900 dark:text-white print:text-black print:py-2">
                              {currencyFormatter.format(item.sasia * item.cmimi_per_njesi)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Totals Section */}
                    <div className="border-t border-slate-200/60 dark:border-transparent pt-4 mb-6 print:border-t-2 print:border-black">
                      <div className="space-y-1.5 text-[13px] max-w-xs ml-auto font-mono">
                        <div className="flex justify-between text-slate-500 dark:text-zinc-400 font-medium print:text-black">
                          <span>Nëntotali:</span>
                          <span className="text-slate-900 dark:text-white print:text-black">
                            {currencyFormatter.format(Number(selectedOffer.totali) - Number(selectedOffer.tax_amount))}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-500 dark:text-zinc-400 font-medium print:text-black">
                          <span>TVSH ({selectedOffer.tax_rate}%):</span>
                          <span className="text-slate-900 dark:text-white print:text-black">
                            {currencyFormatter.format(selectedOffer.tax_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[15px] font-bold border-t border-slate-200/40 dark:border-transparent pt-2 print:border-t print:border-zinc-300">
                          <span className="text-slate-700 dark:text-zinc-200 print:text-black">Totali:</span>
                          <span className="text-indigo-600 dark:text-indigo-400 print:text-black">
                            {currencyFormatter.format(selectedOffer.totali)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Notes & Terms */}
                    {selectedOffer.shenime && (
                      <div className="rounded-2xl border border-slate-200/40 dark:border-transparent bg-white/30 dark:bg-zinc-950/40 p-4 text-[11px] leading-5 text-slate-550 dark:text-zinc-400 print:border-none print:bg-transparent print:p-0 print:mt-4 print:text-black">
                        <p className="font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-550 mb-1 print:text-black print:font-bold">Kushtet e Ofertës:</p>
                        {selectedOffer.shenime}
                      </div>
                    )}

                    {/* QR Code Section */}
                    <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-zinc-800/40 flex flex-col items-center print:border-none print:mt-8 print:p-0">
                      <div className="text-center print:hidden">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-555 font-medium">QR i Ofertës</p>
                        <h2 className="mt-1 text-[13px] font-semibold tracking-tight text-slate-900 dark:text-zinc-150">Skano për përmbajtjen e plotë</h2>
                      </div>
                      <div className="mt-4 grid place-items-center print:mt-2">
                        <div className="rounded-2xl bg-white p-3 shadow-md print:p-0 print:shadow-none">
                          <QRCodeSVG value={`${window.location.origin}/oferta?id=${selectedOffer.id}`} size={100} fgColor="#000000" bgColor="#ffffff" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Hidden on print) */}
                  <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-transparent space-y-4 print:hidden">
                    {/* Status Update Trigger */}
                    <div className="flex gap-2 items-center justify-between text-[12px] font-medium text-slate-500 dark:text-zinc-400">
                      <span>Përditëso statusin:</span>
                      <select
                        value={selectedOffer.statusi}
                        onChange={(e) => handleUpdateStatus(selectedOffer.id, e.target.value)}
                        className="rounded-xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-zinc-900 px-3 py-1.5 text-[12px] text-slate-700 dark:text-zinc-300 outline-none transition focus:border-indigo-500/30"
                      >
                        <option value="draft">Draft</option>
                        <option value="derguar">Dërguar</option>
                        <option value="pranuar">Pranuar</option>
                        <option value="refuzuar">Refuzuar</option>
                        <option value="skaduar">Skaduar</option>
                      </select>
                    </div>

                    {/* Convert Offer to Active Sale / Invoice */}
                    {selectedOffer.statusi !== 'pranuar' ? (
                      <button
                        onClick={() => handleConvertToInvoice(selectedOffer.id)}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-green-600 hover:bg-green-500 text-white py-3 text-[13px] font-bold shadow-md transition"
                      >
                        <CheckCircle2 size={16} />
                        Prano & Kthe në Faturë
                      </button>
                    ) : (
                      <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3.5 flex items-center gap-2.5 text-green-600">
                        <CheckCircle2 size={18} />
                        <span className="text-[12px] font-bold">Kjo ofertë është pranuar dhe konvertuar në faturë.</span>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Offer Builder Slide Drawer Overlay (Hidden on print) */}
      <AnimatePresence>
        {builderOpen && (
          <>
            <motion.div
              onClick={() => setBuilderOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-[2px] print:hidden"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 right-0 z-[160] w-full max-w-xl bg-white dark:bg-zinc-950 shadow-2xl border-l border-slate-200/60 dark:border-transparent p-6 overflow-y-auto print:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-transparent pb-4 mb-6">
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 dark:text-zinc-100">Krijo Ofertë / Quote</h3>
                  <p className="text-[11px] text-slate-400 dark:text-zinc-500">Ndërto kalkulimin dhe zgjidh vlefshmërinë e ofertës.</p>
                </div>
                <button
                  onClick={() => setBuilderOpen(false)}
                  className="rounded-xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] p-2 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Client & Offer Info */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-450 dark:text-zinc-500 font-bold mb-1">Emri i Klientit *</label>
                  <input
                    type="text"
                    placeholder="Psh. Ahmet Halimi"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200/60 dark:border-transparent bg-slate-50/60 dark:bg-zinc-900 px-4 py-2.5 text-[13px] outline-none transition focus:border-indigo-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-slate-455 dark:text-zinc-500 font-bold mb-1">Email i Klientit (Opsionale)</label>
                  <input
                    type="email"
                    placeholder="ahmet@shembull.com"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200/60 dark:border-transparent bg-slate-50/60 dark:bg-zinc-900 px-4 py-2.5 text-[13px] outline-none transition focus:border-indigo-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-450 dark:text-zinc-500 font-bold mb-1">Valide për (Ditë)</label>
                    <input
                      type="number"
                      value={expiryDays}
                      min="1"
                      onChange={(e) => setExpiryDays(Math.max(1, parseInt(e.target.value) || 15))}
                      className="w-full rounded-xl border border-slate-200/60 dark:border-transparent bg-slate-50/60 dark:bg-zinc-900 px-4 py-2.5 text-[13px] outline-none transition focus:border-indigo-500/30 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-slate-450 dark:text-zinc-500 font-bold mb-1">Norma e TVSH %</label>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200/60 dark:border-transparent bg-slate-50/60 dark:bg-zinc-900 px-4 py-2.5 text-[13px] outline-none transition focus:border-indigo-500/30 font-mono"
                    >
                      <option value="18">18% (Standard)</option>
                      <option value="8">8% (Uluar)</option>
                      <option value="0">0% (Pa TVSH)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Items Builder */}
              <div className="border-t border-slate-200/60 dark:border-transparent pt-6 mb-6">
                <h4 className="text-[13px] font-bold text-slate-900 dark:text-zinc-200 mb-3">Shto Produkte në Kalkulim</h4>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 items-end">
                  <div className="sm:col-span-8">
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 dark:text-zinc-550 font-bold mb-1">Zgjidh Produktin</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200/60 dark:border-transparent bg-slate-50/60 dark:bg-zinc-900 px-4 py-2.5 text-[13px] outline-none transition focus:border-indigo-500/30"
                    >
                      <option value="">-- Zgjidh produkt --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.emri} - {currencyFormatter.format(p.cmimi_shitjes)} (Në stok: {p.stoku_aktual})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] uppercase tracking-wider text-slate-400 dark:text-zinc-550 font-bold mb-1">Sasia</label>
                    <input
                      type="number"
                      value={selectedQty}
                      min="1"
                      onChange={(e) => setSelectedQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full rounded-xl border border-slate-200/60 dark:border-transparent bg-slate-50/60 dark:bg-zinc-900 px-4 py-2.5 text-[13px] outline-none transition focus:border-indigo-500/30 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={!selectedProductId}
                      className="w-full inline-flex h-[40px] items-center justify-center rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white disabled:opacity-40 transition"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                {/* Added Items table */}
                <div className="mt-4 rounded-xl border border-slate-200/60 dark:border-transparent bg-slate-50/20 dark:bg-white/[0.01] overflow-hidden">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100/60 dark:bg-zinc-900/40 text-[10px] uppercase tracking-wider text-slate-450 dark:text-zinc-500 font-bold border-b border-slate-200/40 dark:border-transparent">
                        <th className="px-4 py-2.5">Produkti</th>
                        <th className="px-4 py-2.5 text-center">Sasia</th>
                        <th className="px-4 py-2.5 text-right">Çmimi</th>
                        <th className="px-4 py-2.5 text-right">Totali</th>
                        <th className="px-4 py-2.5 text-center">Fshi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/40 dark:divide-transparent">
                      {addedItems.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-6 text-center text-slate-400 dark:text-zinc-500">
                            Nuk ka artikuj të shtuar ende.
                          </td>
                        </tr>
                      ) : (
                        addedItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-zinc-250">{item.emri}</td>
                            <td className="px-4 py-2.5 text-center font-mono">{item.sasia}</td>
                            <td className="px-4 py-2.5 text-right font-mono">{currencyFormatter.format(item.cmimi_per_njesi)}</td>
                            <td className="px-4 py-2.5 text-right font-bold font-mono text-slate-900 dark:text-white">
                              {currencyFormatter.format(item.line_total)}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <button
                                onClick={() => handleRemoveItem(index)}
                                className="text-rose-500 hover:text-rose-600 transition"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Terms Notes */}
              <div className="mb-6">
                <label className="block text-[11px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-bold mb-1">Shënime / Kushte shtesë</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200/60 dark:border-transparent bg-slate-50/60 dark:bg-zinc-900 p-3 text-[12px] leading-5 outline-none transition focus:border-indigo-500/30"
                />
              </div>

              {/* Live Builder Totals */}
              <div className="rounded-2xl border border-slate-200/60 dark:border-transparent bg-slate-50/30 dark:bg-white/[0.03] p-4 mb-6">
                <div className="space-y-1.5 text-[12px]">
                  <div className="flex justify-between text-slate-500 dark:text-zinc-400 font-medium">
                    <span>Nëntotali:</span>
                    <span className="font-mono text-slate-900 dark:text-white">{currencyFormatter.format(builderTotals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 dark:text-zinc-400 font-medium">
                    <span>TVSH ({taxRate}%):</span>
                    <span className="font-mono text-slate-900 dark:text-white">{currencyFormatter.format(builderTotals.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-[14px] font-bold border-t border-slate-200/40 dark:border-transparent pt-2">
                    <span className="text-slate-800 dark:text-zinc-200">Totali i Ofertës:</span>
                    <span className="font-mono text-indigo-650 dark:text-indigo-400">{currencyFormatter.format(builderTotals.total)}</span>
                  </div>
                </div>
              </div>

              {/* Creator Save triggers */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleCreateOffer('draft')}
                  className="rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] text-slate-700 dark:text-zinc-350 hover:bg-slate-100 dark:hover:bg-white/[0.02] py-3 text-[13px] font-bold transition"
                >
                  Ruaj si Draft
                </button>
                <button
                  onClick={() => handleCreateOffer('derguar')}
                  className="rounded-2xl bg-indigo-650 hover:bg-indigo-600 text-white py-3 text-[13px] font-bold shadow-md transition"
                >
                  Krijo & Dërgo
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OffersPage;
