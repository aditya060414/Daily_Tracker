import { Schema, model, Document, Types } from 'mongoose';

export interface ITimeBlock {
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  label: string;
  category: string;
  completed: boolean;
}

export interface IDayPlan extends Document {
  userId: Types.ObjectId;
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
    required: true,
  },
  completed: { type: Boolean, default: false },
});

const dayPlanSchema = new Schema<IDayPlan>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  timeBlocks: [timeBlockSchema],
  notes: { type: String, default: '' },
}, { timestamps: true });

// Ensure unique plan timelines per user per date
dayPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DayPlan = model<IDayPlan>('DayPlan', dayPlanSchema);
