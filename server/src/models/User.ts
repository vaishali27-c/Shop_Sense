import mongoose from 'mongoose';

export interface IUser {
  fullName: string;
  email: string;
  phone?: string;
  passwordHash: string;
  createdAt?: Date;
}

const UserSchema = new mongoose.Schema<IUser>({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

export const UserModel = mongoose.model('User', UserSchema);
