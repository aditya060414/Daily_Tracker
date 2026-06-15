import React from 'react';
import { Timer, EyeOff, Eye, RotateCcw, Pause, Play, CheckCircle2, Sparkles } from 'lucide-react';

interface FocusTimerWidgetProps {
  timeLeft: number;
  duration: number;
  isRunning: boolean;
  mode: 'focus' | 'shortBreak' | 'longBreak' | 'custom';
  isFocusLock: boolean;
  setIsFocusLock: (val: boolean) => void;
  isSettingCustomTime: boolean;
  setIsSettingCustomTime: (val: boolean) => void;
  customMin: number;
  setCustomMin: (val: number) => void;
  onCustomTimeSubmit: () => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onModeSelect: (mode: 'focus' | 'shortBreak' | 'longBreak' | 'custom') => void;
  
  // Alignment focus
  currentFocusedTask: any;
  currentFocusedGoal: any;
  handleCompleteCurrentTask: () => void;
  
  // Goal / task lists
  goals: any[];
  selectedGoalId: string | null;
  setSelectedGoalId: (id: string | null) => void;
  activeChecklistTasks: any[];
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  priorityLevel: 'low' | 'medium' | 'high' | null;
  setPriorityLevel: (lvl: 'low' | 'medium' | 'high' | null) => void;
  
  // Ambient background themes
  ambientTheme: string;
  setAmbientTheme: (theme: any) => void;
  
  // Format countdown string
  formatTimeRemaining: (seconds: number) => string;
}

