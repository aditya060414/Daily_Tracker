import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { GymSession } from '../../types';

interface GymAnalyticsChartsProps {
  historySessions: GymSession[];
  activeExercises: { name: string; bodyPart?: string }[];
}

export const GymAnalyticsCharts: React.FC<GymAnalyticsChartsProps> = ({
  historySessions,
  activeExercises,
}) => {
  // Sort history sessions chronologically
  const sortedSessions = useMemo(() => {
    return [...historySessions].sort((a, b) => a.date.localeCompare(b.date));
  }, [historySessions]);

  // ----------------------------------------------------
  // CHART 1: Body Weight Trend
  // ----------------------------------------------------
  const weightData = useMemo(() => {
    return sortedSessions
      .filter((s) => s.bodyWeight !== undefined && s.bodyWeight !== null && s.bodyWeight > 0)
      .map((s) => ({
        date: s.date,
        weight: s.bodyWeight,
      }));
  }, [sortedSessions]);

  // ----------------------------------------------------
  // CHART 2: Same Body-Part Volume Comparison
  // ----------------------------------------------------
  // Find all unique body parts that exist in history or active list
  const availableBodyParts = useMemo(() => {
    const parts = new Set<string>();
    activeExercises.forEach((ex) => {
      if (ex.bodyPart) parts.add(ex.bodyPart.toLowerCase());
    });
    sortedSessions.forEach((s) => {
      s.exercises.forEach((ex) => {
        if (ex.bodyPart) parts.add(ex.bodyPart.toLowerCase());
      });
    });
    return Array.from(parts);
  }, [activeExercises, sortedSessions]);

  const [selectedBodyPart, setSelectedBodyPart] = useState<string>(() => {
    // Default to the first body part trained today, or first available
    const activePart = activeExercises.find((ex) => ex.bodyPart)?.bodyPart;
    return activePart ? activePart.toLowerCase() : (availableBodyParts[0] || '');
  });

  // Calculate total volume per session for the selected body part
  const bodyPartVolumeData = useMemo(() => {
    if (!selectedBodyPart) return [];

    return sortedSessions
      .map((s) => {
        let totalVolume = 0;
        let hasTrainedPart = false;

        s.exercises.forEach((ex) => {
          if (ex.bodyPart && ex.bodyPart.toLowerCase() === selectedBodyPart) {
            hasTrainedPart = true;
            ex.sets.forEach((set) => {
              if (set.weight !== undefined && set.reps !== undefined) {
                totalVolume += (set.weight || 0) * (set.reps || 0);
              }
            });
          }
        });

        return {
          date: s.date,
          volume: totalVolume,
          hasTrainedPart,
        };
      })
      .filter((d) => d.hasTrainedPart); // Only show sessions where that body part was trained
  }, [sortedSessions, selectedBodyPart]);

  // ----------------------------------------------------
  // CHART 3: Weight x Reps Trend (per exercise)
  // ----------------------------------------------------
  // Gather all unique exercise names
  const availableExercises = useMemo(() => {
    const names = new Set<string>();
    activeExercises.forEach((ex) => names.add(ex.name.toLowerCase()));
    sortedSessions.forEach((s) => {
      s.exercises.forEach((ex) => names.add(ex.name.toLowerCase()));
    });
    return Array.from(names);
  }, [activeExercises, sortedSessions]);

  const [selectedExerciseName, setSelectedExerciseName] = useState<string>(() => {
    return activeExercises[0]?.name.toLowerCase() || (availableExercises[0] || '');
  });

  const exerciseTrendData = useMemo(() => {
    if (!selectedExerciseName) return [];

    return sortedSessions
      .map((s) => {
        const matchingExercise = s.exercises.find(
          (ex) => ex.name.toLowerCase() === selectedExerciseName
        );

        if (!matchingExercise || !matchingExercise.sets || matchingExercise.sets.length === 0) {
          return null;
        }

        // Calculate max weight and average reps
        const weights = matchingExercise.sets
          .map((set) => set.weight)
          .filter((w): w is number => w !== undefined && w !== null);
        const reps = matchingExercise.sets
          .map((set) => set.reps)
          .filter((r): r is number => r !== undefined && r !== null);

        if (weights.length === 0 || reps.length === 0) return null;

        const maxWeight = Math.max(...weights);
        const avgReps = reps.reduce((sum, r) => sum + r, 0) / reps.length;

        return {
          date: s.date,
          maxWeight,
          avgReps: parseFloat(avgReps.toFixed(1)),
          unit: matchingExercise.unit || 'kg',
        };
      })
      .filter((d): d is NonNullable<typeof d> => d !== null);
  }, [sortedSessions, selectedExerciseName]);

  // Formatting helper for X Axis
  const formatXAxis = (tickItem: string) => {
    try {
      return format(parseISO(tickItem), 'MMM dd');
    } catch {
      return tickItem;
    }
  };

  // Glassmorphic Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      let displayDate = label;
      try {
        displayDate = format(parseISO(label), 'EEEE, MMM dd, yyyy');
      } catch {}

      return (
        <div className="bg-[#161616]/95 border border-[#2a2a2a] p-3 rounded shadow-xl backdrop-blur-md font-mono text-[10px]">
          <p className="text-off-white-muted uppercase tracking-wider mb-1.5">{displayDate}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} style={{ color: p.color }} className="font-bold">
              {p.name.toUpperCase()}: <span className="text-off-white">{p.value} {p.unit || ''}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* 1. Body Weight Trend Chart */}
      <div className="bg-panel border border-border rounded-lg p-5 space-y-4">
        <div className="border-b border-border pb-3 mb-2 flex items-center justify-between">
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">
            BODY_WEIGHT_TREND
          </h4>
          <span className="text-[9px] text-off-white-muted font-mono">
            Daily logs comparison
          </span>
        </div>

        {weightData.length === 0 ? (
          <div className="py-12 border border-dashed border-border rounded text-center text-xs font-mono text-off-white-muted uppercase">
            No body weight data logged. Enter weight in active workout sheet.
          </div>
        ) : (
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  stroke="#555"
                  tick={{ fill: '#a3a3a3', fontSize: 9, fontFamily: 'Geist Mono' }}
                  axisLine={{ stroke: '#2a2a2a' }}
                />
                <YAxis
                  stroke="#555"
                  domain={['dataMin - 3', 'dataMax + 3']}
                  tick={{ fill: '#a3a3a3', fontSize: 9, fontFamily: 'Geist Mono' }}
                  axisLine={{ stroke: '#2a2a2a' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2a2a2a', strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Body Weight"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0f0f0f', stroke: '#7c3aed' }}
                  activeDot={{ r: 5, fill: '#7c3aed', stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 2. Same Body-Part Comparison Chart */}
      <div className="bg-panel border border-border rounded-lg p-5 space-y-4">
        <div className="border-b border-border pb-3 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">
            BODY_PART_VOLUME_COMPARISON
          </h4>

          {availableBodyParts.length > 0 && (
            <select
              value={selectedBodyPart}
              onChange={(e) => setSelectedBodyPart(e.target.value)}
              className="px-2.5 py-1.5 bg-darkbg border border-border rounded text-[10px] font-bold text-off-white outline-none focus:border-accent font-mono uppercase"
            >
              {availableBodyParts.map((part) => (
                <option key={part} value={part}>
                  {part}
                </option>
              ))}
            </select>
          )}
        </div>

        {bodyPartVolumeData.length === 0 ? (
          <div className="py-12 border border-dashed border-border rounded text-center text-xs font-mono text-off-white-muted uppercase">
            {selectedBodyPart ? `No historical logs targeting ${selectedBodyPart.toUpperCase()}.` : 'No exercises logged yet.'}
          </div>
        ) : (
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bodyPartVolumeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  stroke="#555"
                  tick={{ fill: '#a3a3a3', fontSize: 9, fontFamily: 'Geist Mono' }}
                  axisLine={{ stroke: '#2a2a2a' }}
                />
                <YAxis
                  stroke="#555"
                  tick={{ fill: '#a3a3a3', fontSize: 9, fontFamily: 'Geist Mono' }}
                  axisLine={{ stroke: '#2a2a2a' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124, 58, 237, 0.05)' }} />
                <Bar
                  dataKey="volume"
                  name="Volume"
                  fill="#7c3aed"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 3. Weight x Reps Trend Chart */}
      <div className="bg-panel border border-border rounded-lg p-5 space-y-4">
        <div className="border-b border-border pb-3 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-off-white">
            PROGRESSIVE_OVERLOAD_INDICATOR
          </h4>

          {availableExercises.length > 0 && (
            <select
              value={selectedExerciseName}
              onChange={(e) => setSelectedExerciseName(e.target.value)}
              className="px-2.5 py-1.5 bg-darkbg border border-border rounded text-[10px] font-bold text-off-white outline-none focus:border-accent font-mono max-w-xs truncate uppercase"
            >
              {availableExercises.map((exName) => (
                <option key={exName} value={exName}>
                  {exName}
                </option>
              ))}
            </select>
          )}
        </div>

        {exerciseTrendData.length === 0 ? (
          <div className="py-12 border border-dashed border-border rounded text-center text-xs font-mono text-off-white-muted uppercase">
            {selectedExerciseName ? `No data logged for ${selectedExerciseName.toUpperCase()}.` : 'No exercises logged yet.'}
          </div>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={exerciseTrendData} margin={{ top: 10, right: -15, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  stroke="#555"
                  tick={{ fill: '#a3a3a3', fontSize: 9, fontFamily: 'Geist Mono' }}
                  axisLine={{ stroke: '#2a2a2a' }}
                />
                {/* Left Y Axis: Max Weight */}
                <YAxis
                  yAxisId="left"
                  stroke="#7c3aed"
                  tick={{ fill: '#a3a3a3', fontSize: 9, fontFamily: 'Geist Mono' }}
                  axisLine={{ stroke: '#2a2a2a' }}
                />
                {/* Right Y Axis: Reps */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#f59e0b"
                  tick={{ fill: '#a3a3a3', fontSize: 9, fontFamily: 'Geist Mono' }}
                  axisLine={{ stroke: '#2a2a2a' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2a2a2a', strokeWidth: 1 }} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{
                    fontFamily: 'Geist Mono',
                    fontSize: '9px',
                    textTransform: 'uppercase',
                  }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="maxWeight"
                  name="Max Weight"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0f0f0f', stroke: '#7c3aed' }}
                  activeDot={{ r: 5, fill: '#7c3aed', stroke: '#fff' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgReps"
                  name="Avg Reps"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0f0f0f', stroke: '#f59e0b' }}
                  activeDot={{ r: 5, fill: '#f59e0b', stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
export default GymAnalyticsCharts;
