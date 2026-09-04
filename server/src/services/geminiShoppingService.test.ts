import assert from 'node:assert/strict';
import { askGeminiShoppingAssistant } from './geminiShoppingService';

async function run() {
  const catalog = [
    {
      id: 'p001',
      name: 'AeroBass X1',
      category: 'Electronics',
      price: 1299,
      rating: 4.8,
      ratingCount: 220,
      stock: 18,
      description: 'Wireless over-ear headphones',
    },
    {
      id: 'p002',
      name: 'SoundMate Mini',
      category: 'Electronics',
      price: 2499,
      rating: 4.5,
      ratingCount: 160,
      stock: 12,
      description: 'Compact earbuds with clear bass',
    },
  ];

  const unrelatedQuery = 'What is the capital of France?';

  const result = await askGeminiShoppingAssistant(unrelatedQuery, catalog);

  assert.deepEqual(result, {
    content:
      'Hi! 👋 Welcome to ShopSense. I can help you find products, compare options, check stock, track your orders, or help with your shopping. What are you looking for?',
    productIds: [],
  });

  console.log('shopping-query-gating test passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
