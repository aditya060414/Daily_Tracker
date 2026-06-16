import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useFocusStore, useDailyStore, useGoalsStore, useDateStore, useAuthStore } from '../store';
import { Maximize2, Minimize2, LogOut } from 'lucide-react';
import { nativeAlert } from '../utils/dialog';

// Import subcomponents
import { ThemeCanvas } from '../components/focus/ThemeCanvas';
import { FocusAnalytics } from '../components/focus/FocusAnalytics';
import { FocusAchievements } from '../components/focus/FocusAchievements';
import { FocusTimerWidget } from '../components/focus/FocusTimerWidget';

export const Focus: React.FC = () => {
  const selectedDate = useDateStore((state) => state.selectedDate);
  const { dailyLog, fetchLog } = useDailyStore();
  const { goals, fetchGoals } = useGoalsStore();
  const user = useAuthStore((state) => state.user);

  const {
    timeLeft,
    duration,
    isRunning,
    mode,
    selectedTaskId,
    selectedGoalId,
    priorityLevel,
    analytics,
    achievements,
    startTimer,
    pauseTimer,
    resetTimer,
    setMode,
    setCustomDuration,
    setSelectedTaskId,
    setSelectedGoalId,
    setPriorityLevel,
    tick,
    fetchAnalytics,
    fetchAchievements,
    saveFocusSession,
  } = useFocusStore();

  const [activeTab, setActiveTab] = useState<'timer' | 'analytics' | 'achievements'>('timer');
  const [ambientTheme, setAmbientTheme] = useState<'gradient' | 'rain' | 'forest' | 'library' | 'night' | 'cyber' | 'aurora' | 'nebula' | 'ocean' | 'snow' | 'matrix' | 'sakura'>('gradient');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocusLock, setIsFocusLock] = useState(false);
  const [isSettingCustomTime, setIsSettingCustomTime] = useState(false);
  const [customMin, setCustomMin] = useState<number>(45);
  const [quote, setQuote] = useState('');

  // Motivational quotes system
  const quotes = useMemo(
    () => [
      'Focus is a muscle, and you are building it right now.',
      'One focus block at a time. The results will compound.',
      'Simplify. Deep work requires leaving the noise behind.',
      'Your mind is for having ideas, not holding them. Zero distractions.',
      'Great things are done by a series of small things brought together.',
      'Quiet the mind. Link your target. Begin typing.',
      'Deep work is not a chore. It is an act of extreme presence.',
    ],
    []
  );

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, [mode, quotes]);

  // Load telemetry data on date sync or mount
  useEffect(() => {
    fetchLog(selectedDate);
    fetchGoals();
    fetchAnalytics(selectedDate);
    fetchAchievements();
  }, [selectedDate, fetchLog, fetchGoals, fetchAnalytics, fetchAchievements]);

  // Clock tick interval
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  // Web Audio session completion bell beep
  const playCompletionBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const time = ctx.currentTime;

      // Double high-pitch chime (E5 -> A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, time);
      gain1.gain.setValueAtTime(0, time);
      gain1.gain.linearRampToValueAtTime(0.28, time + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.0001, time + 0.45);
      osc1.start(time);
      osc1.stop(time + 0.5);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, time + 0.18);
      gain2.gain.setValueAtTime(0, time + 0.18);
      gain2.gain.linearRampToValueAtTime(0.28, time + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.0001, time + 0.6);
      osc2.start(time + 0.18);
      osc2.stop(time + 0.7);
    } catch (err) {
      console.error('Beep synthesizer error:', err);
    }
  };

  // Browser Notification helper
  const sendBrowserNotification = (title: string, message: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }
  };

  // Listen for timer completion
  const wasRunning = useRef(isRunning);
  useEffect(() => {
    const handleCompletion = async () => {
      if (timeLeft === 0 && wasRunning.current && !isRunning) {
        playCompletionBeep();

        if (Notification.permission === 'default') {
          Notification.requestPermission();
        }
        sendBrowserNotification(
          'Focus Session Completed!',
          mode === 'focus'
            ? 'Great job! Take a short break.'
            : 'Break is over, ready to focus?'
        );

        await saveFocusSession(selectedDate, true);
      }
    };
    handleCompletion();
    wasRunning.current = isRunning;
  }, [timeLeft, isRunning, mode, selectedDate, saveFocusSession]);

  // Fullscreen support helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((e) => console.error(e));
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toLowerCase();
      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning) pauseTimer();
        else startTimer();
      } else if (key === 'r') {
        resetTimer();
      } else if (key === 'n') {
        saveFocusSession(selectedDate, false);
        resetTimer();
      } else if (key === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, startTimer, pauseTimer, resetTimer, saveFocusSession, selectedDate]);

  // Format countdown string
  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCustomTimeSubmit = () => {
    if (customMin < 1 || customMin > 1440) {
      nativeAlert('Duration must be between 1 and 1440 minutes.', 'Invalid Duration');
      return;
    }
    setCustomDuration(customMin * 60);
    setIsSettingCustomTime(false);
  };

  const handleCompleteCurrentTask = async () => {
    if (!selectedTaskId) return;
    await saveFocusSession(selectedDate, true);
  };

  // Select list data for widget connections
  const activeChecklistTasks = dailyLog?.tasks.filter((t) => !t.completed) || [];
  const currentFocusedTask = dailyLog?.tasks.find((t) => t._id === selectedTaskId);
  const currentFocusedGoal = goals.find((g) => g._id === selectedGoalId);

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-[#050508] text-off-white p-4 sm:p-6 font-mono select-none overflow-x-hidden">
      {/* Animated Ambient Canvas */}
      <ThemeCanvas theme={ambientTheme} />

      {/* Main Focus Control Container */}
      <div className="w-full max-w-4xl z-10 flex flex-col items-center gap-6">
        
        {/* Navigation / Exit Controls */}
        {!isFocusLock && (
          <div className="w-full flex items-center justify-between border-b border-border/60 pb-3 mb-2 max-w-2xl animate-fade-in bg-panel/20 px-3.5 py-2 rounded-lg backdrop-blur">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border/70 hover:border-accent/30 rounded text-[9px] font-bold text-off-white-muted hover:text-off-white uppercase transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 rotate-180" />
              <span>Dashboard</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('timer')}
                className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase transition-all ${
                  activeTab === 'timer'
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-off-white-muted hover:text-off-white border border-transparent'
                }`}
              >
                Timer
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-off-white-muted hover:text-off-white border border-transparent'
                }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('achievements')}
                className={`px-3 py-1.5 rounded text-[9px] font-bold uppercase transition-all ${
                  activeTab === 'achievements'
                    ? 'bg-accent/15 text-accent border border-accent/30'
                    : 'text-off-white-muted hover:text-off-white border border-transparent'
                }`}
              >
                Badges
              </button>
            </div>
          </div>
        )}

        {/* Render Tab Contents */}
        {activeTab === 'timer' && (
          <>
            <FocusTimerWidget
              timeLeft={timeLeft}
              duration={duration}
              isRunning={isRunning}
              mode={mode}
              isFocusLock={isFocusLock}
              setIsFocusLock={setIsFocusLock}
              isSettingCustomTime={isSettingCustomTime}
              setIsSettingCustomTime={setIsSettingCustomTime}
              customMin={customMin}
              setCustomMin={setCustomMin}
              onCustomTimeSubmit={handleCustomTimeSubmit}
              onStart={startTimer}
              onPause={pauseTimer}
              onReset={resetTimer}
              onSkip={() => {
                saveFocusSession(selectedDate, false);
                resetTimer();
              }}
              onModeSelect={setMode}
              currentFocusedTask={currentFocusedTask}
              currentFocusedGoal={currentFocusedGoal}
              handleCompleteCurrentTask={handleCompleteCurrentTask}
              goals={goals}
              selectedGoalId={selectedGoalId}
              setSelectedGoalId={setSelectedGoalId}
              activeChecklistTasks={activeChecklistTasks}
              selectedTaskId={selectedTaskId}
              setSelectedTaskId={setSelectedTaskId}
              priorityLevel={priorityLevel}
              setPriorityLevel={setPriorityLevel}
              ambientTheme={ambientTheme}
              setAmbientTheme={setAmbientTheme}
              formatTimeRemaining={formatTimeRemaining}
            />

            {/* General bottom status indicators */}
            {!isFocusLock && (
              <div className="w-full max-w-xl grid grid-cols-3 gap-4 border border-border/50 bg-panel/30 rounded-lg p-4 backdrop-blur font-mono text-[9px] uppercase tracking-wider text-off-white-muted text-center animate-fade-in animate-slide-up">
                <div className="flex flex-col gap-1 border-r border-border/40">
                  <span>Streak counts</span>
                  <span className="text-sm font-bold text-accent font-mono mt-0.5">
                    {user?.dailyFocusStreak || 0} days
                  </span>
                </div>
                <div className="flex flex-col gap-1 border-r border-border/40">
                  <span>Deep weeks</span>
                  <span className="text-sm font-bold text-off-white font-mono mt-0.5">
                    {user?.weeklyDeepWorkStreak || 0} wks
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span>Focus Hours</span>
                  <span className="text-sm font-bold text-off-white font-mono mt-0.5">
                    {parseFloat((user?.totalFocusHours || 0).toFixed(1))} hrs
                  </span>
                </div>
              </div>
            )}

            {!isFocusLock && (
              <p className="text-[10px] text-off-white-muted max-w-md text-center italic mt-2 opacity-75">
                "{quote}"
              </p>
            )}

            <button
              onClick={toggleFullscreen}
              className="fixed bottom-6 right-6 p-3 bg-panel/85 border border-border hover:border-accent/40 rounded-full text-off-white transition-all shadow-2xl active:scale-95 pointer-events-auto"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-off-white-muted hover:text-off-white" /> : <Maximize2 className="w-4 h-4 text-off-white-muted hover:text-off-white" />}
            </button>
          </>
        )}

        {activeTab === 'analytics' && <FocusAnalytics analytics={analytics} />}

        {activeTab === 'achievements' && <FocusAchievements achievements={achievements} />}
      </div>
    </div>
  );
};

export default Focus;
