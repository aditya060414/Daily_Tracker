import { Schema, model, Document, Types } from 'mongoose';

export interface IDailyTask extends Document {
  userId: Types.ObjectId;
  title: string;
  isRepeating: boolean;
  points: number;
  category: string;
  createdAt: Date;
}

const dailyTaskSchema = new Schema<IDailyTask>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  isRepeating: { type: Boolean, required: true, default: true },
  points: { type: Number, required: true, min: 1, max: 5, default: 1 },
  category: {
    type: String,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

export const DailyTask = model<IDailyTask>('DailyTask', dailyTaskSchema);
