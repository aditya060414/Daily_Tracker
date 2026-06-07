import { Router } from 'express';
import { DayPlan } from '../models/DayPlan';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /api/v1/day-plan/:date - Get day plan timeline blocks for user
router.get('/:date', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { date } = req.params;
    const plan = await DayPlan.findOne({ date, userId: req.user!.userId });
    return res.json({
      success: true,
      data: plan || { date, timeBlocks: [] },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/day-plan/:date - Upsert day plan timeline blocks for user
router.put('/:date', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { date } = req.params;
    const { timeBlocks, notes } = req.body;
    const userId = req.user!.userId;

    const updateObj: any = { userId };
    if (timeBlocks !== undefined) updateObj.timeBlocks = timeBlocks;
    if (notes !== undefined) updateObj.notes = notes;

    const plan = await DayPlan.findOneAndUpdate(
      { date, userId },
      updateObj,
      { new: true, upsert: true, runValidators: true }
    );

    return res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/day-plan/:date/copy-from/:sourceDate - Copy plan blocks from sourceDate to date for user
router.post('/:date/copy-from/:sourceDate', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { date, sourceDate } = req.params;
    const userId = req.user!.userId;

    const sourcePlan = await DayPlan.findOne({ date: sourceDate, userId });
    if (!sourcePlan) {
      return res.status(404).json({
        success: false,
        data: null,
        error: `Source day plan for ${sourceDate} not found.`,
      });
    }

    // Copy blocks, resetting completed status
    const copiedBlocks = sourcePlan.timeBlocks.map(block => ({
      startTime: block.startTime,
      endTime: block.endTime,
      label: block.label,
      category: block.category,
      completed: false,
    }));

    const plan = await DayPlan.findOneAndUpdate(
      { date, userId },
      { timeBlocks: copiedBlocks, notes: sourcePlan.notes || '', userId },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
