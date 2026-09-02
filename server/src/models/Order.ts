import { Schema, model, type Document } from 'mongoose';

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface IShippingAddress {
  label?: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IRecipient {
  name: string;
  phone: string;
  email?: string;
}

export interface IOrder extends Document {
  userId: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  shippingAddress: IShippingAddress;
  recipient?: IRecipient;
  paymentMethod: 'Cash on Delivery' | 'Credit / Debit Card' | 'UPI / Wallet';
  paymentStatus: 'Pending' | 'Successful' | 'Failed';
  items: IOrderItem[];
  totalAmount: number;
  orderDate: Date;
  status: 'Placed' | 'Confirmed' | 'Shipped' | 'Delivered';
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String, required: true },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: String, required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true, default: '' },
    shippingAddress: {
      label: { type: String, trim: true },
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    recipient: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true },
    },
    paymentMethod: {
      type: String,
      enum: ['Cash on Delivery', 'Credit / Debit Card', 'UPI / Wallet'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Successful', 'Failed'],
      default: 'Pending',
    },
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    orderDate: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: ['Placed', 'Confirmed', 'Shipped', 'Delivered'],
      default: 'Placed',
    },
  },
  { timestamps: true },
);

export const OrderModel = model<IOrder>('Order', OrderSchema);
