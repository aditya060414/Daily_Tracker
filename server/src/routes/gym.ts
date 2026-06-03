import { Router } from 'express';
import { GymSession } from '../models/GymSession';
import { authenticateToken } from '../middleware/auth';
import { startOfWeek, endOfWeek, parseISO } from 'date-fns';

const router = Router();
router.use(authenticateToken);

// GET /api/v1/gym - Get gym sessions with optional date range queries (startDate, endDate)
router.get('/', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query: any = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate as string;
      if (endDate) query.date.$lte = endDate as string;
    }

    const sessions = await GymSession.find(query).sort({ date: 1 });
    return res.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/gym/:date - Get a specific gym session
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const session = await GymSession.findOne({ date });
    return res.json({
      success: true,
      data: session || null, // UI will handle null by presenting an empty workout sheet
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/gym/:date - Upsert workout session
router.put('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const { exercises, durationMinutes, notes } = req.body;

    const session = await GymSession.findOneAndUpdate(
      { date },
      {
        exercises: exercises || [],
        durationMinutes: durationMinutes || 0,
        notes: notes || '',
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.json({
      success: true,
      data: session,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/gym/:date - Delete a session
router.delete('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const session = await GymSession.findOneAndDelete({ date });

    if (!session) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Gym session not found for this date.',
      });
    }

    return res.json({
      success: true,
      data: { date },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
