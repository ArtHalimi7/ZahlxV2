import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Printer, Check, ShieldAlert } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import JsBarcode from 'jsbarcode';

const currency = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const STATUS_META = {
  paguar: { label: 'PAGUAR (PAID)', cls: 'border-green-600 bg-green-50 text-green-700' },
  ne_pritje: { label: 'NË PRITJE (DRAFT)', cls: 'border-amber-500 bg-amber-50 text-amber-700' },
  vonese: { label: 'VONESE (OVERDUE)', cls: 'border-rose-600 bg-rose-50 text-rose-700' },
  anuluar: { label: 'ANULUAR (CANCELLED)', cls: 'border-neutral-500 bg-neutral-50 text-neutral-600' },
};

// Premium SVG architectural banner representing steel/construction structures
const InvoiceBanner = () => (
  <div className="relative h-28 w-full bg-gradient-to-r from-[#0c2340] via-[#1d3557] to-[#0a192f] overflow-hidden flex items-center justify-between px-8 text-white rounded-t-lg select-none">
    {/* Abstract architectural SVG grid & columns in background */}
    <svg className="absolute inset-0 w-full h-full opacity-40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="structural-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#structural-grid)" />
      
      {/* Structural building beams and trusses */}
      <path d="M -50,120 L 150,-20 L 180,-20 L -20,120 Z" fill="rgba(255,255,255,0.06)" />
      <path d="M 120,120 L 320,-20 L 350,-20 L 150,120 Z" fill="rgba(255,255,255,0.06)" />
      <path d="M 450,-20 L 290,120 L 320,120 L 480,-20 Z" fill="rgba(255,255,255,0.06)" />
      <path d="M 680,-20 L 520,120 L 550,120 L 710,-20 Z" fill="rgba(255,255,255,0.06)" />
      
      {/* Accent steel cables */}
      <line x1="0" y1="30" x2="1200" y2="30" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="1.5" />
      <line x1="0" y1="90" x2="1200" y2="90" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" />
      
      <circle cx="150" cy="-20" r="120" fill="none" stroke="rgba(59, 130, 246, 0.15)" strokeWidth="1" />
      <circle cx="700" cy="130" r="100" fill="none" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" />
    </svg>

    <div className="z-10 flex items-center gap-4">
      <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center font-extrabold text-[24px] shadow-lg shadow-blue-500/20 border border-blue-400/20">
        Z
      </div>
      <div>
        <h1 className="text-[22px] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-blue-200 leading-none">
          ZAHLX SYSTEM
        </h1>
        <p className="text-[9px] uppercase tracking-[0.32em] text-blue-300 font-semibold mt-1">Faturim &amp; Biznes me Sistem</p>
      </div>
    </div>
    <div className="z-10 text-right">
      <div className="text-[16px] font-black tracking-wider text-white">FATURË TATIMORE</div>
      <div className="text-[9px] uppercase tracking-[0.2em] text-slate-300 mt-1">Zahlx Invoicing Network</div>
    </div>
  </div>
);

