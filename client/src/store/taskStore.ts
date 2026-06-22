import { create } from 'zustand';
import { ScheduledTask } from '../types';
import { schedulerApi } from '../api';

// ─── Store Interface ──────────────────────────────────────────────────────────

interface TaskStore {
  tasks: ScheduledTask[];
  isLoading: boolean;
  error: string | null;
  activeTagFilters: string[];
  searchQuery: string;

  fetchTasks: () => Promise<void>;
  createTask: (data: Omit<ScheduledTask, '_id' | 'urgencyGroup' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, data: Partial<Omit<ScheduledTask, '_id' | 'urgencyGroup' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  setTagFilter: (tag: string) => void;
  clearTagFilters: () => void;
  setSearchQuery: (q: string) => void;
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  isLoading: false,
  error: null,
  activeTagFilters: [],
  searchQuery: '',

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await schedulerApi.getAll();
      set({ tasks: res.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to fetch tasks', isLoading: false });
    }
  },

  createTask: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await schedulerApi.create(data);
      // Insert into existing sorted list, keeping deadline-asc order
      set((state) => {
        const newTask = res.data;
        const tasks = [...state.tasks, newTask].sort(
          (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        );
        return { tasks, isLoading: false };
      });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to create task', isLoading: false });
    }
  },

  updateTask: async (id, data) => {
    try {
      const res = await schedulerApi.update(id, data);
      set((state) => ({
        tasks: state.tasks
          .map((t) => (t._id === id ? res.data : t))
          .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()),
      }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to update task' });
    }
  },

  deleteTask: async (id) => {
    try {
      await schedulerApi.delete(id);
      set((state) => ({ tasks: state.tasks.filter((t) => t._id !== id) }));
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to delete task' });
    }
  },

  setTagFilter: (tag) =>
    set((state) => {
      const already = state.activeTagFilters.includes(tag);
      return {
        activeTagFilters: already
          ? state.activeTagFilters.filter((t) => t !== tag)
          : [...state.activeTagFilters, tag],
      };
    }),

  clearTagFilters: () => set({ activeTagFilters: [] }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}));
