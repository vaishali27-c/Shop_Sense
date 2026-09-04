import { GoogleGenAI } from '@google/genai';
import { OrderModel } from '../models/Order';

interface ProductCatalogItem {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  rating: number;
  ratingCount: number;
  stock: number;
  reorderLevel?: number;
  description: string;
  specs?: Record<string, string>;
  image?: string;
  featured?: boolean;
  trending?: boolean;
  bestSeller?: boolean;
  specialOffer?: boolean;
}

export interface GeminiShoppingResult {
  content: string;
  productIds: string[];
  orders?: OrderSummary[];
}

export interface OrderSummary {
  orderId: string;
  orderDate: string;
  items: Array<{ productId: string; name: string; quantity: number; price: number; image: string }>;
  totalAmount: number;
  status: string;
  paymentMethod: string;
}

const SHOPPING_ONLY_MESSAGE =
  "Hi! 👋 Welcome to ShopSense. I can help you find products, compare options, check stock, track your orders, or help with your shopping. What are you looking for?";

function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/₹/g, ' rupee ')
    .replace(/rs\.?/g, ' rupee ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isGreetingQuery(query: string): boolean {
  const normalized = normalizeQuery(query);
  const greetings = [
    'hi', 'hii', 'hey', 'hello', 'good morning', 'good evening', 'thanks', 'thank you', 'thanksss',
    'hello assistant', 'hi there', 'hii there', 'heyy', 'bye', 'good night'
  ];
  return greetings.some((entry) => normalized.includes(entry) || normalized === entry);
}

function isHelpQuery(query: string): boolean {
  const normalized = normalizeQuery(query);
  return /what can you do|how can you help|help|capabilities/.test(normalized);
}

function isShoppingRelatedQuery(query: string): boolean {
  const normalized = normalizeQuery(query);
  const words = new Set(normalized.match(/[a-z0-9]+/g) ?? []);

  const shoppingKeywords = [
    'product', 'products', 'buy', 'purchase', 'recommend', 'recommendation', 'compare', 'comparison',
    'price', 'prices', 'cost', 'budget', 'under', 'over', 'rating', 'ratings', 'stock', 'available',
    'inventory', 'category', 'categories', 'shopping', 'shop', 'find', 'best', 'top', 'cheapest',
    'affordable', 'deal', 'offers', 'search', 'looking for', 'need', 'want'
  ];

  const specificProductTerms = [
    'headphone', 'headphones', 'earbud', 'earbuds', 'speaker', 'speakers', 'watch', 'smartwatch',
    'laptop', 'phone', 'tablet', 'backpack', 'charger', 'camera', 'monitor', 'keyboard', 'mouse',
    'shoe', 'shoes', 'bag', 'bags', 'jacket', 'hoodie', 'sneaker', 'sneakers', 'gadget', 'electronics',
  ];

  const hasShoppingKeyword = shoppingKeywords.some((keyword) => normalized.includes(keyword) || words.has(keyword));
  const hasProductTerm = specificProductTerms.some((term) => words.has(term) || normalized.includes(term));
  const hasShoppingPhrase = ['for a gift', 'use case', 'look for', 'looking for', 'for college', 'for coding']
    .some((phrase) => normalized.includes(phrase));

  return hasShoppingKeyword || hasProductTerm || hasShoppingPhrase;
}

function normalizeCatalog(products: unknown[]): ProductCatalogItem[] {
  return products
    .filter((product): product is Record<string, unknown> => Boolean(product) && typeof product === 'object')
    .map((product) => ({
      id: String(product.id ?? ''),
      name: String(product.name ?? ''),
      category: String(product.category ?? 'General'),
      price: Number(product.price ?? 0),
      oldPrice: product.oldPrice == null ? undefined : Number(product.oldPrice),
      rating: Number(product.rating ?? 0),
      ratingCount: Number(product.ratingCount ?? 0),
      stock: Number(product.stock ?? 0),
      reorderLevel: product.reorderLevel == null ? undefined : Number(product.reorderLevel),
      description: String(product.description ?? ''),
      specs: product.specs && typeof product.specs === 'object' ? product.specs as Record<string, string> : {},
      image: product.image == null ? undefined : String(product.image),
      featured: Boolean(product.featured),
      trending: Boolean(product.trending),
      bestSeller: Boolean(product.bestSeller),
      specialOffer: Boolean(product.specialOffer),
    }))
    .filter((product) => Boolean(product.id));
}

function parseGeminiResponse(rawText: string, catalog: ProductCatalogItem[]): GeminiShoppingResult {
  const cleaned = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: unknown;

  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    console.error('[Gemini Shopping Assistant] Invalid JSON response', error, cleaned);
    throw new Error('Invalid Gemini JSON');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid Gemini response payload');
  }

  const payload = parsed as Record<string, unknown>;
  const productIds = Array.isArray(payload.productIds)
    ? payload.productIds
        .map((value) => String(value ?? '').trim())
        .filter(Boolean)
        .filter((id) => catalog.some((product) => product.id === id))
        .filter((id, index, arr) => arr.indexOf(id) === index)
        .slice(0, 6)
    : [];

  const content = typeof payload.content === 'string' && payload.content.trim()
    ? payload.content.trim()
    : 'Here are some products that match your request from the ShopSense catalog.';

  return {
    content,
    productIds,
  };
}

