import React from 'react';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface FocusAnalyticsProps {
  analytics: {
    todayFocusTime: number;
    weeklyFocusTime: number;
    monthlyFocusTime: number;
    totalSessions: number;
    longestSession: number;
    averageSessionLength: number;
    charts: {
      dailyFocusHours: any[];
      weeklyFocusTrend: any[];
      monthlyDeepWorkTrend: any[];
    };
  } | null;
}

export const FocusAnalytics: React.FC<FocusAnalyticsProps> = ({ analytics }) => {
  if (!analytics) {
    return (
      <div className="text-center font-mono text-xs text-off-white-muted animate-pulse py-8">
        Calculating telemetry charts...
      </div>
    );
  }

  const { todayFocusTime, weeklyFocusTime, monthlyFocusTime, totalSessions, longestSession, averageSessionLength, charts } = analytics;

  const formatSecondsToMinutesString = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.round((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6 w-full max-w-4xl animate-fade-in pb-12 font-mono">
      {/* Core telemetry stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="col-span-2 bg-panel/75 backdrop-blur border border-border p-4 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-off-white-muted">Today focus time</span>
          <h3 className="text-2xl font-bold text-accent mt-2">{formatSecondsToMinutesString(todayFocusTime)}</h3>
        </div>
        <div className="col-span-2 bg-panel/75 backdrop-blur border border-border p-4 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-off-white-muted">Weekly focus time</span>
          <h3 className="text-2xl font-bold text-off-white mt-2">{formatSecondsToMinutesString(weeklyFocusTime)}</h3>
        </div>
        <div className="col-span-2 bg-panel/75 backdrop-blur border border-border p-4 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-off-white-muted">Monthly focus time</span>
          <h3 className="text-2xl font-bold text-off-white mt-2">{formatSecondsToMinutesString(monthlyFocusTime)}</h3>
        </div>

        <div className="col-span-2 lg:col-span-2 bg-panel/75 backdrop-blur border border-border p-4 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-off-white-muted">Total focus sessions</span>
          <h3 className="text-2xl font-bold text-off-white mt-2">{totalSessions} <span className="text-xs text-off-white-muted">completed</span></h3>
        </div>
        <div className="col-span-2 lg:col-span-2 bg-panel/75 backdrop-blur border border-border p-4 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-off-white-muted">Longest Session</span>
          <h3 className="text-2xl font-bold text-off-white mt-2">{formatSecondsToMinutesString(longestSession)}</h3>
        </div>
        <div className="col-span-2 lg:col-span-2 bg-panel/75 backdrop-blur border border-border p-4 rounded-lg flex flex-col justify-between">
          <span className="text-[10px] uppercase tracking-wider text-off-white-muted">Avg Session Length</span>
          <h3 className="text-2xl font-bold text-off-white mt-2">{formatSecondsToMinutesString(averageSessionLength)}</h3>
        </div>
      </div>

      {/* Analytics charts widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily hours */}
        <div className="bg-panel/75 backdrop-blur border border-border p-5 rounded-lg flex flex-col">
          <h4 className="text-xs font-bold text-off-white uppercase tracking-wider mb-4">Daily Focus Hours</h4>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.dailyFocusHours}>
                <XAxis dataKey="date" stroke="#6b7280" fontSize={9} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={9} tickLine={false} width={20} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px', fontSize: '10px' }}
                  labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                />
                <Bar dataKey="hours" fill="#7c3aed" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly trends */}
        <div className="bg-panel/75 backdrop-blur border border-border p-5 rounded-lg flex flex-col">
          <h4 className="text-xs font-bold text-off-white uppercase tracking-wider mb-4">Weekly Focus Trend</h4>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.weeklyFocusTrend}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" stroke="#6b7280" fontSize={9} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={9} tickLine={false} width={20} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px', fontSize: '10px' }}
                  labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="hours" stroke="#7c3aed" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Deep work months */}
        <div className="bg-panel/75 backdrop-blur border border-border p-5 rounded-lg flex flex-col">
          <h4 className="text-xs font-bold text-off-white uppercase tracking-wider mb-4">Monthly Deep Work Trend</h4>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.monthlyDeepWorkTrend}>
                <XAxis dataKey="month" stroke="#6b7280" fontSize={9} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={9} tickLine={false} width={20} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '4px', fontSize: '10px' }}
                  labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="hours" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FocusAnalytics;
