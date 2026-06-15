import React from 'react';
import { Terminal } from 'lucide-react';

export const SystemInfoPanel: React.FC = () => {
  return (
    <div className="hidden lg:flex flex-col w-1/2 justify-between p-12 border-r border-border bg-panel/20 relative z-10">
      <div>
        {/* Header Branding */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-accent/25 border border-accent/40 text-accent glow-accent">
            <Terminal className="w-5 h-5 animate-pulse" />
          </div>
          <span className="text-md font-bold tracking-widest text-off-white">DAILY_OS</span>
          <span className="text-[9px] bg-border text-off-white-muted border border-border px-1 rounded">SYS_SEC_V1.2</span>
        </div>

        {/* Motivational System Logs */}
        <div className="mt-16 max-w-md">
          <h1 className="text-xl font-bold tracking-wide text-off-white leading-tight">
            HOST_SEQ: ORGANIZE_YOUR_DAY.
          </h1>
          <p className="text-xs text-off-white-muted mt-2 leading-relaxed italic">
            "We are what we repeatedly do. Excellence, then, is not an act, but a habit." — system_override
          </p>
        </div>
      </div>

      {/* Mock Terminal Dashboard Preview */}
      <div className="border border-border bg-darkbg/90 rounded-lg p-5 shadow-2xl glow-accent-strong w-full max-w-lg mb-10 overflow-hidden relative">
        <div className="flex justify-between items-center border-b border-border pb-2.5 mb-4 text-[10px] text-accent">
          <span>PREVIEW: SYSTEM_OVERVIEW.LOG</span>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent-dim"></span>
          </div>
        </div>
        <div className="space-y-2 text-[10px] text-off-white-muted">
          <div className="flex justify-between">
            <span>[SYSTEM_LOAD_STATUS]</span>
            <span className="text-green-400">ONLINE</span>
          </div>
          <div className="flex justify-between">
            <span>[ACTIVE_TIMELINE_NODES]</span>
            <span>8 BLOCKS CONFIG</span>
          </div>
          <div className="flex justify-between">
            <span>[GYM_ROUTINE_STATE]</span>
            <span>WORKOUT_COMPLETE [120 min]</span>
          </div>
          <div className="flex justify-between">
            <span>[TOTAL_POINTS_DAILY]</span>
            <span className="text-accent">+45 PTS (GOAL_REACHED)</span>
          </div>
          <div className="pt-3 border-t border-border mt-3">
            <div className="flex justify-between text-off-white">
              <span>ACTIVE_USER_SESSION:</span>
              <span>NONE (SECURE_GATEWAY_REQUIRED)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-[10px] text-off-white-muted">
        DAILY_OS CORE ENGINE // ALL RIGHTS SECURED.
      </div>
    </div>
  );
};