export async function askGeminiShoppingAssistant(
  query: string,
  products: unknown[],
  userId?: string,
): Promise<GeminiShoppingResult> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return {
      content: 'Please tell me what kind of product you are looking for.',
      productIds: [],
    };
  }

  if (isGreetingQuery(trimmedQuery)) {
    return {
      content: "Hi! 👋 I'm your ShopSense assistant. I can help you find products, compare options, check stock, manage your cart, or track your orders.",
      productIds: [],
    };
  }

  if (isHelpQuery(trimmedQuery)) {
    return {
      content: 'I can help with products, recommendations, comparisons, stock, your cart, and order tracking. What would you like to do?',
      productIds: [],
    };
  }

  if (isOrderQuery(trimmedQuery)) return answerOrderQuery(trimmedQuery, userId);

  if (!isShoppingRelatedQuery(trimmedQuery)) {
    return {
      content: SHOPPING_ONLY_MESSAGE,
      productIds: [],
    };
  }

  if (!Array.isArray(products) || products.length === 0) {
    return {
      content: 'I could not find any relevant products in the current catalog.',
      productIds: [],
    };
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY');
  }

  const catalog = normalizeCatalog(products);
  if (catalog.length === 0) {
    return {
      content: 'I could not find any relevant products in the current catalog.',
      productIds: [],
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
You are ShopSense AI, an intelligent shopping assistant.

You help users discover products from the ShopSense catalog.
You must ONLY recommend products from the catalog provided to you.
Never invent products or product IDs.
Use the actual catalog information for product name, category, price, rating, ratingCount, stock, description, specs, featured, trending, bestseller, and special offers.
Understand natural-language shopping intent, including budget, category, brand, rating, availability, and use case.
If a user asks for something under a price, the recommended product must cost less than or equal to that amount.
If a user asks for products available now, only include products with stock greater than 0.
If a user asks for the best product, consider rating, ratingCount, and relevance.
Do not claim information that is not present in the catalog.
Return ONLY valid JSON with this exact structure:
{
  "content": "short helpful recommendation",
  "productIds": ["id1", "id2"]
}
Do not include markdown or extra fields.

Customer query:
"${trimmedQuery}"

Catalog:
${JSON.stringify(catalog, null, 2)}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    });

    const text = response.text?.trim() ?? '';
    if (!text) {
      throw new Error('Gemini returned an empty response');
    }

    return parseGeminiResponse(text, catalog);
  } catch (error) {
    console.error('[Gemini Shopping Assistant]', error);
    throw new Error('Gemini shopping assistant failed');
  }
}

export function isOrderQuery(query: string): boolean {
  const hasOrderTerm = /\b(order|orders|purchase|purchased|bought|delivery|delivered|shipped|arrive|tracking|track|paid|item)\b/i.test(query);
  const hasOrderIntent = /\b(my|mine|latest|recent|what|where|when|status|show|did|has|is|in)\b/i.test(query);
  const hasPurchaseHistoryPhrase = /\b(what|which)\s+products?\s+did\s+i\s+buy\b|\bwhat did i buy in that order\b|\bhow much did i pay\b|\bwhat is the item\b|\bmy purchases\b/i.test(query);
  return (hasOrderTerm && hasOrderIntent) || hasPurchaseHistoryPhrase;
}

function wantsOrderList(query: string): boolean {
  return /show|list|all|orders|recent purchase|what did i (buy|order|purchase)/i.test(query);
}

function toOrderSummary(order: { orderId: string; orderDate: Date; items: Array<{ productId: string; name: string; quantity: number; price: number; image: string }>; totalAmount: number; status: string; paymentMethod: string }): OrderSummary {
  return { orderId: order.orderId, orderDate: new Date(order.orderDate).toISOString(), items: order.items, totalAmount: order.totalAmount, status: order.status, paymentMethod: order.paymentMethod };
}

export async function answerOrderQuery(query: string, userId?: string): Promise<GeminiShoppingResult> {
  if (!userId) return { content: "I can help you check your orders, but you'll need to log in first.", productIds: [] };
  if (!process.env.MONGODB_URI) return { content: "I'm unable to retrieve your orders right now. Please try again.", productIds: [] };
  try {
    const found = await OrderModel.find({ userId }).sort({ orderDate: -1 }).limit(wantsOrderList(query) ? 20 : 5).lean();
    const orders = found.map(toOrderSummary);
    if (orders.length === 0) return { content: "I couldn't find any orders on your account yet.", productIds: [], orders: [] };
    const latest = orders[0];
    if (!wantsOrderList(query)) return { content: `Your latest order is currently ${latest.status}.\n\nOrder: ${latest.orderId}\nItem: ${latest.items.map((item) => `${item.name} ×${item.quantity}`).join(', ')}\nTotal: ₹${latest.totalAmount.toLocaleString('en-IN')}\n\nI'll show you the order details below.`, productIds: [], orders: [latest] };
    return { content: `Here are your recent orders${orders.length > 1 ? ` (${orders.length})` : ''}:`, productIds: [], orders };
  } catch (error) {
    console.error('[Order Assistant]', error);
    return { content: "I'm unable to retrieve your orders right now. Please try again.", productIds: [] };
  }
}