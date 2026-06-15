import React from 'react';

interface MacroSummaryCardProps {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export const MacroSummaryCard: React.FC<MacroSummaryCardProps> = ({
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  targets
}) => {
  const caloriesPercent = targets.calories > 0 ? (totalCalories / targets.calories) * 100 : 0;
  const proteinPercent = targets.protein > 0 ? (totalProtein / targets.protein) * 100 : 0;
  const carbsPercent = targets.carbs > 0 ? (totalCarbs / targets.carbs) * 100 : 0;
  const fatPercent = targets.fat > 0 ? (totalFat / targets.fat) * 100 : 0;

  return (
    <div className="bg-panel border border-border rounded-lg p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center font-mono">
      {/* Calorie Macro box */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-off-white-muted uppercase font-bold">
            Macro Summary
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

      {/* Protein Macro box */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-emerald-400 uppercase font-bold">
            Protein
          </span>
          <span className="font-bold text-off-white">
            {totalProtein} / {targets.protein}g
          </span>
        </div>
        <div className="w-full h-2 bg-darkbg border border-border rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${Math.min(proteinPercent, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Carbs Macro box */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-blue-400 uppercase font-bold">Carbs</span>
          <span className="font-bold text-off-white">
            {totalCarbs} / {targets.carbs}g
          </span>
        </div>
        <div className="w-full h-2 bg-darkbg border border-border rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-400 transition-all duration-500"
            style={{ width: `${Math.min(carbsPercent, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Fat Macro box */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-amber-500 uppercase font-bold">Fat</span>
          <span className="font-bold text-off-white">
            {totalFat} / {targets.fat}g
          </span>
        </div>
        <div className="w-full h-2 bg-darkbg border border-border rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${Math.min(fatPercent, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
export default MacroSummaryCard;
