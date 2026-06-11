import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AssistantChatWidget from './components/AssistantChatWidget';
import Dashboard from './pages/Dashboard';
import InventoryPage from './pages/InventoryPage';
import ReceiptPage from './pages/ReceiptPage';
import PosPage from './pages/PosPage';
import TransactionsPage from './pages/TransactionsPage';
import ArkaPage from './pages/ArkaPage';
import ReportsPage from './pages/ReportsPage';
import OffersPage from './pages/OffersPage';
import './index.css';
import Logo from './assets/Logo.png';

const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <Router>
      <div className="flex min-h-screen overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        />

        <div className={`flex min-w-0 flex-1 flex-col ${sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
          <header className="flex items-center justify-between border-b border-zinc-900 dark:border-white/[0.06] bg-zinc-950 px-4 py-3 lg:hidden text-white">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:border-zinc-700 hover:text-white"
              aria-label="Hap menunë"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <img src={Logo} alt="Zahlx Logo" className="h-14 w-auto object-contain brightness-0 invert" />
            <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-medium text-indigo-400">Live</span>
          </header>

          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/shitje" element={<PosPage />} />
              <Route path="/libri-shitjes" element={<TransactionsPage />} />
              <Route path="/arka" element={<ArkaPage />} />
              <Route path="/produktet" element={<InventoryPage />} />
              <Route path="/fature/:invoiceId" element={<ReceiptPage />} />
              <Route path="/raportet" element={<ReportsPage />} />
              <Route path="/oferta" element={<OffersPage />} />
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
