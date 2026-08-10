import type { Order, Product } from '@/types';

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export function getStockStatus(product: Product): StockStatus {
  if (product.stock <= 0) return 'Out of Stock';
  if (product.stock <= product.reorderLevel) return 'Low Stock';
  return 'In Stock';
}

export interface InventoryInsight {
  product: Product;
  status: StockStatus;
  unitsSold: number;
  recentSold: number;
  avgDailySales: number;
  daysOfCover: number;
  priority: 'High' | 'Medium' | 'Low' | 'None';
  reason: string;
  recommendation: string;
}

export function computeUnitsSold(productId: string, orders: Order[]): number {
  return orders
    .filter((o) => o.status !== 'Placed')
    .reduce(
      (sum, o) =>
        sum +
        o.items
          .filter((i) => i.productId === productId)
          .reduce((s, i) => s + i.quantity, 0),
      0,
    );
}

export function computeInventoryInsights(
  products: Product[],
  orders: Order[],
): InventoryInsight[] {
  const now = Date.now();
  const last14 = now - 14 * 24 * 60 * 60 * 1000;
  return products.map((product) => {
    const unitsSold = computeUnitsSold(product.id, orders);
    const recentOrders = orders.filter(
      (o) =>
        new Date(o.createdAt).getTime() >= last14 &&
        o.status !== 'Placed',
    );
    const recentSold = recentOrders.reduce(
      (sum, o) =>
        sum +
        o.items
          .filter((i) => i.productId === product.id)
          .reduce((s, i) => s + i.quantity, 0),
      0,
    );
    const avgDailySales = recentSold / 14;
    const daysOfCover =
      avgDailySales > 0 ? Math.round(product.stock / avgDailySales) : Infinity;

    const status = getStockStatus(product);

    let priority: InventoryInsight['priority'] = 'None';
    let reason = '';
    let recommendation = '';

    if (status === 'Out of Stock') {
      priority = 'High';
      reason = 'No units available — sales are being lost immediately.';
      recommendation = 'Restock urgently to resume sales.';
    } else if (status === 'Low Stock') {
      if (avgDailySales >= 1) {
        priority = 'High';
        reason = `Below reorder level (${product.reorderLevel}). At ~${avgDailySales.toFixed(1)}/day, cover lasts ~${daysOfCover} day(s).`;
        recommendation = 'Restock soon — demand is active.';
      } else {
        priority = 'Medium';
        reason = `Below reorder level (${product.reorderLevel}) but demand is slow.`;
        recommendation = 'Restock at normal pace.';
      }
    } else if (avgDailySales >= 2 && daysOfCover <= 7) {
      priority = 'Medium';
      reason = `Selling fast (~${avgDailySales.toFixed(1)}/day). Only ~${daysOfCover} day(s) of cover left.`;
      recommendation = 'Plan a restock within the next cycle.';
    } else if (unitsSold === 0) {
      priority = 'Low';
      reason = 'No sales recorded in order history.';
      recommendation = 'Review pricing or visibility; consider promotion.';
    } else {
      priority = 'None';
      reason = 'Stock is healthy relative to current demand.';
      recommendation = 'No action needed right now.';
    }

    return {
      product,
      status,
      unitsSold,
      recentSold,
      avgDailySales,
      daysOfCover,
      priority,
      reason,
      recommendation,
    };
  });
}

export function restockPriorityList(
  insights: InventoryInsight[],
): InventoryInsight[] {
  const rank = { High: 0, Medium: 1, Low: 2, None: 3 } as const;
  return [...insights]
    .filter((i) => i.priority !== 'None')
    .sort((a, b) => rank[a.priority] - rank[b.priority]);
}

export function topSellers(
  products: Product[],
  orders: Order[],
  limit = 5,
): { product: Product; unitsSold: number; revenue: number }[] {
  return products
    .map((p) => {
      const items = orders
        .filter((o) => o.status !== 'Placed')
        .flatMap((o) => o.items.filter((i) => i.productId === p.id));
      const unitsSold = items.reduce((s, i) => s + i.quantity, 0);
      const revenue = items.reduce((s, i) => s + i.quantity * i.price, 0);
      return { product: p, unitsSold, revenue };
    })
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, limit);
}

export function totalRevenue(orders: Order[]): number {
  return orders
    .filter((o) => o.status !== 'Placed')
    .reduce((s, o) => s + o.total, 0);
}

export function categoryPerformance(
  products: Product[],
  orders: Order[],
): { category: string; revenue: number; units: number }[] {
  const map = new Map<string, { revenue: number; units: number }>();
  for (const o of orders.filter((ord) => ord.status !== 'Placed')) {
    for (const item of o.items) {
      const product = products.find((p) => p.id === item.productId);
      const category = product?.category ?? 'Other';
      const cur = map.get(category) ?? { revenue: 0, units: 0 };
      cur.revenue += item.price * item.quantity;
      cur.units += item.quantity;
      map.set(category, cur);
    }
  }
  return [...map.entries()]
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.revenue - a.revenue);
}
