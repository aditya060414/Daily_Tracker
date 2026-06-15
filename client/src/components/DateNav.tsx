import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useDateStore } from '../store';
import { format, parseISO } from 'date-fns';

export const DateNav: React.FC = () => {
  const { selectedDate, prevDay, nextDay, setToday } = useDateStore();

  const getDisplayDate = () => {
    try {
      const parsed = parseISO(selectedDate);
      return format(parsed, 'EEEE, MMM dd, yyyy');
    } catch (e) {
      return selectedDate;
    }
  };

  return (
    <div className="flex items-center gap-2 bg-panel border border-border p-1 rounded-lg">
      <button
        onClick={prevDay}
        className="p-1.5 hover:bg-card hover:text-accent rounded transition-colors"
        title="Previous Day"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={setToday}
        className="px-2.5 py-1 text-xs font-mono font-medium hover:bg-card hover:text-accent rounded flex items-center gap-1 transition-colors"
        title="Jump to Today"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">TODAY</span>
      </button>

      <span className="text-xs font-mono font-bold px-1 sm:px-3 select-none text-off-white min-w-[120px] sm:min-w-[160px] text-center">
        {getDisplayDate()}
      </span>

      <button
        onClick={nextDay}
        className="p-1.5 hover:bg-card hover:text-accent rounded transition-colors"
        title="Next Day"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};
export default DateNav;
