import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ProductModel } from '../models/Product';
import { fallbackProducts } from '../services/fallbackData';

function isMongoReady(): boolean {
  return Boolean(process.env.MONGODB_URI) && mongoose.connection.readyState === 1;
}

export async function getProducts(_req: Request, res: Response): Promise<void> {
  if (!isMongoReady()) {
    res.json(fallbackProducts);
    return;
  }

  const products = await ProductModel.find().sort({ createdAt: -1 });
  res.json(products);
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  if (!isMongoReady()) {
    const product = fallbackProducts.find((entry) => entry.id === req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json(product);
    return;
  }

  const product = await ProductModel.findOne({ id: req.params.id });
  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  res.json(product);
}

export async function createProduct(req: Request, res: Response): Promise<void> {
  if (!isMongoReady()) {
    res.status(200).json({
      ...req.body,
      id: req.body.id ?? `p${Date.now().toString(36)}`,
      stock: req.body.stock ?? 0,
    });
    return;
  }

  const product = await ProductModel.create({
    id: req.body.id ?? `p${Date.now().toString(36)}`,
    name: req.body.name,
    category: req.body.category,
    price: req.body.price,
    oldPrice: req.body.oldPrice,
    stock: req.body.stock ?? 0,
    reorderLevel: req.body.reorderLevel ?? 0,
    rating: req.body.rating ?? 0,
    ratingCount: req.body.ratingCount ?? 0,
    description: req.body.description,
    specs: req.body.specs ?? {},
    image: req.body.image,
    featured: req.body.featured ?? false,
    trending: req.body.trending ?? false,
    bestSeller: req.body.bestSeller ?? false,
    specialOffer: req.body.specialOffer ?? false,
  });

  res.status(201).json(product);
}

export async function updateProduct(req: Request, res: Response): Promise<void> {
  if (!isMongoReady()) {
    const product = fallbackProducts.find((entry) => entry.id === req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.json({ ...product, ...req.body });
    return;
  }

  const product = await ProductModel.findOneAndUpdate(
    { id: req.params.id },
    req.body,
    { new: true, runValidators: true },
  );

  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  res.json(product);
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  if (!isMongoReady()) {
    const product = fallbackProducts.find((entry) => entry.id === req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    res.status(204).send();
    return;
  }

  const product = await ProductModel.findOneAndDelete({ id: req.params.id });
  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  res.status(204).send();
}
