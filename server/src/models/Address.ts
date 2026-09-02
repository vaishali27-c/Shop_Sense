import { Schema, model, type Document } from 'mongoose';

export interface IAddress extends Document {
  userId: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const AddressSchema = new Schema<IAddress>(
  {
    userId: { type: String, required: true, index: true },
    label: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const AddressModel = model<IAddress>('Address', AddressSchema);