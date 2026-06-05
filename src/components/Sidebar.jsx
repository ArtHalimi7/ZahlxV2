import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  X,
} from 'lucide-react';

/**
 * Sidebar Navigation
 * 
 * Design choices:
 * - Extremely minimal: only 3 nav items to reduce cognitive load
 * - No logo icon — just the wordmark for brand clarity
 * - Active state uses a very subtle background shift, not a loud highlight
 * - On mobile, it's a full-height overlay with a backdrop
 */

const navItems = [
  { to: '/',          label: 'Paneli',      icon: LayoutDashboard },
  { to: '/shitjet',   label: 'Shitjet',     icon: ShoppingCart },
  { to: '/produktet', label: 'Produktet',   icon: Package },
];

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[220px] flex flex-col
          bg-surface border-r border-white/[0.06]
          transform transition-transform duration-200 ease-out
          lg:relative lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center justify-between h-14 px-5 border-b border-white/[0.06]">
          <span className="text-[15px] font-semibold text-zinc-100 tracking-tight">
            Zahlx
          </span>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Mbyll menunë"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium
                  transition-colors duration-150
                  ${isActive
                    ? 'bg-white/[0.06] text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
                  }
                `}
              >
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                {label}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer — subtle version info */}
        <div className="px-5 py-4 border-t border-white/[0.06]">
          <p className="text-[11px] text-zinc-600">Zahlx v2.0</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
