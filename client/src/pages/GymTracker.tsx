import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dumbbell,
  Clock,
  Notebook,
  Plus,
  Save,
  Flame,
  Camera,
  Upload,
  X,
  History,
  ChevronDown,
  ChevronUp,
  Copy,
  Sparkles,
} from 'lucide-react';
import { useGymStore, useDateStore, useReferenceStore } from '../store';
import { startOfWeek, endOfWeek, parseISO, format } from 'date-fns';
import { GymExercise, GymSet } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ExerciseCard } from '../components/gym/ExerciseCard';
import { LazyGif } from '../components/gym/LazyGif';
import { GymAnalyticsCharts } from '../components/gym/GymAnalyticsCharts';
import { nativeConfirm } from '../utils/dialog';

const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  sets: z.coerce.number().min(1, 'Min 1 set'),
  reps: z.coerce.number().min(1, 'Min 1 rep'),
  weight: z.coerce.number().min(0, 'Min 0 weight'),
  unit: z.enum(['kg', 'lbs']),
  notes: z.string().optional(),
});

type ExerciseFormValues = z.infer<typeof exerciseSchema>;

const COMMON_SPLITS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Rest'];

export const GymTracker: React.FC = () => {
  const selectedDate = useDateStore((state) => state.selectedDate);

  // Zustand Store
  const {
    session,
    historySessions,
    loading,
    fetchSession,
    fetchWeeklySessions,
    fetchHistorySessions,
    saveSession,
    deleteSession,
  } = useGymStore();

  // Local Exercises State (for drafting workouts before saving)
  const [exercises, setExercises] = useState<GymExercise[]>([]);
  const [duration, setDuration] = useState<number>(0);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  // New Fields: Split & Body Weight
  const [split, setSplit] = useState<string>('');
  const [bodyWeight, setBodyWeight] = useState<number | ''>('');

  // Search Suggestions State
  const [bodyPartQuery, setBodyPartQuery] = useState('');
  const [debouncedBodyPartQuery, setDebouncedBodyPartQuery] = useState('');
  const [exerciseSuggestions, setExerciseSuggestions] = useState<Record<string, any[]>>({});
  const [selectedExerciseRef, setSelectedExerciseRef] = useState<any | null>(null);

  // History expansion toggles
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Custom mantra state
  const [isEditingMantra, setIsEditingMantra] = useState(false);
  const [mantraValue, setMantraValue] = useState(() => {
    return localStorage.getItem('gym-user-mantra') || '';
  });

  const handleSaveMantra = () => {
    localStorage.setItem('gym-user-mantra', mantraValue);
    setIsEditingMantra(false);
  };

  // Exercise Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: '',
      sets: 3,
      reps: 10,
      weight: 60,
      unit: 'kg',
      notes: '',
    },
  });

  // Load session data when date changes
  useEffect(() => {
    fetchSession(selectedDate);
    fetchHistorySessions();

    // Load weekly sessions for analytics panel
    const parsedDate = parseISO(selectedDate);
    const start = format(startOfWeek(parsedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const end = format(endOfWeek(parsedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    fetchWeeklySessions(start, end);
  }, [selectedDate, fetchSession, fetchWeeklySessions, fetchHistorySessions]);

  // Sync session state to draft state when it loads
  useEffect(() => {
    if (session) {
      setExercises(session.exercises || []);
      setDuration(session.durationMinutes || 0);
      setSessionNotes(session.notes || '');
      setPhotos(session.photos || []);
      setSplit(session.split || '');
      setBodyWeight(session.bodyWeight || '');
    } else {
      setExercises([]);
      setDuration(0);
      setSessionNotes('');
      setPhotos([]);
      setSplit('');
      setBodyWeight('');
    }
  }, [session]);

  // Debounce exercise search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBodyPartQuery(bodyPartQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [bodyPartQuery]);

  // Query exercise dataset matching body part query
  const searchExercises = useReferenceStore((state) => state.searchExercises);
  useEffect(() => {
    if (debouncedBodyPartQuery.trim().length < 2) {
      setExerciseSuggestions({});
      return;
    }
    const fetchMatches = async () => {
      const results = await searchExercises(debouncedBodyPartQuery);
      setExerciseSuggestions(results);
    };
    fetchMatches();
  }, [debouncedBodyPartQuery, searchExercises]);

  // Add exercise to local list
  const onAddExercise = (values: ExerciseFormValues) => {
    // Generate initial structured sets array
    const defaultSets: GymSet[] = Array.from({ length: Number(values.sets || 3) }, () => ({
      weight: Number(values.weight) || undefined,
      reps: Number(values.reps) || undefined,
      feel: '',
    }));

    // Attach reference dataset details if exercise names match
    const hasRefMatch = selectedExerciseRef && selectedExerciseRef.name.toLowerCase() === values.name.toLowerCase();

    setExercises((prev) => [
      ...prev,
      {
        name: values.name,
        sets: defaultSets,
        unit: values.unit,
        notes: values.notes || '',
        gifUrl: hasRefMatch ? selectedExerciseRef.gifUrl : undefined,
        bodyPart: hasRefMatch ? selectedExerciseRef.bodyPart : undefined,
      },
    ]);
    reset({ name: '', sets: 3, reps: 10, weight: 60, unit: 'kg', notes: '' });
    setSelectedExerciseRef(null);
  };

  // Editable card handlers passed down
  const handleUpdateSet = (exerciseIdx: number, setIdx: number, fields: Partial<GymSet>) => {
    setExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx === exerciseIdx) {
          const newSets = ex.sets.map((set, sIdx) =>
            sIdx === setIdx ? { ...set, ...fields } : set
          );
          return { ...ex, sets: newSets };
        }
        return ex;
      })
    );
  };

  const handleAddSet = (exerciseIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx === exerciseIdx) {
          // Carry over last set details as starting template to make input convenient
          const lastSet = ex.sets[ex.sets.length - 1];
          return {
            ...ex,
            sets: [
              ...ex.sets,
              {
                weight: lastSet?.weight,
                reps: lastSet?.reps,
                feel: '',
              },
            ],
          };
        }
        return ex;
      })
    );
  };

  const handleRemoveSet = (exerciseIdx: number, setIdx: number) => {
    setExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx === exerciseIdx) {
          return {
            ...ex,
            sets: ex.sets.filter((_, sIdx) => sIdx !== setIdx),
          };
        }
        return ex;
      })
    );
  };

  const handleUpdateNotes = (exerciseIdx: number, notes: string) => {
    setExercises((prev) =>
      prev.map((ex, idx) => (idx === exerciseIdx ? { ...ex, notes } : ex))
    );
  };

  const handleRemoveExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit complete session to DB
  const handleSaveSession = async () => {
    // Treat exercises with zero sets as a no-op / filter them out
    const validExercises = exercises.filter((ex) => ex.sets && ex.sets.length > 0);

    // Save session payload
    await saveSession(selectedDate, {
      exercises: validExercises,
      durationMinutes: Number(duration) || 0,
      notes: sessionNotes,
      photos,
      split: split.trim() || undefined,
      bodyWeight: bodyWeight === '' ? undefined : Number(bodyWeight),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);

    // Refresh weekly analytics & history
    const parsedDate = parseISO(selectedDate);
    const start = format(startOfWeek(parsedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const end = format(endOfWeek(parsedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    fetchWeeklySessions(start, end);
    fetchHistorySessions();
  };

  // Clear / delete session
  const handleDeleteSession = async () => {
    const confirmed = await nativeConfirm('Delete this workout session?', 'Delete Session');
    if (confirmed) {
      await deleteSession(selectedDate);
      setExercises([]);
      setDuration(0);
      setSessionNotes('');
      setPhotos([]);
      setSplit('');
      setBodyWeight('');
      fetchHistorySessions();
    }
  };

  // Find previous day history (most recent session before selected date)
  const previousSession = historySessions
    .filter((s) => s.date < selectedDate)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  const handleCopyFromPrevious = async () => {
    if (previousSession) {
      const confirmed = await nativeConfirm('Copy all exercises from previous session to today?', 'Copy Lifts');
      if (confirmed) {
        setExercises(previousSession.exercises || []);
        setDuration(previousSession.durationMinutes || 0);
        setSessionNotes(previousSession.notes || '');
        setSplit(previousSession.split || '');
        setBodyWeight(previousSession.bodyWeight || '');
      }
    }
  };

  // Photo compression utility
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCompressing(true);
    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setPhotos((prev) => [...prev, compressedBase64]);
        }
        setCompressing(false);
      };
      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (idx: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };



  if (loading && !session) {
    return <LoadingSpinner message="Reconstructing gym training matrices..." />;
  }

  return (
    <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 select-none animate-fade-in pb-6">
      {/* LEFT COLUMN: Active Gym Sheet (7 cols) */}
      <div className="xl:col-span-8 space-y-6">
        {/* Workout header controls */}
        <div className="bg-panel border border-border rounded-lg p-5 space-y-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-5 h-5 text-accent animate-bounce" />
              <h2 className="font-mono text-sm font-bold text-off-white">WORKOUT_LOGGER</h2>
            </div>

            <div className="flex gap-2">
              {exercises.length > 0 && (
                <button
                  onClick={handleDeleteSession}
                  className="px-3 py-1.5 border border-red-500/30 hover:border-red-500 text-red-400 rounded text-xs font-mono transition-colors"
                >
                  Reset Session
                </button>
              )}
              <button
                onClick={handleSaveSession}
                className={`px-4 py-1.5 rounded text-xs font-mono font-bold uppercase flex items-center gap-1.5 transition-all duration-150 ${
                  saveSuccess
                    ? 'bg-emerald-500 text-darkbg'
                    : 'bg-accent hover:bg-accent-dim text-darkbg hover:text-off-white glow-accent'
                }`}
              >
                {saveSuccess ? (
                  <span>SAVED_SUCCESSFULLY</span>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>SAVE_SESSION</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Personal Mantra Banner */}
          <div className="p-3.5 bg-card/60 border border-border/80 rounded space-y-1.5 font-mono animate-fade-in">
            <span className="text-[9px] uppercase tracking-wider text-off-white-muted block">
              Personal Mantra / Daily Target
            </span>

            {isEditingMantra ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mantraValue}
                  onChange={(e) => setMantraValue(e.target.value)}
                  onBlur={handleSaveMantra}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveMantra();
                  }}
                  placeholder="Set today's fitness mantra / target"
                  className="flex-1 px-3 py-1.5 bg-darkbg border border-accent rounded text-off-white text-xs outline-none focus:ring-1 focus:ring-accent"
                  autoFocus
                />
                <button
                  onClick={handleSaveMantra}
                  className="px-3 py-1.5 bg-accent text-darkbg font-bold rounded text-[10px] hover:bg-accent-dim hover:text-off-white transition-all uppercase tracking-wider"
                >
                  Save
                </button>
              </div>
            ) : mantraValue ? (
              <div
                onClick={() => setIsEditingMantra(true)}
                className="flex items-center justify-between p-3.5 rounded bg-darkbg/45 hover:bg-darkbg/85 border border-border/60 hover:border-accent/45 cursor-pointer group transition-all duration-200"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-accent animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent via-purple-300 to-accent tracking-wide font-mono break-words">
                      "{mantraValue}"
                    </p>
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold text-accent border border-accent/20 bg-accent/5 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 group-hover:bg-accent group-hover:text-darkbg transition-all ml-2 shrink-0">
                  EDIT
                </span>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingMantra(true)}
                className="flex items-center justify-between p-3.5 rounded bg-darkbg/40 hover:bg-darkbg/70 cursor-pointer border border-dashed border-border hover:border-accent/40 group transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-off-white-muted group-hover:text-accent transition-colors" />
                  <p className="text-xs text-off-white-muted italic">
                    Set today's fitness mantra / target (e.g. 'Pushing for 100kg Bench!')
                  </p>
                </div>
                <span className="text-[10px] text-accent font-mono border border-accent/20 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity uppercase">
                  + Add
                </span>
              </div>
            )}
          </div>

          {/* Workout Split Selector */}
          <div className="p-3.5 bg-card/40 border border-border/70 rounded space-y-2 font-mono">
            <span className="text-[9px] uppercase tracking-wider text-off-white-muted block">
              Workout Split / Day Category
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SPLITS.map((s) => {
                const isActive = split === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSplit(isActive ? '' : s)}
                    className={`px-2 py-1 border text-[9px] font-bold uppercase rounded transition-colors ${
                      isActive
                        ? 'bg-accent/20 border-accent text-accent'
                        : 'bg-darkbg border-border text-off-white-muted hover:border-accent/40'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              placeholder="Custom split name (e.g. Arms + Core)"
              value={split}
              onChange={(e) => setSplit(e.target.value)}
              className="w-full px-3 py-1.5 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent text-xs"
            />
          </div>

          {/* Session Metadata fields: Duration + Body Weight + Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-3 space-y-1">
              <label className="text-[10px] font-mono text-off-white-muted uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-accent" /> Duration (mins)
              </label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent text-xs font-mono"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="text-[10px] font-mono text-off-white-muted uppercase tracking-wider flex items-center gap-1">
                <Dumbbell className="w-3 h-3 text-accent" /> Body Weight (kg)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 75.5"
                className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent text-xs font-mono"
                value={bodyWeight}
                onChange={(e) => setBodyWeight(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>

            <div className="sm:col-span-6 space-y-1">
              <label className="text-[10px] font-mono text-off-white-muted uppercase tracking-wider flex items-center gap-1">
                <Notebook className="w-3 h-3 text-accent" /> Workout / Session Notes
              </label>
              <input
                type="text"
                placeholder="Felt strong, squatted deep..."
                className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent text-xs font-mono"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Reference Movement Lookup Box */}
          <div className="p-4 bg-card border border-border rounded space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-wider text-[10px]">
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Search Movements by Body Part</span>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Type body part (e.g. chest, legs, shoulders, back...)"
                value={bodyPartQuery}
                onChange={(e) => setBodyPartQuery(e.target.value)}
                className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent text-xs"
              />
            </div>

            {Object.keys(exerciseSuggestions).length > 0 && (
              <div className="mt-3 bg-darkbg border border-border/80 rounded p-3 space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {Object.entries(exerciseSuggestions).map(([muscle, items]) => (
                  <div key={muscle} className="space-y-2">
                    <h5 className="text-[9px] font-bold text-accent uppercase tracking-wider border-b border-border/40 pb-0.5">
                      {muscle}
                    </h5>
                    <div className="space-y-2">
                      {items.map((ex) => (
                        <div
                          key={ex._id}
                          className="flex items-center justify-between p-2 bg-card border border-border/60 hover:border-accent/40 rounded transition-all gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Lazy-loaded Hover-to-Play GIF */}
                            <LazyGif src={ex.gifUrl} alt={ex.name} />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-off-white truncate">{ex.name}</p>
                              <p className="text-[8px] text-off-white-muted uppercase mt-0.5">
                                Equipment: {ex.equipment || 'none'} | Diff: {ex.difficulty || 'medium'}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setValue('name', ex.name);
                                setSelectedExerciseRef(ex);
                              }}
                              className="px-2.5 py-1 border border-border hover:border-accent/40 text-off-white hover:text-accent rounded text-[9px] font-bold uppercase transition-all"
                            >
                              Select
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const defaultSets = Array.from({ length: 3 }, () => ({
                                  weight: 60,
                                  reps: 10,
                                  feel: '',
                                }));
                                setExercises((prev) => [
                                  ...prev,
                                  {
                                    name: ex.name,
                                    sets: defaultSets,
                                    unit: 'kg',
                                    notes: '',
                                    gifUrl: ex.gifUrl,
                                    bodyPart: ex.bodyPart,
                                  },
                                ]);
                              }}
                              className="px-2.5 py-1 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded text-[9px] font-bold uppercase transition-all"
                            >
                              + Quick Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form to add custom/pre-filled exercises */}
          <form onSubmit={handleSubmit(onAddExercise)} className="p-4 bg-card border border-border rounded space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-wider text-[10px]">
              <Plus className="w-3.5 h-3.5" />
              <span>Record Lift Detail</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Exercise Name */}
              <div className="sm:col-span-4 space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Exercise Name</label>
                <input
                  type="text"
                  placeholder="e.g. Bench Press, Squats"
                  className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent text-xs"
                  {...register('name')}
                />
                {errors.name && <p className="text-[9px] text-red-400">{errors.name.message}</p>}
              </div>

              {/* Sets */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Sets</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent text-xs"
                  {...register('sets')}
                />
              </div>

              {/* Reps */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Reps</label>
                <input
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent text-xs"
                  {...register('reps')}
                />
              </div>

              {/* Weight */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Weight</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent text-xs"
                  {...register('weight')}
                />
              </div>

              {/* Unit Toggle */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Unit</label>
                <select
                  className="w-full px-2 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent text-xs"
                  {...register('unit')}
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>

            {/* Exercise-specific notes */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-10 space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-off-white-muted">Exercise Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Set 4 felt like RPE 9"
                  className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent text-xs"
                  {...register('notes')}
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="w-full py-2 bg-accent text-darkbg hover:bg-accent-dim hover:text-off-white rounded font-bold uppercase tracking-wider transition-colors text-xs"
                >
                  Add Lift
                </button>
              </div>
            </div>
          </form>

          {/* Evolved Structured Exercise Log Card List */}
          <div className="space-y-4 pt-2">
            {exercises.length === 0 ? (
              <div className="py-12 border border-dashed border-border rounded text-center text-xs font-mono text-off-white-muted uppercase">
                No lifts recorded today. Enter exercise details above to build your session.
              </div>
            ) : (
              exercises.map((ex, idx) => (
                <ExerciseCard
                  key={ex._id || idx}
                  ex={ex}
                  index={idx}
                  onRemove={handleRemoveExercise}
                  onUpdateSet={handleUpdateSet}
                  onAddSet={handleAddSet}
                  onRemoveSet={handleRemoveSet}
                  onUpdateNotes={handleUpdateNotes}
                />
              ))
            )}
          </div>
        </div>

        {/* Workout History Card */}
        <div className="bg-panel border border-border rounded-lg p-5 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-accent animate-pulse" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">Previous Session</h3>
            </div>
            {previousSession && (
              <span className="text-[9px] font-mono text-off-white-muted uppercase">
                {previousSession.date}
              </span>
            )}
          </div>

          {/* Previous Session Info */}
          {previousSession ? (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-card border border-border rounded space-y-2">
                <div className="flex justify-between text-[10px] text-off-white-muted uppercase border-b border-border pb-1">
                  <span>Duration: {previousSession.durationMinutes} mins</span>
                  <span>{previousSession.exercises.length} lifts</span>
                </div>
                <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1 text-[10px]">
                  {previousSession.exercises.map((ex, idx) => (
                    <div key={idx} className="flex justify-between items-center text-off-white-muted">
                      <span className="truncate max-w-[150px]">{ex.name}</span>
                      <span>
                        {ex.sets.length} sets @ {ex.sets[0]?.weight || 0} {ex.unit}
                      </span>
                    </div>
                  ))}
                </div>
                {previousSession.notes && (
                  <div className="text-[9px] text-off-white-muted border-t border-border pt-1 italic truncate">
                    Notes: {previousSession.notes}
                  </div>
                )}
              </div>

              {/* Copy Template Option */}
              <button
                onClick={handleCopyFromPrevious}
                className="w-full py-1.5 bg-card border border-border hover:border-accent/40 hover:text-accent rounded font-mono text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Copy exercises to today's template"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Lifts as Template</span>
              </button>
            </div>
          ) : (
            <div className="py-6 border border-dashed border-border rounded text-center p-3 text-[10px] font-mono text-off-white-muted uppercase">
              No previous session found
            </div>
          )}

          {/* Check Full History Options Toggle */}
          <div className="border-t border-border pt-3 space-y-3">
            <button
              onClick={() => setShowFullHistory(!showFullHistory)}
              className="w-full flex items-center justify-between text-[10px] font-mono text-off-white hover:text-accent font-bold uppercase tracking-wider"
            >
              <span>{showFullHistory ? 'Hide Full History' : 'Check Full History'}</span>
              {showFullHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showFullHistory && (
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {historySessions.length === 0 ? (
                  <div className="text-center text-[9px] font-mono text-off-white-muted uppercase py-4">
                    No history log available.
                  </div>
                ) : (
                  historySessions
                    .filter((s) => s.date !== selectedDate) // Hide current day from history log
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((s) => {
                      const isExpanded = expandedSessionId === s._id;
                      return (
                        <div key={s._id} className="border border-border rounded bg-card/30 overflow-hidden font-mono text-[10px]">
                          <button
                            onClick={() => setExpandedSessionId(isExpanded ? null : s._id)}
                            className="w-full p-2 hover:bg-card flex justify-between items-center text-left text-off-white border-b border-transparent hover:border-border transition-all"
                          >
                            <span className="font-bold">{s.date}</span>
                            <div className="flex items-center gap-2 text-[9px] text-off-white-muted">
                              <span>{s.exercises.length} lifts</span>
                              <span>{s.durationMinutes}m</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="p-2.5 bg-darkbg space-y-1.5 border-t border-border animate-fade-in text-[9px] text-off-white-muted">
                              {s.exercises.map((ex, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span>{ex.name}</span>
                                  <span>
                                    {ex.sets.length} sets @ {ex.sets[0]?.weight || 0} {ex.unit}
                                  </span>
                                </div>
                              ))}
                              {s.notes && (
                                <div className="border-t border-border/50 pt-1 italic text-[8px] text-off-white-muted">
                                  Notes: {s.notes}
                                </div>
                              )}
                              <button
                                onClick={async () => {
                                  const confirmed = await nativeConfirm(`Copy exercises from ${s.date} to today?`, 'Use Lifts');
                                  if (confirmed) {
                                    setExercises(s.exercises || []);
                                    setDuration(s.durationMinutes || 0);
                                    setSessionNotes(s.notes || '');
                                    setSplit(s.split || '');
                                    setBodyWeight(s.bodyWeight || '');
                                  }
                                }}
                                className="w-full mt-2 py-1 bg-card border border-border/55 hover:border-accent/40 text-[8px] hover:text-accent rounded uppercase text-center font-bold flex items-center justify-center gap-1 transition-all"
                              >
                                <Copy className="w-2.5 h-2.5" /> Use Lifts
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Weekly Analytics Panel (4 cols) */}
      <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-24 xl:self-start">
        {/* Motivation Module Card */}
        <div className="bg-panel border border-border rounded-lg p-5 space-y-4 glow-accent animate-fade-in">
          <div className="flex items-center gap-2 border-b border-border pb-3 text-accent">
            <Flame className="w-4 h-4 animate-pulse" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider">Motivation Module</h3>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-mono italic leading-relaxed text-off-white">
              "Discipline is choosing between what you want now and what you want most. Focus on the gains, crush the reps!"
            </p>
          </div>
        </div>

        {/* Visual Progress Gallery Card */}
        <div className="bg-panel border border-border rounded-lg p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-accent animate-pulse" />
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">Visual Progress</h3>
            </div>
            {photos.length > 0 && (
              <span className="text-[10px] font-mono text-off-white-muted uppercase">
                {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
              </span>
            )}
          </div>

          {/* Photos Grid */}
          {photos.length === 0 ? (
            <div className="py-8 border border-dashed border-border rounded flex flex-col items-center justify-center text-center p-4">
              <Camera className="w-6 h-6 text-off-white-muted mb-2 opacity-40" />
              <span className="text-[10px] font-mono text-off-white-muted uppercase">No progress photos recorded</span>
              <span className="text-[9px] text-off-white-muted opacity-60 mt-1 max-w-[200px]">
                Upload everyday track photos to visualize your gains.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative aspect-square rounded overflow-hidden border border-border group cursor-pointer bg-card">
                  <img
                    src={photo}
                    alt={`Gym Track ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onClick={() => setActivePhoto(photo)}
                  />
                  <button
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded transition-colors opacity-0 group-hover:opacity-100 animate-fade-in"
                    title="Remove Photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Trigger */}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              id="gym-photo-upload"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={compressing}
            />
            <label
              htmlFor="gym-photo-upload"
              className={`w-full py-2 bg-card border border-border hover:border-accent/40 rounded font-mono text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                compressing ? 'opacity-55 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-accent" />
              <span>{compressing ? 'COMPRESSING_PHOTO...' : 'SYS_UPLOAD_PHOTO'}</span>
            </label>
          </div>
        </div>

        {/* Visual Recharts Analytics Dashboard */}
        <GymAnalyticsCharts
          historySessions={historySessions}
          activeExercises={exercises}
        />
      </div>

      {/* Full View Modal Overlay */}
      {activePhoto && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 select-none pointer-events-auto cursor-zoom-out"
          onClick={() => setActivePhoto(null)}
        >
          <div className="relative max-w-full max-h-full flex items-center justify-center pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <img
              src={activePhoto}
              alt="Gym Track Full View"
              className="max-w-full max-h-[90vh] object-contain rounded border border-border shadow-2xl"
            />
            <button
              onClick={() => setActivePhoto(null)}
              className="absolute -top-10 right-0 p-1.5 bg-card hover:bg-card-hover border border-border text-off-white rounded-full transition-colors flex items-center justify-center"
              title="Close View"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default GymTracker;
