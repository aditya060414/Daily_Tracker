import { Schema, model, Document, Types } from 'mongoose';

export interface IMilestone {
  label: string;
  completed: boolean;
}

export interface IProgressSnapshot {
  date: string; // YYYY-MM-DD
  progress: number;
}

export interface IGoal extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  type: 'today' | 'short-term' | 'long-term';
  targetDate: Date;
  progress: number; // 0-100
  milestones: IMilestone[];
  status: 'active' | 'completed' | 'paused';
  progressHistory: IProgressSnapshot[];
}

const milestoneSchema = new Schema<IMilestone>({
  label: { type: String, required: true },
  completed: { type: Boolean, default: false },
});

const progressSnapshotSchema = new Schema<IProgressSnapshot>({
  date: { type: String, required: true },
  progress: { type: Number, required: true },
});

const goalSchema = new Schema<IGoal>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: {
    type: String,
    enum: ['today', 'short-term', 'long-term'],
    required: true,
  },
  targetDate: { type: Date, required: true },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  milestones: [milestoneSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active',
  },
  progressHistory: [progressSnapshotSchema],
}, { timestamps: true });

export const Goal = model<IGoal>('Goal', goalSchema);
