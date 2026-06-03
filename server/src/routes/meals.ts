import { Router } from 'express';
import { Meal, IMealItem } from '../models/Meal';
import { authenticateToken } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// GET /api/v1/meals/:date - Get all meal segments for a date
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const meals = await Meal.find({ date });
    return res.json({
      success: true,
      data: meals,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/v1/meals/:date - Upsert a meal segment (e.g. breakfast, lunch, dinner, snack)
// Body: { mealType: 'breakfast'|'lunch'|'dinner'|'snack', items: [ { name, calories, protein, carbs, fat } ] }
router.put('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const { mealType, items } = req.body;

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
      { date, mealType },
      { items, totalCalories },
      { new: true, upsert: true, runValidators: true }
    );

    // Get all meals for this date to return synchronized data
    const allMeals = await Meal.find({ date });

    return res.json({
      success: true,
      data: allMeals,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/meals/:date/:mealType - Clear a specific meal segment
router.delete('/:date/:mealType', async (req, res, next) => {
  try {
    const { date, mealType } = req.params;
    await Meal.findOneAndDelete({ date, mealType });

    const allMeals = await Meal.find({ date });
    return res.json({
      success: true,
      data: allMeals,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
