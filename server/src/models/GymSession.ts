import { Schema, model, Document } from 'mongoose';

export interface IGymExercise {
  name: string;
  sets: number;
  reps: number;
  weight: number;
  unit: 'kg' | 'lbs';
  notes?: string;
}

export interface IGymSession extends Document {
  date: string; // YYYY-MM-DD
  exercises: IGymExercise[];
  durationMinutes: number;
  notes?: string;
}

const gymExerciseSchema = new Schema<IGymExercise>({
  name: { type: String, required: true, trim: true },
  sets: { type: Number, required: true, min: 1 },
  reps: { type: Number, required: true, min: 1 },
  weight: { type: Number, required: true, min: 0 },
  unit: { type: String, enum: ['kg', 'lbs'], default: 'kg', required: true },
  notes: { type: String, default: '' },
});

const gymSessionSchema = new Schema<IGymSession>({
  date: { type: String, required: true, unique: true }, // One session per day
  exercises: [gymExerciseSchema],
  durationMinutes: { type: Number, default: 0 },
  notes: { type: String, default: '' },
}, { timestamps: true });

export const GymSession = model<IGymSession>('GymSession', gymSessionSchema);
