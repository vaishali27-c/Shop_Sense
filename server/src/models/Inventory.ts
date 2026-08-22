import { Schema, model, type Document } from 'mongoose';

export interface IInventory extends Document {
  productId: string;
  currentStock: number;
  unitsSold: number;
  reorderLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  restockPriority: 'High' | 'Medium' | 'Low' | 'None';
  restockReason: string;
}

const InventorySchema = new Schema<IInventory>(
  {
    productId: { type: String, required: true, unique: true, index: true },
    currentStock: { type: Number, required: true, min: 0, default: 0 },
    unitsSold: { type: Number, required: true, min: 0, default: 0 },
    reorderLevel: { type: Number, required: true, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock'],
      required: true,
    },
    restockPriority: {
      type: String,
      enum: ['High', 'Medium', 'Low', 'None'],
      required: true,
    },
    restockReason: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export const InventoryModel = model<IInventory>('Inventory', InventorySchema);
