import type { Request, Response } from 'express';
import { ProductModel } from '../models/Product';
import { OrderModel } from '../models/Order';
import { fallbackOrders, fallbackProducts } from '../services/fallbackData';

function isMongoReady(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function getAnalyticsSummary(_req: Request, res: Response): Promise<void> {
  if (!isMongoReady()) {
    const totalRevenue = fallbackOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    res.json({
      totalProducts: fallbackProducts.length,
      totalOrders: fallbackOrders.length,
      totalRevenue,
    });
    return;
  }

  const [productCount, orderCount, revenue] = await Promise.all([
    ProductModel.countDocuments(),
    OrderModel.countDocuments(),
    // Sum revenue from all persisted orders. If the project later introduces
    // a 'Cancelled' status we should exclude it here. For now include all.
    OrderModel.aggregate([
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } },
    ]),
  ]);

  res.json({
    totalProducts: productCount,
    totalOrders: orderCount,
    totalRevenue: revenue[0]?.revenue ?? 0,
  });
}

export async function getSalesAnalytics(_req: Request, res: Response): Promise<void> {
  if (!isMongoReady()) {
    res.json(
      fallbackOrders.map((order) => ({
        orderId: order.orderId,
        orderDate: order.orderDate,
        totalAmount: order.totalAmount,
        status: order.status,
      })),
    );
    return;
  }

  const orders = await OrderModel.find().sort({ orderDate: 1 });

  res.json(
    orders.map((order) => ({
      orderId: order.orderId,
      orderDate: order.orderDate,
      totalAmount: order.totalAmount,
      status: order.status,
    })),
  );
}

export async function getTopProducts(_req: Request, res: Response): Promise<void> {
  if (!isMongoReady()) {
    const top = fallbackProducts.slice(0, 4).map((product) => ({
      productId: product.id,
      productName: product.name,
      unitsSold: product.ratingCount % 12,
    }));
    res.json(top);
    return;
  }

  const topProducts = await OrderModel.aggregate([
    { $unwind: '$items' },
    { $group: { _id: '$items.productId', unitsSold: { $sum: '$items.quantity' } } },
    { $sort: { unitsSold: -1 } },
    { $limit: 5 },
  ]);

  const enriched = await Promise.all(
    topProducts.map(async (row) => {
      const product = await ProductModel.findOne({ id: row._id });
      return {
        productId: row._id,
        productName: product?.name ?? row._id,
        unitsSold: row.unitsSold,
      };
    }),
  );

  res.json(enriched);
}
