import { Router } from 'express';
import { DayPlan } from '../models/DayPlan';
import { authenticateToken } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /api/v1/day-plan/:date - Get day plan timeline blocks
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const plan = await DayPlan.findOne({ date });
    return res.json({
      success: true,
      data: plan || { date, timeBlocks: [] },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/day-plan/:date - Upsert day plan timeline blocks
router.put('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const { timeBlocks, notes } = req.body;

    const updateObj: any = {};
    if (timeBlocks !== undefined) updateObj.timeBlocks = timeBlocks;
    if (notes !== undefined) updateObj.notes = notes;

    const plan = await DayPlan.findOneAndUpdate(
      { date },
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

// POST /api/v1/day-plan/:date/copy-from/:sourceDate - Copy plan blocks from sourceDate to date
router.post('/:date/copy-from/:sourceDate', async (req, res, next) => {
  try {
    const { date, sourceDate } = req.params;

    const sourcePlan = await DayPlan.findOne({ date: sourceDate });
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
      { date },
      { timeBlocks: copiedBlocks, notes: sourcePlan.notes || '' },
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
