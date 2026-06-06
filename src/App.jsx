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
import './index.css';

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
          <header className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.06] bg-white/80 dark:bg-zinc-950/80 px-4 py-3 backdrop-blur-xl lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-xl border border-slate-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.03] p-2 text-slate-500 dark:text-zinc-400 transition hover:border-slate-300 dark:border-white/[0.12] hover:text-slate-900 dark:text-zinc-100"
              aria-label="Hap menunë"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-zinc-100">Zahlx</span>
            <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-medium text-indigo-600 dark:border-indigo-500/15 dark:text-indigo-400">Live</span>
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
