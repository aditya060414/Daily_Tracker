import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  Play,
  ArrowRight,
  PenLine,
} from 'lucide-react';
import { useDayPlanStore, useDailyStore, useDateStore } from '../store';
import { format, addDays, parseISO } from 'date-fns';
import { TagChip } from '../components/TagChip';
import { LoadingSpinner } from '../components/LoadingSpinner';

const timeBlockSchema = z
  .object({
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format must be HH:MM'),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format must be HH:MM'),
    label: z.string().min(1, 'Label is required'),
    category: z.enum(['work', 'health', 'learning', 'personal', 'rest']),
    completed: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const [startH, startM] = data.startTime.split(':').map(Number);
      const [endH, endM] = data.endTime.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      return endMin > startMin;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  );

type TimeBlockFormValues = z.infer<typeof timeBlockSchema>;

export const DayPlanning: React.FC = () => {
  const selectedDate = useDateStore((state) => state.selectedDate);

  // Zustand stores
  const { plan, tomorrowPlan, loading, fetchPlan, savePlan, saveTomorrowPlan, copyPlan } = useDayPlanStore();
  const { taskTemplates, fetchTemplates } = useDailyStore();

  // Local State
  const [showAddForm, setShowAddForm] = useState(false);
  const [planTomorrowSuccess, setPlanTomorrowSuccess] = useState(false);

  // Notes Local States
  const [todayNotes, setTodayNotes] = useState('');
  const [tomorrowNotes, setTomorrowNotes] = useState('');
  const [saveStatusToday, setSaveStatusToday] = useState('');
  const [saveStatusTomorrow, setSaveStatusTomorrow] = useState('');

  // Add block form
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TimeBlockFormValues>({
    resolver: zodResolver(timeBlockSchema),
    defaultValues: {
      startTime: '09:00',
      endTime: '10:00',
      label: '',
      category: 'work',
      completed: false,
    },
  });

  // Load plan and tasks on mount / change
  useEffect(() => {
    fetchPlan(selectedDate);
    fetchTemplates();
  }, [selectedDate, fetchPlan, fetchTemplates]);

  // Synchronize local notes state with store values
  useEffect(() => {
    setTodayNotes(plan?.notes || '');
  }, [plan]);

  useEffect(() => {
    setTomorrowNotes(tomorrowPlan?.notes || '');
  }, [tomorrowPlan]);

  // Save Today's Notes
  const handleSaveTodayNotes = async () => {
    if ((plan?.notes || '') === todayNotes) return;
    setSaveStatusToday('SAVING...');
    await savePlan(selectedDate, plan?.timeBlocks || [], todayNotes);
    setSaveStatusToday('SAVED');
    setTimeout(() => setSaveStatusToday(''), 2000);
  };

  // Save Tomorrow's Notes
  const handleSaveTomorrowNotes = async () => {
    if ((tomorrowPlan?.notes || '') === tomorrowNotes) return;
    setSaveStatusTomorrow('SAVING...');
    const parsedToday = parseISO(selectedDate);
    const tomorrowDateStr = format(addDays(parsedToday, 1), 'yyyy-MM-dd');
    await saveTomorrowPlan(tomorrowDateStr, tomorrowPlan?.timeBlocks || [], tomorrowNotes);
    setSaveStatusTomorrow('SAVED');
    setTimeout(() => setSaveStatusTomorrow(''), 2000);
  };

  // Submit time block creation
  const onSubmitBlock = async (values: TimeBlockFormValues) => {
    const currentBlocks = plan?.timeBlocks || [];
    // Append and sort chronologically by startTime
    const updatedBlocks = [...currentBlocks, values].sort((a, b) => a.startTime.localeCompare(b.startTime));

    await savePlan(selectedDate, updatedBlocks, plan?.notes || '');
    setShowAddForm(false);
    reset({ startTime: '09:00', endTime: '10:00', label: '', category: 'work', completed: false });
  };

  // Toggle completion of time block
  const handleToggleBlock = async (index: number) => {
    if (!plan) return;
    const updatedBlocks = plan.timeBlocks.map((block, idx) => {
      if (idx === index) {
        return { ...block, completed: !block.completed };
      }
      return block;
    });

    await savePlan(selectedDate, updatedBlocks, plan.notes || '');
  };

  // Delete time block
  const handleDeleteBlock = async (index: number) => {
    if (!plan) return;
    const updatedBlocks = plan.timeBlocks.filter((_, idx) => idx !== index);
    await savePlan(selectedDate, updatedBlocks, plan.notes || '');
  };

  // Plan Tomorrow copying workflow
  const handlePlanTomorrow = async () => {
    const parsedToday = parseISO(selectedDate);
    const tomorrowDateStr = format(addDays(parsedToday, 1), 'yyyy-MM-dd');

    try {
      await copyPlan(tomorrowDateStr, selectedDate);
      setPlanTomorrowSuccess(true);
      setTimeout(() => setPlanTomorrowSuccess(false), 2000);
    } catch (err) {
      console.error('Plan copy failed:', err);
    }
  };

  // Pick unscheduled task from sidebar
  const handleSelectUnscheduled = (taskTitle: string, taskCategory: string) => {
    setValue('label', taskTitle);
    
    // Map categories
    const cat = taskCategory.toLowerCase();
    if (cat === 'work' || cat === 'health' || cat === 'learning' || cat === 'personal' || cat === 'rest') {
      setValue('category', cat as any);
    } else {
      setValue('category', 'personal');
    }
    
    setShowAddForm(true);
  };

  const timeBlocks = plan?.timeBlocks || [];

  if (loading && !plan) {
    return <LoadingSpinner message="Locking alignment for day planners..." />;
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 select-none animate-fade-in pb-20 md:pb-6">
      {/* TIMELINE SHEET & NOTES (8 cols) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* TIMELINE SHEET */}
        <div className="bg-panel border border-border rounded-lg p-5 flex flex-col min-h-[500px]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent animate-pulse" />
              <h2 className="font-mono text-sm font-bold text-off-white">TIMELINE_PLANNER</h2>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePlanTomorrow}
                className={`px-3 py-1.5 border border-accent/20 rounded text-xs font-mono font-bold uppercase transition-all duration-150 ${
                  planTomorrowSuccess
                    ? 'bg-emerald-500/25 border-emerald-500/40 text-emerald-400'
                    : 'hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5" />
                  {planTomorrowSuccess ? 'PLAN_COPIED' : 'PLAN_TOMORROW'}
                </span>
              </button>
              
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-1.5 bg-accent hover:bg-accent-dim text-darkbg hover:text-off-white rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center gap-1 glow-accent"
              >
                <Plus className="w-3.5 h-3.5" /> Block
              </button>
            </div>
          </div>

          {/* Add Block Form Drawer */}
          {showAddForm && (
            <form
              onSubmit={handleSubmit(onSubmitBlock)}
              className="p-4 bg-card border border-border rounded space-y-3 font-mono text-xs mb-6 animate-fade-in"
            >
              <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-wider text-[10px]">
                <Clock className="w-3.5 h-3.5" />
                <span>Schedule Timeline Event</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Event Label */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Event Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Code Review, Lunch Break"
                    className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
                    {...register('label')}
                  />
                  {errors.label && <p className="text-[9px] text-red-400">{errors.label.message}</p>}
                </div>

                {/* Start Time */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Start (HH:MM)</label>
                  <input
                    type="text"
                    placeholder="09:00"
                    className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent text-center"
                    {...register('startTime')}
                  />
                  {errors.startTime && <p className="text-[9px] text-red-400">{errors.startTime.message}</p>}
                </div>

                {/* End Time */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-off-white-muted">End (HH:MM)</label>
                  <input
                    type="text"
                    placeholder="10:30"
                    className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent text-center"
                    {...register('endTime')}
                  />
                  {errors.endTime && <p className="text-[9px] text-red-400">{errors.endTime.message}</p>}
                </div>

                {/* Category */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Category</label>
                  <select
                    className="w-full px-2 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
                    {...register('category')}
                  >
                    <option value="work">Work</option>
                    <option value="health">Health</option>
                    <option value="learning">Learning</option>
                    <option value="personal">Personal</option>
                    <option value="rest">Rest</option>
                  </select>
                </div>

                {/* Save */}
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded font-bold uppercase tracking-wider transition-colors text-[10px] h-9"
                  >
                    Confirm Block
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Timeline representation */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[500px] xl:max-h-[600px]">
            {timeBlocks.length === 0 ? (
              <div className="text-center py-16 text-xs font-mono text-off-white-muted">
                Timeline is clean. Schedule task blocks or click tasks in the sidebar to allocate slots.
              </div>
            ) : (
              timeBlocks.map((block, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3.5 border rounded transition-all duration-200 ${
                    block.completed
                      ? 'bg-card/20 border-border/30 text-off-white-muted opacity-60'
                      : 'bg-card border-border hover:border-accent/40'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Complete checkbox */}
                    <button
                      onClick={() => handleToggleBlock(idx)}
                      className="focus:outline-none transition-transform active:scale-95 text-off-white-muted hover:text-accent"
                      title={block.completed ? 'Mark Incomplete' : 'Mark Complete'}
                    >
                      <CheckCircle
                        className={`w-5 h-5 transition-all ${
                          block.completed ? 'text-accent fill-accent/10 stroke-[2.5]' : 'opacity-40 hover:opacity-100'
                        }`}
                      />
                    </button>

                    {/* Details */}
                    <div className="flex flex-col min-w-0">
                      <span className={`text-xs font-bold truncate text-off-white ${block.completed ? 'line-through' : ''}`}>
                        {block.label}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 text-[9px] font-mono text-off-white-muted">
                          <Clock className="w-3 h-3 text-accent" />
                          <span>{block.startTime}</span>
                          <ArrowRight className="w-2.5 h-2.5 opacity-45" />
                          <span>{block.endTime}</span>
                        </div>
                        <TagChip category={block.category} small />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <button
                      onClick={() => handleDeleteBlock(idx)}
                      className="p-1 text-off-white-muted hover:text-red-400 transition-colors rounded"
                      title="Delete block"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* NOTES GRID (Side-by-Side in the Middle) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* TODAY'S PLAN NOTES */}
          <div className="bg-panel border border-border rounded-lg p-5 flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-off-white flex items-center gap-1.5">
                <PenLine className="w-3.5 h-3.5 text-accent animate-pulse" />
                Today's Plan Notes
              </h3>
              <div className="flex items-center gap-2">
                {saveStatusToday && (
                  <span className="text-[9px] font-mono text-accent animate-pulse">{saveStatusToday}</span>
                )}
                <button
                  onClick={handleSaveTodayNotes}
                  className="px-2 py-0.5 border border-accent/20 rounded text-[9px] font-mono font-bold uppercase text-accent hover:bg-accent/15 transition-all"
                >
                  SAVE
                </button>
              </div>
            </div>
            <textarea
              value={todayNotes}
              onChange={(e) => setTodayNotes(e.target.value)}
              onBlur={handleSaveTodayNotes}
              placeholder="Write down today's goals, schedules, or outline notes..."
              className="w-full h-32 px-3 py-2 bg-darkbg border border-border rounded text-xs text-off-white outline-none focus:border-accent font-mono resize-none"
            />
          </div>

          {/* NEXT DAY PLAN */}
          <div className="bg-panel border border-border rounded-lg p-5 flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-off-white flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                Next Day Plan
              </h3>
              <div className="flex items-center gap-2">
                {saveStatusTomorrow && (
                  <span className="text-[9px] font-mono text-accent animate-pulse">{saveStatusTomorrow}</span>
                )}
                <button
                  onClick={handleSaveTomorrowNotes}
                  className="px-2 py-0.5 border border-accent/20 rounded text-[9px] font-mono font-bold uppercase text-accent hover:bg-accent/15 transition-all"
                >
                  SAVE_PLAN
                </button>
              </div>
            </div>
            <div className="text-[9px] font-mono text-off-white-muted mb-2 uppercase">
              Drafting plan for {format(addDays(parseISO(selectedDate), 1), 'MMM dd, yyyy')}
            </div>
            <textarea
              value={tomorrowNotes}
              onChange={(e) => setTomorrowNotes(e.target.value)}
              onBlur={handleSaveTomorrowNotes}
              placeholder="Plan out tomorrow's tasks, notes, or agenda..."
              className="w-full h-32 px-3 py-2 bg-darkbg border border-border rounded text-xs text-off-white outline-none focus:border-accent font-mono resize-none"
            />
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR (4 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        {/* UNSCHEDULED SIDEBAR */}
        <div className="bg-panel border border-border rounded-lg p-5 flex flex-col min-h-[500px] h-full overflow-hidden">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-off-white flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-accent" />
              Unscheduled Tasks
            </h3>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {taskTemplates.length === 0 ? (
              <div className="text-center py-8 text-[11px] font-mono text-off-white-muted">
                No tasks in library. Add tasks in library to schedule blocks.
              </div>
            ) : (
              taskTemplates.map((task) => (
                <div
                  key={task._id}
                  onClick={() => handleSelectUnscheduled(task.title, task.category)}
                  className="group flex items-center justify-between p-2.5 rounded bg-card border border-border hover:border-accent/40 cursor-pointer transition-colors"
                  title="Click to schedule this task on the timeline"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TagChip category={task.category} small />
                    <span className="text-xs font-semibold text-off-white truncate group-hover:text-accent">
                      {task.title}
                    </span>
                  </div>
                  <span className="text-[8px] font-mono border border-border bg-card group-hover:border-accent/30 group-hover:text-accent px-1.5 py-0.5 rounded uppercase">
                    Schedule
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DayPlanning;
