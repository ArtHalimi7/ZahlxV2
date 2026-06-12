import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Printer, ScanBarcode, ReceiptText, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Logo from '../assets/X.png';


const currency = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const STATUS_META = {
  paguar: { label: 'Paguar', cls: 'border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400' },
  ne_pritje: { label: 'Në Pritje (Draft)', cls: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  vonese: { label: 'Vonesë (Overdue)', cls: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  anuluar: { label: 'Anuluar', cls: 'border-neutral-500/20 bg-neutral-500/10 text-neutral-600 dark:text-neutral-450' }
};

const ReceiptPage = () => {
  const { invoiceId } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReceipt = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/invoices/${invoiceId}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Fatura nuk u gjet');
        }
        setReceipt({
          ...data,
          qrUrl: `${window.location.origin}/fature/${data.id}`,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadReceipt();
  }, [invoiceId]);

  const totalItems = useMemo(
    () => receipt?.items?.reduce((sum, item) => sum + Number(item.sasia || 0), 0) || 0,
    [receipt]
  );

  if (loading) {
    return (
      <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(var(--accent-rgb),0.08),transparent_24%)]" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] px-6 py-10 text-center backdrop-blur-xl">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200/60 dark:border-transparent border-t-indigo-500" />
            <p className="mt-4 text-[14px] text-slate-500 dark:text-zinc-400">Po ngarkohet fatura...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(var(--accent-rgb),0.08),transparent_24%)]" />
        <div className="relative mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] px-6 py-10 text-center backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-rose-600">Fatura nuk u gjet</p>
            <h1 className="mt-4 text-[24px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Nuk mund të hapet kjo faturë</h1>
            <p className="mt-3 text-[14px] leading-7 text-slate-500 dark:text-zinc-400">{error || 'Kontrollo linkun ose skano përsëri QR-në.'}</p>
            <Link
              to="/stoku"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200/60 dark:border-transparent bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[13px] text-slate-800 dark:text-zinc-200 transition hover:border-slate-300 dark:border-transparent hover:text-slate-900 dark:text-zinc-100"
            >
              <ArrowLeft size={16} />
              Kthehu te inventari
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950 print:bg-white print:text-black print:min-h-0">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(var(--accent-rgb),0.08),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.01),transparent_18%)] print:hidden" />
      <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:p-0">
        <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
          <Link
            to="/stoku"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] px-4 py-2.5 text-[13px] text-slate-800 dark:text-zinc-200 transition hover:border-slate-355 dark:hover:border-white/[0.15] dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-zinc-100"
          >
            <ArrowLeft size={16} />
            Kthehu
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/15 px-4 py-2.5 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400 transition hover:border-indigo-500/30 hover:bg-indigo-500/20"
          >
            <Printer size={16} />
            Print
          </button>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-[2rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] shadow-[0_22px_70px_rgba(0,0,0,0.06)] dark:shadow-[0_22px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl print:border-none print:shadow-none print:bg-transparent print:rounded-none"
        >
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr] print:flex print:flex-col">
            <div className="p-6 sm:p-8 print:p-0">
              <div className="flex flex-wrap items-start justify-between gap-4 print:flex-row print:items-center">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-655 dark:text-indigo-400 print:text-black print:font-semibold">Faturë</p>
                  <h1 className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 print:text-black print:mt-1">{receipt.numri_fatures}</h1>
                  <div className="mt-3 space-y-1.5 text-[14px] text-slate-500 dark:text-zinc-400 print:text-black">
                    <p>Klienti: <span className="font-semibold text-slate-800 dark:text-zinc-200 print:text-black">{receipt.klienti}</span></p>
                    <p>Biznesi: <span className="font-semibold text-slate-800 dark:text-zinc-200 print:text-black">{receipt.emri_biznesit}</span></p>
                    <p>Shitësi / Operatori: <span className="font-semibold text-slate-800 dark:text-zinc-200 print:text-black">{receipt.emri_shitesit || 'Zahlx Operator'}</span></p>
                  </div>
                </div>
                <div className="rounded-2xl border border-indigo-500/15 dark:border-indigo-500/20 bg-indigo-500/[0.04] dark:bg-indigo-500/[0.06] px-5 py-3.5 text-center print:border-none print:bg-transparent print:p-0 print:text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-650 dark:text-indigo-400 print:text-black">Totali i Faturës</p>
                  <p className="mt-1.5 text-[30px] font-bold tracking-tight text-slate-900 dark:text-zinc-50 tabular-nums leading-none print:text-black print:text-2xl print:mt-1">{currency.format(receipt.totali)}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 grid-cols-2 sm:grid-cols-4 text-center print:grid-cols-4 print:mt-4 print:gap-1">
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.05] bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-center transition hover:bg-white/60 dark:hover:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.08] print:border-none print:bg-transparent print:p-0 print:text-left">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-400 font-medium print:text-black print:font-semibold">Data e Krijimit</p>
                  <p className="mt-2 text-[13px] text-slate-900 dark:text-zinc-100 print:text-black print:mt-1 font-semibold">{new Date(receipt.data_krijimit).toLocaleDateString('sq-AL')}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.05] bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-center transition hover:bg-white/60 dark:hover:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.08] print:border-none print:bg-transparent print:p-0 print:text-left">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-400 font-medium print:text-black print:font-semibold">Afati i Pagesës</p>
                  <p className="mt-2 text-[13px] text-slate-900 dark:text-zinc-100 print:text-black print:mt-1 font-semibold">{receipt.due_date ? new Date(receipt.due_date).toLocaleDateString('sq-AL') : 'Sot'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.05] bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-center transition hover:bg-white/60 dark:hover:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.08] print:border-none print:bg-transparent print:p-0 print:text-left">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-400 font-medium print:text-black print:font-semibold">Artikuj</p>
                  <p className="mt-2 text-[13px] text-slate-900 dark:text-zinc-100 tabular-nums print:text-black print:mt-1 font-semibold">{totalItems} copë</p>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.05] bg-white/40 dark:bg-white/[0.02] px-4 py-3 text-center transition hover:bg-white/60 dark:hover:bg-white/[0.04] hover:border-slate-300 dark:hover:border-white/[0.08] print:border-none print:bg-transparent print:p-0 print:text-left">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-400 font-medium print:text-black print:font-semibold">Statusi</p>
                  <div className="mt-2 flex justify-center print:justify-start print:mt-1">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${(STATUS_META[receipt.statusi] || STATUS_META.paguar).cls} print:border print:border-black/30 print:bg-zinc-50 print:text-black print:px-2.5 print:py-1 print:rounded-md print:text-[10px] print:uppercase print:tracking-wider print:font-bold`}>
                      {(STATUS_META[receipt.statusi] || STATUS_META.paguar).label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto rounded-[1.5rem] border border-slate-200/60 dark:border-white/[0.06] print:border-none print:rounded-none print:mt-8">
                <table className="w-full min-w-[500px] sm:min-w-0">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] text-left text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-400 font-medium print:bg-transparent print:text-black print:border-b-2 print:border-black">
                      <th className="px-4 py-3 font-medium print:px-2 print:py-2">Artikulli</th>
                      <th className="px-4 py-3 font-medium print:px-2 print:py-2">Barkod</th>
                      <th className="px-4 py-3 text-right font-medium print:px-2 print:py-2">Sasia</th>
                      <th className="px-4 py-3 text-right font-medium print:px-2 print:py-2">Çmimi</th>
                      <th className="px-4 py-3 text-right font-medium print:px-2 print:py-2">Totali</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items.map((item) => (
                      <tr key={item.id} className="border-b border-white/[0.03] last:border-0 print:border-b print:border-zinc-100">
                        <td className="px-4 py-4 text-[13px] text-slate-900 dark:text-zinc-100 print:text-black print:px-2 print:py-2">{item.emri}</td>
                        <td className="px-4 py-4 font-mono text-[12px] text-slate-400 dark:text-zinc-500 print:text-black print:px-2 print:py-2">{item.kodi_bar}</td>
                        <td className="px-4 py-4 text-right text-[13px] text-slate-700 dark:text-zinc-300 tabular-nums print:text-black print:px-2 print:py-2">{item.sasia}</td>
                        <td className="px-4 py-4 text-right text-[13px] text-slate-700 dark:text-zinc-300 tabular-nums print:text-black print:px-2 print:py-2">{currency.format(item.cmimi_per_njesi)}</td>
                        <td className="px-4 py-4 text-right text-[13px] font-semibold text-slate-900 dark:text-zinc-100 tabular-nums print:text-black print:px-2 print:py-2">{currency.format(Number(item.cmimi_per_njesi) * Number(item.sasia))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] print:bg-transparent print:border-t-2 print:border-black">
                    <tr className="text-[12px] text-slate-500 dark:text-zinc-400 print:text-black">
                      <td colSpan="3" className="px-4 py-2 text-right print:px-2 print:py-1.5">Nëntotali:</td>
                      <td colSpan="2" className="px-4 py-2 text-right tabular-nums print:px-2 print:py-1.5">{currency.format(receipt.totali - (receipt.tax_amount || 0))}</td>
                    </tr>
                    {Number(receipt.tax_amount) > 0 && (
                      <tr className="text-[12px] text-slate-500 dark:text-zinc-400 print:text-black">
                        <td colSpan="3" className="px-4 py-2 text-right print:px-2 print:py-1.5">TVSH ({receipt.tax_rate}%):</td>
                        <td colSpan="2" className="px-4 py-2 text-right tabular-nums print:px-2 print:py-1.5">{currency.format(receipt.tax_amount)}</td>
                      </tr>
                    )}
                    <tr className="text-[14px] font-bold text-slate-900 dark:text-zinc-100 border-t border-slate-200/30 dark:border-white/[0.06] print:text-black print:border-t print:border-zinc-350">
                      <td colSpan="3" className="px-4 py-3 text-right print:px-2 print:py-2">Totali:</td>
                      <td colSpan="2" className="px-4 py-3 text-right text-indigo-600 dark:text-indigo-400 tabular-nums print:text-black print:px-2 print:py-2">{currency.format(receipt.totali)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="border-t border-slate-200/60 dark:border-white/[0.06] bg-[#f4f4f5] dark:bg-zinc-900 p-6 sm:p-8 lg:border-l lg:border-t-0 print:border-none print:bg-transparent print:p-0 print:mt-8 print:flex print:flex-col print:items-center print:justify-center">
              <div className="print:text-center">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-400 font-medium print:text-black">QR i faturës</p>
                <h2 className="mt-2 text-[16px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 print:text-black print:text-[13px] print:mt-1">Skano për përmbajtjen e plotë</h2>
              </div>

              <div className="mt-6 grid place-items-center p-6 print:mt-4 print:p-0">
                <div className="rounded-2xl bg-white p-4 shadow-md print:p-0 print:shadow-none">
                  <QRCodeSVG value={receipt.qrUrl} size={110} fgColor="#000000" bgColor="#ffffff" />
                </div>
              </div>

              <div className="mt-5 rounded-[1.25rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-4 print:hidden">
                <div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-zinc-400">
                  <ReceiptText size={14} className="shrink-0 text-slate-400 dark:text-zinc-500" />
                  <span className="font-mono text-[11px] break-all tracking-tight">{receipt.qrUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(receipt.qrUrl)}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200/60 dark:border-white/[0.08] bg-white/60 dark:bg-white/[0.03] px-3 py-2 text-[12px] text-slate-800 dark:text-zinc-200 transition hover:border-slate-350 dark:hover:border-white/[0.15] hover:bg-white/80 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-zinc-100"
                >
                  <Copy size={14} />
                  Kopjo linkun
                </button>
              </div>

              <div className="mt-6 rounded-[1.25rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-4 print:hidden">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-400 font-medium">Shënim</p>
                <p className="mt-2 text-[13px] leading-6 text-slate-700 dark:text-zinc-300">
                  QR çon direkt në këtë faqe fature, ku çdo artikull, totali dhe klienti shfaqen të strukturuara për verifikim ose printim.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-[1.25rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[13px] text-slate-700 dark:text-zinc-300 print:hidden">
                <span>Shkurtim operativ</span>
                <Link to="/produktet" className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 transition hover:text-indigo-750 dark:hover:text-indigo-300 font-semibold">
                  <ScanBarcode size={16} />
                  Kthehu te produktet
                </Link>
              </div>
            </div>
          </div>

          {/* Business Signatures & Premium Footer */}
          <div className="hidden print:block border-t border-slate-200/60 dark:border-white/[0.06] p-6 sm:p-8 bg-slate-50/20 dark:bg-white/[0.01] print:bg-transparent print:border-t-2 print:border-black print:p-0 print:mt-16">
            <div className="grid grid-cols-2 gap-12 text-[12px] print:grid">
              <div className="border-t border-dashed border-slate-300 dark:border-white/10 pt-4 text-center print:border-zinc-300">
                <p className="text-slate-400 dark:text-zinc-500 print:text-zinc-550 font-medium uppercase tracking-wider text-[10px]">Pranoi (Klienti)</p>
                <div className="h-10" />
                <p className="font-semibold text-slate-800 dark:text-zinc-200 print:text-black">{receipt.klienti}</p>
              </div>
              <div className="border-t border-dashed border-slate-300 dark:border-white/10 pt-4 text-center print:border-zinc-300">
                <p className="text-slate-400 dark:text-zinc-500 print:text-zinc-550 font-medium uppercase tracking-wider text-[10px]">Lëshoi (Biznesi)</p>
                <div className="h-10" />
                <p className="font-semibold text-slate-800 dark:text-zinc-200 print:text-black">
                  {receipt.emri_shitesit === receipt.emri_biznesit
                    ? receipt.emri_biznesit
                    : `${receipt.emri_biznesit} / ${receipt.emri_shitesit}`}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center text-[11px] text-slate-400 dark:text-zinc-500 print:text-zinc-555 print:mt-8">
              <img src={Logo} alt="Zahlx Logo" className="h-10 w-auto object-contain dark:invert print:invert-0 print:brightness-0" />
              <div>
                <p className="font-semibold">Faleminderit për bashkëpunimin tuaj!</p>
                <p className="mt-1 italic">Kjo faturë është gjeneruar në mënyrë elektronike dhe është e vlefshme pa vulë apo nënshkrim fizik.</p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default ReceiptPage;
