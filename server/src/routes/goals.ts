import { Router } from 'express';
import { Goal } from '../models/Goal';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { format } from 'date-fns';

const router = Router();
router.use(authenticateToken);

// GET /api/v1/goals - List all goals for user
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const goals = await Goal.find({ userId: req.user!.userId }).sort({ createdAt: -1 });
    return res.json({
      success: true,
      data: goals,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/goals - Create a goal for user
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { title, description, type, targetDate, milestones } = req.body;
    if (!title || !type || !targetDate) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Title, Type, and Target Date are required.',
      });
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const newGoal = await Goal.create({
      userId: req.user!.userId,
      title,
      description: description || '',
      type,
      targetDate: new Date(targetDate),
      progress: 0,
      milestones: milestones || [],
      status: 'active',
      progressHistory: [{ date: todayStr, progress: 0 }],
    });

    return res.status(201).json({
      success: true,
      data: newGoal,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/goals/:id/progress - Update progress for user goal
router.patch('/:id/progress', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { progress } = req.body;
    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Progress must be a number between 0 and 100.',
      });
    }

    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Goal not found.',
      });
    }

    goal.progress = progress;
    if (progress === 100) {
      goal.status = 'completed';
    } else if (goal.status === 'completed' && progress < 100) {
      goal.status = 'active'; // restore to active if pulled back
    }

    // Add or update progress history snapshot for today
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const existingIndex = goal.progressHistory.findIndex(snap => snap.date === todayStr);

    if (existingIndex > -1) {
      goal.progressHistory[existingIndex].progress = progress;
    } else {
      goal.progressHistory.push({ date: todayStr, progress });
    }

    await goal.save();

    return res.json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/goals/:id - Update complete goal info for user
router.put('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { title, description, type, targetDate, progress, milestones, status } = req.body;
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user!.userId });

    if (!goal) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Goal not found.',
      });
    }

    if (title !== undefined) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (type !== undefined) goal.type = type;
    if (targetDate !== undefined) goal.targetDate = new Date(targetDate);
    if (status !== undefined) goal.status = status;
    if (milestones !== undefined) goal.milestones = milestones;

    if (progress !== undefined) {
      goal.progress = progress;
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const existingIndex = goal.progressHistory.findIndex(snap => snap.date === todayStr);
      if (existingIndex > -1) {
        goal.progressHistory[existingIndex].progress = progress;
      } else {
        goal.progressHistory.push({ date: todayStr, progress });
      }
    }

    await goal.save();

    return res.json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/goals/:id - Delete a goal for user
router.delete('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Goal not found.',
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
