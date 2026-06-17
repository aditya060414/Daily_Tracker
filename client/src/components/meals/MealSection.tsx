import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Meal, MealItem } from "../../types";
import { useReferenceStore } from "../../store";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedFoodRef, setSelectedFoodRef] = useState<any | null>(null);
  const [showFullNutrition, setShowFullNutrition] = useState(false);
  const [macrosTouched, setMacrosTouched] = useState(false);

  const searchNutrition = useReferenceStore((state) => state.searchNutrition);
  const getNutritionById = useReferenceStore((state) => state.getNutritionById);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
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

  // Debounce the food item search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Query search suggestions from the reference store
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const fetchMatches = async () => {
      const matches = await searchNutrition(debouncedQuery);
      setSuggestions(matches.slice(0, 5));
    };
    fetchMatches();
  }, [debouncedQuery, searchNutrition]);

  const mealDoc = meals.find((m) => m.mealType === mealType);
  const items = mealDoc?.items || [];
  const totalCalories = mealDoc?.totalCalories || 0;

  const onSubmitMealItem = async (values: MealItemFormValues) => {
    const updatedItems = [...items, values];
    await saveMeal(selectedDate, mealType, updatedItems);
    setIsOpen(false);
    handleResetForm();
  };

  const handleResetForm = () => {
    setSearchQuery("");
    setSuggestions([]);
    setSelectedFoodRef(null);
    setShowFullNutrition(false);
    setMacrosTouched(false);
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
          className="p-3 bg-card border border-border rounded space-y-3 text-xs mb-3 animate-fade-in relative"
        >
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-4 space-y-1 relative">
              <label className="text-[8px] uppercase text-off-white-muted">
                Food Item
              </label>
              <input
                type="text"
                placeholder="e.g. Oats, Egg"
                autoComplete="off"
                className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-xs outline-none focus:border-accent"
                value={searchQuery}
                {...register("name", {
                  onChange: (e) => {
                    setSearchQuery(e.target.value);
                  }
                })}
              />
              {errors.name && (
                <p className="text-[8px] text-red-400">{errors.name.message}</p>
              )}

              {/* Suggestions Dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded shadow-xl z-50 overflow-hidden font-mono max-h-[180px] overflow-y-auto">
                  {suggestions.map((food) => (
                    <button
                      key={food._id}
                      type="button"
                      onClick={() => {
                        setSearchQuery(food.name);
                        setValue("name", food.name);
                        setSelectedFoodRef(food);
                        if (!macrosTouched) {
                          setValue("calories", food.calories);
                          setValue("protein", food.protein);
                          setValue("carbs", food.carbs);
                          setValue("fat", food.fat);
                        }
                        setSuggestions([]);
                      }}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-accent/10 border-b border-border/40 last:border-b-0 transition-colors flex justify-between items-center text-[10px]"
                    >
                      <span className="text-off-white font-bold truncate pr-2">{food.name}</span>
                      <span className="text-accent shrink-0">{food.calories} kcal</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[8px] uppercase text-off-white-muted">
                Calories
              </label>
              <input
                type="number"
                className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-xs outline-none focus:border-accent"
                {...register("calories", {
                  onChange: () => setMacrosTouched(true)
                })}
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[8px] uppercase text-off-white-muted">
                Protein (g)
              </label>
              <input
                type="number"
                className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-xs outline-none focus:border-accent"
                {...register("protein", {
                  onChange: () => setMacrosTouched(true)
                })}
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[8px] uppercase text-off-white-muted">
                Carbs (g)
              </label>
              <input
                type="number"
                className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-xs outline-none focus:border-accent"
                {...register("carbs", {
                  onChange: () => setMacrosTouched(true)
                })}
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[8px] uppercase text-off-white-muted">
                Fat (g)
              </label>
              <input
                type="number"
                className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-xs outline-none focus:border-accent"
                {...register("fat", {
                  onChange: () => setMacrosTouched(true)
                })}
              />
            </div>
          </div>

          {/* Core Macro Reference Summary Card */}
          {selectedFoodRef && (
            <div className="mt-2 p-2 bg-panel border border-border rounded flex flex-col gap-2.5 font-mono text-[10px]">
              <div className="flex justify-between items-center text-[9px] border-b border-border/50 pb-1.5">
                <span className="font-bold text-accent uppercase">Reference Macros</span>
                <span className="text-off-white-muted font-bold text-[8px]">Serving: {selectedFoodRef.servingSize || "100g"}</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center p-1.5 bg-darkbg rounded border border-border/60">
                <div>
                  <div className="text-off-white-muted text-[8px] uppercase">Calories</div>
                  <div className="font-bold text-accent">{selectedFoodRef.calories} kcal</div>
                </div>
                <div>
                  <div className="text-emerald-400 text-[8px] uppercase font-bold">Protein</div>
                  <div className="font-bold text-off-white">{selectedFoodRef.protein}g</div>
                </div>
                <div>
                  <div className="text-blue-400 text-[8px] uppercase font-bold">Carbs</div>
                  <div className="font-bold text-off-white">{selectedFoodRef.carbs}g</div>
                </div>
                <div>
                  <div className="text-amber-500 text-[8px] uppercase font-bold">Fat</div>
                  <div className="font-bold text-off-white">{selectedFoodRef.fat}g</div>
                </div>
              </div>

              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={async () => {
                    if (!selectedFoodRef.micronutrients && !showFullNutrition) {
                      // Fetch full detailed document
                      const fullItem = await getNutritionById(selectedFoodRef._id);
                      if (fullItem) {
                        setSelectedFoodRef(fullItem);
                      }
                    }
                    setShowFullNutrition(!showFullNutrition);
                  }}
                  className="w-fit text-accent hover:text-accent-dim uppercase font-bold text-[8px] tracking-wider transition-all flex items-center gap-0.5 cursor-pointer underline"
                >
                  {showFullNutrition ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  <span>{showFullNutrition ? "Hide all nutrition values" : "View all nutrition values"}</span>
                </button>

                {showFullNutrition && (
                  <div className="mt-2 pt-2 border-t border-border space-y-1 text-[8px] font-mono text-off-white-muted max-h-[100px] overflow-y-auto pr-1">
                    {selectedFoodRef.fiber !== undefined && (
                      <div className="flex justify-between"><span>Dietary Fiber:</span> <span className="text-off-white font-bold">{selectedFoodRef.fiber}g</span></div>
                    )}
                    {selectedFoodRef.sugar !== undefined && (
                      <div className="flex justify-between"><span>Sugars:</span> <span className="text-off-white font-bold">{selectedFoodRef.sugar}g</span></div>
                    )}
                    {selectedFoodRef.sodium !== undefined && (
                      <div className="flex justify-between"><span>Sodium:</span> <span className="text-off-white font-bold">{selectedFoodRef.sodium}g</span></div>
                    )}
                    {selectedFoodRef.micronutrients && Object.entries(selectedFoodRef.micronutrients).map(([key, val]) => {
                      if (Number(val) > 0) {
                        return (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key}:</span>
                            <span className="text-off-white font-bold">{val as any}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-1.5 justify-end pt-1">
            <button
              type="submit"
              className="px-3 py-1.5 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded font-bold uppercase text-[9px] tracking-wider transition-colors shadow-sm"
            >
              Confirm Add
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-1.5 border border-border rounded hover:bg-panel text-[9px] text-off-white-muted hover:text-off-white transition-colors"
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
