import { Schema, model, Document } from 'mongoose';

export interface INutritionReference extends Document {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize?: string;
  micronutrients?: Map<string, number>;
}

const nutritionReferenceSchema = new Schema<INutritionReference>({
  name: { type: String, required: true, unique: true, trim: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
  fiber: { type: Number },
  sugar: { type: Number },
  sodium: { type: Number },
  servingSize: { type: String, default: '100g' },
  micronutrients: { type: Map, of: Number }
});

// Add text index on name for fast text searching
nutritionReferenceSchema.index({ name: 'text' });

export const NutritionReference = model<INutritionReference>('NutritionReference', nutritionReferenceSchema);
