import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  ClipboardList,
  Plus,
  Search,
  X,
  Tag,
  Clock,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Loader2,
  CalendarClock,
  ArrowRight,
} from 'lucide-react';

import { useTaskStore } from '../store/taskStore';
import { ConfirmModal } from '../components/ConfirmModal';
import { ScheduledTask, TaskStatus, UrgencyGroup } from '../types';

// ─── Tag Color Hashing ────────────────────────────────────────────────────────

const TAG_COLOR_PALETTES = [
  { bg: 'bg-violet-500/15', text: 'text-violet-300', border: 'border-violet-500/30' },
  { bg: 'bg-blue-500/15',   text: 'text-blue-300',   border: 'border-blue-500/30'   },
  { bg: 'bg-emerald-500/15',text: 'text-emerald-300',border: 'border-emerald-500/30'},
  { bg: 'bg-amber-500/15',  text: 'text-amber-300',  border: 'border-amber-500/30'  },
  { bg: 'bg-rose-500/15',   text: 'text-rose-300',   border: 'border-rose-500/30'   },
  { bg: 'bg-cyan-500/15',   text: 'text-cyan-300',   border: 'border-cyan-500/30'   },
  { bg: 'bg-pink-500/15',   text: 'text-pink-300',   border: 'border-pink-500/30'   },
  { bg: 'bg-orange-500/15', text: 'text-orange-300', border: 'border-orange-500/30' },
];

function hashTagToColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash + tag.charCodeAt(i)) % TAG_COLOR_PALETTES.length;
  }
  return TAG_COLOR_PALETTES[hash];
}

// ─── Countdown Helpers ────────────────────────────────────────────────────────

function getTimeLeft(deadline: string): {
  label: string;
  color: string;
  isOverdue: boolean;
  isUrgent: boolean;
} {
  const now = Date.now();
  const deadlineMs = new Date(deadline).getTime();
  const diffMs = deadlineMs - now;
  const absDiffMs = Math.abs(diffMs);

  const totalMinutes = Math.floor(absDiffMs / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;
  const remMins = totalMinutes % 60;

  if (diffMs < 0) {
    // Overdue
    const label =
      totalDays > 0
        ? `${totalDays}d ${remHours}h overdue`
        : totalHours > 0
        ? `${totalHours}h ${remMins}m overdue`
        : `${totalMinutes}m overdue`;
    return { label, color: 'text-red-400', isOverdue: true, isUrgent: false };
  }

  if (totalMinutes < 60) {
    return { label: `${Math.max(totalMinutes, 1)}m left`, color: 'text-amber-400', isOverdue: false, isUrgent: true };
  }

  if (totalDays >= 2) {
    return { label: `${totalDays} days left`, color: 'text-off-white-muted', isOverdue: false, isUrgent: false };
  }

  const label = totalHours > 0 ? `${totalHours}h ${remMins}m left` : `${remMins}m left`;
  return { label, color: 'text-off-white-muted', isOverdue: false, isUrgent: false };
}

function formatDeadline(deadline: string): string {
  try {
    const d = new Date(deadline);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return deadline;
  }
}

function getDeadlineHelperText(deadline: string): string {
  if (!deadline) return '';
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return '';
  const diffMs = d.getTime() - Date.now();
  if (diffMs < 0) return 'In the past';
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const mins = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);
  return `${parts.join(' ')} from now`;
}

// ─── Urgency Group Config ─────────────────────────────────────────────────────

const GROUP_CONFIG: Record<UrgencyGroup, { label: string; headerColor: string; dotColor: string }> = {
  overdue: { label: 'Overdue',    headerColor: 'text-red-400',        dotColor: 'bg-red-500'       },
  today:   { label: 'Today',      headerColor: 'text-amber-400',      dotColor: 'bg-amber-400'     },
  this_week:{ label: 'This Week', headerColor: 'text-blue-400',       dotColor: 'bg-blue-400'      },
  later:   { label: 'Later',      headerColor: 'text-off-white-muted',dotColor: 'bg-gray-500'      },
  completed:{ label: 'Completed', headerColor: 'text-emerald-400',    dotColor: 'bg-emerald-500'   },
};

