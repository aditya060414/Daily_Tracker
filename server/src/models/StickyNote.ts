import { Schema, model, Document, Types } from 'mongoose';

export interface IStickyNote extends Document {
  userId: Types.ObjectId;
  title: string;
  content: string;
  color: 'yellow' | 'pink' | 'green' | 'blue' | 'purple' | 'orange' | 'teal' | 'gray' | 'dark';
  position: {
    x: number;
    y: number;
  };
  isMinimized: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const stickyNoteSchema = new Schema<IStickyNote>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, default: 'Untitled Note' },
    content: { type: String, default: '' },
    color: {
      type: String,
      enum: ['yellow', 'pink', 'green', 'blue', 'purple', 'orange', 'teal', 'gray', 'dark'],
      default: 'yellow',
    },
    position: {
      x: { type: Number, required: true, default: 50 },
      y: { type: Number, required: true, default: 50 },
    },
    isMinimized: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

// Add index on userId for fast lookups
stickyNoteSchema.index({ userId: 1 });

export const StickyNote = model<IStickyNote>('StickyNote', stickyNoteSchema);
