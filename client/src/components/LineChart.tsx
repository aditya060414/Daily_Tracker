import React from 'react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface ChartData {
  date: string;
  points: number;
}

interface LineChartProps {
  data: ChartData[];
  color?: string;
  height?: number;
  label?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  color = '#7c3aed',
  height = 200,
  label = 'Points',
}) => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Format dates for X-Axis tick (e.g., "Jun 03")
  const formatXAxis = (tickItem: string) => {
    try {
      const dateObj = parseISO(tickItem);
      return format(dateObj, 'MMM dd');
    } catch (e) {
      return tickItem;
    }
  };

  // Custom glassmorphism tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataObj = payload[0].payload;
      let displayDate = dataObj.date;
      try {
        displayDate = format(parseISO(dataObj.date), 'EEEE, MMM dd yyyy');
      } catch (e) {}

      return (
        <div className="bg-[#161616]/95 border border-[#2a2a2a] p-3 rounded shadow-xl backdrop-blur-md">
          <p className="text-[10px] text-off-white-muted uppercase tracking-wider font-mono mb-1">{displayDate}</p>
          <p className="text-sm font-mono font-bold text-accent">
            {label}: <span className="text-off-white">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', minWidth: 0, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{
            top: 10,
            right: isMobile ? 5 : 10,
            left: isMobile ? -35 : -25,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            stroke="#555"
            tick={{ fill: '#a3a3a3', fontSize: isMobile ? 8 : 10, fontFamily: 'Geist Mono' }}
            axisLine={{ stroke: '#2a2a2a' }}
            tickLine={{ stroke: '#2a2a2a' }}
            interval={isMobile ? Math.ceil(data.length / 4) : 'preserveEnd'}
          />
          <YAxis
            stroke="#555"
            tick={{ fill: '#a3a3a3', fontSize: isMobile ? 8 : 10, fontFamily: 'Geist Mono' }}
            axisLine={{ stroke: '#2a2a2a' }}
            tickLine={{ stroke: '#2a2a2a' }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2a2a2a', strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="points"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, stroke: color, strokeWidth: 1, fill: '#0f0f0f' }}
            activeDot={{ r: 5, stroke: '#fff', strokeWidth: 1, fill: color }}
            animationDuration={1000}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};
export default LineChart;
