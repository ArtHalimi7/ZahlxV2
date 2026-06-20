import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Printer, Check, ShieldAlert } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import JsBarcode from 'jsbarcode';
import Logo from '../assets/X.png';

const currency = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const STATUS_META = {
  paguar: { label: 'PAGUAR (PAID)', cls: 'border-zinc-900 bg-zinc-900 text-white' },
  ne_pritje: { label: 'NË PRITJE (DRAFT)', cls: 'border-zinc-300 bg-zinc-50 text-zinc-600' },
  vonese: { label: 'VONESE (OVERDUE)', cls: 'border-zinc-900 bg-white text-zinc-900 font-bold border-2' },
  anuluar: { label: 'ANULUAR (CANCELLED)', cls: 'border-zinc-200 bg-zinc-100/50 text-zinc-400 line-through' },
};

// InvoiceBanner removed

const ReceiptPage = ({ isPublic = false }) => {
  const { invoiceId } = useParams();
  const { user } = useAuth();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const barcodeRef = useRef(null);

  const subtotalBeforeDiscount = useMemo(() => {
    if (!receipt || !receipt.items) return 0;
    return receipt.items.reduce((sum, item) => sum + Number(item.cmimi_per_njesi) * Number(item.sasia), 0);
  }, [receipt]);

  useEffect(() => {
    const loadReceipt = async () => {
      setLoading(true);
      setError('');
      try {
        // Always fetch from the public endpoint using the scrambled secure_code
        const url = `/api/invoices/public/${invoiceId}`;
        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Fatura nuk u gjet');
        }
        setReceipt({
          ...data,
          qrUrl: `${window.location.origin}/fature/${data.secure_code}`,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadReceipt();
  }, [invoiceId]);

  // Render barcode once secure_code is available
  useEffect(() => {
    if (barcodeRef.current && receipt?.secure_code) {
      try {
        JsBarcode(barcodeRef.current, receipt.secure_code, {
          format: "CODE128",
          lineColor: "#1f2937",
          width: 1.4,
          height: 40,
          displayValue: true,
          fontSize: 11,
          font: "monospace",
          textAlign: "center",
          textPosition: "bottom",
          textMargin: 4,
          margin: 4
        });
      } catch (err) {
        console.error("JsBarcode generation failed:", err);
      }
    }
  }, [receipt?.secure_code]);

  const getNetPrice = (price, rate) => {
    const r = Number(rate || 0);
    return price / (1 + r / 100);
  };

  const getNetTotal = (price, quantity, rate) => {
    const r = Number(rate || 0);
    return (price * quantity) / (1 + r / 100);
  };

  const handleCopyLink = () => {
    if (receipt.qrUrl) {
      navigator.clipboard.writeText(receipt.qrUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-blue-600" />
          <p className="mt-4 text-[14px] text-zinc-500 font-medium">Po ngarkohet fatura zyrtare...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
        <div className="max-w-md text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-xl">
          <div className="mx-auto h-12 w-12 grid place-items-center rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 mb-4">
            <ShieldAlert size={24} />
          </div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-600 font-bold">Gabim</p>
          <h1 className="mt-2 text-[20px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Fatura nuk u gjet</h1>
          <p className="mt-3 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{error || 'Kontrollo linkun ose skano përsëri barkodin/QR-në.'}</p>
          {user && (
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-[13px] font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              <ArrowLeft size={16} />
              Kthehu në panel
            </Link>
          )}
        </div>
      </div>
    );
  }

  const activeStatus = STATUS_META[receipt.statusi] || STATUS_META.paguar;

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 py-6 print:py-0 print:bg-white transition-colors">

      {/* Action Bar (hidden when printing) */}
      <div className="mx-auto flex max-w-[850px] items-center justify-between gap-4 px-4 pb-4 print:hidden">
        {user ? (
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            <ArrowLeft size={16} />
            Kthehu në Panel
          </Link>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          {user && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              {copied ? 'U kopjua!' : 'Kopjo linkun'}
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 px-4 py-2.5 text-[13px] font-bold text-white transition shadow-sm"
          >
            <Printer size={16} />
            Printo Faturën
          </button>
        </div>
      </div>

      {/* Main Official Document Wrapper */}
      <div className="paper-preview relative flex flex-col justify-between max-w-[210mm] mx-auto bg-white shadow-lg rounded-2xl border border-zinc-200/50 select-text print:shadow-none print:rounded-none print:border-0">
        <div>
          {/* Simple, Minimalized & Premium Header */}
          <div className="flex justify-between items-center px-6 py-6 border-b border-zinc-200 bg-zinc-50/50">
            <div className="flex items-center gap-4">
              <img src={Logo} alt="Zahlx Logo" className="h-10 w-auto object-contain brightness-0 transition-all" />
              <div>
                <h1 className="text-[20px] font-black uppercase tracking-wider text-zinc-900">Faturë Fiskale</h1>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">{receipt.emri_biznesit}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${activeStatus.cls}`}>
                {activeStatus.label}
              </span>
            </div>
          </div>

          {/* Top Metadata Area */}
          <div className="mt-8 flex justify-between items-start gap-8 px-6">
            {/* Left: Barcode + Supplier Info */}
            <div className="flex flex-col">
              <div className="bg-white rounded-lg p-2 inline-block self-start">
                <svg ref={barcodeRef} className="w-full h-auto block"></svg>
              </div>
              <div className="mt-3 text-[11px] text-zinc-700 leading-tight space-y-0.5">
                <p className="font-extrabold text-[12px] text-zinc-900 uppercase">{receipt.emri_biznesit}</p>
                <p className="text-zinc-500">
                  Operatori: <span className="font-mono font-medium">{receipt.emri_shitesit || 'Zahlx Operator'}</span>
                </p>
              </div>
            </div>

            {/* Right: Vendor Address & Contacts */}
            <div className="text-right text-[11px] text-zinc-600 space-y-1">
              <p className="font-bold text-zinc-900 uppercase">Kontakti dhe Adresa</p>
              <p>Tel: +383 (38) 200-300</p>
              <p>E-Mail: {receipt.email_biznesit || 'billing@zahlx.com'}</p>
              <p className="font-medium text-zinc-800">Rruga Bill Clinton, Nr. 120, Prishtinë</p>
            </div>
          </div>

          {/* Horizontal Divider Line */}
          <div className="mt-6 border-b border-zinc-200" />

          {/* Customer & Invoice Details Columns */}
          <div className="mt-8 grid grid-cols-2 gap-12 px-6">
            {/* Left Column: Customer Details */}
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">Faturuar për (Blerësi)</p>
                <h2 className="mt-1 text-[16px] font-black text-zinc-900 uppercase tracking-tight">{receipt.klienti}</h2>
              </div>
              <div className="space-y-3 text-[11px] text-zinc-700">
                {receipt.klient_email && (
                  <div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Email</span>
                    <p className="font-semibold text-zinc-900">{receipt.klient_email}</p>
                  </div>
                )}
                {receipt.klient_telefoni && (
                  <div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Tel</span>
                    <p className="font-semibold text-zinc-900">{receipt.klient_telefoni}</p>
                  </div>
                )}
                {receipt.klient_adresa && (
                  <div>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Adresa</span>
                    <p className="font-semibold text-zinc-900">{receipt.klient_adresa}</p>
                  </div>
                )}
                <div className="pt-2 border-t border-zinc-100">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">ID e Klientit</span>
                  <p className="font-mono text-zinc-900 font-bold">#KL-{String(receipt.id).padStart(4, '0')}</p>
                </div>
              </div>
            </div>

            {/* Right Column: Invoice Details */}
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">Detajet e Faturës</p>
                <h2 className="mt-1 text-[16px] font-black text-zinc-900 uppercase tracking-tight">Fatura Zyrtare</h2>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[11px] text-zinc-700">
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Numri i Faturës</span>
                  <p className="font-mono font-bold text-zinc-900 tracking-tight">{receipt.numri_fatures}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Data e Lëshimit</span>
                  <p className="font-semibold text-zinc-900">{new Date(receipt.data_krijimit).toLocaleDateString('sq-AL')}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Mënyra e Pagesës</span>
                  <p className="font-semibold text-zinc-900">{receipt.menyra_pageses || 'KESH'}</p>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">ID e Operatorit</span>
                  <p className="font-mono text-zinc-900">#OP-{String(receipt.seller_id || 1).padStart(3, '0')}</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-zinc-100">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Faqja</span>
                  <p className="font-semibold text-zinc-900">1 / 1</p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-4 text-[9px] text-zinc-400 italic px-6">
            * Ne dërgojmë ekskluzivisht në përputhje me Kushtet tona të Përgjithshme të Shitjes. Ky dokument shërben si faturë zyrtare tatimore.
          </p>

          {/* Structured Items Table */}
          <div className="mt-6 mx-6 border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-zinc-900 text-zinc-100 text-[10px] font-extrabold uppercase tracking-wider">
                  <th className="px-3 py-3.5 w-12 text-center">Nr.</th>
                  <th className="px-3 py-3.5 w-20 text-right">Sasia</th>
                  <th className="px-3 py-3.5">Përshkrimi i Artikullit</th>
                  <th className="px-3 py-3.5 w-28 text-center">Kodi / Barkodi</th>
                  <th className="px-3 py-3.5 w-24 text-right">Çmimi Neto</th>
                  <th className="px-3 py-3.5 w-16 text-center">TVSH %</th>
                  <th className="px-3 py-3.5 w-24 text-right">Vlera (Bruto)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {receipt.items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="hover:bg-zinc-50/50 transition-colors"
                  >
                    <td className="px-3 py-3.5 text-center font-mono text-zinc-400">{idx + 1}</td>
                    <td className="px-3 py-3.5 text-right font-bold tabular-nums text-zinc-800">{Number(item.sasia || 1)} Copë</td>
                    <td className="px-3 py-3.5 font-semibold text-zinc-900 leading-tight">
                      {item.emri}
                      {item.kodi_bar && (
                        <span className="block sm:hidden text-[9px] font-mono text-zinc-400 mt-1">{item.kodi_bar}</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-center font-mono text-[10px] text-zinc-500">{item.kodi_bar || '—'}</td>
                    <td className="px-3 py-3.5 text-right tabular-nums font-mono text-zinc-600">
                      {currency.format(getNetPrice(Number(item.cmimi_per_njesi), item.tax_rate))}
                    </td>
                    <td className="px-3 py-3.5 text-center font-bold text-zinc-700">{item.tax_rate || 0}%</td>
                    <td className="px-3 py-3.5 text-right font-extrabold tabular-nums text-zinc-950 font-mono">
                      {currency.format(Number(item.cmimi_per_njesi) * Number(item.sasia))}
                    </td>
                  </tr>
                ))}

                {/* Vertical columns fill spacer row (keeps grid aligned) */}
                <tr className="h-16 bg-zinc-55/10">
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3 text-zinc-400 italic align-top pt-3 font-medium text-[10px]">
                    * Artikujt u transportuan dhe u lëshuan në vendin e shitjes.
                  </td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3"></td>
                </tr>

                {/* Subtotals & Taxes inside table columns */}
                {Number(receipt.discount_rate) > 0 && (
                  <>
                    <tr className="border-t border-zinc-200/80 bg-zinc-50/20">
                      <td colSpan={6} className="px-3 py-2.5 text-right text-zinc-500 uppercase tracking-wider text-[9px] font-bold">Subtotali (para zbritjes):</td>
                      <td className="px-3 py-2.5 text-right font-mono text-zinc-800 font-bold text-[12px]">{currency.format(subtotalBeforeDiscount)}</td>
                    </tr>
                    <tr className="border-t border-zinc-200/40 bg-zinc-50/20">
                      <td colSpan={6} className="px-3 py-2.5 text-right text-zinc-500 uppercase tracking-wider text-[9px] font-bold">Zbritja ({receipt.discount_rate}%):</td>
                      <td className="px-3 py-2.5 text-right font-mono text-rose-600 font-bold text-[12px]">-{currency.format(receipt.discount_amount)}</td>
                    </tr>
                  </>
                )}
                <tr className="border-t border-zinc-200/80 bg-zinc-50/20">
                  <td colSpan={6} className="px-3 py-2.5 text-right text-zinc-500 uppercase tracking-wider text-[9px] font-bold">Nëntotali (pa TVSH):</td>
                  <td className="px-3 py-2.5 text-right font-mono text-zinc-800 font-bold text-[12px]">{currency.format(receipt.totali - (receipt.tax_amount || 0))}</td>
                </tr>
                {Number(receipt.tax_amount) > 0 && (
                  <tr className="border-t border-zinc-200/40 bg-zinc-50/20">
                    <td colSpan={6} className="px-3 py-2.5 text-right text-zinc-500 uppercase tracking-wider text-[9px] font-bold">TVSH:</td>
                    <td className="px-3 py-2.5 text-right font-mono text-zinc-800 font-bold text-[12px]">{currency.format(receipt.tax_amount)}</td>
                  </tr>
                )}
                <tr className="border-t-2 border-b-2 border-zinc-950 bg-zinc-950 text-white font-black">
                  <td colSpan={6} className="px-3 py-3.5 text-right uppercase tracking-widest text-[10px] font-black">TOTALI (ME TVSH):</td>
                  <td className="px-3 py-3.5 text-right font-mono text-[15px] font-black">{currency.format(receipt.totali)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer Receipt Info (QR & Verification - Clean and minimalist) */}
          <div className="mt-8 flex justify-between items-start gap-12 px-6">
            <div className="flex items-center gap-4">
              <QRCodeSVG value={receipt.qrUrl} size={70} fgColor="#000000" bgColor="transparent" />
              <div className="max-w-[280px] text-[10px] text-zinc-400 leading-normal">
                <p className="font-bold text-zinc-800 uppercase tracking-wider text-[9px]">Verifikimi i Faturës</p>
                <p className="mt-0.5">Skanoni QR kodin për verifikimin zyrtar të faturës në portalin e Zahlx.</p>
                <p className="mt-1 font-mono text-[8px] break-all select-all text-zinc-500 hover:text-zinc-850 underline transition">{receipt.qrUrl}</p>
              </div>
            </div>

            <div className="text-right text-[9px] text-zinc-400 max-w-xs italic pt-2">
              * Ky dokument shërben si faturë zyrtare dhe dëshmi e kryerjes së transaksionit fiskal.
            </div>
          </div>

          {/* Signatures Section */}
          <div className="mt-10 grid grid-cols-2 gap-12 px-6">
            <div className="border-t border-dashed border-zinc-300 pt-3 text-center">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Pranoi (Blerësi / Klienti)</p>
              <div className="h-8" />
              <p className="text-[12px] font-extrabold text-zinc-900 uppercase">{receipt.klienti}</p>
            </div>
            <div className="border-t border-dashed border-zinc-300 pt-3 text-center">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Lëshoi (Operatori / Përfaqësuesi)</p>
              <div className="h-8" />
              <p className="text-[12px] font-extrabold text-zinc-900 uppercase">{receipt.emri_shitesit || receipt.emri_biznesit}</p>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-12 mx-6 border-t border-zinc-200 pt-4 pb-2 text-[10px] text-zinc-500">
          <div className="text-center mt-2 text-[10px] text-zinc-400 italic">
            Faleminderit për bashkëpunimin tuaj! Kjo faturë është gjeneruar në mënyrë elektronike dhe është e vlefshme pa vulë fizike.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPage;
