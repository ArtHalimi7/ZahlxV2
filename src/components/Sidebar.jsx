import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  ChartColumnIncreasing,
  LayoutDashboard,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ShoppingCart,
  Wallet,
  X,
  Moon,
  Sun,
  FileText,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import Logo from '../assets/Logo.png';

const navItems = [
  { to: '/', label: 'Paneli', hint: 'Pasqyrë', icon: LayoutDashboard },
  { to: '/shitje', label: 'Shitje e Re', hint: 'Regjistro', icon: ShoppingCart },
  { to: '/libri-shitjes', label: 'Libri i Shitjes', hint: 'Historiku', icon: BookOpen },
  { to: '/arka', label: 'Arka', hint: 'Paraja', icon: Wallet },
  { to: '/produktet', label: 'Produktet', hint: 'Stoku', icon: Package },
  { to: '/oferta', label: 'Oferta', hint: 'Kalkulime', icon: FileText },
  { to: '/raportet', label: 'Raportet', hint: 'Analitika', icon: ChartColumnIncreasing },
];

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-zinc-200/60 dark:border-transparent
          bg-white dark:bg-zinc-950 shadow-[0_0_60px_rgba(0,0,0,0.02)]
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          ${isCollapsed ? 'lg:w-24' : 'lg:w-72'}
        `}
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200/60 dark:border-transparent px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white dark:bg-zinc-900 shadow-sm shrink-0">
              <img src={Logo} alt="Zahlx Logo" className="h-8 w-auto object-contain dark:brightness-0 dark:invert transition-all" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-[16px] font-bold tracking-tight text-zinc-950 dark:text-zinc-50">Zahlx</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mt-0.5">Workspace</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleCollapse}
              className="hidden rounded-xl border border-zinc-200/60 dark:border-transparent bg-zinc-50 dark:bg-zinc-900 p-2 text-zinc-600 dark:text-zinc-400 transition hover:border-zinc-350 dark:hover:border-zinc-700 hover:text-zinc-950 dark:hover:text-zinc-50 lg:inline-flex"
              aria-label={isCollapsed ? 'Zgjero menunë' : 'Ngushto menunë'}
            >
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
            <button
              onClick={onClose}
              className="inline-flex rounded-xl border border-zinc-200/60 dark:border-transparent bg-zinc-50 dark:bg-zinc-900 p-2 text-zinc-600 dark:text-zinc-400 transition hover:border-zinc-350 dark:hover:border-zinc-700 hover:text-zinc-950 dark:hover:text-zinc-50 lg:hidden"
              aria-label="Mbyll menunë"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, label, hint, icon: Icon }) => (
            <NavLink key={to} to={to} onClick={onClose} className="block">
              {({ isActive }) => (
                <motion.div
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                  className={`relative flex items-center gap-3 rounded-2xl border px-3 py-3 text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'border-indigo-500/20 bg-indigo-50/80 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_4px_20px_rgba(99,102,241,0.1)]'
                      : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:border-zinc-200/60 dark:hover:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-zinc-50'
                  }`}
                >
                  {isActive && (
                    <motion.span
                       layoutId="sidebar-active-indicator"
                      className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                    />
                  )}
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors ${
                      isActive
                        ? 'border-indigo-500/30 bg-white dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                        : 'border-zinc-200 dark:border-transparent bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500'
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

        <div className="border-t border-zinc-200 dark:border-transparent px-4 py-4 space-y-3">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2">
              <span className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">Modaliteti</span>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-transparent bg-zinc-100 dark:bg-zinc-800 p-1 text-zinc-700 dark:text-zinc-300 transition hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-950 dark:hover:text-zinc-50"
              >
                {theme === 'dark' ? (
                  <Sun size={14} className="m-1" />
                ) : (
                  <Moon size={14} className="m-1" />
                )}
              </button>
            </div>
          )}

          {!isCollapsed ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-transparent bg-zinc-50 dark:bg-zinc-900 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500 dark:text-zinc-400">Gjendja e sistemit</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[13px] text-zinc-800 dark:text-zinc-200">Online dhe gati</span>
                <span className="rounded-full border border-zinc-200 dark:border-transparent bg-zinc-200 dark:bg-zinc-800 text-zinc-950 dark:text-zinc-50 px-2.5 py-1 text-[11px] font-medium">Aktiv</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <button onClick={toggleTheme} className="text-zinc-650 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div className="h-2 w-2 rounded-full bg-zinc-950 dark:bg-zinc-50 shadow-[0_0_18px_rgba(var(--accent-rgb),0.1)]" />
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
