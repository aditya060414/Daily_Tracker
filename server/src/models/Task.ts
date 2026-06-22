import { Schema, model, Document, Types } from 'mongoose';

export interface ITask extends Document {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  tags: string[];
  deadline: Date;
  status: 'todo' | 'in_progress' | 'done';
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    tags: { type: [String], default: [] },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
    },
  },
  { timestamps: true }
);

// Compound index for fast user-scoped, deadline-sorted queries
taskSchema.index({ userId: 1, deadline: 1 });

export const Task = model<ITask>('Task', taskSchema);
