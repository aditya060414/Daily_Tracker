import { create } from 'zustand';
import { referenceApi } from '../api';

interface ReferenceState {
  nutritionCache: Record<string, any[]>;
  exerciseCache: Record<string, Record<string, any[]>>;
  loading: boolean;
  error: string | null;
  searchNutrition: (query: string, full?: boolean) => Promise<any[]>;
  getNutritionById: (id: string) => Promise<any>;
  searchExercises: (bodyPart: string) => Promise<Record<string, any[]>>;
  clearCache: () => void;
}

export const useReferenceStore = create<ReferenceState>((set, get) => ({
  nutritionCache: {},
  exerciseCache: {},
  loading: false,
  error: null,

  searchNutrition: async (query: string, full?: boolean) => {
    const q = query.trim().toLowerCase();
    const cacheKey = `${q}:${full ? 'full' : 'core'}`;
    const cache = get().nutritionCache;

    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    set({ loading: true, error: null });
    try {
      const res = await referenceApi.searchNutrition(query, full);
      if (res.success) {
        set((state) => ({
          nutritionCache: { ...state.nutritionCache, [cacheKey]: res.data },
          loading: false,
        }));
        return res.data;
      }
      set({ loading: false });
      return [];
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to search nutrition', loading: false });
      return [];
    }
  },

  getNutritionById: async (id: string) => {
    try {
      const res = await referenceApi.getNutritionById(id);
      if (res.success) {
        return res.data;
      }
      return null;
    } catch (err: any) {
      console.error('Failed to get food detail:', err);
      return null;
    }
  },

  searchExercises: async (bodyPart: string) => {
    const bp = bodyPart.trim().toLowerCase();
    const cache = get().exerciseCache;

    if (cache[bp]) {
      return cache[bp];
    }

    set({ loading: true, error: null });
    try {
      const res = await referenceApi.searchExercises(bodyPart);
      if (res.success) {
        set((state) => ({
          exerciseCache: { ...state.exerciseCache, [bp]: res.data },
          loading: false,
        }));
        return res.data;
      }
      set({ loading: false });
      return {};
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Failed to search exercises', loading: false });
      return {};
    }
  },

  clearCache: () => set({ nutritionCache: {}, exerciseCache: {}, error: null, loading: false }),
}));
