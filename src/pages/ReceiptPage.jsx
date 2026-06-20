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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-zinc-200 border-t-blue-600" />
          <p className="mt-4 text-[14px] text-zinc-500 font-medium">Po ngarkohet fatura zyrtare...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
        <div className="max-w-md text-center bg-white border border-zinc-200 p-8 rounded-3xl shadow-xl">
          <div className="mx-auto h-12 w-12 grid place-items-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
            <ShieldAlert size={24} />
          </div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-rose-600 font-bold">Gabim</p>
          <h1 className="mt-2 text-[20px] font-bold tracking-tight text-zinc-900">Fatura nuk u gjet</h1>
          <p className="mt-3 text-[13px] leading-relaxed text-zinc-500">{error || 'Kontrollo linkun ose skano përsëri barkodin/QR-në.'}</p>
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
    <div className="min-h-screen bg-zinc-50 py-4 sm:py-6 print:py-0 print:bg-white transition-colors">

      {/* Action Bar (hidden when printing) */}
      <div className="mx-auto flex max-w-[850px] flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 pb-3 sm:pb-4 print:hidden">
        {user ? (
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-zinc-800 transition hover:bg-zinc-50"
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
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-zinc-800 transition hover:bg-zinc-50"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              {copied ? 'U kopjua!' : 'Kopjo linkun'}
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-900 hover:bg-zinc-800 px-4 py-2.5 text-[13px] font-bold text-white transition shadow-sm"
          >
            <Printer size={16} />
            Printo Faturën
          </button>
        </div>
      </div>

      {/* Main Official Document Wrapper */}
      <div className="paper-preview relative flex flex-col justify-between max-w-[210mm] mx-auto bg-white shadow-lg rounded-2xl border border-zinc-200/50 select-text print:shadow-none print:rounded-none print:border-0">
        <div>
          {/* Simple, Minimalized & Premium Header — always one row */}
          <div className="flex flex-row justify-between items-center gap-2 px-4 sm:px-6 py-4 sm:py-6 border-b border-zinc-200 bg-zinc-50/50">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <img src={Logo} alt="Zahlx Logo" className="h-7 sm:h-10 w-auto object-contain brightness-0 transition-all shrink-0" />
              <div className="min-w-0">
                <h1 className="text-[14px] sm:text-[20px] font-black uppercase tracking-wider text-zinc-900 leading-tight">Faturë Fiskale</h1>
                <p className="text-[8px] sm:text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5 truncate">{receipt.emri_biznesit}</p>
              </div>
            </div>
            <div className="shrink-0">
              <span className={`inline-flex items-center rounded-lg border px-2 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-black uppercase tracking-wider ${activeStatus.cls}`}>
                {activeStatus.label}
              </span>
            </div>
          </div>

          {/* Barcode + Logo side by side */}
          <div className="mt-4 sm:mt-6 px-4 sm:px-6 flex items-center gap-4 sm:gap-6">
            {/* Barcode — constrained to left portion */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <svg ref={barcodeRef} className="w-full h-auto block"></svg>
            </div>
            {/* Logo — right side */}
            <div className="shrink-0 flex items-center justify-center">
              <img
                src={Logo}
                alt="Zahlx"
                className="h-16 sm:h-24 w-auto object-contain brightness-0 opacity-80"
              />
            </div>
          </div>

          {/* Supplier Info + Contact — 2-col */}
          <div className="mt-2 sm:mt-3 grid grid-cols-2 gap-0 px-4 sm:px-6">
            {/* Left: Supplier Info */}
            <div className="pr-3 sm:pr-6 text-[10px] sm:text-[11px] text-zinc-700 space-y-0.5">
              <p className="font-extrabold text-[11px] sm:text-[12px] text-zinc-900 uppercase">{receipt.emri_biznesit}</p>
              <p className="text-zinc-500">
                Operatori: <span className="font-mono font-medium">{receipt.emri_shitesit || 'Zahlx Operator'}</span>
              </p>
            </div>

            {/* Right: Contact & Address */}
            <div className="pl-3 sm:pl-6 border-l border-zinc-200/60 text-left text-[10px] sm:text-[11px] text-zinc-600 space-y-0.5">
              <p className="font-bold text-zinc-900 uppercase">Kontakti dhe Adresa</p>
              <p>Tel: +383 (38) 200-300</p>
              <p className="break-all">E-Mail: {receipt.email_biznesit || 'billing@zahlx.com'}</p>
              <p className="font-medium text-zinc-800">Rruga Bill Clinton, Nr. 120, Prishtinë</p>
            </div>
          </div>

          {/* Horizontal Divider Line */}
          <div className="mt-4 sm:mt-6 border-b border-zinc-200" />

          {/* Customer & Invoice Details — Always Side by Side */}
          <div className="mt-5 sm:mt-8 grid grid-cols-2 gap-0 px-4 sm:px-6">
            {/* Left Column: Customer Details */}
            <div className="space-y-3 sm:space-y-4 pr-3 sm:pr-6">
              <div>
                <p className="text-[8px] sm:text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">Faturuar për (Blerësi)</p>
                <h2 className="mt-1 text-[13px] sm:text-[16px] font-black text-zinc-900 uppercase tracking-tight leading-tight">{receipt.klienti}</h2>
              </div>
              <div className="space-y-2 sm:space-y-3 text-[10px] sm:text-[11px] text-zinc-700">
                <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                  {receipt.klient_email && (
                    <div>
                      <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Email</span>
                      <p className="font-semibold text-zinc-900 truncate">{receipt.klient_email}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-wider">ID e Klientit</span>
                    <p className="font-mono text-zinc-900 font-bold">#KL-{String(receipt.id).padStart(4, '0')}</p>
                  </div>
                </div>
                {receipt.klient_telefoni && (
                  <div>
                    <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Tel</span>
                    <p className="font-semibold text-zinc-900">{receipt.klient_telefoni}</p>
                  </div>
                )}
                {receipt.klient_adresa && (
                  <div>
                    <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Adresa</span>
                    <p className="font-semibold text-zinc-900">{receipt.klient_adresa}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Invoice Details — with subtle left divider */}
            <div className="space-y-3 sm:space-y-4 pl-3 sm:pl-6 border-l border-zinc-200/60">
              <div>
                <p className="text-[8px] sm:text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest">Detajet e Faturës</p>
                <h2 className="mt-1 text-[13px] sm:text-[16px] font-black text-zinc-900 uppercase tracking-tight leading-tight">Fatura Zyrtare</h2>
              </div>
              <div className="grid grid-cols-2 gap-x-2 sm:gap-x-4 gap-y-2 sm:gap-y-3 text-[10px] sm:text-[11px] text-zinc-700">
                <div>
                  <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Numri i Faturës</span>
                  <p className="font-mono font-bold text-zinc-900 tracking-tight text-[9px] sm:text-[11px] break-all">{receipt.numri_fatures}</p>
                </div>
                <div className="text-center">
                  <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Data e Lëshimit</span>
                  <p className="font-semibold text-zinc-900">{new Date(receipt.data_krijimit).toLocaleDateString('sq-AL')}</p>
                </div>
                <div>
                  <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Mënyra e Pagesës</span>
                  <p className="font-semibold text-zinc-900">{receipt.menyra_pageses || 'KESH'}</p>
                </div>
                <div className="text-center">
                  <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-wider">ID e Operatorit</span>
                  <p className="font-mono text-zinc-900">#OP-{String(receipt.seller_id || 1).padStart(3, '0')}</p>
                </div>
                <div className="col-span-2 pt-2 border-t border-zinc-100">
                  <span className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Faqja</span>
                  <p className="font-semibold text-zinc-900">1 / 1</p>
                </div>
              </div>
            </div>
          </div>

          {/* Structured Items Table */}
          <div className="mt-4 sm:mt-6 mx-3 sm:mx-6 border border-zinc-200 rounded-xl overflow-hidden shadow-sm bg-white">
            {/* Desktop Table */}
            <div className="hidden sm:block">
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
                      <td className="px-3 py-3.5 font-semibold text-zinc-900 leading-tight">{item.emri}</td>
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

            {/* Mobile Card Layout */}
            <div className="sm:hidden">
              {/* Mobile Header */}
              <div className="bg-zinc-900 text-white px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-wider">
                Artikujt e Faturës
              </div>

              {/* Mobile Item Cards */}
              <div className="divide-y divide-zinc-200">
                {receipt.items.map((item, idx) => (
                  <div key={item.id} className="px-3 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-zinc-400 shrink-0">{idx + 1}.</span>
                          <p className="font-semibold text-[12px] text-zinc-900 leading-tight truncate">{item.emri}</p>
                        </div>
                        {item.kodi_bar && (
                          <p className="mt-0.5 text-[9px] font-mono text-zinc-400 ml-5">{item.kodi_bar}</p>
                        )}
                      </div>
                      <p className="text-[13px] font-extrabold font-mono text-zinc-950 tabular-nums shrink-0">
                        {currency.format(Number(item.cmimi_per_njesi) * Number(item.sasia))}
                      </p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 ml-5 text-[10px] text-zinc-500">
                      <span>{Number(item.sasia || 1)} Copë</span>
                      <span className="text-zinc-300">•</span>
                      <span>Neto: {currency.format(getNetPrice(Number(item.cmimi_per_njesi), item.tax_rate))}</span>
                      <span className="text-zinc-300">•</span>
                      <span className="font-bold text-zinc-700">TVSH {item.tax_rate || 0}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile note */}
              <div className="px-3 py-2 border-t border-zinc-100">
                <p className="text-[9px] text-zinc-400 italic">* Artikujt u transportuan dhe u lëshuan në vendin e shitjes.</p>
              </div>

              {/* Mobile Totals */}
              <div className="border-t border-zinc-200">
                {Number(receipt.discount_rate) > 0 && (
                  <>
                    <div className="flex justify-between items-center px-3 py-2 bg-zinc-50/20">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Subtotali (para zbritjes)</span>
                      <span className="font-mono text-zinc-800 font-bold text-[12px]">{currency.format(subtotalBeforeDiscount)}</span>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2 bg-zinc-50/20 border-t border-zinc-100">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Zbritja ({receipt.discount_rate}%)</span>
                      <span className="font-mono text-rose-600 font-bold text-[12px]">-{currency.format(receipt.discount_amount)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center px-3 py-2 bg-zinc-50/20 border-t border-zinc-100">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Nëntotali (pa TVSH)</span>
                  <span className="font-mono text-zinc-800 font-bold text-[12px]">{currency.format(receipt.totali - (receipt.tax_amount || 0))}</span>
                </div>
                {Number(receipt.tax_amount) > 0 && (
                  <div className="flex justify-between items-center px-3 py-2 bg-zinc-50/20 border-t border-zinc-100">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">TVSH</span>
                    <span className="font-mono text-zinc-800 font-bold text-[12px]">{currency.format(receipt.tax_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center px-3 py-3 bg-zinc-950 text-white">
                  <span className="text-[10px] font-black uppercase tracking-widest">TOTALI (ME TVSH)</span>
                  <span className="font-mono text-[15px] font-black">{currency.format(receipt.totali)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Receipt Info — QR centered with link below */}
          <div className="mt-6 sm:mt-8 px-4 sm:px-6 flex flex-col items-center gap-2 text-center">
            <p className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Verifikimi i Faturës</p>
            <p className="text-[9px] sm:text-[10px] text-zinc-400 max-w-xs">
              Skanoni QR kodin për verifikimin zyrtar të faturës në portalin e Zahlx.
            </p>
            <QRCodeSVG value={receipt.qrUrl} size={80} className="sm:hidden mt-1" fgColor="#18181b" bgColor="transparent" />
            <QRCodeSVG value={receipt.qrUrl} size={96} className="hidden sm:block mt-1" fgColor="#18181b" bgColor="transparent" />
            <p className="mt-1 font-mono text-[8px] break-all select-all text-zinc-400 hover:text-zinc-700 underline transition max-w-xs">
              {receipt.qrUrl}
            </p>
          </div>

          {/* Signatures Section */}
          <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-12 px-4 sm:px-6">
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
        <div className="mt-8 sm:mt-12 mx-4 sm:mx-6 border-t border-zinc-200 pt-4 pb-2 text-[10px] text-zinc-500">
          <div className="text-center mt-2 text-[10px] text-zinc-400 italic">
            Faleminderit për bashkëpunimin tuaj! Kjo faturë është gjeneruar në mënyrë elektronike dhe është e vlefshme pa vulë fizike.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPage;