const ReceiptPage = ({ isPublic = false }) => {
  const { invoiceId } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const barcodeRef = useRef(null);

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

  // Render barcode once secure_code is available
  useEffect(() => {
    if (barcodeRef.current && receipt?.secure_code) {
      try {
        JsBarcode(barcodeRef.current, receipt.secure_code, {
          format: "CODE128",
          lineColor: "#111827",
          width: 1.25,
          height: 38,
          displayValue: true,
          fontSize: 8.5,
          fontOptions: "bold",
          font: "monospace",
          textPosition: "bottom",
          textMargin: 4,
          margin: 0
        });
      } catch (err) {
        console.error("JsBarcode generation failed:", err);
      }
    }
  }, [receipt?.secure_code]);

  const taxRate = useMemo(() => Number(receipt?.tax_rate || 0), [receipt]);
  
  const getNetPrice = (price) => {
    return price / (1 + taxRate / 100);
  };

  const getNetTotal = (price, quantity) => {
    return (price * quantity) / (1 + taxRate / 100);
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
          {!isPublic && (
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
      {!isPublic && (
        <div className="mx-auto flex max-w-[850px] items-center justify-between gap-4 px-4 pb-4 print:hidden">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            <ArrowLeft size={16} />
            Kthehu në Panel
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5 text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              {copied ? 'U kopjua!' : 'Kopjo linkun'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-2xl border border-blue-600/20 bg-blue-600/10 px-4 py-2.5 text-[13px] font-bold text-blue-600 transition hover:bg-blue-600/20"
            >
              <Printer size={16} />
              Printo Faturën
            </button>
          </div>
        </div>
      )}

      {/* Main Official Document Wrapper */}
      <div className="paper-preview relative flex flex-col justify-between border border-zinc-200/50 select-text">
        <div>
          {/* Header Architectural Banner */}
          <InvoiceBanner />

          {/* Top Metadata Area */}
          <div className="mt-8 flex justify-between items-start gap-8 px-2">
            {/* Left: Barcode + Supplier Info */}
            <div className="flex flex-col">
              <div className="bg-white p-1.5 border border-zinc-200 rounded-lg inline-block self-start shadow-sm">
                <svg ref={barcodeRef}></svg>
              </div>
              <div className="mt-3 text-[11px] text-zinc-700 leading-tight">
                <p className="font-extrabold text-[12px] text-zinc-900 uppercase">{receipt.emri_biznesit}</p>
                <p className="mt-1">Zahlx Operator / Lëshuesi i Faturës</p>
                <p className="text-zinc-500 font-mono mt-0.5">{receipt.emri_shitesit || 'Zahlx Operator'}</p>
              </div>
            </div>

            {/* Right: Vendor Address & Contacts */}
            <div className="text-right text-[11px] text-zinc-600 space-y-1">
              <p className="font-bold text-zinc-900 uppercase">Kontakti &amp; Adresa</p>
              <p>Telefon: +383 (38) 500-500</p>
              <p>Fax: +383 (38) 500-501</p>
              <p>E-Mail: billing@zahlx.com</p>
              <p className="font-medium text-zinc-800">Rruga Bill Clinton, Nr. 120, Prishtinë</p>
            </div>
          </div>

          {/* Horizontal Divider Line */}
          <div className="mt-6 border-b-2 border-zinc-800" />

          {/* Customer / Billing Info Area */}
          <div className="mt-6 flex justify-between items-end px-2">
            <div className="max-w-md bg-zinc-50 border border-zinc-200 p-4 rounded-xl shadow-inner-sm">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Faturuar për (Blerësi)</p>
              <h2 className="mt-1.5 text-[15px] font-extrabold text-zinc-900 uppercase">{receipt.klienti}</h2>
              <div className="mt-2 text-[11px] text-zinc-500 space-y-0.5">
                {receipt.klient_email && <p>Email: {receipt.klient_email}</p>}
                {receipt.klient_telefoni && <p>Tel: {receipt.klient_telefoni}</p>}
                {receipt.klient_adresa ? <p>Adresa: {receipt.klient_adresa}</p> : <p>Adresa e Blerësit: Kosovë / Shqipëri</p>}
                <p className="font-mono text-[10px]">ID e Klientit: #{receipt.klienti.replace(/\s+/g, '').slice(0,6).toUpperCase()}</p>
              </div>
            </div>

            {/* Status indicator on screen */}
            <div className="text-right">
              <span className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${activeStatus.cls}`}>
                {activeStatus.label}
              </span>
            </div>
          </div>

          {/* Structured Key Fields Box (Matches the Baustoff + Metall Grid Box) */}
          <div className="mt-6 grid grid-cols-5 border border-zinc-300 rounded-lg overflow-hidden text-center divide-x divide-zinc-300 bg-zinc-50/50">
            <div className="p-3">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Tipi i Pagesës</p>
              <p className="mt-1 text-[12px] font-extrabold text-zinc-800">BARVERKAUF</p>
            </div>
            <div className="p-3">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Numër Fature</p>
              <p className="mt-1 text-[12px] font-extrabold text-zinc-900 font-mono">{receipt.numri_fatures}</p>
            </div>
            <div className="p-3">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Data e Lëshimit</p>
              <p className="mt-1 text-[12px] font-bold text-zinc-800">{new Date(receipt.data_krijimit).toLocaleDateString('sq-AL')}</p>
            </div>
            <div className="p-3">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Kunden Nr.</p>
              <p className="mt-1 text-[12px] font-bold text-zinc-800 font-mono">{receipt.seller_id || '901235'}</p>
            </div>
            <div className="p-3">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Faqe</p>
              <p className="mt-1 text-[12px] font-bold text-zinc-800">1 / 1</p>
            </div>
          </div>

          <p className="mt-4 text-[10px] text-zinc-400 italic px-2">
            * Ne dërgojmë ekskluzivisht në përputhje me Kushtet tona të Përgjithshme të Shitjes. Ky dokument shërben si faturë zyrtare tatimore.
          </p>

          {/* Structured Items Table */}
          <div className="mt-6 border border-zinc-300 rounded-lg overflow-hidden">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-zinc-800 text-white text-[10px] font-extrabold uppercase tracking-wider divide-x divide-zinc-700">
                  <th className="px-3 py-3 w-12 text-center">Art. Nr.</th>
                  <th className="px-3 py-3 w-20 text-right">Sasia</th>
                  <th className="px-3 py-3">Përshkrimi i Artikullit</th>
                  <th className="px-3 py-3 w-28 text-center">Kodi / Barkodi</th>
                  <th className="px-3 py-3 w-24 text-right">Çmimi Neto</th>
                  <th className="px-3 py-3 w-16 text-center">TVSH %</th>
                  <th className="px-3 py-3 w-24 text-right">Betrag (Bruto)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 divide-x divide-zinc-200">
                {receipt.items.map((item, idx) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-zinc-50 transition-colors divide-x divide-zinc-200"
                  >
                    <td className="px-3 py-3.5 text-center font-mono text-zinc-400">{idx + 1}</td>
                    <td className="px-3 py-3.5 text-right font-bold tabular-nums text-zinc-800">{Number(item.sasia || 1).toFixed(2)} Rol</td>
                    <td className="px-3 py-3.5 font-semibold text-zinc-900 leading-tight">
                      {item.emri}
                      {item.kodi_bar && (
                        <span className="block sm:hidden text-[9px] font-mono text-zinc-400 mt-1">{item.kodi_bar}</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5 text-center font-mono text-[10px] text-zinc-500">{item.kodi_bar || '—'}</td>
                    <td className="px-3 py-3.5 text-right tabular-nums font-mono text-zinc-600">
                      {currency.format(getNetPrice(Number(item.cmimi_per_njesi)))}
                    </td>
                    <td className="px-3 py-3.5 text-center font-bold text-zinc-700">{taxRate}%</td>
                    <td className="px-3 py-3.5 text-right font-extrabold tabular-nums text-zinc-950 font-mono">
                      {currency.format(Number(item.cmimi_per_njesi) * Number(item.sasia))}
                    </td>
                  </tr>
                ))}

                {/* Vertical columns fill spacer row (keeps grid aligned) */}
                <tr className="h-28 divide-x divide-zinc-200 bg-zinc-50/20">
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3 text-zinc-300 italic align-top pt-4">
                    {"->"} Transportuar dhe lëshuar në vendin e shitjes.
                  </td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3"></td>
                  <td className="px-3 py-3"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="mt-6 flex justify-between items-start gap-8 px-2">
            {/* QR Code Validation */}
            <div className="flex items-start gap-4">
              <div className="bg-white p-2 border border-zinc-200 rounded-xl shadow-sm">
                <QRCodeSVG value={receipt.qrUrl} size={85} fgColor="#0c2340" bgColor="#ffffff" />
              </div>
              <div className="max-w-[200px] text-[10px] text-zinc-400 leading-normal">
                <p className="font-bold text-zinc-800 uppercase tracking-wider">Verifikimi i Faturës</p>
                <p className="mt-1">Skanoni QR kodin për verifikimin zyrtar të faturës në portalin publik.</p>
                <p className="mt-1.5 font-mono text-[9px] break-all select-all text-blue-600 font-semibold">{receipt.qrUrl}</p>
              </div>
            </div>

            {/* Breakdown Totals Box */}
            <div className="w-80 border border-zinc-300 rounded-lg overflow-hidden bg-zinc-50/50 p-4 space-y-2 text-[12px]">
              <div className="flex justify-between text-zinc-500">
                <span>Nëntotali (pa TVSH):</span>
                <span className="font-mono font-bold text-zinc-800">
                  {currency.format(receipt.totali - (receipt.tax_amount || 0))}
                </span>
              </div>
              {Number(receipt.tax_amount) > 0 && (
                <div className="flex justify-between text-zinc-500">
                  <span>TVSH ({taxRate}%):</span>
                  <span className="font-mono font-bold text-zinc-800">
                    {currency.format(receipt.tax_amount)}
                  </span>
                </div>
              )}
              <div className="border-t border-zinc-300 pt-2 flex justify-between text-[14px] font-black text-zinc-950">
                <span>Totali (me TVSH):</span>
                <span className="font-mono text-blue-900">
                  {currency.format(receipt.totali)}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures Section */}
          <div className="mt-10 grid grid-cols-2 gap-12 px-6">
            <div className="border-t border-dashed border-zinc-400 pt-3 text-center">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Pranoi (Blerësi / Klienti)</p>
              <div className="h-8" /> {/* Spacer for physical signature */}
              <p className="text-[12px] font-extrabold text-zinc-900 uppercase">{receipt.klienti}</p>
            </div>
            <div className="border-t border-dashed border-zinc-400 pt-3 text-center">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Lëshoi (Operatori / Përfaqësuesi)</p>
              <div className="h-8" /> {/* Spacer for physical signature */}
              <p className="text-[12px] font-extrabold text-zinc-900 uppercase">{receipt.emri_shitesit || receipt.emri_biznesit}</p>
            </div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="mt-12 border-t border-zinc-200 pt-4 pb-2 text-[10px] text-zinc-500">
          <div className="bg-slate-900 text-slate-300 p-4 rounded-b-lg grid grid-cols-4 gap-4 text-[9px] text-left">
            <div>
              <p className="font-bold text-white uppercase mb-1">Sede e Shoqërisë</p>
              <p>Zahlx Billing Sh.p.k.</p>
              <p>Rruga Bill Clinton, Nr. 120</p>
              <p>10000 Prishtinë, Kosovë</p>
            </div>
            <div>
              <p className="font-bold text-white uppercase mb-1">Menaxhmenti</p>
              <p>Drejtor: Art Halimi</p>
              <p>Gjykata Regjistruese: ARBK</p>
              <p>Regjistri Tregtar: Reg. Nr. 123456</p>
            </div>
            <div>
              <p className="font-bold text-white uppercase mb-1">Të Dhënat Bankare</p>
              <p>TEB Banka: XK55 4530 0000 1234 5678</p>
              <p>NLB Banka: XK55 3100 0000 8765 4321</p>
              <p>BIC: TEBBXKPX, NLBBXKPX</p>
            </div>
            <div>
              <p className="font-bold text-white uppercase mb-1">Numrat Fiskalë</p>
              <p>NIPT / Nr. Fiskal: 330123456</p>
              <p>Nr. i TVSH: 500123456</p>
              <p>Sistemi: ZahlX Fiscal Portal</p>
            </div>
          </div>
          <div className="text-center mt-3 text-[10px] text-zinc-400 italic">
            Faleminderit për bashkëpunimin tuaj! Kjo faturë është gjeneruar në mënyrë elektronike dhe është e vlefshme pa vulë fizike.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPage;
