import React, { useEffect, useState } from "react";
import { Utensils, Sliders } from "lucide-react";
import { useMealsStore, useDateStore } from "../store";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { format, addDays, parseISO } from "date-fns";
import { mealsApi } from "../api";
import { Meal, MealItem } from "../types";

import { MealSection } from "../components/meals/MealSection";
import { MacroSummaryCard } from "../components/meals/MacroSummaryCard";
import { nativeAlert } from "../utils/dialog";

const FOOD_DATABASE = [
  { name: "Chicken Breast (Cooked)", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Chicken Breast (Raw)", calories: 120, protein: 22.5, carbs: 0, fat: 2.6 },
  { name: "Whole Eggs (Large)", calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { name: "Oats (Raw)", calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  { name: "White Rice (Cooked)", calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: "Brown Rice (Cooked)", calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
  { name: "Whey Protein", calories: 400, protein: 80, carbs: 6, fat: 6 },
  { name: "Peanut Butter", calories: 588, protein: 25, carbs: 20, fat: 50 },
  { name: "Paneer (Cottage Cheese)", calories: 265, protein: 18.3, carbs: 1.2, fat: 20.8 },
  { name: "Whole Milk", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  { name: "Almonds", calories: 579, protein: 21.1, carbs: 21.6, fat: 49.9 },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 },
  { name: "Apple", calories: 52, protein: 0.3, carbs: 13.8, fat: 0.2 },
  { name: "Boiled Potato", calories: 87, protein: 1.9, carbs: 20.1, fat: 0.1 },
];

export const Meals: React.FC = () => {
  const selectedDate = useDateStore((state) => state.selectedDate);

  // Zustand Store
  const { meals, loading, fetchMeals, saveMeal, deleteMeal } = useMealsStore();

  // Nutrition Calculator States
  const [selectedFoodIndex, setSelectedFoodIndex] = useState<string>("0");
  const [weight, setWeight] = useState<number>(100);
  const [customFoodName, setCustomFoodName] = useState<string>("");
  const [customCal, setCustomCal] = useState<number>(100);
  const [customProt, setCustomProt] = useState<number>(10);
  const [customCarbs, setCustomCarbs] = useState<number>(10);
  const [customFat, setCustomFat] = useState<number>(2);
  const [targetMealType, setTargetMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("breakfast");

  const baseFood = selectedFoodIndex === "custom"
    ? { name: customFoodName || "Custom Food", calories: customCal, protein: customProt, carbs: customCarbs, fat: customFat }
    : FOOD_DATABASE[Number(selectedFoodIndex)];

  const computedCalories = Math.round(((baseFood?.calories || 0) * weight) / 100);
  const computedProtein = Math.round((((baseFood?.protein || 0) * weight) / 100) * 10) / 10;
  const computedCarbs = Math.round((((baseFood?.carbs || 0) * weight) / 100) * 10) / 10;
  const computedFat = Math.round((((baseFood?.fat || 0) * weight) / 100) * 10) / 10;

  const handleLogToMeal = async () => {
    const mealDoc = meals.find((m) => m.mealType === targetMealType);
    const existingItems = mealDoc?.items || [];
    
    const newItem: MealItem = {
      name: selectedFoodIndex === "custom"
        ? `${customFoodName || "Custom Food"} (${weight}g)`
        : `${FOOD_DATABASE[Number(selectedFoodIndex)].name} (${weight}g)`,
      calories: computedCalories,
      protein: computedProtein,
      carbs: computedCarbs,
      fat: computedFat,
    };

    const updatedItems = [...existingItems, newItem];
    await saveMeal(selectedDate, targetMealType, updatedItems);
    nativeAlert(`Successfully logged ${newItem.name} to ${targetMealType}!`, "Meal Logged");
  };

  // Local State: Targets
  const [targets, setTargets] = useState(() => {
    const saved = localStorage.getItem("dailyos-nutrition-targets");
    return saved
      ? JSON.parse(saved)
      : { calories: 2000, protein: 140, carbs: 200, fat: 65 };
  });
  const [showSettings, setShowSettings] = useState(false);

  // History & Previous day states
  const [prevDayMeals, setPrevDayMeals] = useState<Meal[]>([]);
  const [historyMeals, setHistoryMeals] = useState<Meal[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Copy template helper
  const handleCopyMeals = async (sourceMeals: Meal[]) => {
    if (sourceMeals.length === 0) return;
    try {
      for (const meal of sourceMeals) {
        if (meal.items && meal.items.length > 0) {
          const cleanedItems = meal.items.map((item) => ({
            name: item.name,
            calories: Number(item.calories) || 0,
            protein: Number(item.protein) || 0,
            carbs: Number(item.carbs) || 0,
            fat: Number(item.fat) || 0,
          }));
          await saveMeal(selectedDate, meal.mealType, cleanedItems);
        }
      }
      fetchMeals(selectedDate);
    } catch (err) {
      console.error("Failed to copy meals:", err);
    }
  };

  const prevDateStr = format(addDays(parseISO(selectedDate), -1), "yyyy-MM-dd");

  // Load previous day's meals
  useEffect(() => {
    const fetchPrevDay = async () => {
      try {
        const res = await mealsApi.get(prevDateStr);
        if (res.success) {
          setPrevDayMeals(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch previous day meals:", err);
      }
    };
    fetchPrevDay();
  }, [selectedDate]);

  // Load meals on date change
  useEffect(() => {
    fetchMeals(selectedDate);
  }, [selectedDate, fetchMeals]);

  // Save updated targets to local storage
  const handleSaveTargets = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const updated = {
      calories: Number(data.get("targetCalories")) || 2000,
      protein: Number(data.get("targetProtein")) || 140,
      carbs: Number(data.get("targetCarbs")) || 200,
      fat: Number(data.get("targetFat")) || 65,
    };
    setTargets(updated);
    localStorage.setItem("dailyos-nutrition-targets", JSON.stringify(updated));
    setShowSettings(false);
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

  const caloriesPercent = targets.calories > 0 ? (totalCalories / targets.calories) * 100 : 0;

  if (loading && meals.length === 0) {
    return <LoadingSpinner message="Re-aligning calorie buffers..." />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 select-none animate-fade-in pb-8">
      {/* Target Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center bg-panel border border-border rounded-lg p-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Utensils className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">
              NUTRITION_MONITOR
            </h3>
            <p className="text-[10px] text-off-white-muted font-mono mt-0.5">
              Macro aggregates & targets
            </p>
          </div>
        </div>

        {/* Calorie bar */}
        <div className="flex-1 space-y-1">
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-off-white-muted uppercase">
              Daily Calorie Budget
            </span>
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
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">
                Calories (kcal)
              </label>
              <input
                type="number"
                name="targetCalories"
                defaultValue={targets.calories}
                className="w-full px-3 py-1.5 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">
                Protein (g)
              </label>
              <input
                type="number"
                name="targetProtein"
                defaultValue={targets.protein}
                className="w-full px-3 py-1.5 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">
                Carbs (g)
              </label>
              <input
                type="number"
                name="targetCarbs"
                defaultValue={targets.carbs}
                className="w-full px-3 py-1.5 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">
                Fat (g)
              </label>
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
        {(["breakfast", "lunch", "dinner", "snack"] as const).map((mealType) => (
          <MealSection
            key={mealType}
            mealType={mealType}
            selectedDate={selectedDate}
            meals={meals}
            saveMeal={saveMeal}
            deleteMeal={deleteMeal}
          />
        ))}
      </div>

      {/* Macro Summary Banner */}
      <MacroSummaryCard
        totalCalories={totalCalories}
        totalProtein={totalProtein}
        totalCarbs={totalCarbs}
        totalFat={totalFat}
        targets={targets}
      />

      {/* Bottom widgets grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Yesterday's Intake */}
        <div className="bg-panel border border-border rounded-lg p-5 flex flex-col min-h-[220px]">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">
                Yesterday's Intake
              </span>
              <span className="text-[10px] font-mono text-off-white-muted">
                ({format(addDays(parseISO(selectedDate), -1), "EEE, MMM d")})
              </span>
            </div>

            {prevDayMeals.some((m) => m.items && m.items.length > 0) && (
              <button
                onClick={() => handleCopyMeals(prevDayMeals)}
                className="text-[9px] font-mono text-accent hover:text-accent-dim flex items-center gap-1 border border-accent/20 hover:border-accent/40 px-2 py-0.5 rounded bg-accent/5 transition-all"
              >
                Copy to Today
              </button>
            )}
          </div>

          <div className="flex-grow space-y-3">
            {prevDayMeals.length === 0 || !prevDayMeals.some((m) => m.items && m.items.length > 0) ? (
              <div className="text-center py-12 text-[11px] font-mono text-off-white-muted flex-grow flex items-center justify-center">
                No items logged yesterday.
              </div>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {/* Yesterday's Macro Summary */}
                <div className="grid grid-cols-4 gap-2 p-2 bg-card border border-border rounded text-center text-[9px] font-mono">
                  <div>
                    <div className="text-off-white-muted text-[8px] uppercase">
                      Calories
                    </div>
                    <div className="font-bold text-accent">
                      {prevDayMeals.reduce((sum, m) => sum + m.totalCalories, 0)} kcal
                    </div>
                  </div>
                  <div>
                    <div className="text-emerald-400 text-[8px] uppercase">
                      Protein
                    </div>
                    <div className="font-bold text-off-white">
                      {prevDayMeals.reduce((sum, m) => sum + m.items.reduce((s, i) => s + (i.protein || 0), 0), 0)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-400 text-[8px] uppercase">
                      Carbs
                    </div>
                    <div className="font-bold text-off-white">
                      {prevDayMeals.reduce((sum, m) => sum + m.items.reduce((s, i) => s + (i.carbs || 0), 0), 0)}g
                    </div>
                  </div>
                  <div>
                    <div className="text-amber-500 text-[8px] uppercase">
                      Fat
                    </div>
                    <div className="font-bold text-off-white">
                      {prevDayMeals.reduce((sum, m) => sum + m.items.reduce((s, i) => s + (i.fat || 0), 0), 0)}g
                    </div>
                  </div>
                </div>

                {/* List of yesterday's meals */}
                <div className="space-y-2">
                  {prevDayMeals
                    .filter((m) => m.items && m.items.length > 0)
                    .map((meal) => (
                      <div
                        key={meal._id}
                        className="p-2 rounded bg-card/45 border border-border/80"
                      >
                        <div className="flex justify-between items-center text-[10px] font-mono border-b border-border/50 pb-1 mb-1.5">
                          <span className="font-bold uppercase text-off-white-muted">
                            {meal.mealType}
                          </span>
                          <span className="text-accent font-bold">
                            {meal.totalCalories} kcal
                          </span>
                        </div>
                        <div className="space-y-1">
                          {meal.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between text-[9px] font-mono"
                            >
                              <span className="text-off-white-muted truncate max-w-[150px]">
                                {item.name}
                              </span>
                              <span className="text-off-white/80">
                                {item.calories} kcal | P: {item.protein}g | C:{" "}
                                {item.carbs}g | F: {item.fat}g
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nutrition History */}
        <div className="bg-panel border border-border rounded-lg p-5 flex flex-col min-h-[220px]">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">
              Nutrition History Explorer
            </span>

            <button
              onClick={async () => {
                if (!showHistory) {
                  setLoadingHistory(true);
                  try {
                    const res = await mealsApi.list();
                    if (res.success) {
                      setHistoryMeals(res.data);
                    }
                  } catch (err) {
                    console.error("Failed to load meals history:", err);
                  } finally {
                    setLoadingHistory(false);
                  }
                }
                setShowHistory(!showHistory);
              }}
              className="text-[9px] font-mono text-off-white-muted hover:text-accent border border-border px-2 py-0.5 rounded bg-card/45 hover:border-accent/40 transition-all"
            >
              {showHistory ? "Hide History" : "Check History"}
            </button>
          </div>

          <div className="flex-grow flex flex-col">
            {!showHistory ? (
              <div className="text-center py-12 text-[11px] font-mono text-off-white-muted flex-grow flex flex-col items-center justify-center gap-2">
                <span>
                  Browse caloric history and copy past meals as templates.
                </span>
                <button
                  onClick={async () => {
                    setLoadingHistory(true);
                    try {
                      const res = await mealsApi.list();
                      if (res.success) {
                        setHistoryMeals(res.data);
                      }
                    } catch (err) {
                      console.error("Failed to load meals history:", err);
                    } finally {
                      setLoadingHistory(false);
                    }
                    setShowHistory(true);
                  }}
                  className="mt-2 text-[10px] font-mono font-bold text-accent border border-accent/30 bg-accent/5 hover:bg-accent hover:text-darkbg px-3 py-1.5 rounded transition-all uppercase"
                >
                  LOAD_HISTORY_EXPLORER
                </button>
              </div>
            ) : loadingHistory ? (
              <div className="flex-grow flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : historyMeals.length === 0 ? (
              <div className="text-center py-12 text-[11px] font-mono text-off-white-muted flex-grow flex items-center justify-center">
                No past nutrition logs found.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                {Object.entries(
                  historyMeals.reduce(
                    (acc, curr) => {
                      if (!acc[curr.date]) acc[curr.date] = [];
                      acc[curr.date].push(curr);
                      return acc;
                    },
                    {} as Record<string, Meal[]>,
                  ),
                )
                  .filter(([date]) => date !== selectedDate) // Exclude current date
                  .map(([date, dayMeals]) => (
                    <div
                      key={date}
                      className="p-2.5 rounded bg-card border border-border/80 font-mono text-xs"
                    >
                      <div className="flex justify-between items-center border-b border-border/60 pb-1.5 mb-2">
                        <span className="font-bold text-off-white">
                          {format(parseISO(date), "MMM dd, yyyy")}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-accent">
                            {dayMeals.reduce(
                              (sum, m) => sum + m.totalCalories,
                              0,
                            )}{" "}
                            kcal
                          </span>
                          <button
                            onClick={() => handleCopyMeals(dayMeals)}
                            className="text-[8px] bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white px-2 py-0.5 rounded font-extrabold uppercase transition-colors"
                          >
                            Copy Log
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {dayMeals
                          .filter((m) => m.items && m.items.length > 0)
                          .map((meal) => (
                            <div
                              key={meal._id}
                              className="text-[9px] text-off-white-muted flex justify-between"
                            >
                              <span className="uppercase font-bold">
                                {meal.mealType}:
                              </span>
                              <span>
                                {meal.items.map((i) => i.name).join(", ")}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Log Calculator */}
        <div className="bg-panel border border-border rounded-lg p-5 flex flex-col min-h-[220px]">
          <div className="flex items-center gap-2 border-b border-border pb-3 mb-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">
              Quick Macro Log Calculator
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs flex-grow flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[8px] uppercase tracking-wider text-off-white-muted block">
                  Select Food
                </label>
                <select
                  value={selectedFoodIndex}
                  onChange={(e) => setSelectedFoodIndex(e.target.value)}
                  className="w-full px-2 py-1.5 bg-darkbg border border-border rounded text-[10px] text-off-white outline-none focus:border-accent font-bold"
                >
                  {FOOD_DATABASE.map((food, idx) => (
                    <option key={idx} value={idx}>
                      {food.name} ({food.calories} kcal / 100g)
                    </option>
                  ))}
                  <option value="custom">-- CUSTOM_MACROS --</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] uppercase tracking-wider text-off-white-muted block">
                  Weight (g)
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1 bg-darkbg border border-border rounded text-xs text-off-white outline-none focus:border-accent font-bold"
                />
              </div>
            </div>

            {selectedFoodIndex === "custom" && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 bg-card border border-border rounded animate-fade-in">
                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label className="text-[8px] uppercase text-off-white-muted">
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Custom"
                    value={customFoodName}
                    onChange={(e) => setCustomFoodName(e.target.value)}
                    className="w-full px-1.5 py-0.5 bg-darkbg border border-border rounded text-[10px] text-off-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase text-off-white-muted">
                    Kcal
                  </label>
                  <input
                    type="number"
                    value={customCal}
                    onChange={(e) => setCustomCal(Number(e.target.value) || 0)}
                    className="w-full px-1.5 py-0.5 bg-darkbg border border-border rounded text-[10px] text-off-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase text-off-white-muted">
                    Prot
                  </label>
                  <input
                    type="number"
                    value={customProt}
                    onChange={(e) => setCustomProt(Number(e.target.value) || 0)}
                    className="w-full px-1.5 py-0.5 bg-darkbg border border-border rounded text-[10px] text-off-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase text-off-white-muted">
                    Carbs
                  </label>
                  <input
                    type="number"
                    value={customCarbs}
                    onChange={(e) => setCustomCarbs(Number(e.target.value) || 0)}
                    className="w-full px-1.5 py-0.5 bg-darkbg border border-border rounded text-[10px] text-off-white outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] uppercase text-off-white-muted">
                    Fat
                  </label>
                  <input
                    type="number"
                    value={customFat}
                    onChange={(e) => setCustomFat(Number(e.target.value) || 0)}
                    className="w-full px-1.5 py-0.5 bg-darkbg border border-border rounded text-[10px] text-off-white outline-none"
                  />
                </div>
              </div>
            )}

            {/* Computation Display Banner */}
            <div className="p-2.5 bg-card/65 border border-border/70 rounded grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
              <div>
                <div className="text-off-white-muted text-[8px] uppercase font-bold">
                  Calories
                </div>
                <div className="text-accent">{computedCalories} kcal</div>
              </div>
              <div>
                <div className="text-emerald-400 text-[8px] uppercase font-bold">
                  Protein
                </div>
                <div>{computedProtein}g</div>
              </div>
              <div>
                <div className="text-blue-400 text-[8px] uppercase font-bold">
                  Carbs
                </div>
                <div>{computedCarbs}g</div>
              </div>
              <div>
                <div className="text-amber-500 text-[8px] uppercase font-bold">
                  Fat
                </div>
                <div>{computedFat}g</div>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <span className="text-[8px] text-off-white-muted uppercase">
                Dest:
              </span>
              <select
                value={targetMealType}
                onChange={(e) => setTargetMealType(e.target.value as any)}
                className="px-2 py-1 bg-darkbg border border-border rounded text-[10px] text-off-white font-bold outline-none"
              >
                <option value="breakfast">BREAKFAST</option>
                <option value="lunch">LUNCH</option>
                <option value="dinner">DINNER</option>
                <option value="snack">SNACK</option>
              </select>

              <button
                onClick={handleLogToMeal}
                className="ml-auto px-4 py-1.5 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded font-bold uppercase text-[9px] tracking-wider transition-all"
              >
                Log to meals
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Meals;
