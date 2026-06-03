import { Schema, model } from 'mongoose';

export interface IUser {
  username: string;
  passwordHash: string;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
}, { timestamps: true });

export const User = model<IUser>('User', userSchema);
