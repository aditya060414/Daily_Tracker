import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  AlertCircle,
  BookOpen,
  Heart,
  Briefcase,
  User,
  Zap,
  Pencil,
  X,
} from 'lucide-react';
import { useDailyStore, useDateStore } from '../store';
import { TagChip } from '../components/TagChip';
import { ConfirmModal } from '../components/ConfirmModal';
import { LoadingSpinner } from '../components/LoadingSpinner';

const taskTemplateSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  points: z.coerce.number().min(1, 'Min 1 point').max(5, 'Max 5 points'),
  category: z.enum(['health', 'work', 'learning', 'personal']),
  isRepeating: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(true)),
});

type TaskTemplateFormValues = z.infer<typeof taskTemplateSchema>;

export const DailyTasks: React.FC = () => {
  const selectedDate = useDateStore((state) => state.selectedDate);

  // Zustand Store
  const {
    taskTemplates,
    dailyLog,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    fetchLog,
    addOneOffTask,
    toggleLogTask,
    deleteLogTask,
  } = useDailyStore();

  // Local State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'template' | 'logTask'>('template');
  const [showConfirm, setShowConfirm] = useState(false);
  const [oneOffTitle, setOneOffTitle] = useState('');
  const [oneOffCategory, setOneOffCategory] = useState<'health' | 'work' | 'learning' | 'personal'>('personal');
  const [oneOffPoints, setOneOffPoints] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form setup for adding template
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TaskTemplateFormValues>({
    resolver: zodResolver(taskTemplateSchema),
    defaultValues: {
      title: '',
      points: 1,
      category: 'personal',
      isRepeating: true,
    },
  });

  // Load templates and daily log on mount / date change
  useEffect(() => {
    fetchTemplates();
    fetchLog(selectedDate);
  }, [selectedDate, fetchTemplates, fetchLog]);

  // Form submit for template
  const onSubmitTemplate = async (values: TaskTemplateFormValues) => {
    if (editingId) {
      await updateTemplate(editingId, values);
      setEditingId(null);
    } else {
      await createTemplate(values);
    }
    reset({
      title: '',
      points: 1,
      category: 'personal',
      isRepeating: true,
    });
  };

  const handleStartEdit = (template: any) => {
    setEditingId(template._id);
    reset({
      title: template.title,
      points: template.points,
      category: template.category,
      isRepeating: template.isRepeating,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    reset({
      title: '',
      points: 1,
      category: 'personal',
      isRepeating: true,
    });
  };

  // Quick-Add one-off task submit
  const handleAddOneOff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oneOffTitle.trim()) return;

    await addOneOffTask(selectedDate, {
      title: oneOffTitle,
      points: oneOffPoints,
      category: oneOffCategory,
    });

    setOneOffTitle('');
    setOneOffPoints(1);
  };

  // Confirm delete triggers
  const promptDeleteTemplate = (id: string) => {
    setDeleteId(id);
    setDeleteType('template');
    setShowConfirm(true);
  };

  const promptDeleteLogTask = (id: string) => {
    setDeleteId(id);
    setDeleteType('logTask');
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    if (deleteType === 'template') {
      await deleteTemplate(deleteId);
    } else {
      await deleteLogTask(selectedDate, deleteId);
    }

    setShowConfirm(false);
    setDeleteId(null);
  };

  // Helper icons for categories
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health':
        return <Heart className="w-3.5 h-3.5 text-emerald-400" />;
      case 'work':
        return <Briefcase className="w-3.5 h-3.5 text-blue-400" />;
      case 'learning':
        return <BookOpen className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <User className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  // Compute daily metrics
  const pointsEarned = dailyLog?.totalPoints || 0;
  const maxPointsPossible = dailyLog?.tasks.reduce((sum, t) => sum + t.points, 0) || 0;
  const progressRatio = maxPointsPossible > 0 ? (pointsEarned / maxPointsPossible) * 100 : 0;

  if (loading && !dailyLog) {
    return <LoadingSpinner message="Querying active checklist buffers..." />;
  }

  return (
    <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 select-none animate-fade-in pb-20 md:pb-6">
      {/* LEFT COLUMN: Template Library (5 cols) */}
      <div className="xl:col-span-5 space-y-6 flex flex-col">
        {/* Template Form */}
        <div className="bg-panel border border-border rounded-lg p-5">
          <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
            <div className="flex items-center gap-2 text-accent font-mono text-xs uppercase tracking-wider">
              {editingId ? <Pencil className="w-4 h-4 text-accent" /> : <Plus className="w-4 h-4" />}
              <span>{editingId ? 'Edit Task Template' : 'Register Repeating Task'}</span>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-[10px] text-off-white-muted hover:text-off-white font-mono uppercase tracking-wider flex items-center gap-0.5"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmitTemplate)} className="space-y-3 font-mono text-xs">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-[10px] text-off-white-muted uppercase tracking-wider">Task Title</label>
              <input
                type="text"
                placeholder="e.g. Morning Cardio, Read Documentation"
                className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
                {...register('title')}
              />
              {errors.title && <p className="text-[10px] text-red-400">{errors.title.message}</p>}
            </div>

            {/* Form row: Category, Points, Repeating */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Category */}
              <div className="space-y-1">
                <label className="text-[10px] text-off-white-muted uppercase tracking-wider">Category</label>
                <select
                  className="w-full px-2.5 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
                  {...register('category')}
                >
                  <option value="personal">Personal</option>
                  <option value="health">Health</option>
                  <option value="work">Work</option>
                  <option value="learning">Learning</option>
                </select>
              </div>

              {/* Points */}
              <div className="space-y-1">
                <label className="text-[10px] text-off-white-muted uppercase tracking-wider">Points (1-5)</label>
                <select
                  className="w-full px-2.5 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
                  {...register('points')}
                >
                  <option value="1">1 pt</option>
                  <option value="2">2 pts</option>
                  <option value="3">3 pts</option>
                  <option value="4">4 pts</option>
                  <option value="5">5 pts</option>
                </select>
              </div>

              {/* Repeating status */}
              <div className="space-y-1">
                <label className="text-[10px] text-off-white-muted uppercase tracking-wider">Repeating</label>
                <select
                  className="w-full px-2.5 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
                  {...register('isRepeating')}
                >
                  <option value="true">Yes</option>
                  <option value="false">No (One-Off)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2 bg-card hover:bg-accent hover:text-darkbg border border-border rounded font-bold uppercase tracking-wider transition-all duration-150"
            >
              {editingId ? 'Save Changes' : 'Add Template'}
            </button>
          </form>
        </div>

        {/* Task Library */}
        <div className="bg-panel border border-border rounded-lg p-5 flex-1 flex flex-col max-h-[500px] xl:max-h-none overflow-hidden">
          <div className="flex items-center justify-between mb-3 border-b border-border pb-2">
            <span className="font-mono text-xs uppercase tracking-wider font-bold text-off-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-accent" />
              Templates Library
            </span>
            <span className="text-[9px] font-mono bg-card px-2 py-0.5 rounded text-off-white-muted">
              {taskTemplates.length} Definitions
            </span>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded mb-3">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {taskTemplates.length === 0 ? (
              <div className="text-center py-8 text-xs font-mono text-off-white-muted">
                No templates configured. Create one above to auto-populate daily lists.
              </div>
            ) : (
              taskTemplates.map((template) => (
                <div
                  key={template._id}
                  className="flex items-center justify-between p-2.5 rounded bg-card border border-border hover:border-accent/35 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {getCategoryIcon(template.category)}
                    <span className="text-xs font-semibold text-off-white truncate">{template.title}</span>
                    <span className="text-[10px] font-mono text-accent">+{template.points}p</span>
                    {!template.isRepeating && (
                      <span className="text-[8px] border border-accent/20 bg-accent/5 px-1 rounded text-accent uppercase">
                        One-Off
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleStartEdit(template)}
                      className="p-1 hover:text-accent transition-colors rounded"
                      title="Edit Template Definition"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => promptDeleteTemplate(template._id)}
                      className="p-1 hover:text-red-400 transition-colors rounded"
                      title="Delete Template Definition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Checklist (7 cols) */}
      <div className="xl:col-span-7 bg-panel border border-border rounded-lg p-5 flex flex-col min-h-[500px]">
        {/* Checklist stats */}
        <div className="border-b border-border pb-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs uppercase tracking-wider font-bold text-off-white flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-accent animate-pulse" />
              Today&apos;s Checklist
            </span>
            <span className="font-mono text-xs text-accent font-bold">
              {pointsEarned} / {maxPointsPossible} Points Earned
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-darkbg rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-accent transition-all duration-500 ease-out"
              style={{ width: `${progressRatio}%` }}
            ></div>
          </div>
        </div>

        {/* Quick add one-off task inline */}
        <form onSubmit={handleAddOneOff} className="grid grid-cols-1 sm:grid-cols-12 gap-2 mb-4 font-mono text-xs">
          <div className="sm:col-span-6">
            <input
              type="text"
              placeholder="Add one-off task for today..."
              className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
              value={oneOffTitle}
              onChange={(e) => setOneOffTitle(e.target.value)}
            />
          </div>
          <div className="sm:col-span-3">
            <select
              className="w-full px-2 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
              value={oneOffCategory}
              onChange={(e: any) => setOneOffCategory(e.target.value)}
            >
              <option value="personal">Personal</option>
              <option value="health">Health</option>
              <option value="work">Work</option>
              <option value="learning">Learning</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <select
              className="w-full px-2 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent"
              value={oneOffPoints}
              onChange={(e: any) => setOneOffPoints(Number(e.target.value))}
            >
              <option value="1">1 pt</option>
              <option value="2">2 pts</option>
              <option value="3">3 pts</option>
              <option value="4">4 pts</option>
              <option value="5">5 pts</option>
            </select>
          </div>
          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full h-full py-2 bg-card border border-border hover:border-accent hover:text-accent rounded flex items-center justify-center transition-colors"
              title="Add Task for Today only"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Checklist items */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[500px] xl:max-h-[600px]">
          {dailyLog?.tasks.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono text-off-white-muted">
              Checklist is empty. Add a template or enter an inline task above to get started.
            </div>
          ) : (
            dailyLog?.tasks.map((task) => (
              <div
                key={task._id}
                className={`flex items-center justify-between p-3.5 border rounded transition-all duration-200 ${
                  task.completed
                    ? 'bg-card/30 border-border/40 text-off-white-muted line-through opacity-70'
                    : 'bg-card border-border hover:border-accent/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Checkbox wrapper */}
                  <button
                    onClick={() => toggleLogTask(selectedDate, task._id, !task.completed)}
                    className="focus:outline-none transition-transform active:scale-90"
                    title={task.completed ? 'Mark Incomplete' : 'Mark Completed'}
                  >
                    {task.completed ? (
                      <div className="w-5 h-5 rounded bg-accent text-darkbg flex items-center justify-center border border-accent animate-pop">
                        <CheckSquare className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded bg-darkbg border border-border hover:border-accent/50 flex items-center justify-center text-transparent hover:text-accent transition-colors">
                        <Square className="w-4 h-4" />
                      </div>
                    )}
                  </button>

                  <div className="flex flex-col min-w-0 leading-normal">
                    <span className="text-xs font-bold truncate text-off-white">{task.title}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <TagChip category={task.category} small />
                      <span className="text-[9px] font-mono text-accent">+{task.points} pts</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => promptDeleteLogTask(task._id)}
                    className="p-1 text-off-white-muted hover:text-red-400 transition-colors rounded"
                    title="Remove task from today's list"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CONFIRMATION DIALOG */}
      <ConfirmModal
        isOpen={showConfirm}
        title={deleteType === 'template' ? 'Delete Task Template' : 'Remove Checklist Item'}
        message={
          deleteType === 'template'
            ? 'Are you sure you want to delete this task template definition? Today\'s log records won\'t be changed, but future days will no longer pre-populate this task.'
            : 'Are you sure you want to delete this task from today\'s checklist?'
        }
        confirmText="Confirm Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowConfirm(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
};
export default DailyTasks;
