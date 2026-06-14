import axios from 'axios';
import { useAuthStore } from '../store';
import {
  TaskTemplate,
  DailyLog,
  GymSession,
  DayPlan,
  Goal,
  Meal,
  DayReview,
  User,
  TimeBlock,
  GymExercise,
  MealItem,
  StickyNote,
  SkincareLog,
  FocusSession,
  FocusAnalytics,
  Achievement,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / invalidation (401 status)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().clearAuth();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Unified server response format
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      email,
      password,
    });
    return res.data;
  },
  register: async (name: string, email: string, password: string, confirmPassword: string) => {
    const res = await api.post<ApiResponse<null>>('/auth/register', {
      name,
      email,
      password,
      confirmPassword,
    });
    return res.data;
  },
  verifyOtp: async (email: string, otp: string, purpose: 'signup' | 'forgot_password' | 'google_login') => {
    const res = await api.post<ApiResponse<{ token?: string; user?: User; resetToken?: string }>>('/auth/verify-otp', {
      email,
      otp,
      purpose,
    });
    return res.data;
  },
  googleLogin: async (credential: string) => {
    const res = await api.post<{ success: boolean; pendingOtp?: boolean; email?: string; error?: string }>('/auth/google-login', {
      credential,
    });
    return res.data;
  },
  logout: async () => {
    const res = await api.post<ApiResponse<null>>('/auth/logout');
    return res.data;
  },
  forgotPassword: async (email: string) => {
    const res = await api.post<ApiResponse<null>>('/auth/forgot-password', {
      email,
    });
    return res.data;
  },
  resetPassword: async (email: string, password: string, resetToken: string) => {
    const res = await api.post<ApiResponse<null>>('/auth/reset-password', {
      email,
      password,
      resetToken,
    });
    return res.data;
  },
  me: async () => {
    const res = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return res.data;
  },
  refresh: async () => {
    const res = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/refresh');
    return res.data;
  },
};

export const dailyTasksApi = {
  getAll: async () => {
    const res = await api.get<ApiResponse<TaskTemplate[]>>('/daily-tasks');
    return res.data;
  },
  create: async (task: Omit<TaskTemplate, '_id'>) => {
    const res = await api.post<ApiResponse<TaskTemplate>>('/daily-tasks', task);
    return res.data;
  },
  update: async (id: string, task: Partial<Omit<TaskTemplate, '_id'>>) => {
    const res = await api.put<ApiResponse<TaskTemplate>>(`/daily-tasks/${id}`, task);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<{ id: string }>>(`/daily-tasks/${id}`);
    return res.data;
  },
};

export const dailyLogsApi = {
  get: async (date: string) => {
    const res = await api.get<ApiResponse<DailyLog>>(`/daily-logs/${date}`);
    return res.data;
  },
  addOneOff: async (date: string, task: { title: string; points: number; category: string }) => {
    const res = await api.post<ApiResponse<DailyLog>>(`/daily-logs/${date}`, task);
    return res.data;
  },
  toggleTask: async (date: string, logTaskId: string, completed: boolean) => {
    const res = await api.patch<ApiResponse<DailyLog>>(`/daily-logs/${date}`, {
      logTaskId,
      completed,
    });
    return res.data;
  },
  deleteTask: async (date: string, logTaskId: string) => {
    const res = await api.delete<ApiResponse<DailyLog>>(`/daily-logs/${date}/${logTaskId}`);
    return res.data;
  },
};

export const gymApi = {
  get: async (date: string) => {
    const res = await api.get<ApiResponse<GymSession | null>>(`/gym/${date}`);
    return res.data;
  },
  upsert: async (
    date: string,
    data: { exercises: GymExercise[]; durationMinutes: number; notes: string; photos?: string[] }
  ) => {
    const res = await api.put<ApiResponse<GymSession>>(`/gym/${date}`, data);
    return res.data;
  },
  delete: async (date: string) => {
    const res = await api.delete<ApiResponse<{ date: string }>>(`/gym/${date}`);
    return res.data;
  },
  list: async (startDate?: string, endDate?: string) => {
    const res = await api.get<ApiResponse<GymSession[]>>('/gym', {
      params: { startDate, endDate },
    });
    return res.data;
  },
};

export const dayPlanApi = {
  get: async (date: string) => {
    const res = await api.get<ApiResponse<DayPlan>>(`/day-plan/${date}`);
    return res.data;
  },
  upsert: async (date: string, timeBlocks?: TimeBlock[], notes?: string) => {
    const res = await api.put<ApiResponse<DayPlan>>(`/day-plan/${date}`, { timeBlocks, notes });
    return res.data;
  },
  copy: async (date: string, sourceDate: string) => {
    const res = await api.post<ApiResponse<DayPlan>>(`/day-plan/${date}/copy-from/${sourceDate}`);
    return res.data;
  },
};

