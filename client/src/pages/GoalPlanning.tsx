import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Target,
  Plus,
  Trash2,
  Calendar,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { useGoalsStore } from '../store';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ProgressRing } from '../components/ProgressRing';
import { ConfirmModal } from '../components/ConfirmModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line } from 'recharts';
import { Goal } from '../types';

const goalSchema = z.object({
  title: z.string().min(1, 'Goal title is required'),
  description: z.string().optional(),
  type: z.enum(['today', 'short-term', 'long-term']),
  targetDate: z.string().min(1, 'Target date is required'),
  milestones: z
    .array(
      z.object({
        label: z.string().min(1, 'Milestone label cannot be empty'),
        completed: z.boolean().default(false),
      })
    )
    .optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

export const GoalPlanning: React.FC = () => {
  // Zustand Store
  const { goals, loading, fetchGoals, createGoal, updateGoal, updateGoalProgress, deleteGoal } = useGoalsStore();

  // Local State
  const [activeTab, setActiveTab] = useState<'today' | 'short-term' | 'long-term'>('today');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});

  // Form setup
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'short-term',
      targetDate: new Date().toISOString().split('T')[0],
      milestones: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'milestones',
  });

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const onSubmitGoal = async (values: GoalFormValues) => {
    await createGoal({
      title: values.title,
      description: values.description,
      type: values.type,
      targetDate: values.targetDate,
      milestones: values.milestones || [],
      status: 'active',
    });
    setShowAddForm(false);
    reset({
      title: '',
      description: '',
      type: 'short-term',
      targetDate: new Date().toISOString().split('T')[0],
      milestones: [],
    });
  };

  const handleDeletePrompt = (id: string) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      await deleteGoal(deleteId);
    }
    setShowConfirm(false);
    setDeleteId(null);
  };

  const toggleMilestonesCollapse = (goalId: string) => {
    setExpandedMilestones((prev) => ({
      ...prev,
      [goalId]: !prev[goalId],
    }));
  };

  const handleToggleMilestone = async (goal: Goal, mIndex: number) => {
    const updatedMilestones = goal.milestones.map((m, idx) => {
      if (idx === mIndex) {
        return { ...m, completed: !m.completed };
      }
      return m;
    });

    // Auto-calculate progress ratio based on milestones completed
    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const totalCount = updatedMilestones.length;
    const autoProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : goal.progress;

    await updateGoal(goal._id, {
      milestones: updatedMilestones,
      progress: autoProgress,
    });
  };

  // Sparkline Component
  const Sparkline: React.FC<{ data: { date: string; progress: number }[] }> = ({ data }) => {
    if (!data || data.length < 2) return null;
    return (
      <div className="h-8 w-24">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data}>
            <Line type="monotone" dataKey="progress" stroke="#7c3aed" strokeWidth={1.5} dot={false} />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Calculate Delta Closer Today Callout
  const getProgressDelta = (goal: Goal) => {
    if (!goal.progressHistory || goal.progressHistory.length < 2) return null;
    
    // Sort history chronologically by date
    const sortedHistory = [...goal.progressHistory].sort((a, b) => a.date.localeCompare(b.date));
    const current = sortedHistory[sortedHistory.length - 1]?.progress || 0;
    const prior = sortedHistory[sortedHistory.length - 2]?.progress || 0;
    
    const delta = current - prior;
    if (delta > 0) {
      return `↑ ${delta}% closer today`;
    }
    return null;
  };

  // Get relative target date description
  const getRelativeTarget = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      const isPast = date.getTime() < new Date().getTime();
      const distance = formatDistanceToNow(date, { addSuffix: true });
      if (isPast) return 'passed';
      return distance;
    } catch (e) {
      return dateStr;
    }
  };

  // Filter lists
  const todayGoals = goals.filter((g) => g.type === 'today');
  const shortGoals = goals.filter((g) => g.type === 'short-term');
  const longGoals = goals.filter((g) => g.type === 'long-term');

  if (loading && goals.length === 0) {
    return <LoadingSpinner message="Re-orienting goal vectors..." />;
  }

  return (
    <div className="p-6 space-y-6 select-none animate-fade-in pb-20 md:pb-6">
      {/* Header controls */}
      <div className="bg-panel border border-border rounded-lg p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-accent animate-pulse" />
          <h2 className="font-mono text-sm font-bold text-off-white">GOAL_PLANNER</h2>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-1.5 bg-accent hover:bg-accent-dim text-darkbg hover:text-off-white rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1 glow-accent self-start"
        >
          <Plus className="w-3.5 h-3.5" /> Register Goal
        </button>
      </div>

      {/* Goal Registration Form Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit(onSubmitGoal)}
          className="p-5 bg-panel border border-border rounded-lg space-y-4 font-mono text-xs max-w-2xl"
        >
          <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-wider text-[10px] border-b border-border pb-2">
            <Plus className="w-3.5 h-3.5" />
            <span>Register Goal Parameters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Goal Title</label>
              <input
                type="text"
                placeholder="e.g. Complete Rust course, Hit 80kg bench"
                className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
                {...register('title')}
              />
              {errors.title && <p className="text-[9px] text-red-400">{errors.title.message}</p>}
            </div>

            {/* Target Date */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Target Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
                {...register('targetDate')}
              />
              {errors.targetDate && <p className="text-[9px] text-red-400">{errors.targetDate.message}</p>}
            </div>

            {/* Type */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Goal Span</label>
              <select
                className="w-full px-2 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
                {...register('type')}
              >
                <option value="today">Today&apos;s Goal</option>
                <option value="short-term">Short-Term Goal</option>
                <option value="long-term">Long-Term Goal</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Description / Notes</label>
              <input
                type="text"
                placeholder="Focus metrics, routines, notes..."
                className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
                {...register('description')}
              />
            </div>
          </div>

          {/* Dynamic Milestones Section */}
          <div className="space-y-2 border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Milestones Checklist</label>
              <button
                type="button"
                onClick={() => append({ label: '', completed: false })}
                className="text-[9px] text-accent hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Add Milestone
              </button>
            </div>

            <div className="space-y-2 max-h-36 overflow-y-auto">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder={`Milestone #${idx + 1}`}
                    className="flex-1 px-3 py-1.5 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent text-xs"
                    {...register(`milestones.${idx}.label` as const)}
                  />
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="p-1.5 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded font-bold uppercase tracking-wider transition-colors"
            >
              Add Goal
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-border rounded hover:bg-card transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* MOBILE SCREEN TABS navigation: Hidden on desktop */}
      <div className="lg:hidden flex border-b border-border bg-panel p-1 rounded-lg">
        {(['today', 'short-term', 'long-term'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 font-mono text-[10px] uppercase font-bold tracking-wider rounded transition-colors ${
              activeTab === tab ? 'bg-accent/15 text-accent' : 'text-off-white-muted hover:text-off-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3 COLUMN GRID: side by side on desktop, toggled tabs on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Today's Goals */}
        <div className={`space-y-4 lg:block ${activeTab === 'today' ? 'block' : 'hidden'}`}>
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">Today&apos;s Goals</h3>
            <span className="text-[9px] font-mono bg-card px-2 py-0.5 rounded text-off-white-muted">
              {todayGoals.length}
            </span>
          </div>
          <div className="space-y-4">
            {todayGoals.length === 0 ? (
              <div className="text-center py-12 text-xs font-mono text-off-white-muted bg-panel border border-border rounded-lg">
                No immediate goals configured for today.
              </div>
            ) : (
              todayGoals.map((goal) => renderGoalCard(goal))
            )}
          </div>
        </div>

        {/* Column 2: Short-Term Goals */}
        <div className={`space-y-4 lg:block ${activeTab === 'short-term' ? 'block' : 'hidden'}`}>
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">Short-Term Goals</h3>
            <span className="text-[9px] font-mono bg-card px-2 py-0.5 rounded text-off-white-muted">
              {shortGoals.length}
            </span>
          </div>
          <div className="space-y-4">
            {shortGoals.length === 0 ? (
              <div className="text-center py-12 text-xs font-mono text-off-white-muted bg-panel border border-border rounded-lg">
                No short-term goals active.
              </div>
            ) : (
              shortGoals.map((goal) => renderGoalCard(goal))
            )}
          </div>
        </div>

        {/* Column 3: Long-Term Goals */}
        <div className={`space-y-4 lg:block ${activeTab === 'long-term' ? 'block' : 'hidden'}`}>
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">Long-Term Goals</h3>
            <span className="text-[9px] font-mono bg-card px-2 py-0.5 rounded text-off-white-muted">
              {longGoals.length}
            </span>
          </div>
          <div className="space-y-4">
            {longGoals.length === 0 ? (
              <div className="text-center py-12 text-xs font-mono text-off-white-muted bg-panel border border-border rounded-lg">
                No long-term goals configured.
              </div>
            ) : (
              longGoals.map((goal) => renderGoalCard(goal))
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOG */}
      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Goal"
        message="Are you sure you want to permanently delete this goal? This will clear all milestone logs and historical snapshots."
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setDeleteId(null);
        }}
      />
    </div>
  );

  // Goal Card Renderer Helper
  function renderGoalCard(goal: Goal) {
    const isExpanded = expandedMilestones[goal._id] || false;
    const deltaStr = getProgressDelta(goal);

    return (
      <div
        key={goal._id}
        className="bg-panel border border-border hover:border-accent/40 rounded-lg p-5 flex flex-col gap-4 transition-all duration-200"
      >
        {/* Card Header Info */}
        <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[8px] font-mono uppercase tracking-wider border rounded px-1.5 py-0.5 font-bold ${
                  goal.status === 'completed'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : goal.status === 'paused'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-accent/10 text-accent border-accent/20'
                }`}
              >
                {goal.status}
              </span>
              <span className="text-[9px] font-mono text-off-white-muted flex items-center gap-1">
                <Calendar className="w-3 h-3 text-accent" /> {getRelativeTarget(goal.targetDate)}
              </span>
            </div>
            <h4 className="text-xs font-bold text-off-white mt-1.5 font-mono break-words">{goal.title}</h4>
            {goal.description && <p className="text-[10px] text-off-white-muted mt-1 leading-relaxed">{goal.description}</p>}
          </div>

          <button
            onClick={() => handleDeletePrompt(goal._id)}
            className="p-1 hover:text-red-400 transition-colors text-off-white-muted shrink-0"
            title="Delete Goal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress adjusters */}
        <div className="flex items-center gap-4 justify-between">
          <ProgressRing value={goal.progress} size={64} strokeWidth={6} color="stroke-accent" />
          
          <div className="flex-1 flex flex-col gap-1.5 font-mono text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-off-white-muted flex items-center gap-1">
                <Sliders className="w-3 h-3" /> Adjust Progress
              </span>
              <span className="font-bold text-accent">{goal.progress}%</span>
            </div>
            
            {/* Range slider */}
            <input
              type="range"
              min="0"
              max="100"
              value={goal.progress}
              onChange={(e) => updateGoalProgress(goal._id, Number(e.target.value))}
              className="w-full accent-accent bg-darkbg h-1 rounded border border-border outline-none cursor-pointer"
            />

            {/* +/- Buttons */}
            <div className="flex gap-1.5 justify-end">
              <button
                onClick={() => updateGoalProgress(goal._id, Math.max(goal.progress - 5, 0))}
                className="px-2 py-0.5 border border-border rounded hover:bg-card text-off-white-muted hover:text-off-white text-[9px]"
              >
                -5%
              </button>
              <button
                onClick={() => updateGoalProgress(goal._id, Math.min(goal.progress + 5, 100))}
                className="px-2 py-0.5 border border-border rounded hover:bg-card text-off-white-muted hover:text-off-white text-[9px]"
              >
                +5%
              </button>
            </div>
          </div>
        </div>

        {/* History sparkline and Delta badge */}
        {(goal.type === 'long-term' || deltaStr) && (
          <div className="flex items-center justify-between p-2 bg-card rounded border border-border">
            <div className="flex flex-col">
              <span className="text-[8px] font-mono uppercase tracking-wider text-off-white-muted">Trend Vector</span>
              {deltaStr ? (
                <span className="text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-0.5 mt-0.5">
                  <TrendingUp className="w-3 h-3" /> {deltaStr}
                </span>
              ) : (
                <span className="text-[9px] font-mono text-off-white-muted mt-0.5">No changes today</span>
              )}
            </div>
            {goal.type === 'long-term' && <Sparkline data={goal.progressHistory} />}
          </div>
        )}

        {/* Milestones expander */}
        {goal.milestones.length > 0 && (
          <div className="border-t border-border pt-3">
            <button
              onClick={() => toggleMilestonesCollapse(goal._id)}
              className="w-full flex items-center justify-between text-off-white-muted hover:text-off-white transition-colors"
            >
              <span className="font-mono text-[10px] uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                Milestones ({goal.milestones.filter((m) => m.completed).length} / {goal.milestones.length})
              </span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {isExpanded && (
              <div className="space-y-2 mt-3 pl-1 max-h-36 overflow-y-auto animate-fade-in">
                {goal.milestones.map((milestone, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[10px] font-mono">
                    <input
                      type="checkbox"
                      checked={milestone.completed}
                      onChange={() => handleToggleMilestone(goal, idx)}
                      className="mt-0.5 accent-accent cursor-pointer"
                    />
                    <span className={milestone.completed ? 'line-through text-off-white-muted' : 'text-off-white'}>
                      {milestone.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
};
export default GoalPlanning;
