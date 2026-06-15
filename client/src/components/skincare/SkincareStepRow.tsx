import React from 'react';
import { Trash2, CheckCircle } from 'lucide-react';

interface SkincareItem {
  step: string;
  productName?: string;
  completed: boolean;
}

interface SkincareStepRowProps {
  item: SkincareItem;
  index: number;
  type: 'am' | 'pm';
  onToggle: (index: number) => void;
  onUpdateProduct: (index: number, productName: string) => void;
  onRemove: (index: number) => void;
}

export const SkincareStepRow: React.FC<SkincareStepRowProps> = ({
  item,
  index,
  type,
  onToggle,
  onUpdateProduct,
  onRemove
}) => {
  const isAM = type === 'am';
  const colorClass = isAM ? 'amber' : 'indigo';

  return (
    <div
      className={`flex items-center justify-between p-2.5 border rounded transition-all duration-150 font-mono text-xs ${
        item.completed
          ? `bg-${colorClass}-500/5 border-${colorClass}-500/10 text-off-white-muted line-through opacity-70`
          : `bg-card border-border hover:border-${colorClass}-500/20`
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={() => onToggle(index)}
          className="focus:outline-none transition-transform active:scale-90"
        >
          {item.completed ? (
            <div className={`w-4 h-4 rounded bg-${colorClass}-500 text-darkbg flex items-center justify-center border border-${colorClass}-500 animate-pop`}>
              <CheckCircle className="w-3 h-3 stroke-[3]" />
            </div>
          ) : (
            <div className={`w-4 h-4 rounded bg-darkbg border border-border hover:border-${colorClass}-500/50 flex items-center justify-center text-transparent hover:text-${colorClass}-500 transition-colors`}>
              <CheckCircle className="w-3 h-3" />
            </div>
          )}
        </button>

        <div className="flex flex-col min-w-0 leading-tight">
          <span className="font-bold text-off-white">{item.step}</span>
          <input
            type="text"
            value={item.productName || ''}
            placeholder="No product specified..."
            onChange={(e) => onUpdateProduct(index, e.target.value)}
            className={`bg-transparent text-[10px] text-off-white-muted outline-none border-none p-0 mt-0.5 hover:text-off-white focus:text-${colorClass}-400 focus:underline tracking-tight truncate w-full`}
            title="Click to edit product name (auto-saved)"
          />
        </div>
      </div>

      <button
        onClick={() => onRemove(index)}
        className="p-1 text-off-white-muted hover:text-red-400 transition-colors rounded shrink-0 ml-2"
        title="Remove step"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
export default SkincareStepRow;
