import { Schema, model, Document } from 'mongoose';

export interface ITimeBlock {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  label: string;
  category: 'work' | 'health' | 'learning' | 'personal' | 'rest';
  completed: boolean;
}

export interface IDayPlan extends Document {
  date: string; // YYYY-MM-DD
  timeBlocks: ITimeBlock[];
  notes?: string;
}

const timeBlockSchema = new Schema<ITimeBlock>({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  label: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['work', 'health', 'learning', 'personal', 'rest'],
    required: true,
  },
  completed: { type: Boolean, default: false },
});

const dayPlanSchema = new Schema<IDayPlan>({
  date: { type: String, required: true, unique: true }, // One timeline plan per date
  timeBlocks: [timeBlockSchema],
  notes: { type: String, default: '' },
}, { timestamps: true });

export const DayPlan = model<IDayPlan>('DayPlan', dayPlanSchema);
