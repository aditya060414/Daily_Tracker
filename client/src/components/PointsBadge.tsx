import React, { useEffect, useState } from 'react';
import { Award } from 'lucide-react';

interface PointsBadgeProps {
  points: number;
}

export const PointsBadge: React.FC<PointsBadgeProps> = ({ points }) => {
  const [displayPoints, setDisplayPoints] = useState(0);
  const [animate, setAnimate] = useState(false);

  // Animating number change (increment / count up)
  useEffect(() => {
    let start = displayPoints;
    const end = points;
    if (start === end) return;

    setAnimate(true);
    const timeout = setTimeout(() => setAnimate(false), 300);

    const duration = 400; // ms
    const range = end - start;
    let current = start;
    const increment = range > 0 ? 1 : -1;
    const stepTime = Math.max(Math.floor(duration / Math.abs(range || 1)), 15);
    
    const timer = setInterval(() => {
      current += increment;
      setDisplayPoints(current);
      if (current === end) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [points]);

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1 rounded bg-accent/10 border border-accent/20 text-accent font-mono text-sm transition-all duration-300 ${
        animate ? 'scale-110 shadow-lg shadow-accent/20 border-accent/40 bg-accent/20' : ''
      }`}
    >
      <Award className="w-4 h-4" />
      <span>PTS: {displayPoints}</span>
    </div>
  );
};
export default PointsBadge;
