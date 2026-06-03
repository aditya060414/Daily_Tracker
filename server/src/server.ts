import express from 'express';
import cors from 'cors';
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Middlewares
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests in development
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// REST API routes registration under prefix /api/v1
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/daily-tasks', dailyTasksRouter);
app.use('/api/v1/daily-logs', dailyLogsRouter);
app.use('/api/v1/gym', gymRouter);
app.use('/api/v1/day-plan', dayPlanRouter);
app.use('/api/v1/goals', goalsRouter);
app.use('/api/v1/meals', mealsRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/analytics', analyticsRouter);

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
