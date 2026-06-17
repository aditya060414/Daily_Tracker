import React, { useState } from 'react';
import { Search, LogOut, ChevronDown, Bell } from 'lucide-react';
import { useAuthStore, useDateStore, useDailyStore } from '../store';
import { authApi } from '../api';
import { useNavigate } from 'react-router-dom';
import { PointsBadge } from './PointsBadge';
import { DateNav } from './DateNav';
import { Capacitor } from '@capacitor/core';
import { MobileSettingsModal } from './auth/MobileSettingsModal';

interface TopBarProps {
  onOpenCommandPalette: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenCommandPalette }) => {
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const selectedDate = useDateStore((state) => state.selectedDate);
  const dailyLog = useDailyStore((state) => state.dailyLog);
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Auto greeting based on time of day
  const getGreeting = () => {
    const hours = new Date().getHours();
    let greet = 'Good evening';
    if (hours < 12) greet = 'Good morning';
    else if (hours < 17) greet = 'Good afternoon';
    
    return `${greet}, ${user?.name || user?.username || 'user'}`;
  };

  // Extract points for selected date
  const pointsToday = dailyLog && dailyLog.date === selectedDate ? dailyLog.totalPoints : 0;

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 sm:px-6 py-3 sm:py-4 bg-panel/85 backdrop-blur border-b border-border text-off-white select-none">
      {/* Greetings */}
      <div className="flex flex-col">
        <h2 className="text-xs font-mono uppercase tracking-wider text-off-white-muted">Active Session</h2>
        <h1 className="text-sm font-mono font-bold text-off-white">{getGreeting()}</h1>
      </div>

      {/* Center Date Nav */}
      <div className="w-full sm:w-auto">
        <DateNav />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-card hover:bg-card-hover border border-border text-xs font-mono text-off-white-muted hover:text-off-white transition-all duration-150"
          title="Open Command Palette (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">SYS_SEARCH</span>
          <kbd className="inline-flex items-center h-4 select-none rounded bg-panel px-1 font-mono text-[9px] text-off-white-muted border border-border">
            Ctrl K
          </kbd>
        </button>

        {/* Dynamic Points Indicator */}
        <PointsBadge points={pointsToday} />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1 rounded hover:bg-card border border-transparent hover:border-border transition-all"
          >
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt="user avatar"
                className="w-7 h-7 rounded border border-accent/20 object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-7 h-7 rounded bg-accent/20 border border-accent/30 flex items-center justify-center text-accent font-bold text-xs uppercase">
                {(user?.name || user?.username || user?.email || 'U').charAt(0)}
              </div>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-off-white-muted" />
          </button>

          {dropdownOpen && (
            <>
              {/* Overlay click catcher */}
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
              
              {/* Dropdown Box */}
              <div className="absolute right-0 mt-2 w-48 bg-panel border border-border rounded shadow-2xl z-50 p-3.5 flex flex-col gap-2 font-mono text-xs text-off-white glow-accent">
                <div className="flex flex-col min-w-0 pb-2 border-b border-border">
                  <span className="font-bold truncate text-[11px] text-off-white">{user?.name || 'User'}</span>
                  <span className="text-[9px] text-off-white-muted truncate mt-0.5">{user?.email}</span>
                </div>
                
                {Capacitor.isNativePlatform() && (
                  <button
                    onClick={() => {
                      setSettingsOpen(true);
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[10px] text-accent hover:bg-accent/10 transition-all text-left uppercase tracking-wider"
                  >
                    <Bell className="w-3.5 h-3.5 text-accent" />
                    <span>MOBILE_ALERTS</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[10px] text-red-400 hover:bg-red-500/15 transition-all text-left uppercase tracking-wider"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>SYS_SHUTDOWN</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <MobileSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
};

export default TopBar;
