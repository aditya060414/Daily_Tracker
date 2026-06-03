import React, { useEffect, useRef } from 'react';
import { useFocusStore, useDailyStore, useDateStore } from '../store';
import { Play, Pause, RotateCcw, CheckCircle2, Timer, Sparkles } from 'lucide-react';

export const Focus: React.FC = () => {
  const selectedDate = useDateStore((state) => state.selectedDate);
  const { dailyLog, fetchLog, toggleLogTask } = useDailyStore();

  const {
    timeLeft,
    duration,
    isRunning,
    mode,
    selectedTaskId,
    startTimer,
    pauseTimer,
    resetTimer,
    setMode,
    setSelectedTaskId,
    tick,
  } = useFocusStore();

  // Load today's log tasks to select
  useEffect(() => {
    fetchLog(selectedDate);
  }, [selectedDate, fetchLog]);

  // Sync clock tick
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  // Web Audio sound synthesizer for session completion
  const playCompletionSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      // First beep (E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.45);

      // Second beep (A5) - delayed slightly
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain2.gain.setValueAtTime(0, ctx.currentTime + 0.15);
      gain2.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (err) {
      console.error('Audio beep failed:', err);
    }
  };

  // Play sound exactly once when the timer reaches 0 from a running state
  const wasRunning = useRef(isRunning);
  useEffect(() => {
    if (timeLeft === 0 && wasRunning.current && !isRunning) {
      playCompletionSound();
    }
    wasRunning.current = isRunning;
  }, [timeLeft, isRunning]);

  // Format time remaining (e.g. 25:00)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Find active selected task
  const activeTasks = dailyLog?.tasks.filter((t) => !t.completed) || [];
  const currentFocusedTask = dailyLog?.tasks.find((t) => t._id === selectedTaskId);

  // Mark task completed directly from focus panel
  const handleCompleteTask = async () => {
    if (!selectedTaskId) return;
    await toggleLogTask(selectedDate, selectedTaskId, true);
    setSelectedTaskId(null);
  };

  // Progress SVG Calculation
  const radius = 95;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = duration > 0 ? (timeLeft / duration) : 0;
  const strokeDashoffset = circumference - progressPercent * circumference;

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] font-mono animate-fade-in text-off-white select-none pb-20 md:pb-6">
      <div className="w-full max-w-xl bg-panel border border-border rounded-lg p-6 flex flex-col items-center shadow-2xl relative overflow-hidden">
        {/* Glowing design background accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

        {/* Header Title */}
        <div className="flex items-center gap-2 mb-6 border-b border-border pb-4 w-full justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-accent animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-off-white">FOCUS_ALIGNMENT</h2>
          </div>
          <div className="text-[10px] uppercase text-off-white-muted tracking-wider">
            SYSTEM_STATUS: {isRunning ? 'TICKING' : 'IDLE'}
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex gap-2 bg-darkbg border border-border p-1 rounded mb-8 w-full">
          {(['focus', 'shortBreak', 'longBreak'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
                mode === m
                  ? 'bg-accent/15 text-accent border border-accent/20 font-extrabold glow-accent'
                  : 'text-off-white-muted hover:text-off-white border border-transparent'
              }`}
            >
              {m === 'focus' ? 'Focus (25m)' : m === 'shortBreak' ? 'Short Break (5m)' : 'Long Break (15m)'}
            </button>
          ))}
        </div>

        {/* Progress Ring with Time Left */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-8">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="128"
              cy="128"
              r={radius}
              className="stroke-card/50"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Foreground progress ring */}
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
            />
          </svg>

          {/* Time digits text */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-5xl font-extrabold font-mono tracking-tighter text-off-white">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[9px] uppercase tracking-widest text-off-white-muted mt-1">
              {mode === 'focus' ? 'Focus Session' : 'Break Time'}
            </span>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={resetTimer}
            className="p-3 bg-card hover:bg-card-dim border border-border hover:border-accent/40 rounded-full text-off-white transition-all active:scale-95"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5 text-off-white-muted hover:text-off-white" />
          </button>

          <button
            onClick={isRunning ? pauseTimer : startTimer}
            className="p-5 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded-full transition-all active:scale-95 glow-accent"
            title={isRunning ? 'Pause Focus' : 'Start Focus'}
          >
            {isRunning ? <Pause className="w-6 h-6 stroke-[3]" /> : <Play className="w-6 h-6 stroke-[3] fill-darkbg" />}
          </button>
        </div>

        {/* Task Focus Section */}
        <div className="w-full border border-border bg-card/25 rounded p-4 flex flex-col gap-3">
          <div className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Link Focus Task</span>
          </div>

          <select
            value={selectedTaskId || ''}
            onChange={(e) => setSelectedTaskId(e.target.value || null)}
            className="w-full px-3 py-2 bg-darkbg border border-border rounded text-xs text-off-white outline-none focus:border-accent font-semibold"
          >
            <option value="">-- NO_TASK_CONNECTED --</option>
            {activeTasks.map((task) => (
              <option key={task._id} value={task._id}>
                {task.title} (+{task.points} pts) [{task.category.toUpperCase()}]
              </option>
            ))}
          </select>

          {currentFocusedTask && (
            <div className="flex items-center justify-between bg-darkbg/50 border border-accent/20 rounded p-2.5 mt-2 animate-fade-in">
              <div className="flex flex-col min-w-0">
                <span className="text-[9px] uppercase tracking-wider text-off-white-muted">Active Focus Object</span>
                <span className="text-xs font-bold text-off-white truncate">{currentFocusedTask.title}</span>
              </div>
              <button
                onClick={handleCompleteTask}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded text-[10px] font-bold uppercase transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Complete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Focus;
