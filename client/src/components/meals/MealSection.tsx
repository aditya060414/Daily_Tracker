import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Meal, MealItem } from "../../types";

const mealItemSchema = z.object({
  name: z.string().min(1, "Food name is required"),
  calories: z.coerce.number().min(0, "Min 0 kcal"),
  protein: z.coerce.number().min(0, "Min 0g"),
  carbs: z.coerce.number().min(0, "Min 0g"),
  fat: z.coerce.number().min(0, "Min 0g"),
});

type MealItemFormValues = z.infer<typeof mealItemSchema>;

interface MealSectionProps {
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  selectedDate: string;
  meals: Meal[];
  saveMeal: (
    date: string,
    mealType: "breakfast" | "lunch" | "dinner" | "snack",
    items: MealItem[],
  ) => Promise<void>;
  deleteMeal: (
    date: string,
    mealType: "breakfast" | "lunch" | "dinner" | "snack",
  ) => Promise<void>;
}

export const MealSection: React.FC<MealSectionProps> = ({
  mealType,
  selectedDate,
  meals,
  saveMeal,
  deleteMeal,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MealItemFormValues>({
    resolver: zodResolver(mealItemSchema),
    defaultValues: {
      name: "",
      calories: 250,
      protein: 15,
      carbs: 30,
      fat: 5,
    },
  });

  const mealDoc = meals.find((m) => m.mealType === mealType);
  const items = mealDoc?.items || [];
  const totalCalories = mealDoc?.totalCalories || 0;

  const onSubmitMealItem = async (values: MealItemFormValues) => {
    const updatedItems = [...items, values];
    await saveMeal(selectedDate, mealType, updatedItems);
    setIsOpen(false);
    reset();
  };

  const handleDeleteItem = async (itemIndex: number) => {
    const updatedItems = items.filter((_, idx) => idx !== itemIndex);
    if (updatedItems.length === 0) {
      await deleteMeal(selectedDate, mealType);
    } else {
      await saveMeal(selectedDate, mealType, updatedItems);
    }
  };

  return (
    <div className="bg-panel border border-border rounded-lg p-5 flex flex-col min-h-[220px] font-mono">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-off-white">
            {mealType}
          </span>
          <span className="text-[9px] text-accent">
            {totalCalories} kcal
          </span>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[9px] text-off-white-muted hover:text-accent flex items-center gap-0.5 border border-border px-2 py-0.5 rounded bg-card/45 hover:border-accent/40"
        >
          <Plus className="w-3 h-3" /> Add Item
        </button>
      </div>

      {/* Inline Add Item Form inside meal card */}
      {isOpen && (
        <form
          onSubmit={handleSubmit(onSubmitMealItem)}
          className="p-3 bg-card border border-border rounded space-y-3 text-xs mb-3 animate-fade-in"
        >
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-4 space-y-1">
              <label className="text-[8px] uppercase text-off-white-muted">
                Food Item
              </label>
              <input
                type="text"
                placeholder="e.g. Oats, Egg"
                className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-xs outline-none focus:border-accent"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-[8px] text-red-400">{errors.name.message}</p>
              )}
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[8px] uppercase text-off-white-muted">
                Calories
              </label>
              <input
                type="number"
                className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-xs outline-none focus:border-accent"
                {...register("calories")}
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[8px] uppercase text-off-white-muted">
                Protein (g)
              </label>
              <input
                type="number"
                className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-xs outline-none focus:border-accent"
                {...register("protein")}
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[8px] uppercase text-off-white-muted">
                Carbs (g)
              </label>
              <input
                type="number"
                className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-xs outline-none focus:border-accent"
                {...register("carbs")}
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[8px] uppercase text-off-white-muted">
                Fat (g)
              </label>
              <input
                type="number"
                className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-xs outline-none focus:border-accent"
                {...register("fat")}
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
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 border border-border rounded hover:bg-panel text-[9px] text-off-white-muted hover:text-off-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Food items list */}
      <div className="flex-grow space-y-2 overflow-y-auto max-h-[220px] pr-1">
        {items.length === 0 ? (
          <div className="text-center py-8 text-[11px] text-off-white-muted flex-grow flex items-center justify-center">
            No items logged.
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item._id || idx}
              className="flex items-center justify-between p-2 rounded bg-card border border-border hover:border-accent/30 transition-colors animate-item-log"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-off-white truncate">
                  {item.name}
                </span>
                <span className="text-[9px] text-off-white-muted mt-0.5">
                  P: <span className="text-off-white">{item.protein}g</span> |
                  C: <span className="text-off-white">{item.carbs}g</span> | F:{" "}
                  <span className="text-off-white">{item.fat}g</span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-accent">
                  {item.calories} kcal
                </span>
                <button
                  onClick={() => handleDeleteItem(idx)}
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
  );
};
export default MealSection;
