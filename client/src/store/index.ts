import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, addDays, parseISO } from 'date-fns';
import {
  User,
  TaskTemplate,
  DailyLog,
  GymSession,
  DayPlan,
  Goal,
  Meal,
  DayReview,
  TimeBlock,
  GymExercise,
  MealItem,
  StickyNote,
  SkincareLog,
  FocusAnalytics,
  Achievement,
} from '../types';
import {
  dailyTasksApi,
  dailyLogsApi,
  gymApi,
  dayPlanApi,
  goalsApi,
  mealsApi,
  reviewsApi,
  stickyNotesApi,
  skincareApi,
  focusApi,
} from '../api';

// ----------------------------------------------------
// AUTH STORE
// ----------------------------------------------------
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => {
        // Support backward compatibility with existing views that reference user.username
        const mappedUser = {
          ...user,
          username: user.username || user.name || user.email.split('@')[0]
        };
        set({ token, user: mappedUser, isAuthenticated: true });
      },
      clearAuth: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'dailyos-auth',
    }
  )
);

// ----------------------------------------------------
// DATE STORE (Global selected date synchronizer)
// ----------------------------------------------------
interface DateState {
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  nextDay: () => void;
  prevDay: () => void;
  setToday: () => void;
}

export const useDateStore = create<DateState>((set) => ({
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  setSelectedDate: (date) => set({ selectedDate: date }),
  nextDay: () =>
    set((state) => {
      const current = parseISO(state.selectedDate);
      return { selectedDate: format(addDays(current, 1), 'yyyy-MM-dd') };
    }),
  prevDay: () =>
    set((state) => {
      const current = parseISO(state.selectedDate);
      return { selectedDate: format(addDays(current, -1), 'yyyy-MM-dd') };
    }),
  setToday: () => set({ selectedDate: format(new Date(), 'yyyy-MM-dd') }),
}));

