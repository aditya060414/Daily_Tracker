import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import {
  CheckSquare,
  Dumbbell,
  Target,
  Utensils,
  Plus,
  Terminal,
  ChevronRight,
  TrendingUp,
  PenLine,
} from 'lucide-react';
import {
  useDailyStore,
  useDateStore,
  useGymStore,
  useGoalsStore,
  useMealsStore,
  useDayPlanStore,
} from '../store';
import { analyticsApi } from '../api';
import { ProgressRing } from '../components/ProgressRing';
import { LineChart } from '../components/LineChart';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface DashboardProps {
  onOpenCommandPalette: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenCommandPalette }) => {
  const navigate = useNavigate();
  const selectedDate = useDateStore((state) => state.selectedDate);
  
  // Stores
  const { dailyLog, fetchLog, loading: dailyLoading } = useDailyStore();
  const { weeklySessions, fetchWeeklySessions } = useGymStore();
  const { goals, fetchGoals } = useGoalsStore();
  const { meals, fetchMeals } = useMealsStore();
  const { plan, fetchPlan } = useDayPlanStore();

  // Local state
  const [pointsHistory, setPointsHistory] = useState<{ date: string; points: number }[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [dailyPointsTarget, setDailyPointsTarget] = useState(() => {
    const saved = localStorage.getItem('dailyos-points-target');
    return saved ? parseInt(saved, 10) : 10;
  });
  const [showTargetEdit, setShowTargetEdit] = useState(false);

  // Fetch all dashboard requirements
  useEffect(() => {
    const loadDashboardData = async () => {
      // 1. Fetch current daily log
      fetchLog(selectedDate);

      // 2. Fetch weekly workouts (current week)
      const parsedDate = parseISO(selectedDate);
      const start = format(startOfWeek(parsedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const end = format(endOfWeek(parsedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      fetchWeeklySessions(start, end);

      // 3. Fetch goals
      fetchGoals();

      // 4. Fetch meals
      fetchMeals(selectedDate);
      
      // 5. Fetch day plan notes
      fetchPlan(selectedDate);

      // 5. Fetch 30-day points history
      try {
        setLoadingHistory(true);
        const res = await analyticsApi.getPoints(30);
        if (res.success && res.data) {
          setPointsHistory(res.data);
        }
      } catch (err) {
        console.error('Failed to load points history analytics:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadDashboardData();
  }, [selectedDate, fetchLog, fetchWeeklySessions, fetchGoals, fetchMeals]);

  // Handle target change
  const savePointsTarget = (val: number) => {
    setDailyPointsTarget(val);
    localStorage.setItem('dailyos-points-target', val.toString());
    setShowTargetEdit(false);
  };

  // Computations
  const pointsToday = dailyLog && dailyLog.date === selectedDate ? dailyLog.totalPoints : 0;
  const completedTasksToday = dailyLog?.tasks.filter((t) => t.completed).length || 0;
  const totalTasksToday = dailyLog?.tasks.length || 0;

  const gymSessionsThisWeekCount = weeklySessions.length;

  const activeGoalsCount = goals.filter((g) => g.status === 'active').length;

  const totalCaloriesToday = meals.reduce((sum, meal) => sum + meal.totalCalories, 0);

  const pointsPercentage = (pointsToday / dailyPointsTarget) * 100;

  if (dailyLoading && !dailyLog) {
    return <LoadingSpinner message="Initializing workspace telemetry..." />;
  }

  return (
    <div className="p-6 space-y-6 select-none animate-fade-in pb-20 md:pb-6">
      {/* Upper Grid Layout: Date + Summary Circle */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Welcome and Header */}
        <div className="lg:col-span-2 bg-panel border border-border rounded-lg p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-accent">
            <Terminal className="w-48 h-48" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-accent font-mono text-xs uppercase tracking-wider mb-2">
              <Terminal className="w-3.5 h-3.5" />
              <span>Telemetry Node Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-off-white">
              {format(parseISO(selectedDate), 'EEEE')}
            </h1>
            <h2 className="text-xl sm:text-2xl font-mono font-bold text-accent mt-1">
              {format(parseISO(selectedDate), 'MMMM dd, yyyy')}
            </h2>
            <div className="mt-4 p-3 bg-darkbg/40 border border-border/70 rounded max-w-xl">
              <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-widest text-accent font-extrabold mb-1.5">
                <PenLine className="w-3.5 h-3.5 text-accent animate-pulse" />
                <span>TODAY_PLAN_NOTES</span>
              </div>
              <p className="text-xs font-mono text-off-white leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto pr-1">
                {plan?.notes || 'No plan notes saved for today. Select "Planning" from the sidebar to organize your day.'}
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-2.5">
            <button
              onClick={onOpenCommandPalette}
              className="px-4 py-2 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded font-mono text-xs font-bold uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 shadow-lg shadow-accent/10"
            >
              <Plus className="w-4 h-4" /> Quick Add (Ctrl+K)
            </button>
            <button
              onClick={() => navigate('/review')}
              className="px-4 py-2 border border-border hover:border-accent/40 rounded font-mono text-xs font-bold text-off-white-muted hover:text-off-white transition-all duration-150"
            >
              Write Review
            </button>
          </div>
        </div>

        {/* Circular Points Progress */}
        <div className="bg-panel border border-border rounded-lg p-6 flex flex-col items-center justify-center relative">
          <div className="absolute top-4 left-4 flex items-center gap-1.5 text-off-white-muted font-mono text-[10px] uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-accent" />
            <span>Target Progress</span>
          </div>

          <div className="mt-4 flex flex-col items-center">
            <ProgressRing
              value={pointsPercentage}
              size={130}
              strokeWidth={10}
              color="stroke-accent"
              label={`Score / Target`}
            />

            <div className="text-center mt-3 font-mono">
              <span className="text-2xl font-bold text-off-white">{pointsToday}</span>
              <span className="text-off-white-muted mx-1">/</span>
              {showTargetEdit ? (
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-12 bg-darkbg border border-accent text-center text-off-white font-mono text-sm py-0.5 rounded outline-none"
                  defaultValue={dailyPointsTarget}
                  onBlur={(e) => savePointsTarget(parseInt(e.target.value, 10) || 10)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      savePointsTarget(parseInt((e.target as any).value, 10) || 10);
                    }
                  }}
                  autoFocus
                />
              ) : (
                <span
                  onClick={() => setShowTargetEdit(true)}
                  className="text-sm font-semibold text-accent hover:underline cursor-pointer"
                  title="Click to edit daily points target"
                >
                  {dailyPointsTarget}
                </span>
              )}
              <p className="text-[10px] text-off-white-muted mt-1 uppercase tracking-wider">Daily Points Target</p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Tasks */}
        <div
          onClick={() => navigate('/tasks')}
          className="bg-panel border border-border hover:border-accent/40 rounded-lg p-4 cursor-pointer hover:shadow-lg hover:shadow-accent/5 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-off-white-muted">Tasks Completed</span>
            <CheckSquare className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="text-xl font-mono font-bold text-off-white mt-2">
            {completedTasksToday} <span className="text-xs text-off-white-muted">/ {totalTasksToday}</span>
          </h2>
          <div className="flex items-center text-[10px] font-mono text-accent mt-2 hover:underline">
            <span>Open Checklist</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 2: Gym */}
        <div
          onClick={() => navigate('/gym')}
          className="bg-panel border border-border hover:border-accent/40 rounded-lg p-4 cursor-pointer hover:shadow-lg hover:shadow-accent/5 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-off-white-muted">Weekly Gym</span>
            <Dumbbell className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="text-xl font-mono font-bold text-off-white mt-2">
            {gymSessionsThisWeekCount} <span className="text-xs text-off-white-muted">sessions</span>
          </h2>
          <div className="flex items-center text-[10px] font-mono text-accent mt-2 hover:underline">
            <span>Log Workout</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 3: Goals */}
        <div
          onClick={() => navigate('/goals')}
          className="bg-panel border border-border hover:border-accent/40 rounded-lg p-4 cursor-pointer hover:shadow-lg hover:shadow-accent/5 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-off-white-muted">Active Goals</span>
            <Target className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="text-xl font-mono font-bold text-off-white mt-2">
            {activeGoalsCount} <span className="text-xs text-off-white-muted">active</span>
          </h2>
          <div className="flex items-center text-[10px] font-mono text-accent mt-2 hover:underline">
            <span>View Goals</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* Card 4: Calories */}
        <div
          onClick={() => navigate('/meals')}
          className="bg-panel border border-border hover:border-accent/40 rounded-lg p-4 cursor-pointer hover:shadow-lg hover:shadow-accent/5 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-off-white-muted">Calories Today</span>
            <Utensils className="w-4 h-4 text-amber-400" />
          </div>
          <h2 className="text-xl font-mono font-bold text-off-white mt-2">
            {totalCaloriesToday} <span className="text-xs text-off-white-muted">kcal</span>
          </h2>
          <div className="flex items-center text-[10px] font-mono text-accent mt-2 hover:underline">
            <span>Log Nutrition</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Main Points Graph */}
      <div className="bg-panel border border-border rounded-lg p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-off-white-muted">Productivity Index</span>
            <h3 className="text-sm font-mono font-bold text-off-white">30-Day Points Chronology</h3>
          </div>
          <span className="text-[10px] font-mono bg-card px-2.5 py-1 rounded text-off-white-muted border border-border">
            Total historical daily log analytics
          </span>
        </div>

        {loadingHistory ? (
          <div className="h-56 flex items-center justify-center font-mono text-xs text-off-white-muted animate-pulse">
            Retrieving point analytics vectors...
          </div>
        ) : (
          <div className="mt-4 overflow-hidden">
            <LineChart data={pointsHistory} color="#7c3aed" height={220} label="Score Points" />
          </div>
        )}
      </div>
      
      {/* KeyboardFAB Overlay hint */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-40">
        <button
          onClick={onOpenCommandPalette}
          className="w-12 h-12 rounded-full bg-accent hover:bg-accent-dim text-darkbg hover:text-off-white flex items-center justify-center shadow-2xl transition-all duration-200 glow-accent hover:scale-105"
          title="Open Command Palette (Ctrl+K)"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
export default Dashboard;
