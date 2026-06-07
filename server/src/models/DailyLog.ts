import { Schema, model, Document, Types } from 'mongoose';

export interface ILogTask {
  taskId?: Types.ObjectId;
  title: string;
  points: number;
  category: string;
  completed: boolean;
  completedAt?: Date;
}

export interface IDailyLog extends Document {
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  tasks: ILogTask[];
  totalPoints: number;
  notes?: string;
}

const logTaskSchema = new Schema<ILogTask>({
  taskId: { type: Schema.Types.ObjectId, ref: 'DailyTask' },
  title: { type: String, required: true },
  points: { type: Number, required: true, min: 1, max: 5 },
  category: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
});

const dailyLogSchema = new Schema<IDailyLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  tasks: [logTaskSchema],
  totalPoints: { type: Number, default: 0, required: true },
  notes: { type: String, default: '' },
}, { timestamps: true });

// Ensure unique daily logs per user per date
dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyLog = model<IDailyLog>('DailyLog', dailyLogSchema);
