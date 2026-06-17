import { Router } from 'express';
import { NutritionReference } from '../models/NutritionReference';
import { ExerciseReference } from '../models/ExerciseReference';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply auth middleware to keep endpoints secured for logged-in users
router.use(authenticateToken);

// GET /api/v1/reference/nutrition/search?q=<query>&full=true
router.get('/nutrition/search', async (req, res, next) => {
  try {
    const q = req.query.q as string;
    const full = req.query.full === 'true';

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    // Perform partial case-insensitive regex match on name
    const query = { name: { $regex: q.trim(), $options: 'i' } };

    let selection = '_id name calories protein carbs fat';
    if (full) {
      selection = ''; // Get all fields
    }

    const matches = await NutritionReference.find(query)
      .select(selection)
      .limit(10);

    return res.json({
      success: true,
      data: matches,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/reference/nutrition/:id
router.get('/nutrition/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const food = await NutritionReference.findById(id);

    if (!food) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Food item reference not found.',
      });
    }

    return res.json({
      success: true,
      data: food,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/reference/exercises/search?bodyPart=<query>
router.get('/exercises/search', async (req, res, next) => {
  try {
    const bodyPart = req.query.bodyPart as string;

    if (!bodyPart || bodyPart.trim().length < 2) {
      return res.json({ success: true, data: {} });
    }

    // Match case-insensitively on bodyPart
    const query = { bodyPart: { $regex: bodyPart.trim(), $options: 'i' } };
    const matches = await ExerciseReference.find(query);

    // Group exercises by targetMuscle (or other grouping)
    const grouped: Record<string, any[]> = {};
    matches.forEach(ex => {
      const muscle = ex.targetMuscle || 'other';
      const muscleKey = muscle.toLowerCase();
      if (!grouped[muscleKey]) {
        grouped[muscleKey] = [];
      }
      grouped[muscleKey].push(ex);
    });

    return res.json({
      success: true,
      data: grouped,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
