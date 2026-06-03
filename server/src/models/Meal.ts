import { Schema, model, Document } from 'mongoose';

export interface IMealItem {
  name: string;
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
}

export interface IMeal extends Document {
  date: string; // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: IMealItem[];
  totalCalories: number;
}

const mealItemSchema = new Schema<IMealItem>({
  name: { type: String, required: true, trim: true },
  calories: { type: Number, required: true, min: 0 },
  protein: { type: Number, default: 0, min: 0 },
  carbs: { type: Number, default: 0, min: 0 },
  fat: { type: Number, default: 0, min: 0 },
});

const mealSchema = new Schema<IMeal>({
  date: { type: String, required: true }, // YYYY-MM-DD
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true,
  },
  items: [mealItemSchema],
  totalCalories: { type: Number, default: 0, required: true },
}, { timestamps: true });

// Ensure unique compound index so there is only one breakfast/lunch/etc per date
mealSchema.index({ date: 1, mealType: 1 }, { unique: true });

export const Meal = model<IMeal>('Meal', mealSchema);
