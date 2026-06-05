import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import {
  ArrowLeftRight,
  ChartColumnIncreasing,
  LayoutDashboard,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptText,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Paneli', hint: 'Pasqyrë', icon: LayoutDashboard },
  { to: '/faturimi', label: 'Faturimi', hint: 'POS', icon: ReceiptText },
  { to: '/transaksionet', label: 'Transaksionet', hint: 'Ledger', icon: ArrowLeftRight },
  { to: '/stoku', label: 'Stoku', hint: 'Inventory', icon: Package },
  { to: '/raportet', label: 'Raportet', hint: 'Analytics', icon: ChartColumnIncreasing },
];

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-white/[0.06]
          bg-zinc-950/90 shadow-[0_0_60px_rgba(0,0,0,0.45)] backdrop-blur-2xl
          transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          ${isCollapsed ? 'lg:w-24' : 'lg:w-72'}
        `}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-[0_0_32px_rgba(16,185,129,0.12)]">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.45)]" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-[15px] font-semibold tracking-tight text-zinc-100">Zahlx</p>
                <p className="text-[11px] text-zinc-500">Financial command center</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleCollapse}
              className="hidden rounded-xl border border-white/[0.06] bg-white/[0.03] p-2 text-zinc-400 transition hover:border-white/[0.12] hover:text-zinc-100 lg:inline-flex"
              aria-label={isCollapsed ? 'Zgjero menunë' : 'Ngushto menunë'}
            >
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
            <button
              onClick={onClose}
              className="inline-flex rounded-xl border border-white/[0.06] bg-white/[0.03] p-2 text-zinc-400 transition hover:border-white/[0.12] hover:text-zinc-100 lg:hidden"
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
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-zinc-100 shadow-[0_0_0_1px_rgba(16,185,129,0.08),0_0_30px_rgba(16,185,129,0.08)]'
                      : 'border-transparent text-zinc-500 hover:border-white/[0.06] hover:bg-white/[0.03] hover:text-zinc-200'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-indicator"
                      className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-emerald-500 shadow-[0_0_22px_rgba(16,185,129,0.6)]"
                    />
                  )}
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors ${
                      isActive
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                        : 'border-white/[0.06] bg-white/[0.02] text-zinc-400'
                    }`}
                  >
                    <Icon size={16} strokeWidth={isActive ? 2 : 1.6} />
                  </span>
                  {!isCollapsed && (
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <span className="truncate tracking-tight">{label}</span>
                      <span className="text-[11px] uppercase tracking-[0.24em] text-zinc-600">{hint}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/[0.06] px-4 py-4">
          {!isCollapsed ? (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.24em] text-zinc-500">Gjendja e sistemit</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-[13px] text-zinc-300">Online dhe gati</span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">Aktiv</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.5)]" />
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
