import { ProductModel } from '../models/Product';
import { InventoryModel } from '../models/Inventory';

export type InventoryStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';
export type ReStockPriority = 'High' | 'Medium' | 'Low' | 'None';

export function calculateInventoryStatus(currentStock: number, reorderLevel: number): InventoryStatus {
  if (currentStock <= 0) return 'Out of Stock';
  if (currentStock <= reorderLevel) return 'Low Stock';
  return 'In Stock';
}

export async function syncInventoryForProduct(productId: string): Promise<void> {
  const product = await ProductModel.findOne({ id: productId });
  if (!product) return;

  const inventoryDoc = await InventoryModel.findOne({ productId });
  const currentStock = product.stock;
  const reorderLevel = product.reorderLevel;
  const status = calculateInventoryStatus(currentStock, reorderLevel);

  const unitsSold = await getUnitsSold(productId);

  let priority: ReStockPriority = 'None';
  let reason = 'Stock is healthy relative to current demand.';

  if (status === 'Out of Stock') {
    priority = 'High';
    reason = 'Stock is unavailable and recent sales continue to create demand.';
  } else if (status === 'Low Stock') {
    if (unitsSold >= 1) {
      priority = 'High';
      reason = 'Stock is below reorder level and recent sales are strong.';
    } else {
      priority = 'Medium';
      reason = 'Stock is below reorder level but demand is not currently active.';
    }
  } else if (unitsSold >= 5) {
    priority = 'Medium';
    reason = 'Stock is stable, but recent sales indicate restock monitoring is useful.';
  }

  const payload = {
    productId,
    currentStock,
    unitsSold,
    reorderLevel,
    status,
    restockPriority: priority,
    restockReason: reason,
  };

  if (inventoryDoc) {
    await InventoryModel.updateOne({ _id: inventoryDoc._id }, payload);
  } else {
    await InventoryModel.create(payload);
  }
}

export async function getUnitsSold(productId: string): Promise<number> {
  const { OrderModel } = await import('../models/Order');
  // Aggregate units sold from persisted orders. We include all orders
  // (the application doesn't currently have a 'Cancelled' status in the schema).
  const orders = await OrderModel.find().lean();

  let total = 0;
  for (const order of orders) {
    if (!order.items || !Array.isArray(order.items)) continue;
    for (const it of order.items as any[]) {
      if (it.productId === productId && typeof it.quantity === 'number') {
        total += it.quantity;
      }
    }
  }

  return total;
}

export async function syncAllInventory(): Promise<void> {
  const products = await ProductModel.find().select('id').lean();
  for (const p of products) {
    // ensure inventory doc exists and is up to date for each product
    // do not modify ProductModel.stock here — stock should only change when orders are placed
    // so we only update InventoryModel.unitsSold and related fields
    // call syncInventoryForProduct which computes unitsSold and writes inventory doc
    // ignore errors per-product so one failing product doesn't block others
    // eslint-disable-next-line no-await-in-loop
    await syncInventoryForProduct(p.id as string).catch(() => {});
  }
}
