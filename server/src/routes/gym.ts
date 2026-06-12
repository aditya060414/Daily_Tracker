import { Router } from 'express';
import { GymSession } from '../models/GymSession';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /api/v1/gym - Get gym sessions with optional date range queries (startDate, endDate) for user
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query: any = { userId: req.user!.userId };

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

// GET /api/v1/gym/:date - Get a specific gym session for user
router.get('/:date', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { date } = req.params;
    const session = await GymSession.findOne({ date, userId: req.user!.userId });
    return res.json({
      success: true,
      data: session || null,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/gym/:date - Upsert workout session for user
router.put('/:date', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { date } = req.params;
    const { exercises, durationMinutes, notes, photos } = req.body;
    const userId = req.user!.userId;

    const session = await GymSession.findOneAndUpdate(
      { date, userId },
      {
        userId,
        exercises: exercises || [],
        durationMinutes: durationMinutes || 0,
        notes: notes || '',
        photos: photos || [],
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

// DELETE /api/v1/gym/:date - Delete a session for user
router.delete('/:date', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { date } = req.params;
    const session = await GymSession.findOneAndDelete({ date, userId: req.user!.userId });

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
