import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useToast } from '../../store/ToastContext';

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard',  icon: '⬛' },
  { to: '/portfolios', label: 'Portfolios',  icon: '◈' },
  { to: '/watchlist',  label: 'Watchlist',   icon: '◉' },
  { to: '/assets',     label: 'Assets',      icon: '◆' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#0b0d13] border-r border-[#1e2130] flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1e2130]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">TF</span>
          </div>
          <span className="text-[#e8eaf0] font-semibold text-base tracking-tight">TradeFlow</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#4a4f66]">
          Main
        </p>
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-600/15 text-brand-400 border border-brand-600/20'
                  : 'text-[#7a7f96] hover:text-[#e8eaf0] hover:bg-[#1a1d27]'
              }`
            }
          >
            <span className="text-xs opacity-70">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-[#1e2130]">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#13151f] border border-[#1e2130] mb-2">
          <div className="w-7 h-7 rounded-full bg-brand-600/20 border border-brand-600/30 flex items-center justify-center text-xs font-semibold text-brand-400">
            {user?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#e8eaf0] truncate">{user?.full_name}</p>
            <p className="text-[10px] text-[#4a4f66] truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#7a7f96] hover:text-red-400 hover:bg-red-500/5 transition-all duration-150"
        >
          <span className="text-xs">⎋</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
