import { Schema, model, Document, Types } from 'mongoose';

export interface IFocusSession extends Document {
  userId: Types.ObjectId;
  taskId?: Types.ObjectId;
  goalId?: Types.ObjectId;
  sessionType: 'focus' | 'shortBreak' | 'longBreak' | 'custom';
  duration: number; // in seconds
  completed: boolean;
  startedAt: Date;
  endedAt: Date;
  pointsEarned: number;
}

const focusSessionSchema = new Schema<IFocusSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    taskId: { type: Schema.Types.ObjectId }, // Can be a task inside checklist
    goalId: { type: Schema.Types.ObjectId, ref: 'Goal' },
    sessionType: {
      type: String,
      enum: ['focus', 'shortBreak', 'longBreak', 'custom'],
      required: true,
    },
    duration: { type: Number, required: true }, // duration in seconds
    completed: { type: Boolean, default: false, required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    pointsEarned: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexing for faster telemetry aggregation
focusSessionSchema.index({ userId: 1, startedAt: -1 });

export const FocusSession = model<IFocusSession>('FocusSession', focusSessionSchema);
