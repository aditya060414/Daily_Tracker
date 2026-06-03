import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Utensils,
  Plus,
  Trash2,
  Sliders,
} from 'lucide-react';
import { useMealsStore, useDateStore } from '../store';
import { LoadingSpinner } from '../components/LoadingSpinner';

const mealItemSchema = z.object({
  name: z.string().min(1, 'Food name is required'),
  calories: z.coerce.number().min(0, 'Min 0 kcal'),
  protein: z.coerce.number().min(0, 'Min 0g'),
  carbs: z.coerce.number().min(0, 'Min 0g'),
  fat: z.coerce.number().min(0, 'Min 0g'),
});

type MealItemFormValues = z.infer<typeof mealItemSchema>;

export const Meals: React.FC = () => {
  const selectedDate = useDateStore((state) => state.selectedDate);

  // Zustand Store
  const { meals, loading, fetchMeals, saveMeal, deleteMeal } = useMealsStore();

  // Local State: Targets
  const [targets, setTargets] = useState(() => {
    const saved = localStorage.getItem('dailyos-nutrition-targets');
    return saved
      ? JSON.parse(saved)
      : { calories: 2000, protein: 140, carbs: 200, fat: 65 };
  });
  const [showSettings, setShowSettings] = useState(false);
  const [activeMealForm, setActiveMealForm] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MealItemFormValues>({
    resolver: zodResolver(mealItemSchema),
    defaultValues: {
      name: '',
      calories: 250,
      protein: 15,
      carbs: 30,
      fat: 5,
    },
  });

  // Load meals on date change
  useEffect(() => {
    fetchMeals(selectedDate);
  }, [selectedDate, fetchMeals]);

  // Submit adding item
  const onSubmitMealItem = async (values: MealItemFormValues) => {
    if (!activeMealForm) return;

    // Find existing meal items
    const mealDoc = meals.find((m) => m.mealType === activeMealForm);
    const existingItems = mealDoc?.items || [];
    const updatedItems = [...existingItems, values];

    await saveMeal(selectedDate, activeMealForm, updatedItems);
    setActiveMealForm(null);
    reset();
  };

  // Delete item from a meal
  const handleDeleteItem = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', itemIndex: number) => {
    const mealDoc = meals.find((m) => m.mealType === mealType);
    if (!mealDoc) return;

    const updatedItems = mealDoc.items.filter((_, idx) => idx !== itemIndex);
    
    if (updatedItems.length === 0) {
      await deleteMeal(selectedDate, mealType);
    } else {
      await saveMeal(selectedDate, mealType, updatedItems);
    }
  };

  // Save updated targets to local storage
  const handleSaveTargets = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const updated = {
      calories: Number(data.get('targetCalories')) || 2000,
      protein: Number(data.get('targetProtein')) || 140,
      carbs: Number(data.get('targetCarbs')) || 200,
      fat: Number(data.get('targetFat')) || 65,
    };
    setTargets(updated);
    localStorage.setItem('dailyos-nutrition-targets', JSON.stringify(updated));
    setShowSettings(false);
  };

  // Computations
  const getMealSubtotal = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    const mealDoc = meals.find((m) => m.mealType === mealType);
    return mealDoc?.totalCalories || 0;
  };

  const getMealItems = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    const mealDoc = meals.find((m) => m.mealType === mealType);
    return mealDoc?.items || [];
  };

  // Day macro totals
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  meals.forEach((meal) => {
    totalCalories += meal.totalCalories;
    meal.items.forEach((item) => {
      totalProtein += item.protein || 0;
      totalCarbs += item.carbs || 0;
      totalFat += item.fat || 0;
    });
  });

  const caloriesPercent = (totalCalories / targets.calories) * 100;
  const proteinPercent = (totalProtein / targets.protein) * 100;
  const carbsPercent = (totalCarbs / targets.carbs) * 100;
  const fatPercent = (totalFat / targets.fat) * 100;

  if (loading && meals.length === 0) {
    return <LoadingSpinner message="Re-aligning calorie buffers..." />;
  }

  return (
    <div className="p-6 space-y-6 select-none animate-fade-in pb-32 md:pb-36">
      {/* Target Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-panel border border-border rounded-lg p-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Utensils className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">NUTRITION_MONITOR</h3>
            <p className="text-[10px] text-off-white-muted font-mono mt-0.5">Macro aggregates & targets</p>
          </div>
        </div>

        {/* Calorie bar */}
        <div className="flex-1 space-y-1">
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-off-white-muted uppercase">Daily Calorie Budget</span>
            <span className="font-bold text-accent">
              {totalCalories} / {targets.calories} kcal
            </span>
          </div>
          <div className="w-full h-2 bg-darkbg border border-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${Math.min(caloriesPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Edit Targets Trigger */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="md:justify-self-end px-3 py-1.5 border border-border hover:border-accent/40 rounded text-xs font-mono font-bold text-off-white-muted hover:text-off-white transition-colors flex items-center gap-1.5"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>ADJUST_TARGETS</span>
        </button>
      </div>

      {/* Adjust Targets Drawer */}
      {showSettings && (
        <form
          onSubmit={handleSaveTargets}
          className="p-5 bg-panel border border-border rounded-lg space-y-4 font-mono text-xs max-w-xl animate-fade-in"
        >
          <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-wider text-[10px] border-b border-border pb-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>Configure Nutritional Targets</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Calories (kcal)</label>
              <input
                type="number"
                name="targetCalories"
                defaultValue={targets.calories}
                className="w-full px-3 py-1.5 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Protein (g)</label>
              <input
                type="number"
                name="targetProtein"
                defaultValue={targets.protein}
                className="w-full px-3 py-1.5 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Carbs (g)</label>
              <input
                type="number"
                name="targetCarbs"
                defaultValue={targets.carbs}
                className="w-full px-3 py-1.5 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Fat (g)</label>
              <input
                type="number"
                name="targetFat"
                defaultValue={targets.fat}
                className="w-full px-3 py-1.5 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded font-bold uppercase tracking-wider transition-colors"
            >
              Save Targets
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="px-4 py-1.5 border border-border rounded hover:bg-card transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* 2X2 MEALS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealType) => (
          <div key={mealType} className="bg-panel border border-border rounded-lg p-5 flex flex-col min-h-[220px]">
            {/* Section Header */}
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">
                  {mealType}
                </span>
                <span className="text-[9px] font-mono text-accent">
                  {getMealSubtotal(mealType)} kcal
                </span>
              </div>
              
              <button
                onClick={() => setActiveMealForm(activeMealForm === mealType ? null : mealType)}
                className="text-[9px] font-mono text-off-white-muted hover:text-accent flex items-center gap-0.5 border border-border px-2 py-0.5 rounded bg-card/45 hover:border-accent/40"
              >
                <Plus className="w-3 h-3" /> Add Item
              </button>
            </div>

            {/* Inline Add Item Form inside meal card */}
            {activeMealForm === mealType && (
              <form
                onSubmit={handleSubmit(onSubmitMealItem)}
                className="p-3 bg-card border border-border rounded space-y-3 font-mono text-xs mb-3 animate-fade-in"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[8px] uppercase text-off-white-muted">Food Item</label>
                    <input
                      type="text"
                      placeholder="e.g. Oats, Egg"
                      className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-xs outline-none focus:border-accent"
                      {...register('name')}
                    />
                    {errors.name && <p className="text-[8px] text-red-400">{errors.name.message}</p>}
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[8px] uppercase text-off-white-muted">Calories</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-xs outline-none focus:border-accent"
                      {...register('calories')}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[8px] uppercase text-off-white-muted">Protein (g)</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-xs outline-none focus:border-accent"
                      {...register('protein')}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[8px] uppercase text-off-white-muted">Carbs (g)</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-xs outline-none focus:border-accent"
                      {...register('carbs')}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[8px] uppercase text-off-white-muted">Fat (g)</label>
                    <input
                      type="number"
                      className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-xs outline-none focus:border-accent"
                      {...register('fat')}
                    />
                  </div>
                </div>
                <div className="flex gap-1.5 justify-end">
                  <button
                    type="submit"
                    className="px-3 py-1 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded font-bold uppercase text-[9px] transition-colors"
                  >
                    Confirm Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMealForm(null)}
                    className="px-3 py-1 border border-border rounded hover:bg-panel text-[9px] text-off-white-muted hover:text-off-white"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Food items list */}
            <div className="flex-grow space-y-2 overflow-y-auto max-h-[220px] pr-1">
              {getMealItems(mealType).length === 0 ? (
                <div className="text-center py-8 text-[11px] font-mono text-off-white-muted flex-grow flex items-center justify-center">
                  No items logged.
                </div>
              ) : (
                getMealItems(mealType).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded bg-card border border-border hover:border-accent/30 transition-colors"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-off-white truncate">{item.name}</span>
                      <span className="text-[9px] font-mono text-off-white-muted mt-0.5">
                        P: <span className="text-off-white">{item.protein}g</span> | C:{' '}
                        <span className="text-off-white">{item.carbs}g</span> | F:{' '}
                        <span className="text-off-white">{item.fat}g</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-accent">{item.calories} kcal</span>
                      <button
                        onClick={() => handleDeleteItem(mealType, idx)}
                        className="p-1 text-off-white-muted hover:text-red-400 transition-colors rounded"
                        title="Remove food item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* STICKY TOTALS BAR AT BOTTOM */}
      <div className="fixed bottom-[44px] md:bottom-0 left-0 md:left-56 right-0 bg-panel/95 border-t border-border px-6 py-4 backdrop-blur shadow-2xl flex flex-wrap gap-4 items-center justify-between z-30 select-none font-mono text-[10px]">
        {/* Calorie Macro box */}
        <div className="flex items-center gap-4 flex-1 min-w-[200px]">
          <div className="flex flex-col">
            <span className="uppercase text-off-white-muted">Macro Summary</span>
            <span className="text-xs font-bold text-off-white mt-0.5">
              {totalCalories} kcal <span className="text-off-white-muted">/ {targets.calories}</span>
            </span>
          </div>
          <div className="flex-grow h-1.5 bg-darkbg border border-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${Math.min(caloriesPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Protein Macro box */}
        <div className="flex items-center gap-4 flex-1 min-w-[150px]">
          <div className="flex flex-col">
            <span className="uppercase text-emerald-400">Protein</span>
            <span className="text-xs font-bold text-off-white mt-0.5">
              {totalProtein}g <span className="text-off-white-muted">/ {targets.protein}g</span>
            </span>
          </div>
          <div className="flex-grow h-1.5 bg-darkbg border border-border rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${Math.min(proteinPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Carbs Macro box */}
        <div className="flex items-center gap-4 flex-1 min-w-[150px]">
          <div className="flex flex-col">
            <span className="uppercase text-blue-400">Carbs</span>
            <span className="text-xs font-bold text-off-white mt-0.5">
              {totalCarbs}g <span className="text-off-white-muted">/ {targets.carbs}g</span>
            </span>
          </div>
          <div className="flex-grow h-1.5 bg-darkbg border border-border rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-400 transition-all duration-300"
              style={{ width: `${Math.min(carbsPercent, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Fat Macro box */}
        <div className="flex items-center gap-4 flex-1 min-w-[150px]">
          <div className="flex flex-col">
            <span className="uppercase text-amber-500">Fat</span>
            <span className="text-xs font-bold text-off-white mt-0.5">
              {totalFat}g <span className="text-off-white-muted">/ {targets.fat}g</span>
            </span>
          </div>
          <div className="flex-grow h-1.5 bg-darkbg border border-border rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${Math.min(fatPercent, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Meals;
