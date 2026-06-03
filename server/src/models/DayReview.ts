import { Schema, model, Document } from 'mongoose';

export interface IDayReview extends Document {
  date: string; // YYYY-MM-DD
  mood: number; // 1-5
  highlights: string;
  challenges: string;
  gratitude: string;
  tomorrowFocus: string;
  wordCount: number;
}

const dayReviewSchema = new Schema<IDayReview>({
  date: { type: String, required: true, unique: true }, // Format YYYY-MM-DD
  mood: { type: Number, required: true, min: 1, max: 5 },
  highlights: { type: String, default: '' },
  challenges: { type: String, default: '' },
  gratitude: { type: String, default: '' },
  tomorrowFocus: { type: String, default: '' },
  wordCount: { type: Number, default: 0 },
}, { timestamps: true });

export const DayReview = model<IDayReview>('DayReview', dayReviewSchema);
