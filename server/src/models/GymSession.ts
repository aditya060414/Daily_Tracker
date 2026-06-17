import { Schema, model, Document, Types } from 'mongoose';

export interface IGymSet {
  weight?: number;
  reps?: number;
  feel?: string;
}

export interface IGymExercise {
  name: string;
  sets: IGymSet[];
  unit: 'kg' | 'lbs';
  notes?: string;
  gifUrl?: string;
  bodyPart?: string;
}

export interface IGymSession extends Document {
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  exercises: IGymExercise[];
  durationMinutes: number;
  notes?: string;
  photos?: string[];
  bodyWeight?: number;
  split?: string;
}

const gymSetSchema = new Schema<IGymSet>({
  weight: { type: Number },
  reps: { type: Number },
  feel: { type: String, default: '' },
});

const gymExerciseSchema = new Schema<IGymExercise>({
  name: { type: String, required: true, trim: true },
  sets: { type: [gymSetSchema], default: [] },
  unit: { type: String, enum: ['kg', 'lbs'], default: 'kg', required: true },
  notes: { type: String, default: '' },
  gifUrl: { type: String, default: '' },
  bodyPart: { type: String, default: '' },
});

const gymSessionSchema = new Schema<IGymSession>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  exercises: [gymExerciseSchema],
  durationMinutes: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  photos: { type: [String], default: [] },
  bodyWeight: { type: Number },
  split: { type: String, default: '' },
}, { timestamps: true });

// Ensure unique sessions per user per date
gymSessionSchema.index({ userId: 1, date: 1 }, { unique: true });

export const GymSession = model<IGymSession>('GymSession', gymSessionSchema);

