import { Router } from 'express';
import { DailyLog, ILogTask } from '../models/DailyLog';
import { DailyTask } from '../models/DailyTask';
import { authenticateToken } from '../middleware/auth';
import { Types } from 'mongoose';

const router = Router();
router.use(authenticateToken);

// Helper function to recalculate points
const recalculatePoints = (log: any) => {
  log.totalPoints = log.tasks.reduce((sum: number, task: ILogTask) => {
    return sum + (task.completed ? task.points : 0);
  }, 0);
};

// GET /api/v1/daily-logs/:date - Get (or create & populate) daily log for a date (format: YYYY-MM-DD)
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    let log = await DailyLog.findOne({ date });
    const repeatingTasks = await DailyTask.find({ isRepeating: true });

    if (!log) {
      // Find all repeating tasks to pre-populate this day
      const tasksToInsert: ILogTask[] = repeatingTasks.map(task => ({
        taskId: task._id as Types.ObjectId,
        title: task.title,
        points: task.points,
        category: task.category,
        completed: false,
      }));

      log = await DailyLog.create({
        date,
        tasks: tasksToInsert,
        totalPoints: 0,
        notes: '',
      });
    } else {
      // Log exists. Sync with template library changes.
      const templatesMap = new Map(repeatingTasks.map(t => [t._id.toString(), t]));
      const existingTaskIds = new Set<string>();
      let hasChanges = false;

      // 1. Update details of existing template tasks, and remove deleted ones if uncompleted
      log.tasks = log.tasks.filter(task => {
        if (!task.taskId) return true; // keep one-off inline tasks

        const taskIdStr = task.taskId.toString();
        existingTaskIds.add(taskIdStr);

        const template = templatesMap.get(taskIdStr);
        if (!template) {
          // Template was deleted from library. Remove if not completed.
          if (!task.completed) {
            hasChanges = true;
            return false;
          }
          return true; // Keep if completed to preserve history
        }

        // Sync details if template changed
        if (
          task.title !== template.title ||
          task.points !== template.points ||
          task.category !== template.category
        ) {
          task.title = template.title;
          task.points = template.points;
          task.category = template.category;
          hasChanges = true;
        }

        return true;
      });

      // 2. Add missing repeating templates
      repeatingTasks.forEach(template => {
        const taskIdStr = template._id.toString();
        if (!existingTaskIds.has(taskIdStr)) {
          log!.tasks.push({
            taskId: template._id as Types.ObjectId,
            title: template.title,
            points: template.points,
            category: template.category,
            completed: false,
          });
          hasChanges = true;
        }
      });

      if (hasChanges) {
        recalculatePoints(log);
        await log.save();
      }
    }

    return res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/daily-logs/:date - Add an inline one-off task to a specific day
router.post('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const { title, points, category } = req.body;

    if (!title || !category) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Title and Category are required.',
      });
    }

    let log = await DailyLog.findOne({ date });
    if (!log) {
      // Create a log first if it doesn't exist
      const repeatingTasks = await DailyTask.find({ isRepeating: true });
      const tasksToInsert: ILogTask[] = repeatingTasks.map(task => ({
        taskId: task._id as Types.ObjectId,
        title: task.title,
        points: task.points,
        category: task.category,
        completed: false,
      }));
      log = new DailyLog({
        date,
        tasks: tasksToInsert,
        totalPoints: 0,
        notes: '',
      });
    }

    // Add the new one-off task
    log.tasks.push({
      title,
      points: points || 1,
      category,
      completed: false,
    });

    recalculatePoints(log);
    await log.save();

    return res.status(201).json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/daily-logs/:date - Toggle task completion status
// Body: { logTaskId: string, completed: boolean }
router.patch('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const { logTaskId, completed } = req.body;

    if (!logTaskId) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'logTaskId is required in body.',
      });
    }

    const log = await DailyLog.findOne({ date });
    if (!log) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Daily log not found for this date.',
      });
    }

    // Find the task inside the array
    const task = log.tasks.find(t => (t as any)._id.toString() === logTaskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Task not found in daily log.',
      });
    }

    task.completed = completed;
    task.completedAt = completed ? new Date() : undefined;

    recalculatePoints(log);
    await log.save();

    return res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/daily-logs/:date/:logTaskId - Delete task from a specific day's list
router.delete('/:date/:logTaskId', async (req, res, next) => {
  try {
    const { date, logTaskId } = req.params;
    const log = await DailyLog.findOne({ date });

    if (!log) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Daily log not found.',
      });
    }

    // Remove the task from array
    const initialLength = log.tasks.length;
    log.tasks = log.tasks.filter(t => (t as any)._id.toString() !== logTaskId);

    if (log.tasks.length === initialLength) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Task not found in daily log.',
      });
    }

    recalculatePoints(log);
    await log.save();

    return res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
