import mongoose from 'mongoose';

export interface IGoogleConnection {
  adminId: mongoose.Types.ObjectId;
  googleSubject?: string;
  googleEmail?: string;
  refreshTokenEncrypted?: string;
  accessTokenEncrypted?: string;
  accessTokenExpiresAt?: Date;
  scopes: string[];
  selectedGscProperty?: string;
  selectedGa4Property?: string;
  pendingStateHash?: string;
  pendingStateExpiresAt?: Date;
  status: 'connected' | 'disconnected' | 'error';
  lastError?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const GoogleConnectionSchema = new mongoose.Schema<IGoogleConnection>({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, unique: true, index: true },
  googleSubject: String,
  googleEmail: String,
  refreshTokenEncrypted: String,
  accessTokenEncrypted: String,
  accessTokenExpiresAt: Date,
  scopes: { type: [String], default: [] },
  selectedGscProperty: String,
  selectedGa4Property: String,
  pendingStateHash: String,
  pendingStateExpiresAt: Date,
  status: { type: String, enum: ['connected', 'disconnected', 'error'], default: 'disconnected' },
  lastError: String,
}, { timestamps: true });

export const GoogleConnectionModel = mongoose.model('GoogleConnection', GoogleConnectionSchema);
