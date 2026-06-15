import React from 'react';
import { Trash2 } from 'lucide-react';
import { GymExercise } from '../../types';

interface ExerciseCardProps {
  ex: GymExercise;
  index: number;
  onRemove: (index: number) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ ex, index, onRemove }) => {
  return (
    <div className="flex flex-col px-4 py-3 hover:bg-card/20 transition-colors animate-item-log font-mono">
      <div className="grid grid-cols-12 gap-2 items-center">
        <div className="col-span-5 flex flex-col">
          <span className="text-xs font-bold text-off-white">{ex.name}</span>
          {ex.notes && <span className="text-[9px] text-off-white-muted mt-0.5">{ex.notes}</span>}
        </div>
        
        <div className="col-span-3 text-center text-[10px] sm:text-xs text-off-white">
          {ex.sets} &times; {ex.reps}
        </div>

        <div className="col-span-3 text-right text-[10px] sm:text-xs text-accent">
          {ex.weight} <span className="text-[8px] sm:text-[9px] text-off-white-muted uppercase">{ex.unit}</span>
        </div>

        <div className="col-span-1 text-right">
          <button
            onClick={() => onRemove(index)}
            className="p-1 text-off-white-muted hover:text-red-400 transition-colors rounded"
            title="Remove Exercise"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ExerciseCard;
