export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  googleId?: string;
  isVerified: boolean;
  loginMethod: 'email' | 'google';
  lastLogin?: string;
  username?: string; // For backward compatibility with existing views
  dailyFocusStreak: number;
  weeklyDeepWorkStreak: number;
  longestFocusStreak: number;
  lastFocusedDate?: string;
  totalFocusHours: number;
  achievements: string[];
}

export type CategoryType = 'health' | 'work' | 'learning' | 'personal' | (string & {});

export interface TaskTemplate {
  _id: string;
  title: string;
  isRepeating: boolean;
  points: number;
  category: CategoryType;
  createdAt?: string;
}

export interface LogTask {
  _id: string;
  taskId?: string;
  title: string;
  points: number;
  category: CategoryType;
  completed: boolean;
  completedAt?: string;
}

export interface DailyLog {
  _id: string;
  date: string;
  tasks: LogTask[];
  focusPoints: number;
  totalPoints: number;
  notes?: string;
  createdAt?: string;
}

export interface GymSet {
  weight?: number;
  reps?: number;
  feel?: string;
}

export interface GymExercise {
  _id?: string;
  name: string;
  sets: GymSet[];
  unit: 'kg' | 'lbs';
  notes?: string;
  gifUrl?: string;
  bodyPart?: string;
}

export interface GymSession {
  _id: string;
  date: string;
  exercises: GymExercise[];
  durationMinutes: number;
  notes?: string;
  photos?: string[];
  bodyWeight?: number;
  split?: string;
}


export type PlanCategoryType = 'work' | 'health' | 'learning' | 'personal' | 'rest' | (string & {});

export interface TimeBlock {
  _id?: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  label: string;
  category: PlanCategoryType;
  completed: boolean;
}

export interface DayPlan {
  _id: string;
  date: string;
  timeBlocks: TimeBlock[];
  notes?: string;
}

export interface Milestone {
  _id?: string;
  label: string;
  completed: boolean;
}

export interface ProgressSnapshot {
  date: string;
  progress: number;
}

export interface Goal {
  _id: string;
  title: string;
  description?: string;
  type: 'today' | 'short-term' | 'long-term';
  targetDate: string; // ISO String
  progress: number; // 0-100
  milestones: Milestone[];
  status: 'active' | 'completed' | 'paused';
  progressHistory: ProgressSnapshot[];
  createdAt?: string;
}

export interface MealItem {
  _id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  _id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: MealItem[];
  totalCalories: number;
}

export interface DayReview {
  _id: string;
  date: string;
  mood: number; // 1-5
  highlights: string;
  challenges: string;
  gratitude: string;
  tomorrowFocus: string;
  wordCount: number;
}

export interface StickyNote {
  _id: string;
  title: string;
  content: string;
  color: 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange' | 'teal' | 'gray' | 'dark';
  position: {
    x: number;
    y: number;
  };
  isMinimized: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SkincareRoutineItem {
  step: string;
  productName: string;
  completed: boolean;
}

export interface SkincareLog {
  _id: string;
  date: string;
  amRoutine: SkincareRoutineItem[];
  pmRoutine: SkincareRoutineItem[];
  skinRating: number;
  hydration: number;
  oiliness: number;
  acne: number;
  redness: boolean;
  notes: string;
}

export interface FocusSession {
  _id: string;
  userId: string;
  taskId?: string;
  goalId?: string;
  sessionType: 'focus' | 'shortBreak' | 'longBreak' | 'custom';
  duration: number; // in seconds
  completed: boolean;
  startedAt: string;
  endedAt: string;
  pointsEarned: number;
  createdAt?: string;
}

export interface FocusChartData {
  dailyFocusHours: { date: string; hours: number }[];
  weeklyFocusTrend: { week: string; hours: number }[];
  monthlyDeepWorkTrend: { month: string; hours: number }[];
}

export interface FocusAnalytics {
  todayFocusTime: number; // in seconds
  weeklyFocusTime: number; // in seconds
  monthlyFocusTime: number; // in seconds
  totalSessions: number;
  longestSession: number; // in seconds
  averageSessionLength: number; // in seconds
  charts: FocusChartData;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}
