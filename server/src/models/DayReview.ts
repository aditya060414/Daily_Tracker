import { Schema, model, Document, Types } from 'mongoose';

export interface IDayReview extends Document {
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  mood: number; // 1-5
  highlights: string;
  challenges: string;
  gratitude: string;
  tomorrowFocus: string;
  wordCount: number;
}

const dayReviewSchema = new Schema<IDayReview>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  mood: { type: Number, required: true, min: 1, max: 5 },
  highlights: { type: String, default: '' },
  challenges: { type: String, default: '' },
  gratitude: { type: String, default: '' },
  tomorrowFocus: { type: String, default: '' },
  wordCount: { type: Number, default: 0 },
}, { timestamps: true });

// Ensure unique reviews per user per date
dayReviewSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DayReview = model<IDayReview>('DayReview', dayReviewSchema);
