import { Schema, model, type Document, type Types } from 'mongoose';

export interface IProduct extends Document {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  stock: number;
  reorderLevel: number;
  rating: number;
  ratingCount: number;
  description: string;
  specs: Record<string, string>;
  image: string;
  featured?: boolean;
  trending?: boolean;
  bestSeller?: boolean;
  specialOffer?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    reorderLevel: { type: Number, required: true, min: 0, default: 0 },
    rating: { type: Number, required: true, default: 0 },
    ratingCount: { type: Number, required: true, default: 0, min: 0 },
    description: { type: String, required: true, trim: true },
    specs: { type: Schema.Types.Mixed, default: {} },
    image: { type: String, required: true },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    bestSeller: { type: Boolean, default: false },
    specialOffer: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const ProductModel = model<IProduct>('Product', ProductSchema);
