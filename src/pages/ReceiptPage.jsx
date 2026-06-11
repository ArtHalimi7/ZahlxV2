import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Printer, ScanBarcode, ReceiptText, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

const currency = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const STATUS_META = {
  paguar: { label: 'Paguar', cls: 'border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400' },
  ne_pritje: { label: 'Në Pritje (Draft)', cls: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  vonese: { label: 'Vonesë (Overdue)', cls: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  anuluar: { label: 'Anuluar', cls: 'border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400' }
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
          <div className="rounded-[2rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-6 py-10 text-center backdrop-blur-xl">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-200/60 dark:border-white/[0.06] border-t-indigo-500" />
            <p className="mt-4 text-[14px] text-slate-500 dark:text-zinc-400">Po ngarkohet rechnung...</p>
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
          <div className="rounded-[2rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-6 py-10 text-center backdrop-blur-xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-rose-600">Fatura nuk u gjet</p>
            <h1 className="mt-4 text-[24px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Nuk mund të hapet kjo rechnung</h1>
            <p className="mt-3 text-[14px] leading-7 text-slate-500 dark:text-zinc-400">{error || 'Kontrollo linkun ose skano përsëri QR-në.'}</p>
            <Link
              to="/stoku"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[13px] text-slate-800 dark:text-zinc-200 transition hover:border-slate-300 dark:border-white/[0.12] hover:text-slate-900 dark:text-zinc-100"
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
    <div className="relative min-h-full overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent-rgb),0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(var(--accent-rgb),0.08),transparent_24%),linear-gradient(180deg,rgba(0,0,0,0.01),transparent_18%)]" />
      <div className="relative mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link
            to="/stoku"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-2.5 text-[13px] text-slate-800 dark:text-zinc-200 transition hover:border-slate-300 dark:border-white/[0.12] hover:text-slate-900 dark:text-zinc-100"
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
          className="overflow-hidden rounded-[2rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] shadow-[0_22px_70px_rgba(0,0,0,0.06)] dark:shadow-[0_22px_70px_rgba(0,0,0,0.22)] backdrop-blur-xl"
        >
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-600">Rechnung</p>
                  <h1 className="mt-3 text-[2rem] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{receipt.numri_fatures}</h1>
                  <p className="mt-3 text-[14px] text-slate-500 dark:text-zinc-400">Klienti: {receipt.klienti}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-right">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Totali</p>
                  <p className="mt-2 text-[26px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">{currency.format(receipt.totali)}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Data e Krijimit</p>
                  <p className="mt-2 text-[13px] text-slate-900 dark:text-zinc-100">{new Date(receipt.data_krijimit).toLocaleDateString('sq-AL')}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Afati i Pagesës</p>
                  <p className="mt-2 text-[13px] text-slate-900 dark:text-zinc-100">{receipt.due_date ? new Date(receipt.due_date).toLocaleDateString('sq-AL') : 'Sot'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Artikuj</p>
                  <p className="mt-2 text-[13px] text-slate-900 dark:text-zinc-100 tabular-nums">{receipt.items.length} rreshta / {totalItems} copë</p>
                </div>
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-zinc-500">Statusi</p>
                  <p className="mt-1">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${(STATUS_META[receipt.statusi] || STATUS_META.paguar).cls}`}>
                      {(STATUS_META[receipt.statusi] || STATUS_META.paguar).label}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200/60 dark:border-white/[0.06]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02] text-left text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">
                      <th className="px-4 py-3 font-medium">Artikulli</th>
                      <th className="px-4 py-3 font-medium">Barkod</th>
                      <th className="px-4 py-3 text-right font-medium">Sasia</th>
                      <th className="px-4 py-3 text-right font-medium">Çmimi</th>
                      <th className="px-4 py-3 text-right font-medium">Totali</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.items.map((item) => (
                      <tr key={item.id} className="border-b border-white/[0.03] last:border-0">
                        <td className="px-4 py-4 text-[13px] text-slate-900 dark:text-zinc-100">{item.emri}</td>
                        <td className="px-4 py-4 font-mono text-[12px] text-slate-400 dark:text-zinc-500">{item.kodi_bar}</td>
                        <td className="px-4 py-4 text-right text-[13px] text-slate-700 dark:text-zinc-300 tabular-nums">{item.sasia}</td>
                        <td className="px-4 py-4 text-right text-[13px] text-slate-700 dark:text-zinc-300 tabular-nums">{currency.format(item.cmimi_per_njesi)}</td>
                        <td className="px-4 py-4 text-right text-[13px] font-semibold text-slate-900 dark:text-zinc-100 tabular-nums">{currency.format(Number(item.cmimi_per_njesi) * Number(item.sasia))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-slate-200/60 dark:border-white/[0.06] bg-white/40 dark:bg-white/[0.02]">
                    <tr className="text-[12px] text-slate-500 dark:text-zinc-400">
                      <td colSpan="3" className="px-4 py-2 text-right">Nëntotali:</td>
                      <td colSpan="2" className="px-4 py-2 text-right tabular-nums">{currency.format(receipt.totali - (receipt.tax_amount || 0))}</td>
                    </tr>
                    {Number(receipt.tax_amount) > 0 && (
                      <tr className="text-[12px] text-slate-500 dark:text-zinc-400">
                        <td colSpan="3" className="px-4 py-2 text-right">TVSH ({receipt.tax_rate}%):</td>
                        <td colSpan="2" className="px-4 py-2 text-right tabular-nums">{currency.format(receipt.tax_amount)}</td>
                      </tr>
                    )}
                    <tr className="text-[14px] font-bold text-slate-900 dark:text-zinc-100 border-t border-slate-200/30 dark:border-white/[0.03]">
                      <td colSpan="3" className="px-4 py-3 text-right">Totali:</td>
                      <td colSpan="2" className="px-4 py-3 text-right text-indigo-600 dark:text-indigo-400 tabular-nums">{currency.format(receipt.totali)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="border-t border-slate-200/60 dark:border-white/[0.06] bg-[#f4f4f5] dark:bg-zinc-950/40 p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">QR i faturës</p>
                  <h2 className="mt-2 text-[16px] font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Skano për përmbajtjen e plotë</h2>
                </div>
              </div>

              <div className="mt-6 grid place-items-center rounded-[1.5rem] border border-slate-200/60 dark:border-white/[0.06] bg-white p-6">
                <QRCodeSVG value={receipt.qrUrl} size={220} fgColor="#09090b" bgColor="#ffffff" />
              </div>

              <div className="mt-5 rounded-[1.25rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-[12px] text-slate-500 dark:text-zinc-400">
                  <ReceiptText size={14} />
                  {receipt.qrUrl}
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(receipt.qrUrl)}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-3 py-2 text-[12px] text-slate-800 dark:text-zinc-200 transition hover:border-slate-300 dark:border-white/[0.12] hover:text-slate-900 dark:text-zinc-100"
                >
                  <Copy size={14} />
                  Kopjo linkun
                </button>
              </div>

              <div className="mt-6 rounded-[1.25rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-4">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-zinc-500">Shënim</p>
                <p className="mt-2 text-[13px] leading-6 text-slate-700 dark:text-zinc-300">
                  QR çon direkt në këtë faqe rechnung, ku çdo artikull, totali dhe klienti shfaqen të strukturuara për verifikim ose printim.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between rounded-[1.25rem] border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] px-4 py-3 text-[13px] text-slate-700 dark:text-zinc-300">
                <span>Shkurtim operativ</span>
                <Link to="/produktet" className="text-indigo-600 dark:text-indigo-400 transition hover:text-indigo-200">
                  <ScanBarcode size={16} className="inline-block align-[-3px]" />
                  Kthehu te produktet
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default ReceiptPage;
