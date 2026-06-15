import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  username?: string;
  email: string;
  password?: string;
  avatar?: string;
  googleId?: string;
  isVerified: boolean;
  loginMethod: 'email' | 'google';
  lastLogin?: Date;
  dailyFocusStreak: number;
  weeklyDeepWorkStreak: number;
  longestFocusStreak: number;
  lastFocusedDate?: string;
  totalFocusHours: number;
  achievements: string[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true, trim: true },
  username: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { type: String }, // Optional for Google users
  avatar: { type: String },
  googleId: { type: String, unique: true, sparse: true },
  isVerified: { type: Boolean, default: false },
  loginMethod: { type: String, enum: ['email', 'google'], default: 'email' },
  lastLogin: { type: Date },
  dailyFocusStreak: { type: Number, default: 0 },
  weeklyDeepWorkStreak: { type: Number, default: 0 },
  longestFocusStreak: { type: Number, default: 0 },
  lastFocusedDate: { type: String, default: '' },
  totalFocusHours: { type: Number, default: 0 },
  achievements: { type: [String], default: [] },
}, { timestamps: true });

export const User = model<IUser>('User', userSchema);
