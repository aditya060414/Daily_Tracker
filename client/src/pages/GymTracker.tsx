import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dumbbell,
  Clock,
  Notebook,
  Plus,
  Trash2,
  Save,
  Flame,
  Award,
  PieChart,
} from 'lucide-react';
import { useGymStore, useDateStore } from '../store';
import { startOfWeek, endOfWeek, parseISO, format } from 'date-fns';
import { GymExercise } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required'),
  sets: z.coerce.number().min(1, 'Min 1 set'),
  reps: z.coerce.number().min(1, 'Min 1 rep'),
  weight: z.coerce.number().min(0, 'Min 0 weight'),
  unit: z.enum(['kg', 'lbs']),
  notes: z.string().optional(),
});

type ExerciseFormValues = z.infer<typeof exerciseSchema>;

export const GymTracker: React.FC = () => {
  const selectedDate = useDateStore((state) => state.selectedDate);

  // Zustand Store
  const { session, weeklySessions, loading, fetchSession, fetchWeeklySessions, saveSession, deleteSession } = useGymStore();

  // Local Exercises State (for drafting workouts before saving)
  const [exercises, setExercises] = useState<GymExercise[]>([]);
  const [duration, setDuration] = useState<number>(0);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Exercise Form
  const {
    register,
    handleSubmit,
    reset,
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

    // Load weekly sessions for analytics panel
    const parsedDate = parseISO(selectedDate);
    const start = format(startOfWeek(parsedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const end = format(endOfWeek(parsedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    fetchWeeklySessions(start, end);
  }, [selectedDate, fetchSession, fetchWeeklySessions]);

  // Sync session state to draft state when it loads
  useEffect(() => {
    if (session) {
      setExercises(session.exercises || []);
      setDuration(session.durationMinutes || 0);
      setSessionNotes(session.notes || '');
    } else {
      setExercises([]);
      setDuration(0);
      setSessionNotes('');
    }
  }, [session]);

  // Add exercise to local list
  const onAddExercise = (values: ExerciseFormValues) => {
    setExercises((prev) => [
      ...prev,
      {
        name: values.name,
        sets: Number(values.sets),
        reps: Number(values.reps),
        weight: Number(values.weight),
        unit: values.unit,
        notes: values.notes || '',
      },
    ]);
    reset({ name: '', sets: 3, reps: 10, weight: 60, unit: 'kg', notes: '' });
  };

  // Remove exercise from local list
  const handleRemoveExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit complete session to DB
  const handleSaveSession = async () => {
    await saveSession(selectedDate, {
      exercises,
      durationMinutes: Number(duration) || 0,
      notes: sessionNotes,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);

    // Refresh weekly analytics
    const parsedDate = parseISO(selectedDate);
    const start = format(startOfWeek(parsedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const end = format(endOfWeek(parsedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    fetchWeeklySessions(start, end);
  };

  // Clear / delete session
  const handleDeleteSession = async () => {
    if (window.confirm('Delete this workout session?')) {
      await deleteSession(selectedDate);
      setExercises([]);
      setDuration(0);
      setSessionNotes('');
    }
  };

  // Analytics Math: Muscle Group Auto-Mapping
  const mapMuscleGroup = (exerciseName: string): string => {
    const name = exerciseName.toLowerCase();
    if (name.includes('bench') || name.includes('chest') || name.includes('fly') || name.includes('pushup')) {
      return 'Chest';
    }
    if (name.includes('squat') || name.includes('leg') || name.includes('calf') || name.includes('hamstring') || name.includes('quad') || name.includes('lunge')) {
      return 'Legs';
    }
    if (name.includes('pullup') || name.includes('row') || name.includes('lat') || name.includes('deadlift') || name.includes('back')) {
      return 'Back';
    }
    if (name.includes('press') || name.includes('lateral') || name.includes('raise') || name.includes('shoulder')) {
      return 'Shoulders';
    }
    if (name.includes('curl') || name.includes('tricep') || name.includes('bicep') || name.includes('arm') || name.includes('extension')) {
      return 'Arms';
    }
    if (name.includes('crunch') || name.includes('plank') || name.includes('abs') || name.includes('situp') || name.includes('core')) {
      return 'Core';
    }
    return 'Other';
  };

  // Compute Volume & Frequencies for the week
  const gymSessionsThisWeekCount = weeklySessions.length;
  let weeklyVolumeKg = 0;
  const muscleGroupFrequencies: Record<string, number> = {};

  weeklySessions.forEach((s) => {
    s.exercises.forEach((ex) => {
      // Calculate volume converting lbs to kg for consistency (1 kg = 2.20462 lbs)
      const weightInKg = ex.unit === 'lbs' ? ex.weight / 2.20462 : ex.weight;
      weeklyVolumeKg += ex.sets * ex.reps * weightInKg;

      // Group muscles
      const group = mapMuscleGroup(ex.name);
      muscleGroupFrequencies[group] = (muscleGroupFrequencies[group] || 0) + ex.sets;
    });
  });

  if (loading && !session) {
    return <LoadingSpinner message="Reconstructing gym training matrices..." />;
  }

  return (
    <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 select-none animate-fade-in pb-20 md:pb-6">
      {/* LEFT COLUMN: Active Gym Sheet (7 cols) */}
      <div className="xl:col-span-8 space-y-6">
        {/* Workout header controls */}
        <div className="bg-panel border border-border rounded-lg p-5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-border pb-4 mb-4">
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

          {/* Session Metadata fields: Duration + Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-6">
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
            
            <div className="sm:col-span-9 space-y-1">
              <label className="text-[10px] font-mono text-off-white-muted uppercase tracking-wider flex items-center gap-1">
                <Notebook className="w-3 h-3 text-accent" /> Workout / Session Notes
              </label>
              <input
                type="text"
                placeholder="Felt strong, squatted deep, warm up took 10 mins..."
                className="w-full px-3 py-2 bg-darkbg border border-border rounded text-off-white outline-none focus:border-accent text-xs font-mono"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Inline Add Exercise Form */}
          <form onSubmit={handleSubmit(onAddExercise)} className="p-4 bg-card border border-border rounded space-y-3 font-mono text-xs mb-6">
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

          {/* Exercise Log Grid */}
          <div className="border border-border rounded overflow-hidden">
            <div className="grid grid-cols-12 gap-2 bg-card border-b border-border px-4 py-2 font-mono text-[10px] uppercase text-off-white-muted font-bold">
              <div className="col-span-5">Exercise Lift</div>
              <div className="col-span-3 text-center">Sets &times; Reps</div>
              <div className="col-span-3 text-right">Weight</div>
              <div className="col-span-1"></div>
            </div>

            <div className="divide-y divide-border">
              {exercises.length === 0 ? (
                <div className="py-12 text-center text-xs font-mono text-off-white-muted">
                  No lifts recorded today. Enter exercise details above to build your session.
                </div>
              ) : (
                exercises.map((ex, idx) => (
                  <div key={idx} className="flex flex-col px-4 py-3 hover:bg-card/20 transition-colors">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5 flex flex-col">
                        <span className="text-xs font-bold text-off-white">{ex.name}</span>
                        {ex.notes && <span className="text-[9px] text-off-white-muted mt-0.5">{ex.notes}</span>}
                      </div>
                      
                      <div className="col-span-3 text-center font-mono text-xs text-off-white">
                        {ex.sets} &times; {ex.reps}
                      </div>

                      <div className="col-span-3 text-right font-mono text-xs text-accent">
                        {ex.weight} <span className="text-[9px] text-off-white-muted uppercase">{ex.unit}</span>
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          onClick={() => handleRemoveExercise(idx)}
                          className="p-1 text-off-white-muted hover:text-red-400 transition-colors rounded"
                          title="Remove Exercise"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Weekly Analytics Panel (4 cols) */}
      <div className="xl:col-span-4 space-y-6">
        <div className="bg-panel border border-border rounded-lg p-5 space-y-5">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <PieChart className="w-4 h-4 text-accent" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">Training Analytics (Week)</h3>
          </div>

          {/* Stat 1: Days Trained */}
          <div className="p-4 bg-card border border-border rounded flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono uppercase tracking-wider text-off-white-muted">Days Active</span>
              <span className="text-lg font-mono font-bold text-off-white">
                {gymSessionsThisWeekCount} <span className="text-xs text-off-white-muted">/ 7</span>
              </span>
            </div>
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Flame className="w-5 h-5" />
            </div>
          </div>

          {/* Stat 2: Total Volume */}
          <div className="p-4 bg-card border border-border rounded flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-mono uppercase tracking-wider text-off-white-muted">Total Volume</span>
              <span className="text-lg font-mono font-bold text-off-white">
                {Math.round(weeklyVolumeKg)} <span className="text-xs text-off-white-muted">kg</span>
              </span>
            </div>
            <div className="p-2 rounded bg-accent/10 border border-accent/20 text-accent">
              <Award className="w-5 h-5" />
            </div>
          </div>

          {/* Muscle Group Frequency Tags */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono uppercase tracking-wider text-off-white-muted block">Muscle Group Frequency</span>
            <div className="space-y-1.5">
              {Object.keys(muscleGroupFrequencies).length === 0 ? (
                <div className="text-[10px] font-mono text-off-white-muted py-2">
                  No volume data this week.
                </div>
              ) : (
                Object.entries(muscleGroupFrequencies)
                  .sort((a, b) => b[1] - a[1])
                  .map(([muscle, sets]) => (
                    <div key={muscle} className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-off-white">{muscle}</span>
                      <div className="flex items-center gap-2 flex-1 mx-3">
                        <div className="flex-1 h-1.5 bg-darkbg border border-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent"
                            style={{
                              width: `${Math.min(
                                (sets / Math.max(...Object.values(muscleGroupFrequencies))) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-off-white-muted font-bold">{sets} sets</span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default GymTracker;
