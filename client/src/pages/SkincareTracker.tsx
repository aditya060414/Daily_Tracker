import React, { useEffect, useState } from 'react';
import { useDateStore, useSkincareStore } from '../store';
import {
  Sparkles,
  Sun,
  Moon,
  Plus,
  AlertCircle,
  TrendingUp,
  Droplets,
  Zap,
  Heart,
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { SkincareStepRow } from '../components/skincare/SkincareStepRow';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

export const SkincareTracker: React.FC = () => {
  const selectedDate = useDateStore((state) => state.selectedDate);
  const {
    skincareLog,
    skincareHistory,
    loading,
    error,
    fetchSkincareLog,
    updateSkincareLog,
    fetchSkincareHistory,
  } = useSkincareStore();

  // Local state for adding steps
  const [newAMStep, setNewAMStep] = useState('');
  const [newAMProduct, setNewAMProduct] = useState('');
  const [newPMStep, setNewPMStep] = useState('');
  const [newPMProduct, setNewPMProduct] = useState('');
  
  // Tab selector for analytics chart (overall, hydration vs oiliness, acne)
  const [activeChartTab, setActiveChartTab] = useState<'overall' | 'hydration' | 'acne'>('overall');

  useEffect(() => {
    fetchSkincareLog(selectedDate);
    fetchSkincareHistory();
  }, [selectedDate, fetchSkincareLog, fetchSkincareHistory]);

  const handleToggleAMStep = async (index: number) => {
    if (!skincareLog) return;
    const updatedRoutine = skincareLog.amRoutine.map((item, idx) =>
      idx === index ? { ...item, completed: !item.completed } : item
    );
    await updateSkincareLog(selectedDate, { amRoutine: updatedRoutine });
  };

  const handleTogglePMStep = async (index: number) => {
    if (!skincareLog) return;
    const updatedRoutine = skincareLog.pmRoutine.map((item, idx) =>
      idx === index ? { ...item, completed: !item.completed } : item
    );
    await updateSkincareLog(selectedDate, { pmRoutine: updatedRoutine });
  };

  const handleUpdateAMProduct = async (index: number, productName: string) => {
    if (!skincareLog) return;
    const updatedRoutine = skincareLog.amRoutine.map((item, idx) =>
      idx === index ? { ...item, productName } : item
    );
    await updateSkincareLog(selectedDate, { amRoutine: updatedRoutine });
  };

  const handleUpdatePMProduct = async (index: number, productName: string) => {
    if (!skincareLog) return;
    const updatedRoutine = skincareLog.pmRoutine.map((item, idx) =>
      idx === index ? { ...item, productName } : item
    );
    await updateSkincareLog(selectedDate, { pmRoutine: updatedRoutine });
  };

  const handleAddAMStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAMStep.trim() || !skincareLog) return;
    const updatedRoutine = [
      ...skincareLog.amRoutine,
      { step: newAMStep.trim(), productName: newAMProduct.trim(), completed: false },
    ];
    await updateSkincareLog(selectedDate, { amRoutine: updatedRoutine });
    setNewAMStep('');
    setNewAMProduct('');
  };

  const handleAddPMStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPMStep.trim() || !skincareLog) return;
    const updatedRoutine = [
      ...skincareLog.pmRoutine,
      { step: newPMStep.trim(), productName: newPMProduct.trim(), completed: false },
    ];
    await updateSkincareLog(selectedDate, { pmRoutine: updatedRoutine });
    setNewPMStep('');
    setNewPMProduct('');
  };

  const handleRemoveAMStep = async (index: number) => {
    if (!skincareLog) return;
    const updatedRoutine = skincareLog.amRoutine.filter((_, idx) => idx !== index);
    await updateSkincareLog(selectedDate, { amRoutine: updatedRoutine });
  };

  const handleRemovePMStep = async (index: number) => {
    if (!skincareLog) return;
    const updatedRoutine = skincareLog.pmRoutine.filter((_, idx) => idx !== index);
    await updateSkincareLog(selectedDate, { pmRoutine: updatedRoutine });
  };

  const handleSetSkinRating = async (rating: number) => {
    await updateSkincareLog(selectedDate, { skinRating: rating });
  };

  const handleSetHydration = async (level: number) => {
    await updateSkincareLog(selectedDate, { hydration: level });
  };

  const handleSetOiliness = async (level: number) => {
    await updateSkincareLog(selectedDate, { oiliness: level });
  };

  const handleSetAcne = async (level: number) => {
    await updateSkincareLog(selectedDate, { acne: level });
  };

  const handleToggleRedness = async () => {
    if (!skincareLog) return;
    await updateSkincareLog(selectedDate, { redness: !skincareLog.redness });
  };

  const handleUpdateNotes = async (notes: string) => {
    await updateSkincareLog(selectedDate, { notes });
  };

  // Calculate AM and PM routines completion
  const amCompletedCount = skincareLog?.amRoutine.filter((item) => item.completed).length || 0;
  const amTotalCount = skincareLog?.amRoutine.length || 0;
  const amProgress = amTotalCount > 0 ? (amCompletedCount / amTotalCount) * 100 : 0;

  const pmCompletedCount = skincareLog?.pmRoutine.filter((item) => item.completed).length || 0;
  const pmTotalCount = skincareLog?.pmRoutine.length || 0;
  const pmProgress = pmTotalCount > 0 ? (pmCompletedCount / pmTotalCount) * 100 : 0;

  // Format Recharts data (reverse chronological history to ascending)
  const chartData = [...skincareHistory]
    .reverse()
    .map((log) => ({
      date: log.date,
      'Skin Health': log.skinRating,
      'Hydration': log.hydration,
      'Oiliness': log.oiliness,
      'Breakouts': log.acne,
    }));

  const formatXAxis = (tickItem: string) => {
    try {
      return format(parseISO(tickItem), 'MMM dd');
    } catch {
      return tickItem;
    }
  };

  const CustomChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataObj = payload[0].payload;
      let displayDate = dataObj.date;
      try {
        displayDate = format(parseISO(dataObj.date), 'EEEE, MMM dd, yyyy');
      } catch {}

      return (
        <div className="bg-panel/95 border border-border p-3 rounded shadow-xl backdrop-blur-md font-mono text-xs">
          <p className="text-[10px] text-off-white-muted uppercase tracking-wider mb-2 border-b border-border pb-1">{displayDate}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }} className="font-bold flex justify-between gap-4">
              <span>{p.name}:</span>
              <span className="text-off-white">{p.value} / 5</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading && !skincareLog) {
    return <LoadingSpinner message="Aligning dermatological bio-sensors..." />;
  }

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 select-none animate-fade-in pb-16 md:pb-6">
      {/* ERROR HEADER */}
      {error && (
        <div className="xl:col-span-12 flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono rounded">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TOP SUMMARY BANNER (AM & PM completion trackers) */}
      <div className="xl:col-span-12 bg-panel border border-border rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        {/* Glow backdrop decorator */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-accent/5 blur-3xl"></div>
        
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-accent/20 border border-accent/30 text-accent">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-mono font-bold text-off-white flex items-center gap-1.5">
              SKINCARE_TELEMETRY
            </h1>
            <p className="text-xs font-mono text-off-white-muted">
              Analyze dermal hydration logs and synchronize circadian routine barriers
            </p>
          </div>
        </div>

        {/* Progress summaries */}
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          {/* AM progress widget */}
          <div className="flex-grow md:flex-grow-0 min-w-[140px] bg-darkbg/50 border border-border p-3 rounded font-mono text-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-amber-500/20 bg-amber-500/5 flex items-center justify-center text-amber-400">
              <Sun className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-off-white-muted uppercase">AM Routine</p>
              <p className="font-bold text-off-white">{amCompletedCount}/{amTotalCount} Done</p>
              <div className="w-20 bg-border h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-amber-400 h-full rounded-full transition-all duration-300" style={{ width: `${amProgress}%` }}></div>
              </div>
            </div>
          </div>

          {/* PM progress widget */}
          <div className="flex-grow md:flex-grow-0 min-w-[140px] bg-darkbg/50 border border-border p-3 rounded font-mono text-xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-indigo-500/20 bg-indigo-500/5 flex items-center justify-center text-indigo-400">
              <Moon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] text-off-white-muted uppercase">PM Routine</p>
              <p className="font-bold text-off-white">{pmCompletedCount}/{pmTotalCount} Done</p>
              <div className="w-20 bg-border h-1.5 rounded-full overflow-hidden mt-1">
                <div className="bg-indigo-400 h-full rounded-full transition-all duration-300" style={{ width: `${pmProgress}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COLUMN LEFT: Circadian Barrier Steps (AM/PM lists) */}
      <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        
        {/* AM ROUTINE BLOCK */}
        <div className="bg-panel border border-border rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-amber-400">
                <Sun className="w-4 h-4" />
                <span>Morning Routine (AM)</span>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                Active
              </span>
            </div>

            {/* Checklist items */}
            <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-1">
              {skincareLog?.amRoutine.length === 0 ? (
                <div className="text-center py-8 text-xs font-mono text-off-white-muted">
                  AM Checklist is empty. Add steps below.
                </div>
              ) : (
                skincareLog?.amRoutine.map((item, index) => (
                  <SkincareStepRow
                    key={index}
                    item={item}
                    index={index}
                    type="am"
                    onToggle={handleToggleAMStep}
                    onUpdateProduct={handleUpdateAMProduct}
                    onRemove={handleRemoveAMStep}
                  />
                ))
              )}
            </div>
          </div>

          {/* Add item form */}
          <form onSubmit={handleAddAMStep} className="mt-4 border-t border-border pt-4 font-mono text-xs space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Step title (e.g. Serum)"
                value={newAMStep}
                onChange={(e) => setNewAMStep(e.target.value)}
                className="px-2.5 py-1.5 bg-darkbg border border-border rounded text-off-white outline-none focus:border-amber-500/50"
              />
              <input
                type="text"
                placeholder="Product name (optional)"
                value={newAMProduct}
                onChange={(e) => setNewAMProduct(e.target.value)}
                className="px-2.5 py-1.5 bg-darkbg border border-border rounded text-off-white outline-none focus:border-amber-500/50"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-card hover:bg-amber-500/10 hover:text-amber-400 border border-border hover:border-amber-500/30 rounded font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add AM Step
            </button>
          </form>
        </div>

        {/* PM ROUTINE BLOCK */}
        <div className="bg-panel border border-border rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-indigo-400">
                <Moon className="w-4 h-4" />
                <span>Evening Routine (PM)</span>
              </div>
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                Active
              </span>
            </div>

            {/* Checklist items */}
            <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-1">
              {skincareLog?.pmRoutine.length === 0 ? (
                <div className="text-center py-8 text-xs font-mono text-off-white-muted">
                  PM Checklist is empty. Add steps below.
                </div>
              ) : (
                skincareLog?.pmRoutine.map((item, index) => (
                  <SkincareStepRow
                    key={index}
                    item={item}
                    index={index}
                    type="pm"
                    onToggle={handleTogglePMStep}
                    onUpdateProduct={handleUpdatePMProduct}
                    onRemove={handleRemovePMStep}
                  />
                ))
              )}
            </div>
          </div>

          {/* Add item form */}
          <form onSubmit={handleAddPMStep} className="mt-4 border-t border-border pt-4 font-mono text-xs space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Step title (e.g. Retinol)"
                value={newPMStep}
                onChange={(e) => setNewPMStep(e.target.value)}
                className="px-2.5 py-1.5 bg-darkbg border border-border rounded text-off-white outline-none focus:border-indigo-500/50"
              />
              <input
                type="text"
                placeholder="Product name (optional)"
                value={newPMProduct}
                onChange={(e) => setNewPMProduct(e.target.value)}
                className="px-2.5 py-1.5 bg-darkbg border border-border rounded text-off-white outline-none focus:border-indigo-500/50"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-card hover:bg-indigo-500/10 hover:text-indigo-400 border border-border hover:border-indigo-500/30 rounded font-bold uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add PM Step
            </button>
          </form>
        </div>

      </div>

      {/* COLUMN RIGHT: Skincare Bio-Metrics Survey */}
      <div className="xl:col-span-4 bg-panel border border-border rounded-lg p-5 flex flex-col gap-5">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Heart className="w-4 h-4 text-accent animate-pulse" />
          <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">Bio-Condition Log</h2>
        </div>

        {/* METRIC 1: Skin Wellness Score */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase text-off-white-muted">
            <span>Overall Skin Wellness</span>
            <span className="text-accent font-bold">{skincareLog?.skinRating || 3} / 5</span>
          </div>
          <div className="flex gap-2.5 justify-between">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                onClick={() => handleSetSkinRating(val)}
                className={`flex-1 py-1.5 font-mono font-bold text-xs rounded border transition-all duration-150 ${
                  skincareLog?.skinRating === val
                    ? 'bg-accent/15 border-accent/40 text-accent glow-accent'
                    : 'bg-card border-border hover:border-accent/30 text-off-white-muted hover:text-off-white'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* METRIC 2: Hydration Index */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase text-off-white-muted">
            <span className="flex items-center gap-1"><Droplets className="w-3 h-3 text-blue-400" /> Hydration Level</span>
            <span className="text-blue-400 font-bold">
              {skincareLog?.hydration === 1 ? 'Dry' : skincareLog?.hydration === 2 ? 'Under-hydrated' : skincareLog?.hydration === 3 ? 'Balanced' : skincareLog?.hydration === 4 ? 'Plump' : 'Dewy'}
            </span>
          </div>
          <div className="flex gap-2.5 justify-between">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                onClick={() => handleSetHydration(val)}
                className={`flex-1 py-1.5 font-mono font-bold text-xs rounded border transition-all duration-150 ${
                  skincareLog?.hydration === val
                    ? 'bg-blue-500/10 border-blue-500/35 text-blue-400 shadow-md shadow-blue-500/5'
                    : 'bg-card border-border hover:border-blue-500/30 text-off-white-muted hover:text-off-white'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* METRIC 3: Oiliness Index */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase text-off-white-muted">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-400" /> Sebum / Oiliness</span>
            <span className="text-yellow-400 font-bold">
              {skincareLog?.oiliness === 1 ? 'Matte' : skincareLog?.oiliness === 2 ? 'Satin' : skincareLog?.oiliness === 3 ? 'Normal' : skincareLog?.oiliness === 4 ? 'Oily' : 'Greasy'}
            </span>
          </div>
          <div className="flex gap-2.5 justify-between">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                onClick={() => handleSetOiliness(val)}
                className={`flex-1 py-1.5 font-mono font-bold text-xs rounded border transition-all duration-150 ${
                  skincareLog?.oiliness === val
                    ? 'bg-yellow-500/10 border-yellow-500/35 text-yellow-400 shadow-md shadow-yellow-500/5'
                    : 'bg-card border-border hover:border-yellow-500/30 text-off-white-muted hover:text-off-white'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* METRIC 4: Breakout / Acne Severity */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase text-off-white-muted">
            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-red-400" /> Acne / Breakouts</span>
            <span className="text-red-400 font-bold">
              {skincareLog?.acne === 1 ? 'None' : skincareLog?.acne === 2 ? 'Minimal' : skincareLog?.acne === 3 ? 'Mild' : skincareLog?.acne === 4 ? 'Moderate' : 'Severe'}
            </span>
          </div>
          <div className="flex gap-2.5 justify-between">
            {[1, 2, 3, 4, 5].map((val) => (
              <button
                key={val}
                onClick={() => handleSetAcne(val)}
                className={`flex-1 py-1.5 font-mono font-bold text-xs rounded border transition-all duration-150 ${
                  skincareLog?.acne === val
                    ? 'bg-red-500/10 border-red-500/35 text-red-400 shadow-md shadow-red-500/5'
                    : 'bg-card border-border hover:border-red-500/30 text-off-white-muted hover:text-off-white'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* TOGGLE: Redness / Irritation */}
        <div className="flex items-center justify-between bg-card border border-border p-3 rounded font-mono text-xs">
          <div className="flex flex-col">
            <span className="font-bold text-off-white">Redness & Irritation</span>
            <span className="text-[9px] text-off-white-muted">Mark if skin is inflamed or sensitized</span>
          </div>
          <button
            onClick={handleToggleRedness}
            className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 outline-none flex ${
              skincareLog?.redness ? 'bg-red-500 justify-end' : 'bg-border justify-start'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-off-white shadow-md"></span>
          </button>
        </div>

        {/* TEXTAREA: Notes */}
        <div className="space-y-1.5 font-mono text-xs">
          <div className="flex items-center justify-between text-[10px] uppercase text-off-white-muted">
            <span>Dermatological Notes</span>
            <span className="text-[9px] opacity-40">Auto-saved</span>
          </div>
          <textarea
            placeholder="e.g. Dry spots on nose, reacted to new retinol formula..."
            value={skincareLog?.notes || ''}
            onChange={(e) => handleUpdateNotes(e.target.value)}
            className="w-full h-24 px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent text-xs font-mono leading-relaxed resize-none"
          />
        </div>
      </div>

      {/* ANALYTICS LINE CHART */}
      <div className="xl:col-span-12 bg-panel border border-border rounded-lg p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            <div>
              <h3 className="text-sm font-mono font-bold text-off-white">30-Day Dermal Analytics</h3>
              <p className="text-[10px] font-mono text-off-white-muted mt-0.5">Timeline trends for cosmetic correlations</p>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex gap-1.5 bg-darkbg p-1 rounded border border-border font-mono text-[9px] uppercase">
            <button
              onClick={() => setActiveChartTab('overall')}
              className={`px-2 py-1 rounded transition-colors ${
                activeChartTab === 'overall' ? 'bg-accent text-darkbg font-bold' : 'text-off-white-muted hover:text-off-white'
              }`}
            >
              Overall
            </button>
            <button
              onClick={() => setActiveChartTab('hydration')}
              className={`px-2 py-1 rounded transition-colors ${
                activeChartTab === 'hydration' ? 'bg-accent text-darkbg font-bold' : 'text-off-white-muted hover:text-off-white'
              }`}
            >
              Hydration vs Oil
            </button>
            <button
              onClick={() => setActiveChartTab('acne')}
              className={`px-2 py-1 rounded transition-colors ${
                activeChartTab === 'acne' ? 'bg-accent text-darkbg font-bold' : 'text-off-white-muted hover:text-off-white'
              }`}
            >
              Breakouts
            </button>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center font-mono text-xs text-off-white-muted animate-pulse">
            No history recorded. Logs will appear on the chart as they are generated.
          </div>
        ) : (
          <div className="h-64 mt-2 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  stroke="#555"
                  tick={{ fill: '#a3a3a3', fontSize: 9, fontFamily: 'Geist Mono' }}
                  axisLine={{ stroke: '#2a2a2a' }}
                  tickLine={{ stroke: '#2a2a2a' }}
                />
                <YAxis
                  stroke="#555"
                  domain={[1, 5]}
                  tickCount={5}
                  tick={{ fill: '#a3a3a3', fontSize: 9, fontFamily: 'Geist Mono' }}
                  axisLine={{ stroke: '#2a2a2a' }}
                  tickLine={{ stroke: '#2a2a2a' }}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: '#2a2a2a', strokeWidth: 1 }} />
                <Legend
                  wrapperStyle={{ fontSize: '9px', fontFamily: 'Geist Mono', color: '#a3a3a3', marginTop: '10px' }}
                />
                
                {/* Dynamically draw lines based on selected tab */}
                {activeChartTab === 'overall' && (
                  <Line
                    type="monotone"
                    dataKey="Skin Health"
                    stroke="#7c3aed"
                    strokeWidth={2.5}
                    dot={{ r: 3, stroke: '#7c3aed', strokeWidth: 1, fill: '#0f0f0f' }}
                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 1, fill: '#7c3aed' }}
                  />
                )}
                
                {activeChartTab === 'hydration' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="Hydration"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ r: 3, stroke: '#3b82f6', strokeWidth: 1, fill: '#0f0f0f' }}
                      activeDot={{ r: 5, stroke: '#fff', strokeWidth: 1, fill: '#3b82f6' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Oiliness"
                      stroke="#eab308"
                      strokeWidth={2}
                      dot={{ r: 3, stroke: '#eab308', strokeWidth: 1, fill: '#0f0f0f' }}
                      activeDot={{ r: 5, stroke: '#fff', strokeWidth: 1, fill: '#eab308' }}
                    />
                  </>
                )}

                {activeChartTab === 'acne' && (
                  <Line
                    type="monotone"
                    dataKey="Breakouts"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    dot={{ r: 3, stroke: '#ef4444', strokeWidth: 1, fill: '#0f0f0f' }}
                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 1, fill: '#ef4444' }}
                  />
                )}
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkincareTracker;
