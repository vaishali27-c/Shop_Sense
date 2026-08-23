import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { apiRouter } from './routes/apiRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import cookieParser from 'cookie-parser';
import { createAdminIfMissing } from './middleware/auth';
import { corsOptions } from './config/cors';
import { ProductModel } from './models/Product';
import { OrderModel } from './models/Order';
import { syncAllInventory } from './services/inventoryService';
import { fallbackProducts, fallbackOrders } from './services/fallbackData';

const rootEnv = path.resolve(process.cwd(), '.env');
const parentEnv = path.resolve(process.cwd(), '..', '.env');

dotenv.config({ path: rootEnv });
dotenv.config({ path: parentEnv });

const app = express();
const port = Number(process.env.PORT ?? 10000);
const mongoUri = process.env.MONGODB_URI;

app.set('trust proxy', 1);
app.use(cors(corsOptions()));
app.use(cookieParser());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'ShopSense API is running successfully' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ShopSense API' });
});

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

async function syncProducts(): Promise<void> {
  const catalog = fallbackProducts;

  for (const product of catalog) {
    const existing = await ProductModel.findOne({ id: product.id });
    if (!existing) {
      await ProductModel.create(product);
      console.log(`[ShopSense API] Added missing product ${product.id}`);
      continue;
    }

    const stock = typeof existing.stock === 'number' ? existing.stock : product.stock;
    const reorderLevel = typeof existing.reorderLevel === 'number' ? existing.reorderLevel : product.reorderLevel;

    await ProductModel.updateOne(
      { id: product.id },
      {
        name: product.name,
        category: product.category,
        price: product.price,
        oldPrice: product.oldPrice,
        rating: product.rating,
        ratingCount: product.ratingCount,
        description: product.description,
        specs: product.specs ?? {},
        image: product.image,
        featured: product.featured ?? false,
        trending: product.trending ?? false,
        bestSeller: product.bestSeller ?? false,
        specialOffer: product.specialOffer ?? false,
        stock,
        reorderLevel,
      },
    );
  }

  const productCount = await ProductModel.countDocuments();
  console.log(`[ShopSense API] Synced product catalog (${productCount} products)`);
}

async function syncFallbackOrders(): Promise<void> {
  for (const order of fallbackOrders) {
    const existing = await OrderModel.findOne({ orderId: order.orderId });
    if (!existing) {
      await OrderModel.create(order);
      console.log(`[ShopSense API] Added missing order ${order.orderId}`);
    }
  }
}

function startServer(): void {
  app.listen(port, '0.0.0.0', () => {
    console.log(`[ShopSense API] Server running on port ${port}`);
  });
}

if (!mongoUri) {
  console.log('[ShopSense API] MONGODB_URI is not configured. Starting without MongoDB.');
  startServer();
} else {
  mongoose
    .connect(mongoUri, { dbName: 'shopsense' })
    .then(async () => {
      console.log('[ShopSense API] MongoDB connected');
      await syncProducts();
      await syncFallbackOrders();
      // create initial admin account from environment vars if present
      try {
        const result = await createAdminIfMissing();
        if (!result) {
          // env not configured
        } else if (result.created) {
          // already logged inside the function
        } else if (result.skipped) {
          console.log('[ShopSense API] Admin account ready');
        }
      } catch (err) {
        console.warn('[ShopSense API] createAdminIfMissing failed', err);
      }
      // Reconcile inventory documents from persisted orders and product stock
      await syncAllInventory();
      startServer();
    })
    .catch((error) => {
      console.error('[ShopSense API] MongoDB connection error:', error);
      process.exit(1);
    });
}
