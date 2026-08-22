import mongoose from 'mongoose';

export interface IAdmin {
  email: string;
  name?: string;
  passwordHash: string;
  createdAt?: Date;
}

const AdminSchema = new mongoose.Schema<IAdmin>({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() },
});

export const AdminModel = mongoose.model('Admin', AdminSchema);
