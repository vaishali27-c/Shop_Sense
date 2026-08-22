import type { Request, Response } from 'express';
import { InventoryModel } from '../models/Inventory';
import { ProductModel } from '../models/Product';
import { syncInventoryForProduct } from '../services/inventoryService';
import { fallbackProducts } from '../services/fallbackData';

function isMongoReady(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

export async function getInventory(_req: Request, res: Response): Promise<void> {
  if (!isMongoReady()) {
    const inventory = fallbackProducts.map((product) => ({
      productId: product.id,
      currentStock: product.stock,
      unitsSold: 0,
      reorderLevel: product.reorderLevel,
      status: product.stock <= 0 ? 'Out of Stock' : product.stock <= product.reorderLevel ? 'Low Stock' : 'In Stock',
      restockPriority: product.stock <= product.reorderLevel ? 'High' : 'None',
      restockReason: product.stock <= product.reorderLevel
        ? 'Stock is below reorder level and recent sales are strong.'
        : 'Stock is healthy relative to current demand.',
    }));

    res.json(inventory);
    return;
  }

  const inventory = await InventoryModel.find().sort({ productId: 1 });
  res.json(inventory);
}

export async function updateInventory(req: Request, res: Response): Promise<void> {
  if (!isMongoReady()) {
    const product = fallbackProducts.find((entry) => entry.id === req.params.productId);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const nextStock = typeof req.body.currentStock === 'number'
      ? req.body.currentStock
      : product.stock;

    res.json({
      productId: product.id,
      currentStock: nextStock,
      unitsSold: 0,
      reorderLevel: product.reorderLevel,
      status: nextStock <= 0 ? 'Out of Stock' : nextStock <= product.reorderLevel ? 'Low Stock' : 'In Stock',
      restockPriority: nextStock <= product.reorderLevel ? 'High' : 'None',
      restockReason: nextStock <= product.reorderLevel
        ? 'Stock is below reorder level and recent sales are strong.'
        : 'Stock is healthy relative to current demand.',
    });
    return;
  }

  const product = await ProductModel.findOne({ id: req.params.productId });
  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  if (typeof req.body.currentStock === 'number') {
    product.stock = req.body.currentStock;
    await product.save();
  }

  await syncInventoryForProduct(product.id);

  const updatedInventory = await InventoryModel.findOne({ productId: product.id });
  res.json(updatedInventory);
}
