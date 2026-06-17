import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// Initialize channel for silent ongoing tasks updates
const initNotificationChannels = async () => {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await LocalNotifications.createChannel({
      id: 'silent_progress',
      name: 'Silent Progress Tracker',
      description: 'Ongoing notification for task completion progress without sound or vibration.',
      importance: 2, // Low importance (no sound/vibration, just drawer icon)
      vibration: false,
      visibility: 1, // Public
    });

    await LocalNotifications.createChannel({
      id: 'reminders',
      name: 'Interval Reminders',
      description: 'Recurring alerts prompting checklist reviews.',
      importance: 3, // Default importance (makes sound)
      vibration: true,
      visibility: 1,
    });
  } catch (err) {
    console.warn('Failed to register notification channels:', err);
  }
};

// Auto-run channel setup on load
initNotificationChannels();

/**
 * Checks and requests notifications permissions.
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return true;

  try {
    const status = await LocalNotifications.checkPermissions();
    if (status.display === 'granted') {
      return true;
    }
    
    const request = await LocalNotifications.requestPermissions();
    return request.display === 'granted';
  } catch (err) {
    console.error('Error requesting notification permissions:', err);
    return false;
  }
};

/**
 * Updates the persistent status bar notification (ID: 9999).
 */
export const updatePersistentNotification = async (
  remainingTasks: number,
  completedTasks: number,
  totalTasks: number,
  enabled: boolean
): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Cancel existing ongoing notification first
    await LocalNotifications.cancel({ notifications: [{ id: 9999 }] });

    if (!enabled) return;

    // 2. Request permission first
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    // 3. Calculate metrics
    let bodyText = '';
    if (totalTasks === 0) {
      bodyText = 'No tasks scheduled for today.';
    } else {
      const percentage = Math.round((completedTasks / totalTasks) * 100);
      bodyText = `${completedTasks}/${totalTasks} tasks completed (${percentage}%) — ${remainingTasks} remaining`;
    }

    // 4. Schedule/Render ongoing notification
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 9999,
          title: 'DailyOS Task Progress',
          body: bodyText,
          ongoing: true, // Non-dismissible status bar notification on Android
          channelId: 'silent_progress',
          autoCancel: false,
          smallIcon: 'ic_stat_name', // Uses default status asset or fallback
          schedule: {
            allowWhileIdle: true
          }
        }
      ]
    });
  } catch (err) {
    console.error('Failed to update persistent notification:', err);
  }
};

/**
 * Schedules or cancels the recurring interval reminder notification (ID: 8888).
 */
export const scheduleIntervalNotifications = async (
  intervalType: 'minute' | 'hour' | 'day' | 'none',
  enabled: boolean
): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // 1. Cancel any active reminders
    await LocalNotifications.cancel({ notifications: [{ id: 8888 }] });

    if (!enabled || intervalType === 'none') return;

    // 2. Request permission
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    // 3. Schedule recurring reminder
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 8888,
          title: 'DailyOS Checklist Reminder',
          body: 'Take a brief moment to update your logs and mark completed tasks.',
          channelId: 'reminders',
          schedule: {
            every: intervalType, // 'minute', 'hour', or 'day'
            allowWhileIdle: true
          }
        }
      ]
    });
  } catch (err) {
    console.error('Failed to schedule interval notification:', err);
  }
};