const STATUS_DISPLAY: Record<TaskStatus, { label: string; classes: string }> = {
  todo:        { label: 'Todo',        classes: 'bg-zinc-700/60 text-zinc-300 border-zinc-600/40'         },
  in_progress: { label: 'In Progress', classes: 'bg-blue-500/15 text-blue-300 border-blue-500/30'         },
  done:        { label: 'Done',        classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'},
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const TagChipDisplay: React.FC<{
  tag: string;
  onClick?: () => void;
  isActive?: boolean;
  onRemove?: () => void;
  maxChars?: number;
}> = ({ tag, onClick, isActive, onRemove, maxChars = 20 }) => {
  const palette = hashTagToColor(tag);
  const displayTag = tag.length > maxChars ? tag.slice(0, maxChars) + '…' : tag;

  return (
    <span
      title={tag}
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono border transition-all duration-150
        ${palette.bg} ${palette.text} ${palette.border}
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
        ${isActive ? 'ring-1 ring-white/30' : ''}
      `}
    >
      {displayTag}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="hover:opacity-60 transition-opacity"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
};

// ─── Task Card ────────────────────────────────────────────────────────────────

const TaskCard: React.FC<{
  task: ScheduledTask;
  onEdit: (task: ScheduledTask) => void;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
  tick: number; // triggers re-render for countdown
}> = ({ task, onEdit, onDelete, onTagClick, tick: _tick }) => {
  const countdown = getTimeLeft(task.deadline);
  const statusCfg = STATUS_DISPLAY[task.status];

  return (
    <div
      className="group relative bg-panel border border-border hover:border-accent/40 rounded-lg p-4 flex flex-col gap-3 transition-all duration-200 cursor-pointer animate-fade-in"
      style={{ boxShadow: 'none' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px rgba(124,58,237,0.1)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
      onClick={() => onEdit(task)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-mono font-semibold text-off-white leading-tight truncate">{task.title}</h4>
          {task.description && (
            <p className="text-[11px] text-off-white-muted mt-0.5 leading-snug line-clamp-1">{task.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded text-off-white-muted hover:text-accent hover:bg-accent/10 transition-colors"
            title="Edit task"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="p-1.5 rounded text-off-white-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
          {task.tags.map((tag) => (
            <TagChipDisplay key={tag} tag={tag} onClick={() => onTagClick(tag)} />
          ))}
        </div>
      )}

      {/* Footer: deadline + countdown + status */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex items-center gap-1 text-[10px] font-mono text-off-white-muted shrink-0">
            <CalendarClock className="w-3 h-3" />
            {formatDeadline(task.deadline)}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-mono font-semibold ${countdown.color} flex items-center gap-1`}>
            {countdown.isUrgent && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />}
            {countdown.isOverdue && <AlertTriangle className="w-3 h-3" />}
            {countdown.label}
          </span>

          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${statusCfg.classes}`}>
            {statusCfg.label}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── Urgency Section ──────────────────────────────────────────────────────────

const UrgencySection: React.FC<{
  group: UrgencyGroup;
  tasks: ScheduledTask[];
  onEdit: (task: ScheduledTask) => void;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
  tick: number;
  defaultCollapsed?: boolean;
}> = ({ group, tasks, onEdit, onDelete, onTagClick, tick, defaultCollapsed = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const cfg = GROUP_CONFIG[group];

  if (tasks.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Section header */}
      <button
        onClick={() => setIsCollapsed((p) => !p)}
        className="w-full flex items-center gap-2 py-1 group/header"
      >
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotColor}`} />
        <span className={`text-[11px] font-mono font-bold uppercase tracking-widest ${cfg.headerColor}`}>
          {cfg.label}
        </span>
        <span className="text-[9px] font-mono bg-card border border-border text-off-white-muted px-1.5 py-0.5 rounded">
          {tasks.length}
        </span>
        <span className="flex-1 border-t border-border/40 ml-1" />
        {isCollapsed
          ? <ChevronRight className="w-3.5 h-3.5 text-off-white-muted" />
          : <ChevronDown className="w-3.5 h-3.5 text-off-white-muted" />
        }
      </button>

      {/* Task list */}
      {!isCollapsed && (
        <div className="space-y-2 pl-3">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onTagClick={onTagClick}
              tick={tick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Tag Input ────────────────────────────────────────────────────────────────

const TagInput: React.FC<{
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}> = ({ tags, onChange, suggestions }) => {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  );

  const addTag = useCallback((raw: string) => {
    const tag = raw.trim();
    if (!tag || tags.includes(tag)) { setInput(''); return; }
    onChange([...tags, tag]);
    setInput('');
  }, [tags, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="relative">
      <div
        className="flex flex-wrap gap-1.5 p-2 bg-darkbg border border-border rounded focus-within:border-accent transition-colors min-h-[40px] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <TagChipDisplay key={tag} tag={tag} onRemove={() => onChange(tags.filter((t) => t !== tag))} />
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={tags.length === 0 ? 'Type a tag, press Enter or comma…' : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-xs font-mono text-off-white placeholder-off-white-muted/50"
        />
      </div>

      {/* Typeahead dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-panel border border-border rounded shadow-xl max-h-40 overflow-y-auto">
          {filteredSuggestions.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={() => addTag(s)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-off-white hover:bg-card transition-colors text-left"
            >
              <Tag className="w-3 h-3 text-accent shrink-0" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Task Form Panel ──────────────────────────────────────────────────────────

interface TaskFormData {
  title: string;
  description: string;
  deadline: string; // datetime-local value
  tags: string[];
  status: TaskStatus;
}

const EMPTY_FORM: TaskFormData = {
  title: '',
  description: '',
  deadline: '',
  tags: [],
  status: 'todo',
};

const TaskPanel: React.FC<{
  isOpen: boolean;
  editingTask: ScheduledTask | null;
  onClose: () => void;
  onSave: (data: TaskFormData) => Promise<void>;
  tagSuggestions: string[];
}> = ({ isOpen, editingTask, onClose, onSave, tagSuggestions }) => {
  const [form, setForm] = useState<TaskFormData>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});

  // Populate form when editing task changes
  useEffect(() => {
    if (editingTask) {
      // Convert ISO to datetime-local format: "YYYY-MM-DDTHH:MM"
      const deadlineLocal = editingTask.deadline
        ? new Date(editingTask.deadline).toISOString().slice(0, 16)
        : '';
      setForm({
        title: editingTask.title,
        description: editingTask.description || '',
        deadline: deadlineLocal,
        tags: editingTask.tags,
        status: editingTask.status,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [editingTask, isOpen]);

  const deadlineHelper = getDeadlineHelperText(form.deadline);

  const validate = (): boolean => {
    const errs: Partial<Record<keyof TaskFormData, string>> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.deadline) errs.deadline = 'Deadline is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'Todo' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-panel border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-accent">
            <ClipboardList className="w-4 h-4" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              {editingTask ? 'Edit Task' : 'New Task'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-off-white-muted hover:text-off-white hover:bg-card transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5 font-mono text-xs">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-wider text-off-white-muted">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Submit assignment, Fix the login bug…"
              className="w-full px-3 py-2.5 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent transition-colors placeholder-off-white-muted/40"
            />
            {errors.title && <p className="text-[9px] text-red-400">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional details, context, notes…"
              rows={3}
              className="w-full px-3 py-2.5 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent transition-colors resize-none placeholder-off-white-muted/40"
            />
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-wider text-off-white-muted">
              Deadline <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="w-full px-3 py-2.5 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent transition-colors [color-scheme:dark]"
            />
            {errors.deadline && <p className="text-[9px] text-red-400">{errors.deadline}</p>}
            {deadlineHelper && !errors.deadline && (
              <p className={`text-[9px] flex items-center gap-1 ${deadlineHelper === 'In the past' ? 'text-red-400' : 'text-off-white-muted'}`}>
                <Clock className="w-3 h-3" />
                {deadlineHelper}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Tags</label>
            <TagInput
              tags={form.tags}
              onChange={(tags) => setForm({ ...form, tags })}
              suggestions={tagSuggestions}
            />
            <p className="text-[9px] text-off-white-muted/60">Press Enter or comma to add. Same tag always gets same color.</p>
          </div>

          {/* Status — segmented control */}
          <div className="space-y-1.5">
            <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Status</label>
            <div className="flex rounded border border-border overflow-hidden">
              {STATUS_OPTIONS.map((opt, idx) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, status: opt.value })}
                  className={`flex-1 py-2 text-[10px] font-mono font-semibold transition-colors duration-150
                    ${idx > 0 ? 'border-l border-border' : ''}
                    ${form.status === opt.value
                      ? opt.value === 'done'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : opt.value === 'in_progress'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-accent/15 text-accent'
                      : 'bg-darkbg text-off-white-muted hover:bg-card hover:text-off-white'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Panel Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-card/30 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono rounded border border-border text-off-white-muted hover:bg-panel hover:text-off-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit as any}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-mono font-bold rounded bg-accent hover:bg-accent-dim text-white transition-colors disabled:opacity-60 flex items-center gap-1.5"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            {editingTask ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const TaskScheduler: React.FC = () => {
  const {
    tasks,
    isLoading,
    activeTagFilters,
    searchQuery,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    setTagFilter,
    clearTagFilters,
    setSearchQuery,
  } = useTaskStore();

  const [tick, setTick] = useState(0); // increment every minute to refresh countdowns
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Countdown ticker: updates every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Derived data ──

  // All unique tags across all tasks (for typeahead)
  const allTags = Array.from(new Set(tasks.flatMap((t) => t.tags))).sort();

  // Apply search + tag filters to a task list
  const applyFilters = (list: ScheduledTask[]): ScheduledTask[] => {
    return list.filter((task) => {
      const matchesSearch =
        !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTags =
        activeTagFilters.length === 0 ||
        activeTagFilters.every((f) => task.tags.includes(f));
      return matchesSearch && matchesTags;
    });
  };

  // Group tasks by urgencyGroup from server; fallback to client-side computation
  const grouped: Record<UrgencyGroup, ScheduledTask[]> = {
    overdue: [],
    today: [],
    this_week: [],
    later: [],
    completed: [],
  };

  for (const task of tasks) {
    const g = task.urgencyGroup || 'later';
    grouped[g].push(task);
  }

  // Completed sorted by updatedAt desc
  grouped.completed.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const totalActiveTasks = tasks.filter((t) => t.status !== 'done').length;
  const hasAnyTasks = tasks.length > 0;

  // ── Handlers ──

  const openCreatePanel = () => {
    setEditingTask(null);
    setIsPanelOpen(true);
  };

  const openEditPanel = (task: ScheduledTask) => {
    setEditingTask(task);
    setIsPanelOpen(true);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
    setEditingTask(null);
  };

  const handleSave = async (data: TaskFormData) => {
    // datetime-local string → ISO
    const deadlineISO = data.deadline ? new Date(data.deadline).toISOString() : '';
    const payload = {
      title: data.title,
      description: data.description,
      tags: data.tags,
      deadline: deadlineISO,
      status: data.status,
    };

    if (editingTask) {
      await updateTask(editingTask._id, payload);
    } else {
      await createTask(payload);
    }
  };

  const handleDeletePrompt = (id: string) => {
    setDeleteTargetId(id);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId) await deleteTask(deleteTargetId);
    setDeleteTargetId(null);
    setShowConfirm(false);
  };

  // ── Render ──

  const GROUP_ORDER: UrgencyGroup[] = ['overdue', 'today', 'this_week', 'later'];

  return (
    <div className="p-4 md:p-6 space-y-5 animate-fade-in select-none">
      {/* ── Page Header ── */}
      <div className="bg-panel border border-border rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-accent/15 border border-accent/30 text-accent">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-mono text-sm font-bold text-off-white tracking-wider">TASK_SCHEDULER</h1>
            <p className="text-[10px] text-off-white-muted mt-0.5">
              {totalActiveTasks} active task{totalActiveTasks !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <button
          onClick={openCreatePanel}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-dim text-white rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors glow-accent shrink-0"
        >
          <Plus className="w-3.5 h-3.5" /> New Task
        </button>
      </div>

      {/* ── Search + Active Tag Filters ── */}
      <div className="space-y-2">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-off-white-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks by title…"
            className="w-full pl-9 pr-4 py-2.5 bg-panel border border-border rounded text-xs font-mono text-off-white outline-none focus:border-accent transition-colors placeholder-off-white-muted/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-off-white-muted hover:text-off-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Active tag filter chips */}
        {activeTagFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-mono text-off-white-muted uppercase tracking-wider">Filtering by:</span>
            {activeTagFilters.map((tag) => (
              <TagChipDisplay
                key={tag}
                tag={tag}
                isActive
                onRemove={() => setTagFilter(tag)}
              />
            ))}
            <button
              onClick={clearTagFilters}
              className="text-[9px] font-mono text-off-white-muted hover:text-red-400 transition-colors flex items-center gap-0.5"
            >
              <X className="w-2.5 h-2.5" /> Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {isLoading && tasks.length === 0 ? (
        <div className="flex items-center justify-center py-20 gap-2 text-off-white-muted text-xs font-mono">
          <Loader2 className="w-4 h-4 animate-spin text-accent" />
          Loading tasks…
        </div>
      ) : !hasAnyTasks ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-panel border border-border rounded-lg animate-fade-in">
          <div className="p-4 rounded-full bg-accent/10 border border-accent/20">
            <ClipboardList className="w-8 h-8 text-accent/60" />
          </div>
          <div className="text-center">
            <p className="text-sm font-mono font-semibold text-off-white">No tasks yet</p>
            <p className="text-xs text-off-white-muted mt-1">Create your first task to get started</p>
          </div>
          <button
            onClick={openCreatePanel}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-accent hover:bg-accent-dim text-white rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors glow-accent"
          >
            <Plus className="w-3.5 h-3.5" /> Create your first task
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active urgency groups */}
          {GROUP_ORDER.map((group) => {
            const filtered = applyFilters(grouped[group]);
            return (
              <UrgencySection
                key={group}
                group={group}
                tasks={filtered}
                onEdit={openEditPanel}
                onDelete={handleDeletePrompt}
                onTagClick={setTagFilter}
                tick={tick}
              />
            );
          })}

          {/* Completed section — collapsed by default */}
          {grouped.completed.length > 0 && (
            <UrgencySection
              group="completed"
              tasks={applyFilters(grouped.completed)}
              onEdit={openEditPanel}
              onDelete={handleDeletePrompt}
              onTagClick={setTagFilter}
              tick={tick}
              defaultCollapsed
            />
          )}

          {/* No results after filter */}
          {GROUP_ORDER.every((g) => applyFilters(grouped[g]).length === 0) &&
            applyFilters(grouped.completed).length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <Search className="w-6 h-6 text-off-white-muted/40" />
                <p className="text-xs font-mono text-off-white-muted">No tasks match your current filters</p>
                <button
                  onClick={() => { clearTagFilters(); setSearchQuery(''); }}
                  className="text-[10px] font-mono text-accent hover:underline"
                >
                  Clear filters
                </button>
              </div>
            )}
        </div>
      )}

      {/* ── Slide-in Task Panel ── */}
      <TaskPanel
        isOpen={isPanelOpen}
        editingTask={editingTask}
        onClose={closePanel}
        onSave={handleSave}
        tagSuggestions={allTags}
      />

      {/* ── Confirm Delete Modal ── */}
      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Task"
        message="Are you sure you want to permanently delete this task? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => { setShowConfirm(false); setDeleteTargetId(null); }}
        confirmText="Delete Task"
      />
    </div>
  );
};

export default TaskScheduler;
