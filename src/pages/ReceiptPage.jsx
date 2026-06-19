import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Printer, ReceiptText } from 'lucide-react';
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
  anuluar: { label: 'Anuluar', cls: 'border-neutral-500/20 bg-neutral-500/10 text-neutral-600 dark:text-neutral-400' },
};

const ReceiptPage = ({ isPublic = false }) => {
  const { invoiceId } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadReceipt = async () => {
      setLoading(true);
      setError('');
      try {
        const url = isPublic
          ? `/api/invoices/public/${invoiceId}`
          : `/api/invoices/${invoiceId}`;
        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Fatura nuk u gjet');
        }
        setReceipt({
          ...data,
          qrUrl: `${window.location.origin}/fature/publike/${data.secure_code || data.id}`,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadReceipt();
  }, [invoiceId, isPublic]);

  const totalItems = useMemo(
    () => receipt?.items?.reduce((sum, item) => sum + Number(item.sasia || 0), 0) || 0,
    [receipt]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-500" />
          <p className="mt-4 text-[14px] text-zinc-500">Po ngarkohet fatura...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="max-w-md text-center">
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-600">Fatura nuk u gjet</p>
          <h1 className="mt-4 text-[24px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Nuk mund të hapet kjo faturë</h1>
          <p className="mt-3 text-[14px] leading-7 text-zinc-500">{error || 'Kontrollo linkun ose skano përsëri QR-në.'}</p>
          {!isPublic && (
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-3 text-[13px] text-zinc-800 transition hover:border-zinc-300"
            >
              <ArrowLeft size={16} />
              Kthehu në panel
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 print:bg-white">
      {!isPublic && (
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 print:hidden">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/60 px-4 py-2.5 text-[13px] text-zinc-800 transition hover:border-zinc-300"
          >
            <ArrowLeft size={16} />
            Kthehu
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (receipt.qrUrl) {
                  navigator.clipboard.writeText(receipt.qrUrl);
                }
              }}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/60 px-4 py-2.5 text-[13px] text-zinc-800 transition hover:border-zinc-300"
            >
              <Copy size={16} />
              Kopjo linkun
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/15 px-4 py-2.5 text-[13px] font-semibold text-indigo-600 transition hover:border-indigo-500/30 hover:bg-indigo-500/20"
            >
              <Printer size={16} />
              Printo
            </button>
          </div>
        </div>
      )}

      <div className="paper-preview">
        <div className="flex items-start justify-between border-b border-zinc-200 pb-6 print:border-b-2 print:border-black">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-indigo-600 font-semibold">Faturë</p>
            <h1 className="mt-2 text-[28px] font-bold tracking-tight text-zinc-900">{receipt.numri_fatures}</h1>
            <div className="mt-4 space-y-1 text-[13px] text-zinc-600">
              <p>Klienti: <span className="font-semibold text-zinc-900">{receipt.klienti}</span></p>
              <p>Biznesi: <span className="font-semibold text-zinc-900">{receipt.emri_biznesit}</span></p>
              <p>Shitësi: <span className="font-semibold text-zinc-900">{receipt.emri_shitesit || 'Zahlx Operator'}</span></p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Totali</p>
            <p className="mt-1 text-[32px] font-bold tracking-tight text-zinc-900 tabular-nums leading-none">{currency.format(receipt.totali)}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-6 text-[13px]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Data</p>
            <p className="mt-1 font-semibold text-zinc-900">{new Date(receipt.data_krijimit).toLocaleDateString('sq-AL')}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Afati i Pagesës</p>
            <p className="mt-1 font-semibold text-zinc-900">{receipt.due_date ? new Date(receipt.due_date).toLocaleDateString('sq-AL') : 'Sot'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Statusi</p>
            <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${(STATUS_META[receipt.statusi] || STATUS_META.paguar).cls}`}>
              {(STATUS_META[receipt.statusi] || STATUS_META.paguar).label}
            </span>
          </div>
        </div>

        <div className="mt-8">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-zinc-300 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="pb-3 pr-4">Artikulli</th>
                <th className="pb-3 pr-4">Barkod</th>
                <th className="pb-3 pr-4 text-right">Sasia</th>
                <th className="pb-3 pr-4 text-right">Çmimi</th>
                <th className="pb-3 text-right">Totali</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100">
                  <td className="py-3 pr-4 font-medium text-zinc-900">{item.emri}</td>
                  <td className="py-3 pr-4 font-mono text-[12px] text-zinc-400">{item.kodi_bar || '—'}</td>
                  <td className="py-3 pr-4 text-right tabular-nums text-zinc-700">{item.sasia}</td>
                  <td className="py-3 pr-4 text-right tabular-nums text-zinc-700">{currency.format(item.cmimi_per_njesi)}</td>
                  <td className="py-3 text-right font-semibold tabular-nums text-zinc-900">{currency.format(Number(item.cmimi_per_njesi) * Number(item.sasia))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 ml-auto w-72 space-y-1.5 border-t border-zinc-300 pt-4 text-[13px]">
          <div className="flex justify-between text-zinc-600">
            <span>Nëntotali (pa TVSH):</span>
            <span className="font-semibold tabular-nums text-zinc-900">{currency.format(receipt.totali - (receipt.tax_amount || 0))}</span>
          </div>
          {Number(receipt.tax_amount) > 0 && (
            <div className="flex justify-between text-zinc-600">
              <span>TVSH ({receipt.tax_rate}%):</span>
              <span className="font-semibold tabular-nums text-zinc-900">{currency.format(receipt.tax_amount)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-200 pt-1.5 text-[15px] font-bold text-zinc-900">
            <span>Totali (përfshirë TVSH):</span>
            <span className="tabular-nums">{currency.format(receipt.totali)}</span>
          </div>
        </div>

        <div className="mt-10 flex items-start justify-between gap-8 border-t border-zinc-200 pt-6">
          <div className="flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">QR i faturës</p>
            <div className="mt-3 inline-block rounded-xl bg-white p-3 shadow-sm">
              <QRCodeSVG value={receipt.qrUrl} size={100} fgColor="#000000" bgColor="#ffffff" />
            </div>
            <p className="mt-2 text-[11px] text-zinc-400 break-all font-mono">{receipt.qrUrl}</p>
          </div>
          <div className="flex-1 text-right">
            <div className="border-t border-dashed border-zinc-300 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Pranoi (Klienti)</p>
              <p className="mt-6 font-semibold text-zinc-900">{receipt.klienti}</p>
            </div>
            <div className="mt-6 border-t border-dashed border-zinc-300 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Lëshoi (Biznesi)</p>
              <p className="mt-6 font-semibold text-zinc-900">
                {receipt.emri_shitesit === receipt.emri_biznesit
                  ? receipt.emri_biznesit
                  : `${receipt.emri_biznesit} / ${receipt.emri_shitesit}`}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-200 pt-6 text-center">
          <img src={Logo} alt="Zahlx Logo" className="mx-auto h-8 w-auto object-contain" />
          <p className="mt-3 text-[12px] font-semibold text-zinc-800">Faleminderit për bashkëpunimin tuaj!</p>
          <p className="mt-1 text-[11px] text-zinc-400 italic">Kjo faturë është gjeneruar në mënyrë elektronike dhe është e vlefshme pa vulë apo nënshkrim fizik.</p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPage;
