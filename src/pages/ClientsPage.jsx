import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus, Search, Contact, Mail, Phone, MapPin, StickyNote,
  Trash2, Pencil, X, ChevronDown, ChevronUp, RefreshCcw,
  Users, TrendingUp, Activity, FileText, ShoppingCart,
  ShieldAlert, Calendar,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ClientDetailRow = ({ client, formatCurrency, formatDate }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`/api/clients/${client.id}/transactions`);
        if (res.ok) {
          const data = await res.json();
          setTransactions(data);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [client.id]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paguar':
      case 'pranuar':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'ne_pritje':
      case 'derguar':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'anuluar':
      case 'refuzuar':
      case 'skaduar':
      case 'vonese':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
    }
  };

  const getStatusLabel = (status) => {
    const map = {
      'paguar': 'E Paguar',
      'ne_pritje': 'Në Pritje',
      'anuluar': 'Anuluar',
      'vonese': 'Vonesë',
      'draft': 'Draft',
      'derguar': 'Dërguar',
      'pranuar': 'Pranuar',
      'refuzuar': 'Refuzuar',
      'skaduar': 'Skaduar'
    };
    return map[status] || status;
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-slate-200/40 dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.01] overflow-hidden"
    >
      <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Email</p>
          <p className="text-[13px] text-slate-800 dark:text-zinc-200">{client.email || '—'}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Telefoni</p>
          <p className="text-[13px] text-slate-800 dark:text-zinc-200">{client.telefoni || '—'}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Adresa</p>
          <p className="text-[13px] text-slate-800 dark:text-zinc-200">{client.adresa || '—'}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Shënime</p>
          <p className="text-[13px] text-slate-800 dark:text-zinc-200">{client.shenime || '—'}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Parë Herën e Parë</p>
          <p className="text-[13px] text-slate-800 dark:text-zinc-200">{formatDate(client.first_seen)}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Aktiviteti i Fundit</p>
          <p className="text-[13px] text-slate-800 dark:text-zinc-200">{formatDate(client.last_seen)}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Totali Faturave</p>
          <p className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(client.invoice_total)}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">Totali Ofertave</p>
          <p className="text-[13px] font-semibold text-indigo-600 dark:text-indigo-400">{formatCurrency(client.offer_total)}</p>
        </div>
      </div>

      <div className="px-6 pb-6 mt-2">
        <h4 className="text-[12px] font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Activity size={14} className="text-indigo-500" />
          Historiku i Transaksioneve
        </h4>
        
        {loading ? (
          <div className="flex items-center gap-3 text-[12px] text-slate-500">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            Po ngarkon historikun...
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-[12px] text-slate-500 dark:text-zinc-400 italic">Asnjë transaksion i regjistruar.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200/60 dark:border-white/[0.04]">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-white/[0.02] border-b border-slate-200/60 dark:border-white/[0.04] text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] font-semibold">
                  <th className="px-4 py-2.5">Lloji</th>
                  <th className="px-4 py-2.5">Numri</th>
                  <th className="px-4 py-2.5">Data</th>
                  <th className="px-4 py-2.5">Totali</th>
                  <th className="px-4 py-2.5">Statusi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-white/[0.02]">
                {transactions.map(t => (
                  <tr key={`${t.type}-${t.id}`} className="hover:bg-slate-50 dark:hover:bg-white/[0.01]">
                    <td className="px-4 py-2 font-medium text-slate-700 dark:text-zinc-300">
                      {t.type}
                    </td>
                    <td className="px-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium">
                      {t.number}
                    </td>
                    <td className="px-4 py-2 text-slate-500 dark:text-zinc-400">
                      {formatDate(t.date)}
                    </td>
                    <td className="px-4 py-2 font-semibold text-slate-900 dark:text-zinc-100">
                      {formatCurrency(t.total)}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusColor(t.status)}`}>
                        {getStatusLabel(t.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ClientsPage = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('emri');
  const [sortDir, setSortDir] = useState('asc');
  const [expandedId, setExpandedId] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({ emri: '', email: '', telefoni: '', adresa: '', shenime: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filtered & sorted clients
  const filteredClients = useMemo(() => {
    let list = clients;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(c =>
        c.emri?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.telefoni?.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'emri': aVal = a.emri?.toLowerCase() || ''; bVal = b.emri?.toLowerCase() || ''; break;
        case 'invoice_total': aVal = Number(a.invoice_total || 0); bVal = Number(b.invoice_total || 0); break;
        case 'invoice_count': aVal = Number(a.invoice_count || 0); bVal = Number(b.invoice_count || 0); break;
        case 'created_at': aVal = new Date(a.created_at); bVal = new Date(b.created_at); break;
        default: aVal = a.emri?.toLowerCase() || ''; bVal = b.emri?.toLowerCase() || '';
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [clients, search, sortBy, sortDir]);

  // Summary stats
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const totalRevenue = clients.reduce((s, c) => s + Number(c.invoice_total || 0), 0);
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const activeClients = clients.filter(c => {
      const lastSeen = new Date(c.last_seen);
      return lastSeen > thirtyDaysAgo && c.last_seen !== '1970-01-01';
    }).length;
    return { totalClients, totalRevenue, activeClients };
  }, [clients]);

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return null;
    return sortDir === 'asc' ? <ChevronUp size={13} className="inline ml-0.5" /> : <ChevronDown size={13} className="inline ml-0.5" />;
  };

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({ emri: '', email: '', telefoni: '', adresa: '', shenime: '' });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);
    setFormData({
      emri: client.emri || '',
      email: client.email || '',
      telefoni: client.telefoni || '',
      adresa: client.adresa || '',
      shenime: client.shenime || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!formData.emri.trim()) {
      setFormError('Emri i klientit është i detyrueshëm');
      return;
    }
    setSubmitting(true);
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gabim gjatë ruajtjes');
      }
      setModalOpen(false);
      fetchClients();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const data = await res.json();
        throw new Error(data.error || 'Gabim gjatë fshirjes');
      }
      setDeleteId(null);
      setExpandedId(null);
      fetchClients();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  };

  const formatDate = (d) => {
    if (!d || d === '1970-01-01' || d === '9999-12-31') return '—';
    return new Date(d).toLocaleDateString('sq-AL', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (user?.role !== 'owner') {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center select-none">
        <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-450 flex items-center justify-center mb-4">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h3 className="text-[18px] font-bold text-slate-900 dark:text-white">Qasje e Kufizuar</h3>
        <p className="mt-2 text-[13px] text-slate-500 dark:text-zinc-450 max-w-sm">
          Vetëm pronari i biznesit mund të menaxhojë klientët.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(var(--accent-rgb),0.08),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.01),transparent_18%)]" />
      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-600/90 font-medium">Kontaktet</p>
            <h1 className="mt-3 text-[2rem] font-bold tracking-tight text-slate-900 dark:text-white sm:text-[2.8rem] leading-[1.15]">
              Klientët
            </h1>
            <p className="mt-2 text-[14px] text-slate-500 dark:text-zinc-400 max-w-xl">
              Menaxhoni klientët tuaj, shikoni historikun e blerjeve dhe ofertave.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchClients}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-[13px] font-semibold text-slate-700 dark:text-zinc-300 transition hover:border-slate-350 hover:bg-white/60 dark:hover:bg-white/[0.03] backdrop-blur-xl"
            >
              <RefreshCcw size={16} />
              Rifresko
            </button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 dark:bg-white px-5 py-3 text-[13px] font-bold text-white dark:text-slate-900 shadow-sm transition hover:bg-slate-800 dark:hover:bg-zinc-200"
            >
              <Plus size={16} />
              Shto Klient
            </motion.button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          {[
            { label: 'Klientë Gjithsej', value: stats.totalClients, icon: Users, color: 'indigo' },
            { label: 'Të Hyra nga Klientët', value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: 'emerald' },
            { label: 'Klientë Aktivë (30d)', value: stats.activeClients, icon: Activity, color: 'amber' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-[2rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] p-5 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  stat.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20' :
                  stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                  'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  <stat.icon size={18} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">{stat.label}</p>
                  <p className="text-[22px] font-bold text-slate-900 dark:text-white mt-0.5">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kërko klient sipas emrit, emailit ose telefonit..."
              className="w-full rounded-2xl border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] py-3 pl-10 pr-4 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white/60 dark:focus:bg-white/[0.04] placeholder:text-slate-400 dark:placeholder:text-zinc-600 backdrop-blur-xl"
            />
          </div>
        </div>

        {/* Clients Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[2rem] border border-slate-200/60 dark:border-transparent bg-white/40 dark:bg-white/[0.02] shadow-sm backdrop-blur-xl overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-slate-200/40 dark:border-white/[0.04]">
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-zinc-100">
              Lista e Klientëve ({filteredClients.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500 dark:text-zinc-500">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="text-[13px]">Duke ngarkuar listën e klientëve...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="mx-6 my-6 text-center py-16 text-slate-500 dark:text-zinc-500 border border-dashed border-slate-200/60 dark:border-white/[0.06] rounded-[1.5rem] bg-white/20 dark:bg-white/[0.01]">
              <Contact className="h-10 w-10 mx-auto text-slate-400 dark:text-zinc-500 mb-3" />
              <p className="text-[13px] font-semibold text-slate-800 dark:text-zinc-300">
                {search.trim() ? 'Asnjë klient nuk u gjet' : 'Nuk ka klientë të regjistruar'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1 max-w-[300px] mx-auto">
                {search.trim() ? 'Provoni të ndryshoni termat e kërkimit.' : 'Shtoni klientin tuaj të parë duke klikuar butonin "Shto Klient" më sipër.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] text-slate-700 dark:text-zinc-300">
                <thead>
                  <tr className="border-b border-slate-200/60 dark:border-white/[0.04] bg-white/60 dark:bg-white/[0.02]">
                    <th
                      onClick={() => handleSort('emri')}
                      className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-zinc-200 transition select-none"
                    >
                      Klienti <SortIcon col="emri" />
                    </th>
                    <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider">
                      Kontakti
                    </th>
                    <th
                      onClick={() => handleSort('invoice_count')}
                      className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-zinc-200 transition select-none"
                    >
                      Fatura <SortIcon col="invoice_count" />
                    </th>
                    <th
                      onClick={() => handleSort('invoice_total')}
                      className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-zinc-200 transition select-none"
                    >
                      Totali <SortIcon col="invoice_total" />
                    </th>
                    <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider">
                      Oferta
                    </th>
                    <th
                      onClick={() => handleSort('created_at')}
                      className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-zinc-200 transition select-none"
                    >
                      Krijuar <SortIcon col="created_at" />
                    </th>
                    <th className="px-6 py-4 font-semibold text-slate-500 dark:text-zinc-400 text-[11px] uppercase tracking-wider text-right">
                      Veprime
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 dark:divide-white/[0.03]">
                  <AnimatePresence>
                    {filteredClients.map((client) => (
                      <motion.tr
                        key={client.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group transition-colors hover:bg-white/60 dark:hover:bg-white/[0.03] cursor-pointer"
                        onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-[11px] shadow-sm shrink-0">
                              {getInitials(client.emri)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-zinc-100 text-[13px]">{client.emri}</p>
                              {client.adresa && (
                                <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
                                  <MapPin size={10} /> {client.adresa}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {client.email && (
                              <p className="text-[12px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                                <Mail size={12} className="text-slate-400 dark:text-zinc-500" /> {client.email}
                              </p>
                            )}
                            {client.telefoni && (
                              <p className="text-[12px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                                <Phone size={12} className="text-slate-400 dark:text-zinc-500" /> {client.telefoni}
                              </p>
                            )}
                            {!client.email && !client.telefoni && (
                              <span className="text-[11px] text-slate-400 dark:text-zinc-600">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium">
                            <ShoppingCart size={13} className="text-slate-400 dark:text-zinc-500" />
                            {Number(client.invoice_count || 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[13px] font-semibold text-slate-900 dark:text-zinc-100">
                            {formatCurrency(client.invoice_total)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium">
                            <FileText size={13} className="text-slate-400 dark:text-zinc-500" />
                            {Number(client.offer_count || 0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[12px] text-slate-500 dark:text-zinc-400 font-medium">
                          {formatDate(client.created_at)}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(client)}
                              className="p-2 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition"
                              title="Redakto"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => setDeleteId(client.id)}
                              className="p-2 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition"
                              title="Fshi"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>

              {/* Expanded detail row */}
              <AnimatePresence>
                {expandedId && (() => {
                  const client = filteredClients.find(c => c.id === expandedId);
                  if (!client) return null;
                  return (
                    <ClientDetailRow 
                      key={`detail-${expandedId}`} 
                      client={client} 
                      formatCurrency={formatCurrency} 
                      formatDate={formatDate} 
                    />
                  );
                })()}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-lg rounded-[2rem] border border-slate-200/60 dark:border-zinc-800 bg-[#f0f0f2] dark:bg-zinc-900 shadow-2xl overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900">
                <div>
                  <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">
                    {editingClient ? 'Redakto Klientin' : 'Shto Klient të Ri'}
                  </h3>
                  <p className="text-[12px] text-slate-500 dark:text-zinc-400 mt-0.5">
                    {editingClient ? 'Përditësoni të dhënat e klientit.' : 'Plotësoni të dhënat për klientin e ri.'}
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal body */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {formError && (
                  <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-[12px] text-rose-600 dark:text-rose-400 font-medium">
                    {formError}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                    Emri i Klientit *
                  </label>
                  <div className="relative">
                    <Contact className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={formData.emri}
                      onChange={(e) => setFormData(f => ({ ...f, emri: e.target.value }))}
                      placeholder="P.sh. Ram Shaqiri"
                      className="w-full rounded-2xl border border-slate-200/60 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800 py-3 pl-10 pr-4 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white dark:focus:bg-zinc-750"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                        placeholder="email@example.com"
                        className="w-full rounded-2xl border border-slate-200/60 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800 py-3 pl-10 pr-4 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white dark:focus:bg-zinc-750"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                      Telefoni
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                      <input
                        type="tel"
                        value={formData.telefoni}
                        onChange={(e) => setFormData(f => ({ ...f, telefoni: e.target.value }))}
                        placeholder="+383 44 123 456"
                        className="w-full rounded-2xl border border-slate-200/60 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800 py-3 pl-10 pr-4 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white dark:focus:bg-zinc-750"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                    Adresa
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    <input
                      type="text"
                      value={formData.adresa}
                      onChange={(e) => setFormData(f => ({ ...f, adresa: e.target.value }))}
                      placeholder="Rr. Muharrem Fejza, Prishtinë"
                      className="w-full rounded-2xl border border-slate-200/60 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800 py-3 pl-10 pr-4 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white dark:focus:bg-zinc-750"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-500">
                    Shënime
                  </label>
                  <div className="relative">
                    <StickyNote className="absolute left-4 top-3.5 h-4 w-4 text-slate-400 dark:text-zinc-500" />
                    <textarea
                      value={formData.shenime}
                      onChange={(e) => setFormData(f => ({ ...f, shenime: e.target.value }))}
                      placeholder="Shënime shtesë për klientin..."
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200/60 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800 py-3 pl-10 pr-4 text-[13px] text-slate-900 dark:text-zinc-100 outline-none transition focus:border-indigo-500/30 focus:bg-white dark:focus:bg-zinc-750 resize-none"
                    />
                  </div>
                </div>

                {/* Modal footer */}
                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 rounded-2xl border border-slate-200/60 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800 text-[13px] font-semibold text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition"
                  >
                    Anulo
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.005 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[13px] hover:bg-slate-800 dark:hover:bg-zinc-200 transition shadow-sm disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <>
                        {editingClient ? <Pencil size={14} /> : <Plus size={14} />}
                        {editingClient ? 'Ruaj Ndryshimet' : 'Shto Klientin'}
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="relative w-full max-w-sm rounded-[2rem] border border-slate-200/60 dark:border-zinc-800 bg-[#f0f0f2] dark:bg-zinc-900 shadow-2xl p-6 text-center"
            >
              <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-[16px] font-bold text-slate-900 dark:text-white">Fshi Klientin?</h3>
              <p className="mt-2 text-[13px] text-slate-500 dark:text-zinc-400 max-w-xs mx-auto">
                Ky veprim nuk mund të kthehet. Të dhënat e klientit do të fshihen përgjithmonë.
              </p>
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200/60 dark:border-zinc-700 bg-white/60 dark:bg-zinc-800 text-[13px] font-semibold text-slate-700 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700 transition"
                >
                  Anulo
                </button>
                <motion.button
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleDelete(deleteId)}
                  disabled={deleting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-rose-600 text-white font-bold text-[13px] hover:bg-rose-700 transition shadow-sm disabled:opacity-50"
                >
                  {deleting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Fshi
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientsPage;
