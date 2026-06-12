import { Router } from 'express';
import { Meal, IMealItem } from '../models/Meal';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /api/v1/meals - Get all meal logs for user
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const meals = await Meal.find({ userId: req.user!.userId }).sort({ date: -1 });
    return res.json({
      success: true,
      data: meals,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/meals/:date - Get all meal segments for a date for user
router.get('/:date', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { date } = req.params;
    const meals = await Meal.find({ date, userId: req.user!.userId });
    return res.json({
      success: true,
      data: meals,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/meals/:date - Upsert a meal segment for user
router.put('/:date', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { date } = req.params;
    const { mealType, items } = req.body;
    const userId = req.user!.userId;

    if (!mealType || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'mealType and items array are required.',
      });
    }

    const totalCalories = items.reduce((sum: number, item: IMealItem) => sum + (Number(item.calories) || 0), 0);

    // Upsert meal segment
    await Meal.findOneAndUpdate(
      { date, mealType, userId },
      { items, totalCalories, userId },
      { new: true, upsert: true, runValidators: true }
    );

    // Get all meals for this date to return synchronized data
    const allMeals = await Meal.find({ date, userId });

    return res.json({
      success: true,
      data: allMeals,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/meals/:date/:mealType - Clear a specific meal segment for user
router.delete('/:date/:mealType', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { date, mealType } = req.params;
    const userId = req.user!.userId;
    await Meal.findOneAndDelete({ date, mealType, userId });

    const allMeals = await Meal.find({ date, userId });
    return res.json({
      success: true,
      data: allMeals,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
