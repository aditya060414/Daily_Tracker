import { Router } from 'express';
import { DailyTask } from '../models/DailyTask';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all daily-tasks routes
router.use(authenticateToken);

// GET /api/v1/daily-tasks - Get all task templates for user
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const tasks = await DailyTask.find({ userId: req.user!.userId }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/daily-tasks - Create new task template for user
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { title, isRepeating, points, category } = req.body;
    if (!title || !category) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Title and Category are required.',
      });
    }

    const newTask = await DailyTask.create({
      userId: req.user!.userId,
      title,
      isRepeating: isRepeating !== undefined ? isRepeating : true,
      points: points || 1,
      category,
    });

    return res.status(201).json({
      success: true,
      data: newTask,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/daily-tasks/:id - Update task template for user
router.put('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { title, isRepeating, points, category } = req.body;
    const task = await DailyTask.findOne({ _id: req.params.id, userId: req.user!.userId });

    if (!task) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Task not found.',
      });
    }

    if (title !== undefined) task.title = title;
    if (isRepeating !== undefined) task.isRepeating = isRepeating;
    if (points !== undefined) task.points = points;
    if (category !== undefined) task.category = category;

    await task.save();

    return res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/daily-tasks/:id - Delete task template for user
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const task = await DailyTask.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });
    if (!task) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Task not found.',
      });
    }

    return res.json({
      success: true,
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
