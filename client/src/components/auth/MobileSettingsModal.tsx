import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuthStore, useDailyStore } from '../../store';
import { scheduleIntervalNotifications, updatePersistentNotification } from '../../utils/notifications';
import { Bell, Sparkles } from 'lucide-react';

interface MobileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSettingsModal: React.FC<MobileSettingsModalProps> = ({ isOpen, onClose }) => {
  const { notificationPrefs, setNotificationPrefs } = useAuthStore();
  const dailyLog = useDailyStore((state) => state.dailyLog);

  // Local component states initialized from Zustand auth store
  const [persistentEnabled, setPersistentEnabled] = useState(notificationPrefs?.persistentEnabled ?? false);
  const [intervalEnabled, setIntervalEnabled] = useState(notificationPrefs?.intervalEnabled ?? false);
  const [intervalType, setIntervalType] = useState<'minute' | 'hour' | 'day'>(
    notificationPrefs?.intervalHours === 1 ? 'hour' : notificationPrefs?.intervalHours === 24 ? 'day' : 'hour'
  );
  
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    setSuccessMsg(null);

    // 1. Calculate numerical interval based on choice
    const hours = intervalType === 'hour' ? 1 : intervalType === 'day' ? 24 : 0; // 0 for minute/none

    // 2. Persist state to Zustand store (saves to localStorage automatically)
    setNotificationPrefs({
      persistentEnabled,
      intervalEnabled,
      intervalHours: hours,
    });

    // 3. Update persistent/ongoing notification bar state
    if (persistentEnabled) {
      const remainingTasks = dailyLog ? dailyLog.tasks.filter((t) => !t.completed).length : 0;
      const completedTasks = dailyLog ? dailyLog.tasks.filter((t) => t.completed).length : 0;
      const totalTasks = dailyLog ? dailyLog.tasks.length : 0;
      await updatePersistentNotification(remainingTasks, completedTasks, totalTasks, true);
    } else {
      await updatePersistentNotification(0, 0, 0, false);
    }

    // 4. Update scheduled interval notifications state
    if (intervalEnabled) {
      // If we chose minute interval, pass 'minute', else pass computed scheme
      const everyScheme = hours === 1 ? 'hour' : hours === 24 ? 'day' : 'minute';
      await scheduleIntervalNotifications(everyScheme, true);
    } else {
      await scheduleIntervalNotifications('none', false);
    }

    setSuccessMsg('NOTIFICATION_VECTORS_UPDATED');
    setLoading(false);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1000);
  };

  return createPortal(
    <div className="fixed inset-0 bg-darkbg/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-panel border border-border rounded-lg shadow-2xl p-6 glow-accent animate-fade-in font-mono text-off-white">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-border pb-3 mb-4">
          <div className="flex items-center gap-2 text-accent">
            <Bell className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold tracking-widest uppercase">
              MOBILE_ALERT_GATEWAY
            </span>
          </div>
          <span className="text-[10px] bg-border px-1.5 py-0.5 rounded text-off-white-muted">
            NATIVE_SYS
          </span>
        </div>

        {/* Form Content */}
        <div className="space-y-5">
          {/* Section 1: Persistent Notification Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-off-white">Persistent Notification Bar</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={persistentEnabled}
                  onChange={(e) => setPersistentEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-darkbg rounded-full border border-border peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-off-white-muted peer-checked:after:bg-accent after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-accent/10 peer-checked:border-accent/30"></div>
              </label>
            </div>
            <p className="text-[10px] text-off-white-muted leading-relaxed">
              Keeps an ongoing, non-dismissible card in your system drawer showing remaining tasks and progress metrics in real-time.
            </p>
          </div>

          <div className="border-t border-border/50"></div>

          {/* Section 2: Interval Reminders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-off-white">Interval Reminders</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={intervalEnabled}
                  onChange={(e) => setIntervalEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-darkbg rounded-full border border-border peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-off-white-muted peer-checked:after:bg-accent after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-accent/10 peer-checked:border-accent/30"></div>
              </label>
            </div>
            <p className="text-[10px] text-off-white-muted leading-relaxed">
              Triggers a recurring reminder system alert to review your daily checklists.
            </p>

            {intervalEnabled && (
              <div className="space-y-1.5 p-3 rounded bg-darkbg/40 border border-border animate-fade-in">
                <label className="text-[9px] uppercase tracking-wider text-off-white-muted">
                  Choose Alert Frequency
                </label>
                <select
                  value={intervalType}
                  onChange={(e) => setIntervalType(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-xs bg-darkbg border border-border rounded text-off-white focus:border-accent outline-none"
                >
                  <option value="minute">Every 1 Minute (Testing)</option>
                  <option value="hour">Every 1 Hour</option>
                  <option value="day">Every 24 Hours (Daily)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Feedback / Alert */}
        {successMsg && (
          <div className="mt-4 flex items-center gap-2 p-2.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] uppercase tracking-widest justify-center">
            <Sparkles className="w-4 h-4 animate-spin shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-1/2 py-2 border border-border hover:border-accent/20 rounded text-xs font-bold uppercase tracking-wider text-off-white-muted hover:text-off-white transition-all"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="w-1/2 py-2 rounded bg-accent hover:bg-accent-dim text-darkbg hover:text-off-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1"
          >
            {loading ? 'STORING...' : 'SAVE_ALERTS'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
