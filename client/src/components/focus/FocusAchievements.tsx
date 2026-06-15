import React from 'react';
import { Sparkles, Flame, Trophy, Clock, Award } from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface FocusAchievementsProps {
  achievements: Achievement[];
}

export const FocusAchievements: React.FC<FocusAchievementsProps> = ({ achievements }) => {
  const iconMap = (name: string, unlocked: boolean) => {
    const cl = `w-6 h-6 ${unlocked ? 'text-accent' : 'text-off-white-muted opacity-40'}`;
    if (name === 'Sparkles') return <Sparkles className={cl} />;
    if (name === 'Flame') return <Flame className={cl} />;
    if (name === 'Trophy') return <Trophy className={cl} />;
    if (name === 'Clock') return <Clock className={cl} />;
    return <Award className={cl} />;
  };

  return (
    <div className="w-full max-w-2xl bg-panel/70 backdrop-blur border border-border rounded-lg p-6 animate-fade-in relative overflow-hidden font-mono">
      {/* Glow header */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
        <Trophy className="w-4 h-4 text-accent" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-off-white">ACHIEVEMENT_TELEMETRY</h2>
      </div>

      <div className="space-y-4">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className={`flex items-center gap-4 p-3.5 border rounded-lg transition-all ${
              ach.unlocked
                ? 'bg-accent/5 border-accent/25 glow-accent'
                : 'bg-card/20 border-border/60 opacity-60'
            }`}
          >
            <div className={`p-2.5 rounded border ${ach.unlocked ? 'bg-accent/15 border-accent/30' : 'bg-darkbg/40 border-border/50'}`}>
              {iconMap(ach.icon, ach.unlocked)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`text-xs font-bold uppercase ${ach.unlocked ? 'text-off-white' : 'text-off-white-muted'}`}>
                  {ach.title}
                </h3>
                {ach.unlocked && (
                  <span className="text-[8px] bg-accent/25 border border-accent/30 text-accent font-extrabold px-1 rounded">
                    UNLOCKED
                  </span>
                )}
              </div>
              <p className="text-[10px] text-off-white-muted mt-1 leading-relaxed">{ach.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default FocusAchievements;