// ----------------------------------------------------
// DAILY TASKS & LOGS STORE (With Optimistic UI Updates)
// ----------------------------------------------------
interface DailyState {
  taskTemplates: TaskTemplate[];
  dailyLog: DailyLog | null;
  loading: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  createTemplate: (task: Omit<TaskTemplate, '_id'>) => Promise<void>;
  updateTemplate: (id: string, task: Partial<Omit<TaskTemplate, '_id'>>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  fetchLog: (date: string) => Promise<void>;
  addOneOffTask: (date: string, task: { title: string; points: number; category: any }) => Promise<void>;
  toggleLogTask: (date: string, logTaskId: string, completed: boolean) => Promise<void>;
  deleteLogTask: (date: string, logTaskId: string) => Promise<void>;
}

export const useDailyStore = create<DailyState>((set, get) => ({
  taskTemplates: [],
  dailyLog: null,
  loading: false,
  error: null,

  fetchTemplates: async () => {
    set({ loading: true, error: null });
    try {
      const res = await dailyTasksApi.getAll();
      set({ taskTemplates: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch task templates', loading: false });
    }
  },

  createTemplate: async (task) => {
    try {
      const res = await dailyTasksApi.create(task);
      set((state) => ({ taskTemplates: [res.data, ...state.taskTemplates] }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to create task template' });
    }
  },

  updateTemplate: async (id, task) => {
    try {
      const res = await dailyTasksApi.update(id, task);
      set((state) => ({
        taskTemplates: state.taskTemplates.map((t) => (t._id === id ? res.data : t)),
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to update task template' });
    }
  },

  deleteTemplate: async (id) => {
    try {
      await dailyTasksApi.delete(id);
      set((state) => ({
        taskTemplates: state.taskTemplates.filter((t) => t._id !== id),
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to delete task template' });
    }
  },

  fetchLog: async (date) => {
    set({ loading: true, error: null });
    try {
      const res = await dailyLogsApi.get(date);
      set({ dailyLog: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch daily log', loading: false });
    }
  },

  addOneOffTask: async (date, task) => {
    try {
      const res = await dailyLogsApi.addOneOff(date, task);
      set({ dailyLog: res.data });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to add one-off task' });
    }
  },

  toggleLogTask: async (date, logTaskId, completed) => {
    const previousLog = get().dailyLog;
    if (!previousLog) return;

    // OPTIMISTIC UPDATE:
    // Update local state immediately
    const updatedTasks = previousLog.tasks.map((task) => {
      if (task._id === logTaskId) {
        return {
          ...task,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        };
      }
      return task;
    });

    const newPoints = updatedTasks.reduce((sum, task) => {
      return sum + (task.completed ? task.points : 0);
    }, 0);

    const optimisticLog = {
      ...previousLog,
      tasks: updatedTasks,
      totalPoints: newPoints,
    };

    set({ dailyLog: optimisticLog });

    // Sync to Server
    try {
      const res = await dailyLogsApi.toggleTask(date, logTaskId, completed);
      set({ dailyLog: res.data }); // update with database final response
    } catch (err: any) {
      // Rollback on failure
      set({ dailyLog: previousLog, error: 'Failed to sync check box toggle. Restored original state.' });
    }
  },

  deleteLogTask: async (date, logTaskId) => {
    try {
      const res = await dailyLogsApi.deleteTask(date, logTaskId);
      set({ dailyLog: res.data });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to delete task from checklist' });
    }
  },
}));

// ----------------------------------------------------
// GYM STORE
// ----------------------------------------------------
interface GymState {
  session: GymSession | null;
  weeklySessions: GymSession[];
  historySessions: GymSession[];
  loading: boolean;
  error: string | null;
  fetchSession: (date: string) => Promise<void>;
  fetchWeeklySessions: (startDate: string, endDate: string) => Promise<void>;
  fetchHistorySessions: () => Promise<void>;
  saveSession: (
    date: string,
    data: { exercises: GymExercise[]; durationMinutes: number; notes: string; photos?: string[] }
  ) => Promise<void>;
  deleteSession: (date: string) => Promise<void>;
}

export const useGymStore = create<GymState>((set) => ({
  session: null,
  weeklySessions: [],
  historySessions: [],
  loading: false,
  error: null,

  fetchSession: async (date) => {
    set({ loading: true, error: null });
    try {
      const res = await gymApi.get(date);
      set({ session: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch gym session', loading: false });
    }
  },

  fetchWeeklySessions: async (startDate, endDate) => {
    try {
      const res = await gymApi.list(startDate, endDate);
      set({ weeklySessions: res.data });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch weekly workout summary' });
    }
  },

  fetchHistorySessions: async () => {
    try {
      const res = await gymApi.list();
      set({ historySessions: res.data });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch workout history log' });
    }
  },

  saveSession: async (date, data) => {
    set({ loading: true, error: null });
    try {
      const res = await gymApi.upsert(date, data);
      set({ session: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to save workout session', loading: false });
    }
  },

  deleteSession: async (date) => {
    set({ loading: true, error: null });
    try {
      await gymApi.delete(date);
      set({ session: null, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to delete gym session', loading: false });
    }
  },
}));

// ----------------------------------------------------
// DAY PLANNING STORE
// ----------------------------------------------------
interface DayPlanState {
  plan: DayPlan | null;
  tomorrowPlan: DayPlan | null;
  loading: boolean;
  error: string | null;
  fetchPlan: (date: string) => Promise<void>;
  savePlan: (date: string, timeBlocks?: TimeBlock[], notes?: string) => Promise<void>;
  saveTomorrowPlan: (date: string, timeBlocks?: TimeBlock[], notes?: string) => Promise<void>;
  copyPlan: (date: string, sourceDate: string) => Promise<void>;
}

export const useDayPlanStore = create<DayPlanState>((set) => ({
  plan: null,
  tomorrowPlan: null,
  loading: false,
  error: null,

  fetchPlan: async (date) => {
    set({ loading: true, error: null });
    try {
      const res = await dayPlanApi.get(date);
      const parsedToday = parseISO(date);
      const tomorrowDateStr = format(addDays(parsedToday, 1), 'yyyy-MM-dd');
      const resTomorrow = await dayPlanApi.get(tomorrowDateStr);
      set({ plan: res.data, tomorrowPlan: resTomorrow.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch day schedule', loading: false });
    }
  },

  savePlan: async (date, timeBlocks, notes) => {
    set({ loading: true, error: null });
    try {
      const res = await dayPlanApi.upsert(date, timeBlocks, notes);
      set({ plan: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to save schedule', loading: false });
    }
  },

  saveTomorrowPlan: async (date, timeBlocks, notes) => {
    try {
      const res = await dayPlanApi.upsert(date, timeBlocks, notes);
      set({ tomorrowPlan: res.data });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to save tomorrow schedule' });
    }
  },

  copyPlan: async (date, sourceDate) => {
    set({ loading: true, error: null });
    try {
      const res = await dayPlanApi.copy(date, sourceDate);
      set({ plan: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to copy plan from yesterday', loading: false });
    }
  },
}));

// ----------------------------------------------------
// GOALS STORE
// ----------------------------------------------------
interface GoalsState {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  createGoal: (goal: Omit<Goal, '_id' | 'progress' | 'progressHistory'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  updateGoalProgress: (id: string, progress: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useGoalsStore = create<GoalsState>((set) => ({
  goals: [],
  loading: false,
  error: null,

  fetchGoals: async () => {
    set({ loading: true, error: null });
    try {
      const res = await goalsApi.getAll();
      set({ goals: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch goals', loading: false });
    }
  },

  createGoal: async (goal) => {
    set({ loading: true, error: null });
    try {
      const res = await goalsApi.create(goal);
      set((state) => ({ goals: [res.data, ...state.goals], loading: false }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to create goal', loading: false });
    }
  },

  updateGoal: async (id, goal) => {
    try {
      const res = await goalsApi.update(id, goal);
      set((state) => ({
        goals: state.goals.map((g) => (g._id === id ? res.data : g)),
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to update goal' });
    }
  },

  updateGoalProgress: async (id, progress) => {
    // Optimistically update goals list
    set((state) => ({
      goals: state.goals.map((g) => {
        if (g._id === id) {
          const todayStr = format(new Date(), 'yyyy-MM-dd');
          const exists = g.progressHistory.some((s) => s.date === todayStr);
          const newHistory = exists
            ? g.progressHistory.map((s) => (s.date === todayStr ? { ...s, progress } : s))
            : [...g.progressHistory, { date: todayStr, progress }];
          return {
            ...g,
            progress,
            status: progress === 100 ? 'completed' : g.status === 'completed' ? 'active' : g.status,
            progressHistory: newHistory,
          };
        }
        return g;
      }),
    }));

    try {
      const res = await goalsApi.updateProgress(id, progress);
      set((state) => ({
        goals: state.goals.map((g) => (g._id === id ? res.data : g)),
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to save progress update' });
      // Refetch all to sync back on error
      const res = await goalsApi.getAll();
      set({ goals: res.data });
    }
  },

  deleteGoal: async (id) => {
    try {
      await goalsApi.delete(id);
      set((state) => ({ goals: state.goals.filter((g) => g._id !== id) }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to delete goal' });
    }
  },
}));

// ----------------------------------------------------
// MEALS STORE
// ----------------------------------------------------
interface MealsState {
  meals: Meal[];
  loading: boolean;
  error: string | null;
  fetchMeals: (date: string) => Promise<void>;
  saveMeal: (
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    items: MealItem[]
  ) => Promise<void>;
  deleteMeal: (date: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => Promise<void>;
}

export const useMealsStore = create<MealsState>((set) => ({
  meals: [],
  loading: false,
  error: null,

  fetchMeals: async (date) => {
    set({ loading: true, error: null });
    try {
      const res = await mealsApi.get(date);
      set({ meals: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch meal log', loading: false });
    }
  },

  saveMeal: async (date, mealType, items) => {
    set({ loading: true, error: null });
    try {
      const res = await mealsApi.upsert(date, mealType, items);
      set({ meals: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to save meal', loading: false });
    }
  },

  deleteMeal: async (date, mealType) => {
    set({ loading: true, error: null });
    try {
      const res = await mealsApi.delete(date, mealType);
      set({ meals: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to clear meal', loading: false });
    }
  },
}));

// ----------------------------------------------------
// DAY REVIEWS STORE
// ----------------------------------------------------
interface ReviewsState {
  currentReview: DayReview | null;
  allReviews: DayReview[];
  loading: boolean;
  error: string | null;
  fetchReview: (date: string) => Promise<void>;
  fetchAllReviews: () => Promise<void>;
  saveReview: (date: string, reviewData: Partial<Omit<DayReview, '_id' | 'wordCount'>>) => Promise<void>;
}

export const useReviewsStore = create<ReviewsState>((set) => ({
  currentReview: null,
  allReviews: [],
  loading: false,
  error: null,

  fetchReview: async (date) => {
    set({ loading: true, error: null });
    try {
      const res = await reviewsApi.get(date);
      set({ currentReview: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch day review', loading: false });
    }
  },

  fetchAllReviews: async () => {
    set({ loading: true, error: null });
    try {
      const res = await reviewsApi.getAll();
      set({ allReviews: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch review history', loading: false });
    }
  },

  saveReview: async (date, reviewData) => {
    try {
      const res = await reviewsApi.patch(date, reviewData);
      set({ currentReview: res.data });
      // Update in allReviews list if it exists
      set((state) => {
        const index = state.allReviews.findIndex((r) => r.date === date);
        if (index > -1) {
          const updated = [...state.allReviews];
          updated[index] = res.data;
          return { allReviews: updated };
        } else {
          return { allReviews: [res.data, ...state.allReviews] };
        }
      });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to auto-save review' });
    }
  },
}));

// ----------------------------------------------------
// FOCUS TIMER STORE (With persistent timer alignment)
// ----------------------------------------------------
interface FocusState {
  timeLeft: number;
  duration: number;
  isRunning: boolean;
  mode: 'focus' | 'shortBreak' | 'longBreak' | 'custom';
  selectedTaskId: string | null;
  selectedGoalId: string | null;
  priorityLevel: 'low' | 'medium' | 'high' | null;
  targetEndTime: number | null;
  sessionStartTime: number | null;
  analytics: FocusAnalytics | null;
  achievements: Achievement[];
  loading: boolean;
  error: string | null;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setMode: (mode: 'focus' | 'shortBreak' | 'longBreak' | 'custom') => void;
  setCustomDuration: (seconds: number) => void;
  setSelectedTaskId: (id: string | null) => void;
  setSelectedGoalId: (id: string | null) => void;
  setPriorityLevel: (level: 'low' | 'medium' | 'high' | null) => void;
  tick: () => void;
  fetchAnalytics: (date: string) => Promise<void>;
  fetchAchievements: () => Promise<void>;
  saveFocusSession: (date: string, completed: boolean) => Promise<void>;
}

const getDurationByMode = (mode: 'focus' | 'shortBreak' | 'longBreak' | 'custom', currentDuration: number = 25 * 60) => {
  if (mode === 'focus') return 25 * 60;
  if (mode === 'shortBreak') return 5 * 60;
  if (mode === 'longBreak') return 15 * 60;
  return currentDuration;
};

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      timeLeft: 25 * 60,
      duration: 25 * 60,
      isRunning: false,
      mode: 'focus',
      selectedTaskId: null,
      selectedGoalId: null,
      priorityLevel: null,
      targetEndTime: null,
      sessionStartTime: null,
      analytics: null,
      achievements: [],
      loading: false,
      error: null,

      startTimer: () => {
        const { timeLeft, sessionStartTime } = get();
        set({
          isRunning: true,
          targetEndTime: Date.now() + timeLeft * 1000,
          sessionStartTime: sessionStartTime || Date.now(),
        });
      },

      pauseTimer: () => {
        const { targetEndTime } = get();
        if (targetEndTime) {
          const remaining = Math.max(0, Math.round((targetEndTime - Date.now()) / 1000));
          set({
            isRunning: false,
            timeLeft: remaining,
            targetEndTime: null,
          });
        } else {
          set({ isRunning: false });
        }
      },

      resetTimer: () => {
        const { mode, duration } = get();
        const dur = getDurationByMode(mode, duration);
        set({
          isRunning: false,
          timeLeft: dur,
          duration: dur,
          targetEndTime: null,
          sessionStartTime: null,
        });
      },

      setMode: (mode) => {
        const dur = getDurationByMode(mode, get().duration);
        set({
          mode,
          isRunning: false,
          timeLeft: dur,
          duration: dur,
          targetEndTime: null,
          sessionStartTime: null,
        });
      },

      setCustomDuration: (seconds) => {
        set({
          mode: 'custom',
          isRunning: false,
          timeLeft: seconds,
          duration: seconds,
          targetEndTime: null,
          sessionStartTime: null,
        });
      },

      setSelectedTaskId: (id) => set({ selectedTaskId: id }),
      setSelectedGoalId: (id) => set({ selectedGoalId: id }),
      setPriorityLevel: (level) => set({ priorityLevel: level }),

      tick: () => {
        const { isRunning, targetEndTime } = get();
        if (!isRunning || !targetEndTime) return;

        const remaining = Math.max(0, Math.round((targetEndTime - Date.now()) / 1000));
        if (remaining === 0) {
          set({
            isRunning: false,
            timeLeft: 0,
            targetEndTime: null,
          });
        } else {
          set({ timeLeft: remaining });
        }
      },

      fetchAnalytics: async (date) => {
        try {
          const res = await focusApi.getAnalytics(date);
          if (res.success && res.data) {
            set({ analytics: res.data });
          }
        } catch (err: any) {
          console.error('Failed to fetch focus analytics:', err);
        }
      },

      fetchAchievements: async () => {
        try {
          const res = await focusApi.getAchievements();
          if (res.success && res.data) {
            set({ achievements: res.data });
          }
        } catch (err: any) {
          console.error('Failed to fetch achievements:', err);
        }
      },

      saveFocusSession: async (date, completed) => {
        const { mode, duration, timeLeft, selectedTaskId, selectedGoalId, sessionStartTime } = get();
        const startTimestamp = sessionStartTime || (Date.now() - (duration - timeLeft) * 1000);
        const endTimestamp = Date.now();
        const actualDuration = Math.max(0, Math.round((endTimestamp - startTimestamp) / 1000));

        set({ loading: true, error: null });
        try {
          const res = await focusApi.completeSession({
            taskId: selectedTaskId,
            goalId: selectedGoalId,
            sessionType: mode,
            duration: completed ? duration : actualDuration,
            completed,
            startedAt: new Date(startTimestamp).toISOString(),
            endedAt: new Date(endTimestamp).toISOString(),
            date,
          });

          if (res.success && res.data) {
            const { dailyLog, goal, user } = res.data;

            // Sync with other Zustand stores instantly for real-time dashboard updates
            useDailyStore.setState({ dailyLog });
            useAuthStore.setState({ user });
            
            if (goal) {
              const currentGoals = useGoalsStore.getState().goals;
              useGoalsStore.setState({
                goals: currentGoals.map((g) => (g._id === goal._id ? goal : g)),
              });
            }

            // Reset selected states upon completion
            if (completed) {
              set({
                selectedTaskId: null,
                selectedGoalId: null,
                priorityLevel: null,
                sessionStartTime: null,
              });
            }

            // Sync statistics instantly
            await get().fetchAnalytics(date);
            await get().fetchAchievements();
          }
        } catch (err: any) {
          set({ error: err.response?.data?.error || 'Failed to save focus session' });
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'dailyos-focus',
      partialize: (state) => ({
        timeLeft: state.timeLeft,
        duration: state.duration,
        isRunning: state.isRunning,
        mode: state.mode,
        selectedTaskId: state.selectedTaskId,
        selectedGoalId: state.selectedGoalId,
        priorityLevel: state.priorityLevel,
        targetEndTime: state.targetEndTime,
        sessionStartTime: state.sessionStartTime,
      }),
    }
  )
);

// ----------------------------------------------------
// STICKY NOTES STORE (With debounced backend sync & auth subscribe)
// ----------------------------------------------------
interface StickyState {
  notes: StickyNote[];
  loading: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  addNote: () => Promise<void>;
  updateNote: (id: string, fields: Partial<Omit<StickyNote, '_id' | 'createdAt' | 'updatedAt'>>) => void;
  deleteNote: (id: string) => Promise<void>;
  setPosition: (id: string, x: number, y: number) => void;
  toggleMinimize: (id: string) => void;
  clearStore: () => void;
}

const pendingSyncs = new Map<string, any>();

const debounceSync = (id: string, syncFn: () => Promise<void>) => {
  if (pendingSyncs.has(id)) {
    clearTimeout(pendingSyncs.get(id));
  }
  const timeout = setTimeout(async () => {
    pendingSyncs.delete(id);
    try {
      await syncFn();
    } catch (err) {
      console.error(`Failed to sync note ${id}:`, err);
    }
  }, 800);
  pendingSyncs.set(id, timeout);
};

export const useStickyStore = create<StickyState>()(
  persist(
    (set, get) => ({
      notes: [],
      loading: false,
      error: null,

      fetchNotes: async () => {
        set({ loading: true, error: null });
        try {
          const res = await stickyNotesApi.getAll();
          set({ notes: res.data, loading: false });
        } catch (err: any) {
          set({ error: err.response?.data?.error || 'Failed to fetch sticky notes', loading: false });
        }
      },

      addNote: async () => {
        const tempId = `temp-${Date.now()}`;
        const newNote: StickyNote = {
          _id: tempId,
          title: 'Untitled Note',
          content: '',
          color: 'yellow',
          position: { x: 50, y: 50 },
          isMinimized: false,
        };

        // Instantly add to local state
        set((state) => ({ notes: [newNote, ...state.notes] }));

        try {
          const res = await stickyNotesApi.create({
            title: newNote.title,
            content: newNote.content,
            color: newNote.color,
            position: newNote.position,
            isMinimized: newNote.isMinimized,
          });

          if (res.success && res.data) {
            // Swap temporary ID with DB ID
            set((state) => ({
              notes: state.notes.map((n) => (n._id === tempId ? res.data : n)),
            }));
          }
        } catch (err: any) {
          set({ error: err.response?.data?.error || 'Failed to sync new note' });
        }
      },

      updateNote: (id, fields) => {
        // Optimistic update
        set((state) => ({
          notes: state.notes.map((n) => (n._id === id ? { ...n, ...fields } : n)),
        }));

        // If it's a temporary ID, we don't sync yet (creation request will save the latest state or subsequent updates will trigger)
        if (id.startsWith('temp-')) {
          return;
        }

        debounceSync(id, async () => {
          // Fetch current note state to sync the fields
          const currentNote = get().notes.find((n) => n._id === id);
          if (!currentNote) return;

          await stickyNotesApi.update(id, {
            title: currentNote.title,
            content: currentNote.content,
            color: currentNote.color,
            position: currentNote.position,
            isMinimized: currentNote.isMinimized,
          });
        });
      },

      deleteNote: async (id) => {
        // Clear any pending syncs
        if (pendingSyncs.has(id)) {
          clearTimeout(pendingSyncs.get(id));
          pendingSyncs.delete(id);
        }

        // Optimistic remove
        set((state) => ({ notes: state.notes.filter((n) => n._id !== id) }));

        if (id.startsWith('temp-')) {
          return;
        }

        try {
          await stickyNotesApi.delete(id);
        } catch (err: any) {
          set({ error: err.response?.data?.error || 'Failed to delete note' });
        }
      },

      setPosition: (id, x, y) => {
        get().updateNote(id, { position: { x, y } });
      },

      toggleMinimize: (id) => {
        const note = get().notes.find((n) => n._id === id);
        if (note) {
          get().updateNote(id, { isMinimized: !note.isMinimized });
        }
      },

      clearStore: () => {
        // Cancel all pending timeouts
        for (const timeout of pendingSyncs.values()) {
          clearTimeout(timeout);
        }
        pendingSyncs.clear();
        set({ notes: [], error: null, loading: false });
      },
    }),
    {
      name: 'dailyos-sticky-notes',
    }
  )
);

// Subscribe to auth state to wipe data upon logout
useAuthStore.subscribe((state) => {
  if (!state.isAuthenticated) {
    useStickyStore.getState().clearStore();
  }
});

// ----------------------------------------------------
// SKINCARE STORE
// ----------------------------------------------------
interface SkincareState {
  skincareLog: SkincareLog | null;
  skincareHistory: SkincareLog[];
  loading: boolean;
  error: string | null;
  fetchSkincareLog: (date: string) => Promise<void>;
  updateSkincareLog: (date: string, data: Partial<Omit<SkincareLog, '_id' | 'date'>>) => Promise<void>;
  fetchSkincareHistory: () => Promise<void>;
}

export const useSkincareStore = create<SkincareState>((set, get) => ({
  skincareLog: null,
  skincareHistory: [],
  loading: false,
  error: null,

  fetchSkincareLog: async (date) => {
    set({ loading: true, error: null });
    try {
      const res = await skincareApi.get(date);
      set({ skincareLog: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch skincare log', loading: false });
    }
  },

  updateSkincareLog: async (date, data) => {
    // Optimistic local state update to ensure UI response is fast
    const currentLog = get().skincareLog;
    if (currentLog && currentLog.date === date) {
      set({ skincareLog: { ...currentLog, ...data } });
    }

    try {
      const res = await skincareApi.update(date, data);
      set({ skincareLog: res.data, error: null });
      
      // Sync history if it exists
      const history = get().skincareHistory;
      if (history.length > 0) {
        const index = history.findIndex((h) => h.date === date);
        if (index > -1) {
          const updated = [...history];
          updated[index] = res.data;
          set({ skincareHistory: updated });
        }
      }
    } catch (err: any) {
      // Rollback to original if server request fails
      if (currentLog) {
        set({ skincareLog: currentLog });
      }
      set({ error: err.response?.data?.error || 'Failed to update skincare log' });
    }
  },

  fetchSkincareHistory: async () => {
    set({ error: null });
    try {
      const res = await skincareApi.getHistory();
      set({ skincareHistory: res.data });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch skincare history' });
    }
  },
}));

