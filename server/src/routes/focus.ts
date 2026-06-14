import { Router } from 'express';
import { FocusSession } from '../models/FocusSession';
import { DailyLog } from '../models/DailyLog';
import { Goal } from '../models/Goal';
import { User } from '../models/User';
import { DailyTask } from '../models/DailyTask';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { subDays, format, parseISO, differenceInCalendarDays, startOfWeek, endOfWeek, subWeeks, subMonths } from 'date-fns';
import { Types } from 'mongoose';

const router = Router();
router.use(authenticateToken);

// Helper function to recalculate daily log points
const recalculatePoints = (log: any) => {
  const taskPoints = log.tasks.reduce((sum: number, task: any) => {
    return sum + (task.completed ? task.points : 0);
  }, 0);
  log.totalPoints = taskPoints + (log.focusPoints || 0);
};

// GET /api/v1/focus/achievements - Get achievements list with status
router.get('/achievements', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const availableAchievements = [
      { id: 'first_session', title: 'First Focus Session', description: 'Complete your first focus session', icon: 'Sparkles' },
      { id: 'streak_7', title: '7 Day Streak', description: 'Maintain a 7-day daily focus streak', icon: 'Flame' },
      { id: 'streak_30', title: '30 Day Streak', description: 'Maintain a 30-day daily focus streak', icon: 'Trophy' },
      { id: 'hours_100', title: '100 Hours Focused', description: 'Accumulate 100 hours of focus time', icon: 'Clock' },
      { id: 'hours_500', title: '500 Hours Focused', description: 'Accumulate 500 hours of focus time', icon: 'Award' },
    ];

    const data = availableAchievements.map(ach => ({
      ...ach,
      unlocked: user.achievements.includes(ach.id),
    }));

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/focus/analytics - Get focus analytics and trends
router.get('/analytics', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const clientDateStr = (req.query.date as string) || format(new Date(), 'yyyy-MM-dd');

    // Fetch all completed focus/custom sessions for this user
    const completedSessions = await FocusSession.find({
      userId,
      completed: true,
      sessionType: { $in: ['focus', 'custom'] },
    }).sort({ startedAt: 1 });

    const totalSessions = completedSessions.length;
    let longestSession = 0;
    let totalDurationSeconds = 0;

    completedSessions.forEach(s => {
      if (s.duration > longestSession) longestSession = s.duration;
      totalDurationSeconds += s.duration;
    });

    const averageSessionLength = totalSessions > 0 ? Math.round(totalDurationSeconds / totalSessions) : 0;

    // Filter focus time per day
    const timeByDateMap: Record<string, number> = {};
    completedSessions.forEach(s => {
      // Use date format from startedAt in local string format YYYY-MM-DD
      const dStr = format(s.startedAt, 'yyyy-MM-dd');
      timeByDateMap[dStr] = (timeByDateMap[dStr] || 0) + s.duration;
    });

    // 1. Today's focus time
    const todayFocusTime = timeByDateMap[clientDateStr] || 0;

    // 2. Weekly focus time (last 7 days)
    let weeklyFocusTime = 0;
    const clientDate = parseISO(clientDateStr);
    for (let i = 0; i < 7; i++) {
      const d = subDays(clientDate, i);
      const dStr = format(d, 'yyyy-MM-dd');
      weeklyFocusTime += timeByDateMap[dStr] || 0;
    }

    // 3. Monthly focus time (last 30 days)
    let monthlyFocusTime = 0;
    for (let i = 0; i < 30; i++) {
      const d = subDays(clientDate, i);
      const dStr = format(d, 'yyyy-MM-dd');
      monthlyFocusTime += timeByDateMap[dStr] || 0;
    }

    // --- Chart Data Generators ---
    // A. Daily Focus Hours (last 7 days)
    const dailyFocusHours: { date: string; hours: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(clientDate, i);
      const dStr = format(d, 'yyyy-MM-dd');
      const seconds = timeByDateMap[dStr] || 0;
      dailyFocusHours.push({
        date: format(d, 'MMM dd'),
        hours: parseFloat((seconds / 3600).toFixed(2)),
      });
    }

    // B. Weekly Focus Trend (last 4 weeks)
    const weeklyFocusTrend: { week: string; hours: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const targetDate = subWeeks(clientDate, i);
      const start = startOfWeek(targetDate, { weekStartsOn: 1 });
      const end = endOfWeek(targetDate, { weekStartsOn: 1 });

      let secondsInWeek = 0;
      completedSessions.forEach(s => {
        if (s.startedAt >= start && s.startedAt <= end) {
          secondsInWeek += s.duration;
        }
      });

      weeklyFocusTrend.push({
        week: `Wk -${i}`,
        hours: parseFloat((secondsInWeek / 3600).toFixed(2)),
      });
    }

    // C. Monthly Deep Work Trend (last 6 months, Deep Work defined as sessions >= 50m / 3000s)
    const monthlyDeepWorkTrend: { month: string; hours: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = subMonths(clientDate, i);
      const start = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const end = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59);

      let secondsInMonth = 0;
      completedSessions.forEach(s => {
        if (s.startedAt >= start && s.startedAt <= end && s.duration >= 3000) {
          secondsInMonth += s.duration;
        }
      });

      monthlyDeepWorkTrend.push({
        month: format(targetDate, 'MMM'),
        hours: parseFloat((secondsInMonth / 3600).toFixed(2)),
      });
    }

    return res.json({
      success: true,
      data: {
        todayFocusTime,
        weeklyFocusTime,
        monthlyFocusTime,
        totalSessions,
        longestSession,
        averageSessionLength,
        charts: {
          dailyFocusHours,
          weeklyFocusTrend,
          monthlyDeepWorkTrend,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/focus/session - Log a completed focus session
router.post('/session', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const { taskId, goalId, sessionType, duration, completed, startedAt, endedAt, date } = req.body;

    if (!sessionType || duration === undefined || !startedAt || !endedAt || !date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required focus session details (sessionType, duration, startedAt, endedAt, date).',
      });
    }

    // 1. Calculate points earned
    let pointsEarned = 0;
    if (completed && (sessionType === 'focus' || sessionType === 'custom')) {
      if (duration >= 3000) {
        // Deep Work (50 mins+)
        pointsEarned = 4;
      } else if (duration >= 1500) {
        // Classic Pomodoro (25 mins+)
        pointsEarned = 2;
      } else if (duration >= 600) {
        // Shorter session (10 mins+)
        pointsEarned = 1;
      }
    }

    // 2. Create focus session
    const session = await FocusSession.create({
      userId,
      taskId: taskId ? new Types.ObjectId(taskId) : undefined,
      goalId: goalId ? new Types.ObjectId(goalId) : undefined,
      sessionType,
      duration,
      completed,
      startedAt: new Date(startedAt),
      endedAt: new Date(endedAt),
      pointsEarned,
    });

    // 3. Update DailyLog
    let dailyLog = await DailyLog.findOne({ userId, date });
    if (!dailyLog) {
      // Pre-populate daily checklist
      const repeatingTasks = await DailyTask.find({ isRepeating: true, userId });
      const tasksToInsert = repeatingTasks.map(task => ({
        taskId: task._id as Types.ObjectId,
        title: task.title,
        points: task.points,
        category: task.category,
        completed: false,
      }));

      dailyLog = new DailyLog({
        userId,
        date,
        tasks: tasksToInsert,
        focusPoints: pointsEarned,
        totalPoints: pointsEarned,
        notes: '',
      });
    } else {
      dailyLog.focusPoints = (dailyLog.focusPoints || 0) + pointsEarned;
    }

    // 3.1. Update Checklist Task if linked
    if (completed && taskId && dailyLog) {
      const task = dailyLog.tasks.find(t => (t as any)._id.toString() === taskId);
      if (task) {
        task.completed = true;
        task.completedAt = new Date();
      }
    }

    recalculatePoints(dailyLog);
    await dailyLog.save();

    // 4. Update Goal if linked
    let updatedGoal = null;
    if (completed && goalId) {
      const goal = await Goal.findOne({ _id: goalId, userId });
      if (goal) {
        goal.progress = Math.min(100, goal.progress + 10);
        if (goal.progress === 100) {
          goal.status = 'completed';
        }

        const existingIndex = goal.progressHistory.findIndex(snap => snap.date === date);
        if (existingIndex > -1) {
          goal.progressHistory[existingIndex].progress = goal.progress;
        } else {
          goal.progressHistory.push({ date, progress: goal.progress });
        }

        await goal.save();
        updatedGoal = goal;
      }
    }

    // 5. Update User Streaks & Achievements
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Incremental total hours focused
    if (completed && (sessionType === 'focus' || sessionType === 'custom')) {
      user.totalFocusHours += duration / 3600;

      // Update daily focus streak
      const lastFocused = user.lastFocusedDate;
      if (!lastFocused) {
        // First session ever
        user.dailyFocusStreak = 1;
        user.longestFocusStreak = 1;
      } else {
        const lastFocusedParsed = parseISO(lastFocused);
        const currentParsed = parseISO(date);
        const diffDays = differenceInCalendarDays(currentParsed, lastFocusedParsed);

        if (diffDays === 1) {
          // Successive day
          user.dailyFocusStreak += 1;
          if (user.dailyFocusStreak > user.longestFocusStreak) {
            user.longestFocusStreak = user.dailyFocusStreak;
          }
        } else if (diffDays > 1) {
          // Missed a day
          user.dailyFocusStreak = 1;
        }
        // If diffDays === 0, it means they already focused today, streak remains same
      }
      user.lastFocusedDate = date;

      // Update weekly deep work streak (requires a completed deep work session >= 50m / 3000s)
      if (duration >= 3000) {
        // Query the most recent deep work session before this one
        const lastDeepWork = await FocusSession.findOne({
          userId,
          completed: true,
          sessionType: { $in: ['focus', 'custom'] },
          duration: { $gte: 3000 },
          _id: { $ne: session._id },
        }).sort({ startedAt: -1 });

        if (!lastDeepWork) {
          user.weeklyDeepWorkStreak = 1;
        } else {
          const lastDate = lastDeepWork.startedAt;
          const currentDate = new Date(startedAt);

          const lastWeekStart = startOfWeek(lastDate, { weekStartsOn: 1 });
          const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });

          const diffWeeks = Math.round(
            differenceInCalendarDays(currentWeekStart, lastWeekStart) / 7
          );

          if (diffWeeks === 1) {
            // Consecutive week
            user.weeklyDeepWorkStreak += 1;
          } else if (diffWeeks > 1) {
            // Missed a week
            user.weeklyDeepWorkStreak = 1;
          }
          // If diffWeeks === 0, same week, no change
        }
      }

      // Check achievements
      const earned = user.achievements || [];
      if (!earned.includes('first_session')) {
        earned.push('first_session');
      }
      if (user.dailyFocusStreak >= 7 && !earned.includes('streak_7')) {
        earned.push('streak_7');
      }
      if (user.dailyFocusStreak >= 30 && !earned.includes('streak_30')) {
        earned.push('streak_30');
      }
      if (user.totalFocusHours >= 100 && !earned.includes('hours_100')) {
        earned.push('hours_100');
      }
      if (user.totalFocusHours >= 500 && !earned.includes('hours_500')) {
        earned.push('hours_500');
      }
      user.achievements = earned;

      await user.save();
    }

    return res.status(201).json({
      success: true,
      data: {
        session,
        dailyLog,
        goal: updatedGoal,
        user,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
