import React from 'react';

interface ProgressRingProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  color?: string; // Hex or tailwind class
  label?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 80,
  strokeWidth = 8,
  color = 'stroke-accent',
  label,
}) => {
  // Ensure value stays between 0 and 100
  const normalizedValue = Math.min(Math.max(value, 0), 100);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 w-full h-full">
          {/* Background circle */}
          <circle
            className="stroke-border"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Progress circle */}
          <circle
            className={`${color} transition-all duration-500 ease-out`}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        {/* Central percentage text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-sm font-semibold text-off-white">
            {Math.round(normalizedValue)}%
          </span>
        </div>
      </div>
      {label && <span className="text-[10px] uppercase font-mono text-off-white-muted tracking-wider">{label}</span>}
    </div>
  );
};
export default ProgressRing;
