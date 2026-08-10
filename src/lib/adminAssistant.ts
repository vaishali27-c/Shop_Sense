import type { Order, Product } from '@/types';
import {
  computeInventoryInsights,
  formatINR,
  getStockStatus,
  restockPriorityList,
  topSellers,
  categoryPerformance,
  totalRevenue,
  type InventoryInsight,
} from '@/lib/inventory';

export interface AdminAssistantResult {
  content: string;
  table?: {
    columns: string[];
    rows: (string | number)[][];
  };
}

function insightRow(i: InventoryInsight): (string | number)[] {
  return [
    i.product.name,
    i.product.stock,
    i.recentSold,
    i.avgDailySales.toFixed(1),
    i.product.reorderLevel,
    i.status,
    i.priority,
    i.recommendation,
  ];
}

export function answerAdminQuery(
  query: string,
  products: Product[],
  orders: Order[],
): AdminAssistantResult {
  const q = query.toLowerCase().trim();
  const insights = computeInventoryInsights(products, orders);

  if (!q) {
    return {
      content:
        "Hi! I'm the ShopSense inventory assistant. Ask me things like \"Which products should I restock?\", \"What are my best-selling products?\", or \"Which category generated the most sales?\".",
    };
  }

  // restock / low stock
  if (/restock|reorder|replenish|need stock|should i order|what.*order/.test(q)) {
    const list = restockPriorityList(insights);
    if (list.length === 0) {
      return { content: 'No products need restocking right now. Inventory looks healthy.' };
    }
    return {
      content: `I recommend restocking ${list.length} product(s). Priority is based on current stock, reorder level, and recent average daily sales. (Note: this is a simple rule-based recommendation, not a demand-forecasting model.)`,
      table: {
        columns: ['Product', 'Stock', 'Recent (14d)', 'Avg/day', 'Reorder Lvl', 'Status', 'Priority', 'Recommendation'],
        rows: list.slice(0, 8).map(insightRow),
      },
    };
  }

  if (/low stock|low on stock|running low|below reorder|understock/.test(q)) {
    const list = insights.filter(
      (i) => i.status === 'Low Stock' || i.status === 'Out of Stock',
    );
    if (list.length === 0) {
      return { content: 'No products are low or out of stock. Everything is above reorder level.' };
    }
    return {
      content: `${list.length} product(s) are at or below their reorder level.`,
      table: {
        columns: ['Product', 'Stock', 'Recent (14d)', 'Avg/day', 'Reorder Lvl', 'Status', 'Priority', 'Recommendation'],
        rows: list.slice(0, 8).map(insightRow),
      },
    };
  }

  if (/best.?sell|top sell|most sold|best selling|popular product/.test(q)) {
    const ts = topSellers(products, orders, 8);
    if (ts.length === 0 || ts[0].unitsSold === 0) {
      return { content: 'No sales have been recorded yet.' };
    }
    return {
      content: `Here are your top-selling products by units sold (from confirmed+ orders).`,
      table: {
        columns: ['Product', 'Units Sold', 'Revenue'],
        rows: ts.map((t) => [t.product.name, t.unitsSold, formatINR(t.revenue)]),
      },
    };
  }

  if (/poor sale|worst sell|not selling|slow.?moving|underperform|dead stock|no sale/.test(q)) {
    const slow = insights
      .filter((i) => i.unitsSold === 0 || i.avgDailySales < 0.1)
      .sort((a, b) => a.unitsSold - b.unitsSold);
    if (slow.length === 0) {
      return { content: 'Every product has recorded at least some sales. No clear slow-movers.' };
    }
    return {
      content: `${slow.length} product(s) have little to no recent sales. Consider a promotion or review pricing.`,
      table: {
        columns: ['Product', 'Stock', 'Units Sold', 'Avg/day', 'Status'],
        rows: slow.slice(0, 8).map((i) => [
          i.product.name,
          i.product.stock,
          i.unitsSold,
          i.avgDailySales.toFixed(2),
          i.status,
        ]),
      },
    };
  }

  if (/category.*sale|category.*revenue|which category|top category|category perform/.test(q)) {
    const cp = categoryPerformance(products, orders);
    if (cp.length === 0) return { content: 'No category sales data available yet.' };
    return {
      content: `Category performance by revenue (from confirmed+ orders).`,
      table: {
        columns: ['Category', 'Units Sold', 'Revenue'],
        rows: cp.map((c) => [c.category, c.units, formatINR(c.revenue)]),
      },
    };
  }

  if (/revenue|total sales|how much.*sell|money|earn/.test(q)) {
    const rev = totalRevenue(orders);
    const orderCount = orders.filter((o) => o.status !== 'Placed').length;
    return {
      content: `Total revenue from confirmed and delivered orders is ${formatINR(rev)} across ${orderCount} order(s).`,
    };
  }

  if (/inventory.*attention|need attention|attention|problem|issue|what.*wrong|health/.test(q)) {
    const low = insights.filter((i) => i.status !== 'In Stock');
    const slow = insights.filter((i) => i.avgDailySales < 0.1 && i.status === 'In Stock');
    const parts: string[] = [];
    if (low.length > 0) parts.push(`${low.length} product(s) are low or out of stock`);
    if (slow.length > 0) parts.push(`${slow.length} product(s) are slow-moving`);
    if (parts.length === 0) return { content: 'Inventory looks healthy — nothing needs urgent attention.' };
    return {
      content: `Needs attention: ${parts.join(', and ')}.`,
      table: {
        columns: ['Product', 'Stock', 'Avg/day', 'Status', 'Priority', 'Recommendation'],
        rows: low.slice(0, 6).map((i) => [
          i.product.name,
          i.product.stock,
          i.avgDailySales.toFixed(1),
          i.status,
          i.priority,
          i.recommendation,
        ]),
      },
    };
  }

  if (/out of stock|oos|no stock|zero stock/.test(q)) {
    const list = insights.filter((i) => i.status === 'Out of Stock');
    if (list.length === 0) return { content: 'No products are out of stock.' };
    return {
      content: `${list.length} product(s) are completely out of stock.`,
      table: {
        columns: ['Product', 'Stock', 'Units Sold', 'Recommendation'],
        rows: list.map((i) => [i.product.name, 0, i.unitsSold, i.recommendation]),
      },
    };
  }

  return {
    content:
      "I can help with restocking, low stock, best-sellers, slow movers, category performance, revenue, and inventory health. Try asking \"Which products should I restock?\" or \"Which category generated the most sales?\".",
  };
}
