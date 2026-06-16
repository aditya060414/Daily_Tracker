import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, Dumbbell, Calendar, Target, Utensils, PenLine, LayoutDashboard, CheckSquare, Timer, Wallet } from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Define commands
  const commands: CommandItem[] = [
    {
      id: 'dash',
      title: 'Go to Dashboard',
      subtitle: 'System core statistics and points visual tracking overview',
      category: 'Navigation',
      icon: <LayoutDashboard className="w-4 h-4" />,
      action: () => {
        navigate('/');
        onClose();
      },
    },
    {
      id: 'tasks',
      title: 'Go to Daily Tasks',
      subtitle: 'Manage repeating task templates and check off today\'s list',
      category: 'Navigation',
      icon: <CheckSquare className="w-4 h-4" />,
      action: () => {
        navigate('/tasks');
        onClose();
      },
    },
    {
      id: 'gym',
      title: 'Go to Gym Tracker',
      subtitle: 'Log lifts, volume sets, weights, and inspect muscle groupings',
      category: 'Navigation',
      icon: <Dumbbell className="w-4 h-4" />,
      action: () => {
        navigate('/gym');
        onClose();
      },
    },
    {
      id: 'plan',
      title: 'Go to Day Planning',
      subtitle: 'Block out your 24h timeline and view unscheduled items',
      category: 'Navigation',
      icon: <Calendar className="w-4 h-4" />,
      action: () => {
        navigate('/plan');
        onClose();
      },
    },
    {
      id: 'focus',
      title: 'Go to Focus Timer',
      subtitle: 'Tune into your sessions with Pomodoro tracking and task linkages',
      category: 'Navigation',
      icon: <Timer className="w-4 h-4" />,
      action: () => {
        navigate('/focus');
        onClose();
      },
    },
    {
      id: 'goals',
      title: 'Go to Goal Planning',
      subtitle: 'Track active, paused, or completed short-term and long-term milestones',
      category: 'Navigation',
      icon: <Target className="w-4 h-4" />,
      action: () => {
        navigate('/goals');
        onClose();
      },
    },
    {
      id: 'meals',
      title: 'Go to Meals Tracker',
      subtitle: 'Log daily food calorie values and track macro totals',
      category: 'Navigation',
      icon: <Utensils className="w-4 h-4" />,
      action: () => {
        navigate('/meals');
        onClose();
      },
    },
    {
      id: 'skincare',
      title: 'Go to Skin Care',
      subtitle: 'Track AM/PM routine, skin health rating, hydration, acne, and notes',
      category: 'Navigation',
      icon: <Sparkles className="w-4 h-4" />,
      action: () => {
        navigate('/skincare');
        onClose();
      },
    },
    {
      id: 'review',
      title: 'Go to Daily Review',
      subtitle: 'Write down Highlights, Challenges, Gratitude, and check streaks',
      category: 'Navigation',
      icon: <PenLine className="w-4 h-4" />,
      action: () => {
        navigate('/review');
        onClose();
      },
    },
    {
      id: 'finance',
      title: 'Go to Finance Dashboard',
      subtitle: 'Audit liquid balance, track savings goals, log expenses, and configure budgets',
      category: 'Navigation',
      icon: <Wallet className="w-4 h-4" />,
      action: () => {
        navigate('/finance');
        onClose();
      },
    },
    {
      id: 'quick-expense',
      title: 'Quick-Add Expense Item',
      subtitle: 'Record a transaction in the finance ledger immediately',
      category: 'Actions',
      icon: <Sparkles className="w-4 h-4 text-accent" />,
      action: () => {
        navigate('/finance');
        onClose();
      },
    },
    {
      id: 'quick-task',
      title: 'Quick-Add One-Off Task',
      subtitle: 'Add a new custom task to today\'s checklist immediately',
      category: 'Actions',
      icon: <Sparkles className="w-4 h-4 text-accent" />,
      action: () => {
        navigate('/tasks');
        onClose();
      },
    },
    {
      id: 'quick-meal',
      title: 'Quick-Add Meal Item',
      subtitle: 'Log a food item directly on the meals sheet',
      category: 'Actions',
      icon: <Sparkles className="w-4 h-4 text-accent" />,
      action: () => {
        navigate('/meals');
        onClose();
      },
    },
  ];

  // Filter commands by search
  const filtered = commands.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  // Listen to Cmd/Ctrl + K
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setSearch('');
    }
  }, [isOpen]);

  // Handle keyboard shortcuts inside palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(filtered.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(filtered.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh] bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        ref={containerRef}
        className="w-full max-w-xl bg-panel border border-border rounded-lg shadow-2xl overflow-hidden glow-accent-strong flex flex-col max-h-[50vh]"
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 border-b border-border py-3">
          <Search className="w-4 h-4 text-off-white-muted" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-sm text-off-white outline-none border-none placeholder-off-white-muted font-mono"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <kbd className="hidden sm:inline-flex items-center h-5 select-none rounded border border-border bg-card px-1.5 font-mono text-[10px] text-off-white-muted">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs font-mono text-off-white-muted">
              No commands matching &ldquo;{search}&rdquo;
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded text-left transition-colors font-mono ${
                    idx === selectedIndex ? 'bg-accent/15 text-off-white border-l-2 border-accent' : 'text-off-white-muted'
                  }`}
                >
                  <div className={`p-1.5 rounded bg-card border border-border ${idx === selectedIndex ? 'text-accent border-accent/30' : ''}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span className={idx === selectedIndex ? 'text-accent' : ''}>{item.title}</span>
                      <span className="text-[9px] uppercase tracking-wider text-off-white-muted opacity-40">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-[10px] text-off-white-muted mt-0.5 truncate">{item.subtitle}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-card text-[9px] font-mono text-off-white-muted">
          <div className="flex gap-2">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>DailyOS Commands</span>
        </div>
      </div>
    </div>
  );
};
export default CommandPalette;