export const FocusTimerWidget: React.FC<FocusTimerWidgetProps> = ({
  timeLeft,
  duration,
  isRunning,
  mode,
  isFocusLock,
  setIsFocusLock,
  isSettingCustomTime,
  setIsSettingCustomTime,
  customMin,
  setCustomMin,
  onCustomTimeSubmit,
  onStart,
  onPause,
  onReset,
  onSkip,
  onModeSelect,
  currentFocusedTask,
  currentFocusedGoal,
  handleCompleteCurrentTask,
  goals,
  selectedGoalId,
  setSelectedGoalId,
  activeChecklistTasks,
  selectedTaskId,
  setSelectedTaskId,
  priorityLevel,
  setPriorityLevel,
  ambientTheme,
  setAmbientTheme,
  formatTimeRemaining
}) => {
  // Circular progress countdown calculation
  const progressPercent = duration > 0 ? (timeLeft / duration) * 100 : 0;
  const radius = 105;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="w-full flex flex-col items-center gap-6 font-mono">
      {/* The main countdown central timer card */}
      <div className="w-full max-w-xl bg-panel/75 backdrop-blur-md border border-border/80 rounded-xl p-4 sm:p-8 flex flex-col items-center shadow-2xl relative overflow-hidden glow-accent">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-[1px] bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        {/* Timer Header */}
        <div className="flex items-center gap-2 mb-6 border-b border-border/40 pb-4 w-full justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-accent animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-off-white">FOCUS_OS_V1.0</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Focus lock toggler */}
            <button
              onClick={() => setIsFocusLock(!isFocusLock)}
              className={`p-1.5 rounded border transition-colors ${
                isFocusLock
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-card/40 border-border/50 text-off-white-muted hover:text-off-white'
              }`}
              title={isFocusLock ? 'Disable Distraction Lock' : 'Enable Distraction Lock'}
            >
              {isFocusLock ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>

            <div className="text-[9px] uppercase font-bold text-accent tracking-wider bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
              {isRunning ? 'Ticking' : 'Idle'}
            </div>
          </div>
        </div>

        {/* Preset buttons: Hidden in Focus Lock */}
        {!isFocusLock && (
          <div className="flex flex-wrap gap-2 bg-darkbg/50 border border-border/50 p-1.5 rounded-lg w-full mb-6">
            <button
              onClick={() => {
                onModeSelect('focus');
                setIsSettingCustomTime(false);
              }}
              className={`flex-1 py-1.5 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all ${
                mode === 'focus'
                  ? 'bg-accent/15 text-accent border border-accent/25'
                  : 'text-off-white-muted hover:text-off-white border border-transparent'
              }`}
            >
              Pomodoro (25m)
            </button>
            <button
              onClick={() => {
                onModeSelect('custom');
                onCustomTimeSubmit(); // sets default 50m
                setIsSettingCustomTime(false);
              }}
              className={`flex-1 py-1.5 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all ${
                mode === 'custom' && duration === 50 * 60
                  ? 'bg-accent/15 text-accent border border-accent/25'
                  : 'text-off-white-muted hover:text-off-white border border-transparent'
              }`}
            >
              Deep Work (50m)
            </button>
            <button
              onClick={() => {
                onModeSelect('shortBreak');
                setIsSettingCustomTime(false);
              }}
              className={`px-3 py-1.5 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all ${
                mode === 'shortBreak'
                  ? 'bg-accent/15 text-accent border border-accent/25'
                  : 'text-off-white-muted hover:text-off-white border border-transparent'
              }`}
            >
              Break (5m)
            </button>
            <button
              onClick={() => setIsSettingCustomTime(!isSettingCustomTime)}
              className={`px-3 py-1.5 rounded text-[9px] font-extrabold uppercase tracking-wider transition-all ${
                isSettingCustomTime || (mode === 'custom' && duration !== 50 * 60)
                  ? 'bg-accent/15 text-accent border border-accent/25'
                  : 'text-off-white-muted hover:text-off-white border border-transparent'
              }`}
            >
              Custom
            </button>
          </div>
        )}

        {/* Custom time settings widget */}
        {isSettingCustomTime && !isFocusLock && (
          <div className="flex items-center gap-2.5 bg-darkbg/60 border border-border p-2.5 rounded mb-6 w-full animate-fade-in animate-slide-down">
            <span className="text-[9px] uppercase font-extrabold text-off-white-muted pl-1">Minutes:</span>
            <input
              type="number"
              min="1"
              max="1440"
              value={customMin}
              onChange={(e) => setCustomMin(parseInt(e.target.value) || 0)}
              className="w-16 px-2.5 py-1 bg-card border border-border rounded text-xs text-off-white text-center outline-none focus:border-accent font-bold"
            />
            <button
              onClick={onCustomTimeSubmit}
              className="px-3.5 py-1.5 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded text-[9px] font-bold uppercase transition-colors ml-auto"
            >
              Apply
            </button>
            <button
              onClick={() => setIsSettingCustomTime(false)}
              className="px-3 py-1.5 bg-card hover:bg-card-dim border border-border rounded text-[9px] text-off-white-muted hover:text-off-white uppercase transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Large circular countdown timer graphics */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r={radius}
              className="stroke-card/40"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <circle
              cx="128"
              cy="128"
              r={radius}
              className="stroke-accent transition-all duration-300 ease-linear"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0px 0px 4px rgba(124, 58, 237, 0.45))' }}
            />
          </svg>

          {/* Centered text timer digits */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-5xl font-extrabold tracking-tighter text-off-white">
              {formatTimeRemaining(timeLeft)}
            </span>
            <span className="text-[8px] uppercase tracking-widest text-off-white-muted mt-2">
              {mode === 'focus'
                ? 'Deep Focus'
                : mode === 'shortBreak'
                ? 'Short Break'
                : mode === 'longBreak'
                ? 'Long Break'
                : 'Custom Focus'}
            </span>
          </div>
        </div>

        {/* Controls triggers */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={onReset}
            className="p-3 bg-card hover:bg-card-dim border border-border/80 hover:border-accent/40 rounded-full text-off-white transition-all active:scale-95"
            title="Reset Timer (R)"
          >
            <RotateCcw className="w-4 h-4 text-off-white-muted hover:text-off-white" />
          </button>

          <button
            onClick={isRunning ? onPause : onStart}
            className="p-5 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded-full transition-all active:scale-90 glow-accent"
            title={isRunning ? 'Pause Timer (Space)' : 'Start Timer (Space)'}
          >
            {isRunning ? <Pause className="w-6 h-6 stroke-[3]" /> : <Play className="w-6 h-6 stroke-[3] fill-darkbg" />}
          </button>

          <button
            onClick={onSkip}
            className="p-3 bg-card hover:bg-card-dim border border-border/80 hover:border-accent/40 rounded-full text-off-white transition-all active:scale-95 text-off-white-muted hover:text-off-white text-xs font-bold"
            title="Skip Session (N)"
          >
            Skip
          </button>
        </div>

        {/* Connected details status (Current Task / Goal) */}
        {(currentFocusedTask || currentFocusedGoal) && (
          <div className="w-full flex flex-col gap-2 border-t border-border/30 pt-4 animate-fade-in text-[10px]">
            {currentFocusedTask && (
              <div className="flex items-center justify-between bg-darkbg/40 border border-accent/20 rounded p-2.5">
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] uppercase text-off-white-muted">Active Focus Object</span>
                  <span className="font-bold text-off-white truncate">{currentFocusedTask.title}</span>
                </div>
                <button
                  onClick={handleCompleteCurrentTask}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded text-[8px] font-extrabold uppercase transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Done</span>
                </button>
              </div>
            )}

            {currentFocusedGoal && (
              <div className="flex items-center justify-between bg-darkbg/40 border border-border/40 rounded p-2.5">
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] uppercase text-off-white-muted">Aligned Objective</span>
                  <span className="font-bold text-off-white truncate">{currentFocusedGoal.title}</span>
                </div>
                <span className="text-accent font-bold">{currentFocusedGoal.progress}% Progress</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Config links and Ambient selector (Hidden in Focus Lock distraction mode) */}
      {!isFocusLock && (
        <div className="w-full max-w-xl grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {/* 1. Integration parameters */}
          <div className="bg-panel/75 backdrop-blur border border-border p-5 rounded-lg flex flex-col gap-3.5">
            <div className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Focus Integrations</span>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold text-off-white-muted">Align with Goal</label>
                <select
                  value={selectedGoalId || ''}
                  onChange={(e) => setSelectedGoalId(e.target.value || null)}
                  className="w-full px-2 py-1.5 bg-darkbg border border-border rounded text-[10px] text-off-white outline-none focus:border-accent font-bold"
                >
                  <option value="">-- NO_GOAL_ALIGNED --</option>
                  {goals.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.title} ({g.progress}%)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold text-off-white-muted">Align with Checklist Task</label>
                <select
                  value={selectedTaskId || ''}
                  onChange={(e) => setSelectedTaskId(e.target.value || null)}
                  className="w-full px-2 py-1.5 bg-darkbg border border-border rounded text-[10px] text-off-white outline-none focus:border-accent font-bold"
                >
                  <option value="">-- NO_TASK_CONNECTED --</option>
                  {activeChecklistTasks.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.title} (+{t.points} pts) [{t.category.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[8px] uppercase font-bold text-off-white-muted">Priority Level</label>
                <div className="flex gap-2.5">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriorityLevel(priorityLevel === p ? null : p)}
                      className={`flex-1 py-1 rounded text-[8px] font-extrabold uppercase border transition-all ${
                        priorityLevel === p
                          ? p === 'high'
                            ? 'bg-red-500/10 border-red-500/40 text-red-400 font-extrabold'
                            : p === 'medium'
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-extrabold'
                            : 'bg-blue-500/10 border-blue-500/40 text-blue-400 font-extrabold'
                          : 'bg-darkbg/40 border-border/70 text-off-white-muted hover:text-off-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Theme selector */}
          <div className="bg-panel/75 backdrop-blur border border-border p-5 rounded-lg flex flex-col gap-3.5">
            <div className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5 border-b border-border/40 pb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Background Themes</span>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'gradient', label: 'Gradient' },
                  { id: 'rain', label: 'Rain' },
                  { id: 'forest', label: 'Forest' },
                  { id: 'library', label: 'Library' },
                  { id: 'night', label: 'Night' },
                  { id: 'cyber', label: 'Cyber' },
                  { id: 'aurora', label: 'Aurora' },
                  { id: 'nebula', label: 'Nebula' },
                  { id: 'ocean', label: 'Ocean' },
                  { id: 'snow', label: 'Snow' },
                  { id: 'matrix', label: 'Matrix' },
                  { id: 'sakura', label: 'Sakura' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAmbientTheme(t.id as any)}
                    className={`py-2 rounded text-[8px] font-extrabold uppercase border text-center transition-all ${
                      ambientTheme === t.id
                        ? 'bg-accent/15 border-accent/30 text-accent glow-accent'
                        : 'bg-darkbg/40 border-border/50 text-off-white-muted hover:text-off-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FocusTimerWidget;
