import { Router } from 'express';
import { DailyLog } from '../models/DailyLog';
import { authenticateToken } from '../middleware/auth';
import { subDays, format, parseISO } from 'date-fns';

const router = Router();
router.use(authenticateToken);

// GET /api/v1/analytics/points?range=7|14|30
router.get('/points', async (req, res, next) => {
  try {
    const range = parseInt(req.query.range as string) || 30;
    
    // Determine the list of YYYY-MM-DD dates in the range (ending today)
    const today = new Date();
    const dates: string[] = [];
    
    for (let i = range - 1; i >= 0; i--) {
      const d = subDays(today, i);
      dates.push(format(d, 'yyyy-MM-dd'));
    }

    // Query logs in this date set
    const logs = await DailyLog.find({
      date: { $in: dates },
    });

    // Build a map of date -> points
    const pointsMap: Record<string, number> = {};
    logs.forEach(log => {
      pointsMap[log.date] = log.totalPoints;
    });

    // Generate output with 0 points for missing dates
    const data = dates.map(date => ({
      date,
      points: pointsMap[date] || 0,
    }));

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
