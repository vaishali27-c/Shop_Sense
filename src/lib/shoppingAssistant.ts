import type { ChatMessage, Product } from '@/types';
import { formatINR, getStockStatus } from '@/lib/inventory';

type ProductPick = ChatMessage['products'] extends (infer T)[] | undefined ? T : never;

function toPick(p: Product): ProductPick {
  return {
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image,
    rating: p.rating,
    stock: p.stock,
  };
}

function pickList(ps: Product[]): ProductPick[] {
  return ps.slice(0, 6).map(toPick);
}

function summary(p: Product): string {
  return `${p.name} — ${formatINR(p.price)}, rated ${p.rating}, ${getStockStatus(p).toLowerCase()} (${p.stock} left).`;
}

export interface AssistantResult {
  content: string;
  products?: ProductPick[];
}

export function answerShoppingQuery(
  query: string,
  products: Product[],
): AssistantResult {
  const q = query.toLowerCase().trim();
  if (!q) {
    return {
      content:
        "Hi! I'm your ShopSense assistant. Ask me things like \"Show me headphones under ₹3000\", \"Which headphones have the best rating?\", or \"What is currently in stock?\".",
    };
  }

  const priceMatch = q.match(/(?:under|below|less than|<)\s*₹?\s*(\d{3,6})/);
  const maxPrice = priceMatch ? parseInt(priceMatch[1], 10) : null;

  const overMatch = q.match(/(?:over|above|more than|>)\s*₹?\s*(\d{3,6})/);
  const minPrice = overMatch ? parseInt(overMatch[1], 10) : null;

  const categoryKeywords: Record<string, string[]> = {
    electronics: ['electronic', 'gadget', 'device', 'tech'],
    fashion: ['fashion', 'clothing', 'apparel', 'wear', 'shirt', 'jacket', 'sweater', 'shoe', 'sneaker', 'boot'],
    home: ['home', 'decor', 'kitchen', 'candle', 'vase', 'blanket', 'lamp'],
    books: ['book', 'reading', 'novel'],
    accessories: ['accessory', 'accessories', 'bag', 'backpack', 'wallet', 'belt', 'sunglass', 'scarf', 'case'],
  };
  const matchedCategories: string[] = [];
  for (const [cat, kws] of Object.entries(categoryKeywords)) {
    if (kws.some((k) => q.includes(k))) matchedCategories.push(cat);
  }

  const productKeywords: Record<string, string[]> = {
    headphones: ['headphone', 'head phone', 'over-ear', 'over ear'],
    earbuds: ['earbud', 'ear bud', 'earphone', 'tws'],
    smartwatch: ['smartwatch', 'smart watch', 'fitness tracker', 'watch'],
    camera: ['camera', 'action cam', 'gopro'],
    laptop: ['laptop', 'ultrabook', 'notebook'],
    tablet: ['tablet', 'ipad'],
    speaker: ['speaker', 'bluetooth speaker'],
    mouse: ['mouse'],
    keyboard: ['keyboard'],
    powerbank: ['power bank', 'powerbank', 'charger'],
    sneakers: ['sneaker', 'running shoe', 'shoe'],
    jacket: ['jacket'],
    sweater: ['sweater', 'knit'],
    sunglasses: ['sunglass', 'sunglasses'],
    belt: ['belt'],
    boots: ['hiking boot', 'trek boot', 'boot'],
    candle: ['candle'],
    vase: ['vase'],
    blanket: ['blanket', 'throw'],
    coffee: ['coffee maker', 'coffee'],
    lamp: ['lamp', 'desk light'],
    cutlery: ['cutlery', 'utensil'],
    book: ['book', 'novel', 'reading'],
    backpack: ['backpack', 'bag for', 'laptop bag'],
    phonecase: ['phone case', 'mobile case'],
    wallet: ['wallet'],
    scarf: ['scarf'],
  };
  const matchedProductTypes: string[] = [];
  for (const [type, kws] of Object.entries(productKeywords)) {
    if (kws.some((k) => q.includes(k))) matchedProductTypes.push(type);
  }

  let pool = [...products];

  // "best rating" / "highest rated"
  const wantsBestRating = /best rating|highest rating|top rating|best rated|highest rated|best quality/.test(q);
  // "best selling" / "popular" / "trending"
  const wantsBestSeller = /best sell|best-selling|top sell|popular|trending/.test(q);
  // "in stock" / "available"
  const wantsInStock = /in stock|available|what.*stock|currently in stock/.test(q);
  // "low stock" / "running low"
  const wantsLowStock = /low stock|running low|almost out/.test(q);
  // "cheap" / "budget" / "affordable"
  const wantsCheap = /cheap|budget|affordable|lowest price|cheapest/.test(q);
  // "college"
  const wantsCollege = /college|student|school|university/.test(q);

  // filter by price
  if (maxPrice !== null) pool = pool.filter((p) => p.price <= maxPrice);
  if (minPrice !== null) pool = pool.filter((p) => p.price >= minPrice);

  // filter by category
  if (matchedCategories.length > 0) {
    pool = pool.filter((p) =>
      matchedCategories.some((c) => p.category.toLowerCase() === c),
    );
  }

  // filter by product type via name/specs
  if (matchedProductTypes.length > 0) {
    pool = pool.filter((p) =>
      matchedProductTypes.some((t) =>
        productKeywords[t].some(
          (k) =>
            p.name.toLowerCase().includes(k) ||
            p.description.toLowerCase().includes(k),
        ),
      ),
    );
  }

  // "in stock"
  if (wantsInStock) {
    pool = pool.filter((p) => getStockStatus(p) === 'In Stock');
  }
  if (wantsLowStock) {
    pool = pool.filter((p) => getStockStatus(p) === 'Low Stock');
  }

  // college context — prefer backpacks, laptops, headphones, books, sneakers
  if (wantsCollege && matchedProductTypes.length === 0) {
    const collegeKws = ['backpack', 'laptop', 'headphone', 'earbud', 'book', 'sneaker', 'mouse', 'keyboard', 'power bank'];
    pool = pool.filter((p) =>
      collegeKws.some((k) => p.name.toLowerCase().includes(k) || p.description.toLowerCase().includes(k)),
    );
  }

  if (pool.length === 0) {
    return {
      content:
        "I couldn't find any products matching that. Try a different category, price range, or product type — for example, \"Show me fashion under ₹1500\".",
    };
  }

  // sorting
  if (wantsBestRating) {
    pool.sort((a, b) => b.rating - a.rating);
    return {
      content: `Here are the highest-rated matches I found (${pool.length} product${pool.length > 1 ? 's' : ''}). ${pool.slice(0, 3).map(summary).join(' ')}`,
      products: pickList(pool),
    };
  }

  if (wantsBestSeller) {
    pool.sort((a, b) => b.ratingCount - a.ratingCount);
    return {
      content: `These are our most popular matches right now (${pool.length} product${pool.length > 1 ? 's' : ''}).`,
      products: pickList(pool),
    };
  }

  if (wantsCheap) {
    pool.sort((a, b) => a.price - b.price);
    return {
      content: `Here are the most affordable options I found (${pool.length} product${pool.length > 1 ? 's' : ''}), starting at ${formatINR(pool[0].price)}.`,
      products: pickList(pool),
    };
  }

  // default: sort by a blend of rating + popularity
  pool.sort(
    (a, b) =>
      b.rating * 100 + b.ratingCount / 50 - (a.rating * 100 + a.ratingCount / 50),
  );

  const filters: string[] = [];
  if (matchedCategories.length > 0)
    filters.push(`in ${matchedCategories.join(', ')}`);
  if (matchedProductTypes.length > 0)
    filters.push(`matching "${matchedProductTypes.join(', ')}"`);
  if (maxPrice !== null) filters.push(`under ${formatINR(maxPrice)}`);
  if (minPrice !== null) filters.push(`over ${formatINR(minPrice)}`);
  if (wantsInStock) filters.push('currently in stock');
  if (wantsCollege && matchedProductTypes.length === 0)
    filters.push('handy for college');

  const filterText =
    filters.length > 0 ? ` ${filters.join(', ')}` : '';

  return {
    content: `I found ${pool.length} product${pool.length > 1 ? 's' : ''}${filterText}. Here are the top picks:`,
    products: pickList(pool),
  };
}

export function findSimilar(product: Product, all: Product[]): ProductPick[] {
  const sameCategory = all.filter(
    (p) => p.id !== product.id && p.category === product.category,
  );
  const priceRange = product.price * 0.6;
  const near = sameCategory
    .filter((p) => Math.abs(p.price - product.price) <= priceRange)
    .sort((a, b) => Math.abs(a.price - product.price) - Math.abs(b.price - product.price));
  const list = near.length > 0 ? near : sameCategory;
  return pickList(list);
}
