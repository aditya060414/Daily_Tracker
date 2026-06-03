import { Router } from 'express';
import { DayReview } from '../models/DayReview';
import { authenticateToken } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// Helper to count words
const calculateWordCount = (
  highlights: string = '',
  challenges: string = '',
  gratitude: string = '',
  tomorrowFocus: string = ''
): number => {
  const text = `${highlights} ${challenges} ${gratitude} ${tomorrowFocus}`.trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(word => word.length > 0).length;
};

// GET /api/v1/reviews - List all reviews (sorted by date descending)
router.get('/', async (req, res, next) => {
  try {
    const reviews = await DayReview.find().sort({ date: -1 });
    return res.json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/reviews/:date - Get specific day review
router.get('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const review = await DayReview.findOne({ date });
    return res.json({
      success: true,
      data: review || null,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/reviews/:date - Upsert a day review (saves automatically on blur / update)
router.patch('/:date', async (req, res, next) => {
  try {
    const { date } = req.params;
    const { mood, highlights, challenges, gratitude, tomorrowFocus } = req.body;

    // Fetch existing or initialize default review fields to calculate wordCount accurately
    const existing = await DayReview.findOne({ date });
    
    const updatedMood = mood !== undefined ? mood : (existing?.mood || 3);
    const updatedHighlights = highlights !== undefined ? highlights : (existing?.highlights || '');
    const updatedChallenges = challenges !== undefined ? challenges : (existing?.challenges || '');
    const updatedGratitude = gratitude !== undefined ? gratitude : (existing?.gratitude || '');
    const updatedTomorrowFocus = tomorrowFocus !== undefined ? tomorrowFocus : (existing?.tomorrowFocus || '');

    const wordCount = calculateWordCount(
      updatedHighlights,
      updatedChallenges,
      updatedGratitude,
      updatedTomorrowFocus
    );

    const review = await DayReview.findOneAndUpdate(
      { date },
      {
        mood: updatedMood,
        highlights: updatedHighlights,
        challenges: updatedChallenges,
        gratitude: updatedGratitude,
        tomorrowFocus: updatedTomorrowFocus,
        wordCount,
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
