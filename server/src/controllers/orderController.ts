import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { OrderModel } from '../models/Order';
import { ProductModel } from '../models/Product';
import { syncInventoryForProduct } from '../services/inventoryService';
import { fallbackOrders } from '../services/fallbackData';

function isMongoReady(): boolean {
  return Boolean(process.env.MONGODB_URI) && mongoose.connection.readyState === 1;
}

export async function getOrders(_req: Request, res: Response): Promise<void> {
  if (!isMongoReady()) {
    res.status(503).json({ message: 'Database unavailable' });
    return;
  }

  // If admin is authenticated, return all orders
  const reqAny = _req as any;
  if (reqAny.admin) {
    const orders = await OrderModel.find().sort({ orderDate: -1 });
    res.json(orders);
    return;
  }

  // If user is authenticated, return only that user's orders
  if (reqAny.user) {
    const orders = await OrderModel.find({ userId: reqAny.user.id }).sort({ orderDate: -1 });
    res.json(orders);
    return;
  }

  // unauthenticated — deny
  res.status(401).json({ message: 'Authentication required to view orders.' });
}

export async function getOrder(req: Request, res: Response): Promise<void> {
  const reqAny = req as any;
  if (!reqAny.admin && !reqAny.user) {
    res.status(401).json({ message: 'Authentication required to view orders.' });
    return;
  }
  if (!isMongoReady()) {
    if (!reqAny.admin) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    const order = fallbackOrders.find((entry) => entry.orderId === req.params.id);
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.json(order);
    return;
  }

  const query = reqAny.admin ? { orderId: req.params.id } : { orderId: req.params.id, userId: reqAny.user.id };
  const order = await OrderModel.findOne(query);
  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  res.json(order);
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  const payload = req.body;
  const reqAny = req as any;
  if (!reqAny.user) {
    res.status(401).json({ message: 'Authentication required to place an order.' });
    return;
  }

  const validPaymentMethods = ['Cash on Delivery', 'Credit / Debit Card', 'UPI / Wallet'];
  if (
    !payload.customerName ||
    !payload.customerEmail ||
    !payload.customerPhone ||
    !payload.address ||
    !payload.city ||
    !payload.state ||
    !payload.pincode ||
    !payload.paymentMethod ||
    !validPaymentMethods.includes(payload.paymentMethod) ||
    !Array.isArray(payload.items) ||
    payload.items.length === 0
  ) {
    res.status(400).json({ message: 'Invalid order payload' });
    return;
  }

  if (!isMongoReady()) {
    res.status(503).json({ message: 'Database unavailable' });
    return;
  }

  const { UserModel } = await import('../models/User.js');
  const user = await UserModel.findById(reqAny.user.id).lean().catch(() => null);
  if (user) {
    payload.customerEmail = user.email;
    payload.customerName = user.fullName ?? payload.customerName;
    payload.customerPhone = user.phone ?? payload.customerPhone;
  }

  const orderItems = [];

  for (const item of payload.items) {
    const product = await ProductModel.findOne({ id: item.productId });
    if (!product) {
      res.status(400).json({ message: `Product ${item.productId} not found` });
      return;
    }

    if (item.quantity > product.stock) {
      res.status(400).json({ message: `Not enough stock for ${product.name}` });
      return;
    }

    orderItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image: product.image,
    });
  }

  const totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;

  const order = await OrderModel.create({
    orderId,
    customerName: payload.customerName,
    customerEmail: payload.customerEmail,
    customerPhone: payload.customerPhone,
    userId: reqAny.user.id,
    address: payload.address,
    city: payload.city,
    pincode: payload.pincode,
    state: payload.state,
    shippingAddress: {
      label: payload.addressLabel,
      street: payload.address,
      city: payload.city,
      state: payload.state,
      pincode: payload.pincode,
    },
    recipient: payload.recipient,
    paymentMethod: payload.paymentMethod,
    paymentStatus: payload.paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Successful',
    items: orderItems,
    totalAmount,
    orderDate: new Date(),
    status: 'Placed',
  });

  for (const item of orderItems) {
    const product = await ProductModel.findOne({ id: item.productId });
    if (product) {
      product.stock = Math.max(0, product.stock - item.quantity);
      await product.save();
      await syncInventoryForProduct(product.id);
    }
  }

  res.status(201).json(order);
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  const validStatuses = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];
  const nextStatus = req.body.status;

  if (!validStatuses.includes(nextStatus)) {
    res.status(400).json({ message: 'Invalid order status' });
    return;
  }

  if (!isMongoReady()) {
    const existing = fallbackOrders.find((entry) => entry.orderId === req.params.id);
    if (!existing) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }

    res.json({ ...existing, status: nextStatus });
    return;
  }

  const order = await OrderModel.findOneAndUpdate(
    { orderId: req.params.id },
    { status: nextStatus },
    { new: true, runValidators: true },
  );

  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }

  res.json(order);
}
