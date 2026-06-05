import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AssistantChatWidget from './components/AssistantChatWidget';
import Dashboard from './pages/Dashboard';
import InventoryPage from './pages/InventoryPage';
import ReceiptPage from './pages/ReceiptPage';
import SectionPage from './components/dashboard/SectionPage';
import './index.css';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <Router>
      <div className="flex min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        />

        <div className={`flex min-w-0 flex-1 flex-col ${sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
          <header className="flex items-center justify-between border-b border-white/[0.06] bg-zinc-950/80 px-4 py-3 backdrop-blur-xl lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-2 text-zinc-400 transition hover:border-white/[0.12] hover:text-zinc-100"
              aria-label="Hap menunë"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-sm font-semibold tracking-tight text-zinc-100">Zahlx</span>
            <span className="rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">Live</span>
          </header>

          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/faturimi"
                element={(
                  <SectionPage
                    eyebrow="Faturimi"
                    title="Qendra e faturimit dhe POS"
                    description="Ky modul do të shërbejë si hapësira për shitje të shpejta, llogaritje të faturave dhe krijim të transaksioneve me shpejtësi operative."
                    accent="Përgatitur për fluks të lartë shitjesh dhe hyrje të shpejtë të të dhënave."
                  />
                )}
              />
              <Route
                path="/transaksionet"
                element={(
                  <SectionPage
                    eyebrow="Transaksionet"
                    title="Ledger i pastër dhe i verifikueshëm"
                    description="Përmbledhje e hyrjeve, daljeve dhe statusit të pagesave me fokus në auditim, ritëm dhe transparencë."
                    accent="Gati për filtrime, kërkime dhe gjurmim operacional."
                  />
                )}
              />
              <Route
                path="/stoku"
                element={<InventoryPage />}
              />
              <Route
                path="/fature/:invoiceId"
                element={<ReceiptPage />}
              />
              <Route
                path="/raportet"
                element={(
                  <SectionPage
                    eyebrow="Raportet"
                    title="Analitika financiare dhe tregtare"
                    description="Paneli analitik do të japë lexueshmëri për trendet, fitimin, dinamiken e shitjeve dhe sinjalet kyçe të performancës."
                    accent="Fokus në vendimmarrje të shpejtë dhe vizualizim premium."
                  />
                )}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        <AssistantChatWidget />
      </div>
    </Router>
  );
};

export default App;
