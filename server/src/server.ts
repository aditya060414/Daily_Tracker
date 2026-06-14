import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './db';
import { errorHandler } from './middleware/errorHandler';

// Import routers
import authRouter from './routes/auth';
import dailyTasksRouter from './routes/dailyTasks';
import dailyLogsRouter from './routes/dailyLogs';
import gymRouter from './routes/gym';
import dayPlanRouter from './routes/dayPlan';
import goalsRouter from './routes/goals';
import mealsRouter from './routes/meals';
import reviewsRouter from './routes/reviews';
import analyticsRouter from './routes/analytics';
import stickyNotesRouter from './routes/stickyNotes';
import skincareRouter from './routes/skincare';
import focusRouter from './routes/focus';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Security and utility Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Auth rate limiter: max 10 requests per minute
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP. Please try again after a minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Log requests in development
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// REST API routes registration
// Register auth routes under both /api/auth and /api/v1/auth for maximum flexibility
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/v1/auth', authLimiter, authRouter);

app.use('/api/v1/daily-tasks', dailyTasksRouter);
app.use('/api/v1/daily-logs', dailyLogsRouter);
app.use('/api/v1/gym', gymRouter);
app.use('/api/v1/day-plan', dayPlanRouter);
app.use('/api/v1/goals', goalsRouter);
app.use('/api/v1/meals', mealsRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/sticky-notes', stickyNotesRouter);
app.use('/api/v1/skincare', skincareRouter);
app.use('/api/v1/focus', focusRouter);

// Root route for sanity check
app.get('/', (req, res) => {
  res.json({ message: 'DailyOS API is online.' });
});

// Global Error Handler Middleware
app.use(errorHandler);

// Start listening
app.listen(PORT, () => {
  console.log(`DailyOS Server is running in development mode on port ${PORT}`);
});
