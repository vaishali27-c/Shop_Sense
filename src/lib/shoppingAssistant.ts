import type { ChatMessage, Product } from '@/types';
import { formatINR, getStockStatus } from '@/lib/inventory';

type ProductPick = ChatMessage['products'] extends (infer T)[] | undefined ? T : never;

export type AssistantIntent =
  | 'GREETING'
  | 'PRODUCT_SEARCH'
  | 'PRODUCT_DETAILS'
  | 'PRODUCT_COMPARISON'
  | 'STOCK_QUERY'
  | 'CART_ACTION'
  | 'ORDER_QUERY'
  | 'ACCOUNT_QUERY'
  | 'HELP'
  | 'CASUAL';

export interface AssistantContext {
  lastProducts?: Product[];
  selectedProductId?: string | null;
  selectedOrderId?: string | null;
  lastOrder?: ChatMessage['orders'] extends (infer T)[] ? T : never;
}

export interface AssistantResult {
  content: string;
  products?: ProductPick[];
  orders?: ChatMessage['orders'];
}

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

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/₹/g, ' rupee ')
    .replace(/rs\.?/g, ' rupee ')
    .replace(/,/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function replaceShortPriceTokens(value: string): string {
  return value
    .replace(/\b(\d+(?:\.\d+)?)k\b/gi, (_, amount) => `${Number(amount) * 1000}`)
    .replace(/\b(\d+(?:\.\d+)?)\s*thousand\b/gi, (_, amount) => `${Number(amount) * 1000}`);
}

export function classifyShoppingIntent(query: string): AssistantIntent {
  const normalized = normalizeText(replaceShortPriceTokens(query));
  if (!normalized) return 'CASUAL';

  const greetingTerms = [
    'hi', 'hii', 'hey', 'hello', 'good morning', 'good evening', 'thanks', 'thank you', 'thanksss',
    'bye', 'good night', 'heyy', 'hey there', 'hello there', 'hi there', 'hii there', 'thanks a lot', 'thank you so much'
  ];
  if (greetingTerms.some((term) => normalized.includes(term) || normalized === term)) return 'GREETING';

  const helpTerms = ['what can you do', 'help', 'how can you help', 'capabilities', 'what can i ask'];
  if (helpTerms.some((term) => normalized.includes(term))) return 'HELP';

  const accountTerms = ['show my profile', 'my account', 'account details', 'edit profile', 'profile'];
  if (accountTerms.some((term) => normalized.includes(term))) return 'ACCOUNT_QUERY';

  const cartTerms = ['add this to cart', 'add it to cart', 'remove this', 'remove it', 'show my cart', 'what is in my cart', 'buy this', 'checkout', 'take me to checkout', 'i want to purchase this'];
  if (cartTerms.some((term) => normalized.includes(term))) return 'CART_ACTION';

  const orderTerms = ['where is my order', 'where\'s my order', 'track my order', 'track my latest order', 'show my orders', 'show my previous orders', 'what did i order', 'what is in my order', 'what products did i buy', 'what have i purchased', 'tell me about my order', 'order status', 'when will my order arrive', 'show my order', 'what did i buy', 'where is my latest order', 'what is the item', 'what did i buy in that order', 'how much did i pay', 'what is the status', 'when will it arrive', 'tell me more about that order', 'my purchases', 'my orders'];
  if (orderTerms.some((term) => normalized.includes(term))) return 'ORDER_QUERY';

  const comparisonTerms = ['compare these', 'compare the two', 'which one is better', 'which is better', 'compare this', 'compare', 'better for', 'which has better ratings', 'which one should i buy'];
  if (comparisonTerms.some((term) => normalized.includes(term))) return 'PRODUCT_COMPARISON';

  const detailTerms = ['tell me about this', 'what are the features', 'is this good', 'what is the rating', 'is it worth buying', 'how much is it', 'does it have good reviews', 'what is the price', 'how much does it cost', 'what is this'];
  if (detailTerms.some((term) => normalized.includes(term))) return 'PRODUCT_DETAILS';

  const stockTerms = ['is it in stock', 'how many are left', 'is this available', 'check stock', 'stock status', 'in stock', 'available now'];
  if (stockTerms.some((term) => normalized.includes(term))) return 'STOCK_QUERY';

  const productSearchTerms = [
    'show me', 'find', 'looking for', 'need', 'want', 'search', 'browse', 'recommend', 'best', 'top',
    'headphones', 'laptop', 'smartwatch', 'earbuds', 'speaker', 'power bank', 'backpack', 'bag', 'watch', 'camera', 'sneakers', 'shoes', 'mobile', 'phone', 'book', 'wallet', 'mouse', 'keyboard', 'charger'
  ];

  const hasProductSearchHint = productSearchTerms.some((term) => normalized.includes(term));
  const hasPriceHint = /(?:under|below|less than|upto|up to|over|above|more than|budget|around|about|roughly|\d\s*k)/.test(normalized);
  if (hasProductSearchHint || hasPriceHint) return 'PRODUCT_SEARCH';

  return 'CASUAL';
}

function getSelectedProduct(context: AssistantContext | undefined, products: Product[]): Product | undefined {
  if (!products.length) return undefined;
  const selectedId = context?.selectedProductId;
  if (selectedId) {
    const direct = products.find((product) => product.id === selectedId);
    if (direct) return direct;
  }

  const lastProducts = context?.lastProducts ?? [];
  if (lastProducts.length > 0) {
    const lastSelected = lastProducts[0];
    if (lastSelected && products.some((product) => product.id === lastSelected.id)) return lastSelected;
  }

  return products[0];
}

export function answerShoppingQuery(
  query: string,
  products: Product[],
  context?: AssistantContext,
): AssistantResult {
  const q = normalizeText(replaceShortPriceTokens(query));
  if (!q) {
    return {
      content: 'Hi! 👋 Welcome to ShopSense. I can help you find products, compare options, check stock, track your orders, or help with your shopping. What are you looking for?',
    };
  }

  const intent = classifyShoppingIntent(query);

  if (intent === 'GREETING') {
    return {
      content: 'Hi! 👋 Welcome to ShopSense. I can help you find products, compare options, check stock, track your orders, or help with your shopping. What are you looking for?',
    };
  }

  if (intent === 'HELP') {
    return {
      content: 'I can help you with: • Find products and budget-friendly recommendations • Compare products and explain trade-offs • Check stock availability • Track your orders and purchases • Add products to your cart and help with checkout',
    };
  }

  if (intent === 'ACCOUNT_QUERY') {
    return {
      content: 'You can view and update your profile from your account page. If you need help with your details, I can guide you there.',
    };
  }

  if (intent === 'CASUAL') {
    return {
      content: 'Hi! 👋 Welcome to ShopSense. I can help you find products, compare options, check stock, track your orders, or help with your shopping. What are you looking for?',
    };
  }

  if (intent === 'STOCK_QUERY') {
    const product = getSelectedProduct(context, products);
    if (!product) {
      return { content: 'I do not see a product selected right now. Tell me which product you want to check.' };
    }
    const stock = product.stock > 0 ? `${product.stock} item${product.stock === 1 ? '' : 's'} left` : 'currently out of stock';
    return {
      content: `${product.name} is ${stock}.`,
      products: [toPick(product)],
    };
  }

  if (intent === 'PRODUCT_DETAILS') {
    const product = getSelectedProduct(context, products);
    if (!product) {
      return {
        content: 'I do not have a product selected in this chat yet. Tell me the product name or ask me to show options first.',
      };
    }
    return {
      content: `${product.name} — ${formatINR(product.price)}. ${product.rating}★ from ${product.ratingCount} reviews. ${getStockStatus(product)}. ${product.description || 'A popular ShopSense pick for everyday use.'}`,
      products: [toPick(product)],
    };
  }

  const priceMatch = q.match(/(?:under|below|less than|upto|up to|<|budget|within)\s*(?:rupee\s*)?(\d{2,7})/i);
  const maxPrice = priceMatch ? parseInt(priceMatch[1], 10) : null;
  const overMatch = q.match(/(?:over|above|more than|>)\s*(?:rupee\s*)?(\d{2,7})/i);
  const minPrice = overMatch ? parseInt(overMatch[1], 10) : null;

  const categoryKeywords: Record<string, string[]> = {
    electronics: ['electronics', 'electronic', 'gadget', 'device', 'tech', 'laptop', 'power bank', 'charger', 'speaker', 'headphones', 'earbuds', 'watch', 'camera'],
    fashion: ['fashion', 'clothing', 'apparel', 'wear', 'shirt', 'jacket', 'sweater', 'shoe', 'sneaker', 'boot'],
    home: ['home', 'decor', 'kitchen', 'candle', 'vase', 'blanket', 'lamp'],
    books: ['book', 'reading', 'novel'],
    accessories: ['accessory', 'bag', 'backpack', 'wallet', 'belt', 'sunglass', 'scarf', 'case'],
  };

  const matchedCategories: string[] = [];
  for (const [cat, kws] of Object.entries(categoryKeywords)) {
    if (kws.some((keyword) => q.includes(keyword))) matchedCategories.push(cat);
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
    lamp: ['lamp', 'desk light'],
    book: ['book', 'novel', 'reading'],
    backpack: ['backpack', 'laptop bag'],
    wallet: ['wallet'],
    scarf: ['scarf'],
  };

  const matchedProductTypes: string[] = [];
  for (const [name, kws] of Object.entries(productKeywords)) {
    if (kws.some((keyword) => q.includes(keyword))) matchedProductTypes.push(name);
  }

  let pool = [...products];

  if (maxPrice !== null) pool = pool.filter((product) => product.price <= maxPrice);
  if (minPrice !== null) pool = pool.filter((product) => product.price >= minPrice);
  if (matchedCategories.length > 0) {
    pool = pool.filter((product) => matchedCategories.some((category) => product.category.toLowerCase() === category));
  }
  if (matchedProductTypes.length > 0) {
    pool = pool.filter((product) => matchedProductTypes.some((type) => productKeywords[type].some((keyword) => product.name.toLowerCase().includes(keyword) || product.description.toLowerCase().includes(keyword))));
  }

  if (intent === 'PRODUCT_SEARCH') {
    const wantsInStock = /in stock|available|currently in stock/.test(q);
    if (wantsInStock) pool = pool.filter((product) => product.stock > 0);

    if (pool.length === 0) {
      return { content: "I couldn't find a matching product. Try a different category, budget, or keyword." };
    }

    pool.sort((a, b) => b.rating * 100 + b.ratingCount - (a.rating * 100 + a.ratingCount));
    const top = pool.slice(0, 4);
    const budgetText = maxPrice ? ` under ${formatINR(maxPrice)}` : '';
    return {
      content: `I found ${pool.length} matching product${pool.length > 1 ? 's' : ''}${budgetText}. Here are the best matches:`,
      products: pickList(top),
    };
  }

  if (intent === 'PRODUCT_COMPARISON') {
    const baseProducts = context?.lastProducts?.length ? context.lastProducts : pool;
    const options = baseProducts.slice(0, 2);
    if (options.length < 2) {
      return { content: 'I need at least two products to compare. Show me a few options first.' };
    }

    const [first, second] = options;
    const winner = first.rating >= second.rating && first.price <= second.price ? first : second;
    return {
      content: `Between ${first.name} and ${second.name}, I’d pick ${winner.name} because it offers a stronger value for the price and matches the key features you asked for. ${first.name}: ${formatINR(first.price)} | ${first.rating}★ | ${first.stock > 0 ? 'In stock' : 'Out of stock'}. ${second.name}: ${formatINR(second.price)} | ${second.rating}★ | ${second.stock > 0 ? 'In stock' : 'Out of stock'}.`,
      products: pickList([first, second]),
    };
  }

  if (intent === 'CART_ACTION') {
    return {
      content: 'I can help you add or remove items, but the cart flow is handled in the current ShopSense cart. If you want, I can suggest the best product to add first.',
    };
  }

  if (intent === 'ORDER_QUERY') {
    return {
      content: 'I can help with your orders, but I need to look at your account first. Please log in to view your recent purchases and order status.',
    };
  }

  return {
    content: 'I can help with product searches, comparisons, stock checks, and order tracking. What would you like to do next?',
  };
}

export async function answerShoppingQueryWithAI(
  query: string,
  products: Product[],
  context?: AssistantContext,
  isAuthenticated = true,
): Promise<AssistantResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return answerShoppingQuery(trimmed, products, context);
  }

  const intent = classifyShoppingIntent(trimmed);
  if (intent === 'GREETING' || intent === 'HELP' || intent === 'ACCOUNT_QUERY' || intent === 'CASUAL') {
    return answerShoppingQuery(trimmed, products, context);
  }

  if (intent === 'ORDER_QUERY') {
    if (!isAuthenticated) {
      return { content: 'Please log in to view your orders.', products: [] };
    }

    try {
      const response = await fetch('/api/ai/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: trimmed, products }),
      });
      if (response.ok) {
        const data = await response.json() as Partial<{ content?: string; orders?: ChatMessage['orders'] }>;
        if (data.orders && data.orders.length > 0) {
          return { content: data.content ?? 'Here are your recent orders:', orders: data.orders, products: [] };
        }
      }
    } catch {
      // Fall through to safe local guidance.
    }

    return { content: 'Please log in to view your orders. Once you are signed in, I can show your recent purchases and order status.', products: [] };
  }

  if (intent === 'PRODUCT_DETAILS' || intent === 'STOCK_QUERY' || intent === 'PRODUCT_COMPARISON' || intent === 'PRODUCT_SEARCH') {
    return answerShoppingQuery(trimmed, products, context);
  }

  if (products.length === 0) {
    return answerShoppingQuery(trimmed, products, context);
  }

  try {
    const response = await fetch('/api/ai/shopping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        query: trimmed,
        products,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed with status ${response.status}`);
    }

    const data = (await response.json()) as Partial<{
      content?: unknown;
      productIds?: unknown[];
      orders?: ChatMessage['orders'];
    }>;

    if (Array.isArray(data.orders)) {
      return {
        content: typeof data.content === 'string' ? data.content : 'Here are your orders:',
        orders: data.orders,
        products: [],
      };
    }

    const productMap = new Map(products.map((product) => [product.id, product] as const));
    const matchedProducts: Product[] = [];
    const seen = new Set<string>();

    const candidateIds = Array.isArray(data.productIds) ? data.productIds : [];
    for (const item of candidateIds) {
      const id = typeof item === 'string' ? item.trim() : String(item ?? '').trim();
      if (!id || seen.has(id)) continue;

      const product = productMap.get(id);
      if (!product) continue;

      matchedProducts.push(product);
      seen.add(id);

      if (matchedProducts.length >= 6) break;
    }

    if (matchedProducts.length === 0) {
      return answerShoppingQuery(trimmed, products, context);
    }

    const content = typeof data.content === 'string' && data.content.trim()
      ? data.content.trim()
      : answerShoppingQuery(trimmed, products, context).content;

    return {
      content,
      products: matchedProducts.slice(0, 6).map(toPick),
    };
  } catch (error) {
    console.error('[ShopSense AI]', error);
    return answerShoppingQuery(trimmed, products, context);
  }
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
