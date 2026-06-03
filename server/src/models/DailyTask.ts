import { Schema, model, Document } from 'mongoose';

export interface IDailyTask extends Document {
  title: string;
  isRepeating: boolean;
  points: number;
  category: 'health' | 'work' | 'learning' | 'personal';
  createdAt: Date;
}

const dailyTaskSchema = new Schema<IDailyTask>({
  title: { type: String, required: true, trim: true },
  isRepeating: { type: Boolean, required: true, default: true },
  points: { type: Number, required: true, min: 1, max: 5, default: 1 },
  category: {
    type: String,
    enum: ['health', 'work', 'learning', 'personal'],
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

export const DailyTask = model<IDailyTask>('DailyTask', dailyTaskSchema);
