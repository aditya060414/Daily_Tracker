import { Schema, model, Document, Types } from 'mongoose';

export interface ISkincareRoutineItem {
  step: string;
  productName: string;
  completed: boolean;
}

export interface ISkincareLog extends Document {
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  amRoutine: ISkincareRoutineItem[];
  pmRoutine: ISkincareRoutineItem[];
  skinRating: number; // 1 to 5
  hydration: number; // 1 to 5
  oiliness: number; // 1 to 5
  acne: number; // 1 to 5
  redness: boolean;
  notes: string;
}

const skincareRoutineItemSchema = new Schema<ISkincareRoutineItem>({
  step: { type: String, required: true, trim: true },
  productName: { type: String, default: '', trim: true },
  completed: { type: Boolean, default: false },
});

const skincareLogSchema = new Schema<ISkincareLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  amRoutine: [skincareRoutineItemSchema],
  pmRoutine: [skincareRoutineItemSchema],
  skinRating: { type: Number, default: 3, min: 1, max: 5 },
  hydration: { type: Number, default: 3, min: 1, max: 5 },
  oiliness: { type: Number, default: 3, min: 1, max: 5 },
  acne: { type: Number, default: 1, min: 1, max: 5 },
  redness: { type: Boolean, default: false },
  notes: { type: String, default: '' },
}, { timestamps: true });

// Ensure unique compound index for userId + date
skincareLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const SkincareLog = model<ISkincareLog>('SkincareLog', skincareLogSchema);
