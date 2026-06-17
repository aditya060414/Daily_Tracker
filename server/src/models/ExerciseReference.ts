import { Schema, model, Document } from 'mongoose';

export interface IExerciseReference extends Document {
  name: string;
  bodyPart: string;
  equipment?: string;
  difficulty?: string;
  targetMuscle?: string;
  instructions?: string;
  gifUrl: string;
}

const exerciseReferenceSchema = new Schema<IExerciseReference>({
  name: { type: String, required: true, unique: true, trim: true },
  bodyPart: { type: String, required: true, trim: true },
  equipment: { type: String, trim: true },
  difficulty: { type: String, trim: true },
  targetMuscle: { type: String, trim: true },
  instructions: { type: String, trim: true },
  gifUrl: { type: String, required: true }
});

// Add text indexes on bodyPart + name for search lookup
exerciseReferenceSchema.index({ bodyPart: 'text', name: 'text' });

export const ExerciseReference = model<IExerciseReference>('ExerciseReference', exerciseReferenceSchema);
