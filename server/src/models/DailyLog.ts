import { Schema, model, Document, Types } from 'mongoose';

export interface ILogTask {
  taskId?: Types.ObjectId;
  title: string;
  points: number;
  category: 'health' | 'work' | 'learning' | 'personal';
  completed: boolean;
  completedAt?: Date;
}

export interface IDailyLog extends Document {
  date: string; // YYYY-MM-DD
  tasks: ILogTask[];
  totalPoints: number;
  notes?: string;
}

const logTaskSchema = new Schema<ILogTask>({
  taskId: { type: Schema.Types.ObjectId, ref: 'DailyTask' },
  title: { type: String, required: true },
  points: { type: Number, required: true, min: 1, max: 5 },
  category: { type: String, enum: ['health', 'work', 'learning', 'personal'], required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date },
});

const dailyLogSchema = new Schema<IDailyLog>({
  date: { type: String, required: true, unique: true }, // Format YYYY-MM-DD
  tasks: [logTaskSchema],
  totalPoints: { type: Number, default: 0, required: true },
  notes: { type: String, default: '' },
}, { timestamps: true });

export const DailyLog = model<IDailyLog>('DailyLog', dailyLogSchema);
