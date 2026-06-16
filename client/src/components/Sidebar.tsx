import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Dumbbell,
  Calendar,
  Target,
  Utensils,
  PenLine,
  LogOut,
  Terminal,
  Timer,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '../store';

export const Sidebar: React.FC = () => {
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: '/tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { to: '/gym', label: 'Gym', icon: <Dumbbell className="w-4 h-4" /> },
    { to: '/plan', label: 'Planning', icon: <Calendar className="w-4 h-4" /> },
    { to: '/focus', label: 'Focus', icon: <Timer className="w-4 h-4" /> },
    { to: '/goals', label: 'Goals', icon: <Target className="w-4 h-4" /> },
    { to: '/meals', label: 'Meals', icon: <Utensils className="w-4 h-4" /> },
    { to: '/finance', label: 'Finance', icon: <Wallet className="w-4 h-4" /> },
    { to: '/skincare', label: 'Skin Care', icon: <Sparkles className="w-4 h-4" /> },
    { to: '/review', label: 'Review', icon: <PenLine className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR: Hidden on mobile (<768px) */}
      <aside className="hidden md:flex flex-col w-56 bg-panel border-r border-border h-screen sticky top-0 text-off-white select-none">
        {/* App Title Header */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
          <div className="p-1 rounded bg-accent/20 border border-accent/30 text-accent">
            <Terminal className="w-4 h-4" />
          </div>
          <span className="font-mono text-sm font-bold tracking-widest text-off-white">DAILY_OS</span>
          <span className="text-[8px] bg-border text-off-white-muted border border-border px-1 rounded">V1.0</span>
        </div>

        {/* User Card */}
        <div className="px-6 py-4 border-b border-border bg-card/40 flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-off-white-muted">Active Host</span>
            <span className="text-xs font-mono font-bold truncate text-accent">@{user?.username || 'user'}</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-xs font-mono transition-all duration-150 border ${
                  isActive
                    ? 'bg-accent/10 border-accent/20 text-accent font-bold glow-accent'
                    : 'border-transparent text-off-white-muted hover:bg-card hover:text-off-white'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout Footer */}
        <div className="p-4 border-t border-border bg-card/25">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded text-xs font-mono text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            <span>SYS_SHUTDOWN</span>
          </button>
        </div>
      </aside>

      {/* MOBILE BOTTOM TAB BAR: Hidden on desktop (>=768px) */}
      <aside className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-panel border-t border-border flex items-center justify-start gap-1 overflow-x-auto no-scrollbar pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom))] px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center shrink-0 min-w-[56px] gap-0.5 px-2 py-1 rounded text-[9px] font-mono transition-all duration-150 ${
                isActive ? 'text-accent font-bold bg-accent/5' : 'text-off-white-muted hover:text-off-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-full ${isActive ? 'bg-accent/15' : ''}`}>{item.icon}</div>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </aside>
    </>
  );
};
export default Sidebar;
