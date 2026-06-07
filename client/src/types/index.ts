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
  totalPoints: number;
  notes?: string;
  createdAt?: string;
}

export interface GymExercise {
  _id?: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  unit: 'kg' | 'lbs';
  notes?: string;
}

export interface GymSession {
  _id: string;
  date: string;
  exercises: GymExercise[];
  durationMinutes: number;
  notes?: string;
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
