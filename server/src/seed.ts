import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User';
import { DailyTask } from './models/DailyTask';
import { DailyLog } from './models/DailyLog';
import { GymSession } from './models/GymSession';
import { DayPlan } from './models/DayPlan';
import { Goal } from './models/Goal';
import { Meal } from './models/Meal';
import { DayReview } from './models/DayReview';
import { SkincareLog } from './models/SkincareLog';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MOONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dailyos';
const DEFAULT_USER = process.env.DEFAULT_USER || 'admin';
const DEFAULT_PASS = process.env.DEFAULT_PASS || 'password123';

const cleanDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected. Clearing all collections...');

    await User.deleteMany({});
    await DailyTask.deleteMany({});
    await DailyLog.deleteMany({});
    await GymSession.deleteMany({});
    await DayPlan.deleteMany({});
    await Goal.deleteMany({});
    await Meal.deleteMany({});
    await DayReview.deleteMany({});
    await SkincareLog.deleteMany({});

    console.log('Collections cleared. Seeding default admin user...');

    const passwordHash = await bcrypt.hash(DEFAULT_PASS, 10);
    await User.create({
      username: DEFAULT_USER.toLowerCase(),
      passwordHash,
    });
    
    console.log('\n=========================================');
    console.log('DATABASE CLEARED SUCCESSFULLY!');
    console.log('Admin account credentials (clean start):');
    console.log(`Username: ${DEFAULT_USER}`);
    console.log(`Password: ${DEFAULT_PASS}`);
    console.log('=========================================\n');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
};

cleanDatabase();
