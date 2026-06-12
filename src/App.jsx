import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AssistantChatWidget from './components/AssistantChatWidget';
import OnboardingWizard from './components/OnboardingWizard';
import Dashboard from './pages/Dashboard';
import InventoryPage from './pages/InventoryPage';
import ReceiptPage from './pages/ReceiptPage';
import PosPage from './pages/PosPage';
import TransactionsPage from './pages/TransactionsPage';
import ArkaPage from './pages/ArkaPage';
import ReportsPage from './pages/ReportsPage';
import OffersPage from './pages/OffersPage';
import StaffPage from './pages/StaffPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './index.css';
import Logo from './assets/X.png';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/shitje" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AuthenticatedLayout = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    if (user && user.role === 'owner') {
      const completed = localStorage.getItem(`onboarding_completed_${user.id}`);
      if (!completed) {
        setWizardOpen(true);
      }
    }
  }, [user]);

  return (
    <div className="flex min-h-screen overflow-hidden bg-[#f4f4f5] dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
      />

      <div className={`flex min-w-0 flex-1 flex-col print:pl-0 ${sidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72'}`}>
        <header className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.06] bg-white dark:bg-zinc-950 px-4 py-3 lg:hidden text-zinc-900 dark:text-white print:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2 text-zinc-550 dark:text-zinc-400 transition hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white"
            aria-label="Hap menunë"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <img src={Logo} alt="Zahlx Logo" className="h-14 w-auto object-contain brightness-0 dark:invert" />
          <span className="rounded-full border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">Live</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {user?.role === 'owner' && <AssistantChatWidget />}

      <OnboardingWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />
    </div>
  );
};

const AppContent = () => {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
      
      <Route element={<PrivateRoute><AuthenticatedLayout /></PrivateRoute>}>
        {/* Owner-only routes */}
        <Route path="/" element={<PrivateRoute allowedRoles={['owner']}><Dashboard /></PrivateRoute>} />
        <Route path="/arka" element={<PrivateRoute allowedRoles={['owner']}><ArkaPage /></PrivateRoute>} />
        <Route path="/oferta" element={<PrivateRoute allowedRoles={['owner']}><OffersPage /></PrivateRoute>} />
        <Route path="/raportet" element={<PrivateRoute allowedRoles={['owner']}><ReportsPage /></PrivateRoute>} />
        <Route path="/stafi" element={<PrivateRoute allowedRoles={['owner']}><StaffPage /></PrivateRoute>} />
        
        {/* Common routes (Owner & Worker) */}
        <Route path="/shitje" element={<PosPage />} />
        <Route path="/libri-shitjes" element={<TransactionsPage />} />
        <Route path="/produktet" element={<InventoryPage />} />
        <Route path="/fature/:invoiceId" element={<ReceiptPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
