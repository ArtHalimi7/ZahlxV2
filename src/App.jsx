import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import './index.css';

/**
 * App Shell
 * 
 * Minimal layout: fixed sidebar on the left, scrollable content area.
 * The sidebar collapses on mobile behind a toggle.
 */
const App = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="flex h-screen overflow-hidden bg-surface">
        {/* Sidebar — fixed on desktop, overlay on mobile */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile header bar */}
          <header className="lg:hidden flex items-center h-14 px-4 border-b border-white/[0.06] bg-surface">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] transition-colors"
              aria-label="Hap menunë"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <span className="ml-3 text-sm font-semibold text-zinc-100 tracking-tight">Zahlx</span>
          </header>

          {/* Scrollable page content */}
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
