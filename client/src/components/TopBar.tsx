import React from 'react';
import { Search } from 'lucide-react';
import { useAuthStore, useDateStore, useDailyStore } from '../store';
import { PointsBadge } from './PointsBadge';
import { DateNav } from './DateNav';

interface TopBarProps {
  onOpenCommandPalette: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenCommandPalette }) => {
  const user = useAuthStore((state) => state.user);
  const selectedDate = useDateStore((state) => state.selectedDate);
  const dailyLog = useDailyStore((state) => state.dailyLog);

  // Auto greeting based on time of day
  const getGreeting = () => {
    const hours = new Date().getHours();
    let greet = 'Good evening';
    if (hours < 12) greet = 'Good morning';
    else if (hours < 17) greet = 'Good afternoon';
    
    return `${greet}, ${user?.username || 'user'}`;
  };

  // Extract points for selected date
  const pointsToday = dailyLog && dailyLog.date === selectedDate ? dailyLog.totalPoints : 0;

  return (
    <header className="sticky top-0 z-30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-4 bg-panel/85 backdrop-blur border-b border-border text-off-white select-none">
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
      </div>
    </header>
  );
};
export default TopBar;
