import { Router } from 'express';
import { SkincareLog, ISkincareRoutineItem } from '../models/SkincareLog';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /api/v1/skincare/history - Get 30-day skincare history for trends
router.get('/history', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const history = await SkincareLog.find({ userId }).sort({ date: -1 }).limit(30);
    return res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/skincare/:date - Get skincare log for a date (or copy forward / initialize default)
router.get('/:date', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { date } = req.params;
    const userId = req.user!.userId;

    let log = await SkincareLog.findOne({ date, userId });

    if (!log) {
      // Find the most recent skincare log to copy routine products
      const lastLog = await SkincareLog.findOne({ userId }).sort({ date: -1 });

      let amRoutine: ISkincareRoutineItem[] = [];
      let pmRoutine: ISkincareRoutineItem[] = [];

      if (lastLog) {
        // Carry forward the routine steps and products, but reset completion status
        amRoutine = lastLog.amRoutine.map(item => ({
          step: item.step,
          productName: item.productName || '',
          completed: false,
        }));
        pmRoutine = lastLog.pmRoutine.map(item => ({
          step: item.step,
          productName: item.productName || '',
          completed: false,
        }));
      } else {
        // Fall back to default initial routine
        amRoutine = [
          { step: 'Cleanser', productName: 'Gentle Cleanser', completed: false },
          { step: 'Toner', productName: 'Hydrating Toner', completed: false },
          { step: 'Serum', productName: 'Vitamin C Serum', completed: false },
          { step: 'Moisturizer', productName: 'Moisturizer', completed: false },
          { step: 'Sunscreen', productName: 'Sunscreen SPF 30+', completed: false },
        ];
        pmRoutine = [
          { step: 'Double Cleanse', productName: 'Cleansing Oil + Foaming Cleanser', completed: false },
          { step: 'Toner', productName: 'Hydrating Toner', completed: false },
          { step: 'Treatment', productName: 'Retinol / Treatment', completed: false },
          { step: 'Moisturizer', productName: 'Barrier Cream', completed: false },
          { step: 'Eye Cream', productName: 'Eye Cream', completed: false },
        ];
      }

      log = await SkincareLog.create({
        userId,
        date,
        amRoutine,
        pmRoutine,
        skinRating: 3,
        hydration: 3,
        oiliness: 3,
        acne: 1,
        redness: false,
        notes: '',
      });
    }

    return res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/skincare/:date - Update skincare log for a date
router.put('/:date', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { date } = req.params;
    const userId = req.user!.userId;
    const {
      amRoutine,
      pmRoutine,
      skinRating,
      hydration,
      oiliness,
      acne,
      redness,
      notes,
    } = req.body;

    const log = await SkincareLog.findOneAndUpdate(
      { date, userId },
      {
        userId,
        date,
        amRoutine,
        pmRoutine,
        skinRating,
        hydration,
        oiliness,
        acne,
        redness,
        notes,
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.json({
      success: true,
      data: log,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
