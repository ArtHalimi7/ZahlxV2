import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  ChartColumnIncreasing,
  LayoutDashboard,
  Menu,
  Package,
  ShoppingCart,
  Wallet,
  X,
  Moon,
  Sun,
  FileText,
  LogOut,
  Users,
  Contact,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../assets/X.png';

const navItems = [
  { to: '/', label: 'Paneli', hint: 'Pasqyrë', icon: LayoutDashboard, ownerOnly: true },
  { to: '/shitje', label: 'Shitje e Re', hint: 'Regjistro', icon: ShoppingCart },
  { to: '/libri-shitjes', label: 'Libri i Shitjes', hint: 'Historiku', icon: BookOpen },
  { to: '/arka', label: 'Arka', hint: 'Paraja', icon: Wallet, ownerOnly: true },
  { to: '/produktet', label: 'Produktet', hint: 'Stoku', icon: Package },
  { to: '/oferta', label: 'Oferta', hint: 'Kalkulime', icon: FileText, ownerOnly: true },
  { to: '/klientet', label: 'Klientët', hint: 'Kontaktet', icon: Contact, ownerOnly: true },
  { to: '/raportet', label: 'Raportet', hint: 'Analitika', icon: ChartColumnIncreasing, ownerOnly: true },
  { to: '/stafi', label: 'Stafi', hint: 'Punëtorët', icon: Users, ownerOnly: true },
];

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const filteredNavItems = navItems.filter(item => {
    if (user?.role === 'worker' && item.ownerOnly) {
      return false;
    }
    return true;
  });

  const getInitials = (name) => {
    if (!name) return 'Z';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden print:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      <aside
        className={`
          print:hidden
          fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-zinc-200 dark:border-white/[0.06]
          bg-white dark:bg-zinc-950 shadow-[0_0_60px_rgba(0,0,0,0.05)] dark:shadow-[0_0_60px_rgba(0,0,0,0.4)]
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          ${isCollapsed ? 'lg:w-24' : 'lg:w-72'}
        `}
      >
        <div className={`flex items-center border-b border-zinc-100 dark:border-white/[0.06] px-4 py-4 ${isCollapsed ? 'flex-col gap-3' : 'justify-between gap-3'}`}>
          <div className={`flex min-w-0 items-center gap-3 ${isCollapsed ? 'flex-col' : ''}`}>
            <div className="flex h-12 w-12 items-center justify-center shrink-0">
              <img src={Logo} alt="Zahlx Logo" className="h-10 w-auto object-contain brightness-0 dark:invert transition-all" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-[16px] font-bold tracking-tight text-zinc-900 dark:text-white truncate max-w-[120px]">
                  {user?.emri_biznesit || 'Zahlx'}
                </p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">
                  {user?.role === 'worker' ? 'Punëtor' : 'Pronar'}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleCollapse}
              className="hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2 text-zinc-550 dark:text-zinc-400 transition hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white lg:inline-flex"
              aria-label={isCollapsed ? 'Zgjero menunë' : 'Ngushto menunë'}
            >
              {isCollapsed ? <Menu size={16} /> : <X size={16} />}
            </button>
            <button
              onClick={onClose}
              className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-2 text-zinc-550 dark:text-zinc-400 transition hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white lg:hidden"
              aria-label="Mbyll menunë"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {filteredNavItems.map(({ to, label, hint, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={onClose} className="block">
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className={`relative flex items-center gap-3 rounded-2xl border px-3 py-3 text-[13px] font-medium transition-colors ${isActive
                      ? 'border-indigo-500/25 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.04)] dark:shadow-[0_0_12px_rgba(99,102,241,0.08)]'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:border-zinc-200 dark:hover:border-zinc-800 hover:bg-zinc-100/60 dark:hover:bg-zinc-900/60 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-indicator"
                      className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                    />
                  )}
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors ${isActive
                        ? 'border-zinc-800 dark:border-indigo-500/30 bg-zinc-800 dark:bg-indigo-500/20 text-white dark:text-indigo-400'
                        : 'border-zinc-800/60 dark:border-transparent bg-zinc-800 dark:bg-zinc-900 text-white dark:text-zinc-500'
                      }`}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2 : 1.6} />
                  </span>
                  {!isCollapsed && (
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span className="truncate tracking-tight">{label}</span>
                      <span className="text-[11px] uppercase tracking-[0.24em] text-zinc-400 dark:text-zinc-500">{hint}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-zinc-100 dark:border-white/[0.06] px-4 py-4 space-y-3">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2">
              <span className="text-[12px] font-medium text-zinc-500">Modaliteti</span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-1 text-zinc-550 dark:text-zinc-400 transition hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-white"
              >
                {theme === 'dark' ? (
                  <Sun size={14} className="m-1" />
                ) : (
                  <Moon size={14} className="m-1" />
                )}
              </button>
            </div>
          )}

          {/* User profile and logout section */}
          {user && (
            <div className="pt-2 border-t border-zinc-100 dark:border-white/[0.04]">
              {isCollapsed ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="h-10 w-10 rounded-full border-2 border-black dark:border-0 bg-gradient-to-tr from-indigo-500 to-purple-650 text-white font-bold flex items-center justify-center text-[12px] shadow-sm">
                    {getInitials(user.emri_biznesit)}
                  </div>
                  <button
                    onClick={logout}
                    className="text-zinc-400 hover:text-rose-500 transition-colors p-2 rounded-xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    title="Shkyçu"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-full border-2 border-black dark:border-0 bg-gradient-to-tr from-indigo-500 to-purple-650 text-white font-bold flex items-center justify-center text-[11px] shadow-sm shrink-0">
                      {getInitials(user.emri_biznesit)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-zinc-900 dark:text-white truncate max-w-[120px]">
                        {user.email}
                      </p>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                        {user.role === 'worker' ? 'Cashier Account' : 'Owner Account'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="text-zinc-400 hover:text-rose-500 transition-colors p-1.5 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 shrink-0"
                    title="Shkyçu"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isCollapsed: PropTypes.bool.isRequired,
  onToggleCollapse: PropTypes.func.isRequired,
};