export const goalsApi = {
  getAll: async () => {
    const res = await api.get<ApiResponse<Goal[]>>('/goals');
    return res.data;
  },
  create: async (goal: Omit<Goal, '_id' | 'progress' | 'progressHistory'>) => {
    const res = await api.post<ApiResponse<Goal>>('/goals', goal);
    return res.data;
  },
  update: async (id: string, goal: Partial<Goal>) => {
    const res = await api.put<ApiResponse<Goal>>(`/goals/${id}`, goal);
    return res.data;
  },
  updateProgress: async (id: string, progress: number) => {
    const res = await api.patch<ApiResponse<Goal>>(`/goals/${id}/progress`, { progress });
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<{ id: string }>>(`/goals/${id}`);
    return res.data;
  },
};

export const mealsApi = {
  get: async (date: string) => {
    const res = await api.get<ApiResponse<Meal[]>>(`/meals/${date}`);
    return res.data;
  },
  upsert: async (
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    items: MealItem[]
  ) => {
    const res = await api.put<ApiResponse<Meal[]>>(`/meals/${date}`, { mealType, items });
    return res.data;
  },
  delete: async (date: string, mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    const res = await api.delete<ApiResponse<Meal[]>>(`/meals/${date}/${mealType}`);
    return res.data;
  },
  list: async () => {
    const res = await api.get<ApiResponse<Meal[]>>('/meals');
    return res.data;
  },
};

export const reviewsApi = {
  getAll: async () => {
    const res = await api.get<ApiResponse<DayReview[]>>('/reviews');
    return res.data;
  },
  get: async (date: string) => {
    const res = await api.get<ApiResponse<DayReview | null>>(`/reviews/${date}`);
    return res.data;
  },
  patch: async (date: string, review: Partial<Omit<DayReview, '_id' | 'wordCount'>>) => {
    const res = await api.patch<ApiResponse<DayReview>>(`/reviews/${date}`, review);
    return res.data;
  },
};

export const analyticsApi = {
  getPoints: async (range: 7 | 14 | 30) => {
    const res = await api.get<ApiResponse<{ date: string; points: number }[]>>('/analytics/points', {
      params: { range },
    });
    return res.data;
  },
};

export const stickyNotesApi = {
  getAll: async () => {
    const res = await api.get<ApiResponse<StickyNote[]>>('/sticky-notes');
    return res.data;
  },
  create: async (note: Omit<StickyNote, '_id' | 'createdAt' | 'updatedAt'>) => {
    const res = await api.post<ApiResponse<StickyNote>>('/sticky-notes', note);
    return res.data;
  },
  update: async (id: string, note: Partial<Omit<StickyNote, '_id' | 'createdAt' | 'updatedAt'>>) => {
    const res = await api.put<ApiResponse<StickyNote>>(`/sticky-notes/${id}`, note);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete<ApiResponse<{ id: string }>>(`/sticky-notes/${id}`);
    return res.data;
  },
};

export const skincareApi = {
  get: async (date: string) => {
    const res = await api.get<ApiResponse<SkincareLog>>(`/skincare/${date}`);
    return res.data;
  },
  update: async (date: string, data: Partial<Omit<SkincareLog, '_id' | 'date'>>) => {
    const res = await api.put<ApiResponse<SkincareLog>>(`/skincare/${date}`, data);
    return res.data;
  },
  getHistory: async () => {
    const res = await api.get<ApiResponse<SkincareLog[]>>('/skincare/history');
    return res.data;
  },
};

export const focusApi = {
  completeSession: async (data: {
    taskId?: string | null;
    goalId?: string | null;
    sessionType: 'focus' | 'shortBreak' | 'longBreak' | 'custom';
    duration: number;
    completed: boolean;
    startedAt: string;
    endedAt: string;
    date: string;
  }) => {
    const res = await api.post<ApiResponse<{
      session: FocusSession;
      dailyLog: DailyLog;
      goal: Goal | null;
      user: User;
    }>>('/focus/session', data);
    return res.data;
  },
  getAnalytics: async (date?: string) => {
    const res = await api.get<ApiResponse<FocusAnalytics>>('/focus/analytics', {
      params: { date },
    });
    return res.data;
  },
  getAchievements: async () => {
    const res = await api.get<ApiResponse<Achievement[]>>('/focus/achievements');
    return res.data;
  },
};
