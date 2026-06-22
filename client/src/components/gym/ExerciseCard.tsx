import React, { useState, useEffect } from 'react';
import { Trash2, Plus, HelpCircle } from 'lucide-react';
import { GymExercise, GymSet } from '../../types';

interface ExerciseCardProps {
  ex: GymExercise;
  index: number;
  onRemove: (index: number) => void;
  onUpdateSet: (exerciseIdx: number, setIdx: number, fields: Partial<GymSet>) => void;
  onAddSet: (exerciseIdx: number) => void;
  onRemoveSet: (exerciseIdx: number, setIdx: number) => void;
  onUpdateNotes: (exerciseIdx: number, notes: string) => void;
}

const COMMON_FEELS = ['Light', 'Heavy', 'Failure'];


export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  ex,
  index,
  onRemove,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onUpdateNotes,
}) => {
  const [showGif, setShowGif] = useState(true);
  const [customFeelIndex, setCustomFeelIndex] = useState<number | null>(null);
  const [customFeelValue, setCustomFeelValue] = useState('');
  // Holds description to show when a feel option is clicked
  const [activeFeelDesc, setActiveFeelDesc] = useState('');
  // Close description when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement && e.target.closest('.help-circle'))) {
        setActiveFeelDesc('');
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <div className="bg-card border border-border/80 rounded-lg p-4 font-mono space-y-4 transition-all duration-200 hover:border-accent/30">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-off-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
            {ex.name}
          </span>
          {ex.bodyPart && (
            <span className="text-[9px] uppercase tracking-wider text-off-white-muted mt-0.5">
              Category: {ex.bodyPart} {ex.unit ? `(${ex.unit.toUpperCase()})` : ''}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {ex.gifUrl && (
            <button
              type="button"
              onClick={() => setShowGif(!showGif)}
              className="text-[9px] border border-border px-2 py-1 rounded bg-darkbg/40 text-off-white-muted hover:text-accent hover:border-accent/40 transition-colors"
            >
              {showGif ? 'HIDE_GUIDE_GIF' : 'SHOW_GUIDE_GIF'}
            </button>
          )}

          <button
            onClick={() => onRemove(index)}
            className="p-1 text-off-white-muted hover:text-red-400 border border-transparent hover:border-red-500/25 rounded bg-darkbg/20 transition-all"
            title="Remove Exercise"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Guide GIF Reference */}
      {ex.gifUrl && showGif && (
        <div className="relative border border-border/40 rounded overflow-hidden max-w-xs bg-darkbg/50 aspect-video flex items-center justify-center animate-fade-in group">
          {/* Note: In local dev, standard relative URL resolves to Express. Served from server */}
          <img
            src={ex.gifUrl.startsWith('http') ? ex.gifUrl : `${window.location.origin.replace(':5173', ':5000')}${ex.gifUrl}`}
            alt={`${ex.name} instruction guide`}
            className="h-full object-contain mix-blend-lighten"
            onError={(e) => {
              // Fallback to avoid broken images if the port mapping fails
              e.currentTarget.src = ex.gifUrl || '';
            }}
          />
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/75 rounded text-[8px] text-accent font-bold uppercase tracking-wider border border-accent/20">
            Reference Guide
          </div>
        </div>
      )}

      {/* Sets Repeatable Table */}
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 text-[9px] uppercase font-bold text-off-white-muted border-b border-border/40 pb-1">
          <div className="col-span-1 text-center">Set</div>
          <div className="col-span-3">Weight ({ex.unit})</div>
          <div className="col-span-3">Reps</div>
          <div className="col-span-2 text-right">Volume</div>
          <div className="col-span-3 text-center">Feel</div>
        </div>

        <div className="space-y-2">
          {ex.sets.map((set, sIdx) => {
            const hasWeight = set.weight !== undefined && set.weight !== null && !isNaN(set.weight);
            const hasReps = set.reps !== undefined && set.reps !== null && !isNaN(set.reps);
            const volume = hasWeight && hasReps ? Math.round(set.weight! * set.reps!) : null;

            const isCustomFeelActive = set.feel && !COMMON_FEELS.includes(set.feel);

            return (
              <div key={sIdx} className="grid grid-cols-12 gap-2 items-center text-xs animate-fade-in">
                {/* Set # */}
                <div className="col-span-1 text-center font-bold text-off-white-muted text-[10px]">
                  {sIdx + 1}
                </div>

                {/* Weight Input */}
                <div className="col-span-3">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="--"
                    value={set.weight !== undefined ? set.weight : ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : Number(e.target.value);
                      onUpdateSet(index, sIdx, { weight: val });
                    }}
                    className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-center text-xs outline-none focus:border-accent"
                  />
                </div>

                {/* Reps Input */}
                <div className="col-span-3">
                  <input
                    type="number"
                    min="0"
                    placeholder="--"
                    value={set.reps !== undefined ? set.reps : ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? undefined : Number(e.target.value);
                      onUpdateSet(index, sIdx, { reps: val });
                    }}
                    className="w-full px-2 py-1 bg-darkbg border border-border rounded text-off-white text-center text-xs outline-none focus:border-accent"
                  />
                </div>

                {/* Volume Output (weight * reps) */}
                <div className="col-span-2 text-right font-mono font-bold text-accent text-[10px]">
                  {volume !== null ? `${volume}` : '--'}
                </div>

                {/* Feel Chips */}
                <div className="col-span-3 flex flex-wrap gap-1 items-center justify-center relative">
          {/* Global Help Icon */}
          <HelpCircle
            className="absolute top-0 right-0 w-4 h-4 cursor-pointer text-off-white-muted"
            onMouseEnter={() => setActiveFeelDesc('Feel indicates intensity: Light, Heavy, Failure.')}
            onMouseLeave={() => setActiveFeelDesc('')}
            onClick={(e) => {
              e.stopPropagation();
              setActiveFeelDesc((prev) => prev ? '' : 'Feel indicates intensity: Light, Heavy, Failure.');
            }}
          />
                  {/* Delete set button next to row */}
                  <div className="flex gap-1">
                    {COMMON_FEELS.map((feelOption) => {
                      const isActive = set.feel === feelOption;
                      return (
                        <button
                          key={feelOption}
                          type="button"
                          onClick={() => {
                            onUpdateSet(index, sIdx, { feel: isActive ? '' : feelOption });
                            setCustomFeelIndex(null);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold border transition-colors ${
                            isActive
                              ? 'bg-accent/20 border-accent text-accent'
                              : 'bg-darkbg border-border text-off-white-muted hover:border-accent/40'
                          }`}
                        >
                          {feelOption[0]}
                        </button>
                      );
                    })}
                    {/* Feel description */}
                    
                    {/* Feel description tooltip */}
                    {activeFeelDesc && (
                      <div className="absolute z-10 mt-1 w-48 p-2 bg-darkbg border border-border rounded text-xs text-off-white-muted shadow-lg">
                        {activeFeelDesc}
                      </div>
                    )}
                    {/* Custom Feel Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (customFeelIndex === sIdx) {
                          setCustomFeelIndex(null);
                          setActiveFeelDesc('');
                        } else {
                          setCustomFeelIndex(sIdx);
                          setCustomFeelValue(isCustomFeelActive ? set.feel || '' : '');
                          setActiveFeelDesc(isCustomFeelActive ? set.feel || '' : 'Custom Feel');
                        }
                      }}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold border transition-colors ${
                        isCustomFeelActive
                          ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                          : 'bg-darkbg border-border text-off-white-muted hover:border-accent/40'
                      }`}
                      title={isCustomFeelActive ? `Feel: ${set.feel}` : "Custom Feel"}
                    >
                      C
                    </button>

                    {/* Set deletion button */}
                    <button
                      type="button"
                      onClick={() => onRemoveSet(index, sIdx)}
                      className="p-0.5 hover:text-red-400 text-off-white-muted transition-colors rounded shrink-0"
                      title="Remove Set"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Inline Custom Feel Input Box */}
                  {customFeelIndex === sIdx && (
                    <div className="absolute right-0 top-6 bg-card border border-border p-1.5 rounded z-20 flex gap-1 animate-fade-in shadow-lg">
                      <input
                        type="text"
                        placeholder="Pain, Fast..."
                        value={customFeelValue}
                        onChange={(e) => setCustomFeelValue(e.target.value)}
                        className="px-1.5 py-0.5 bg-darkbg border border-border text-[9px] rounded text-off-white outline-none w-20"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSet(index, sIdx, { feel: customFeelValue.trim() });
                          setCustomFeelIndex(null);
                        }}
                        className="px-1.5 py-0.5 bg-accent text-darkbg text-[8px] font-bold rounded uppercase hover:bg-accent-dim"
                      >
                        Set
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Actions / Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-2">
        <div className="sm:col-span-9">
          <input
            type="text"
            placeholder="Exercise specific notes (e.g. barbell felt cold, straps used...)"
            value={ex.notes || ''}
            onChange={(e) => onUpdateNotes(index, e.target.value)}
            className="w-full px-2.5 py-1.5 bg-darkbg border border-border rounded text-[10px] text-off-white outline-none focus:border-accent font-sans"
          />
        </div>

        <div className="sm:col-span-3">
          <button
            type="button"
            onClick={() => onAddSet(index)}
            className="w-full py-1.5 border border-dashed border-accent/30 hover:border-accent text-accent hover:bg-accent/5 rounded font-bold uppercase text-[9px] tracking-wider transition-all flex items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Set</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default ExerciseCard;
