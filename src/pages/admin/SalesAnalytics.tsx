import { useMemo } from 'react';
import { TrendingUp, IndianRupee, ShoppingBag, Layers } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAssistant } from '@/components/admin/AdminAssistant';
import {
  formatINR,
  totalRevenue,
  topSellers,
  categoryPerformance,
  computeInventoryInsights,
} from '@/lib/inventory';

export function SalesAnalytics() {
  const { products, orders } = useStore();
  const revenue = totalRevenue(orders);
  const ts = topSellers(products, orders, 8);
  const cp = categoryPerformance(products, orders);
  const insights = computeInventoryInsights(products, orders);

  const maxCatRev = Math.max(...cp.map((c) => c.revenue), 1);
  const maxUnits = Math.max(...ts.map((t) => t.unitsSold), 1);

  // Orders over time (last 14 days)
  const days = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      map.set(key, { count: 0, revenue: 0 });
    }
    for (const o of orders) {
      const key = new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const cur = map.get(key);
      if (cur) {
        cur.count += 1;
        cur.revenue += o.total;
      }
    }
    return [...map.entries()];
  }, [orders]);
  const maxDayRev = Math.max(...days.map((d) => d[1].revenue), 1);

  // Inventory movement
  const fastMovers = insights.filter((i) => i.avgDailySales >= 1).sort((a, b) => b.avgDailySales - a.avgDailySales).slice(0, 5);
  const slowMovers = insights.filter((i) => i.avgDailySales < 0.1 && i.status !== 'Out of Stock').slice(0, 5);

  const stats = [
    { label: 'Total Revenue', value: formatINR(revenue), icon: IndianRupee, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, tone: 'bg-sky-50 text-sky-600' },
    { label: 'Avg Order Value', value: orders.length > 0 ? formatINR(Math.round(revenue / orders.length)) : formatINR(0), icon: TrendingUp, tone: 'bg-brand-50 text-brand-600' },
    { label: 'Categories', value: cp.length, icon: Layers, tone: 'bg-accent-100 text-accent-700' },
  ];

  return (
    <>
      <AdminLayout title="Sales Analytics">
        <p className="mb-4 text-xs text-ink-500">Charts below use demo order data. This is a prototype visualization, not a production analytics engine.</p>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.tone}`}>
                <s.icon size={20} />
              </div>
              <p className="mt-3 text-xl font-bold text-ink-900">{s.value}</p>
              <p className="text-xs text-ink-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Revenue over time */}
        <div className="mt-6 card p-5">
          <h2 className="mb-4 text-base font-semibold text-ink-900">Orders & Revenue (Last 14 Days)</h2>
          <div className="flex h-48 items-end gap-1.5">
            {days.map(([key, val]) => (
              <div key={key} className="group flex flex-1 flex-col items-center gap-1">
                <div className="relative flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-brand-500 transition-all hover:bg-brand-600"
                    style={{ height: `${(val.revenue / maxDayRev) * 100}%`, minHeight: val.revenue > 0 ? '4px' : '0' }}
                    title={`${key}: ${formatINR(val.revenue)} (${val.count} orders)`}
                  />
                </div>
                <span className="hidden text-[10px] text-ink-400 sm:block">{key.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Category performance */}
          <div className="card p-5">
            <h2 className="mb-4 text-base font-semibold text-ink-900">Category Performance</h2>
            <div className="space-y-3">
              {cp.map((c) => (
                <div key={c.category}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-ink-700">{c.category}</span>
                    <span className="text-ink-600">{formatINR(c.revenue)}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${(c.revenue / maxCatRev) * 100}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-ink-400">{c.units} units sold</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top selling products */}
          <div className="card p-5">
            <h2 className="mb-4 text-base font-semibold text-ink-900">Top-Selling Products</h2>
            <div className="space-y-3">
              {ts.map((t, idx) => (
                <div key={t.product.id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{idx + 1}</span>
                  <img src={t.product.image} alt={t.product.name} className="h-10 w-10 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-1 text-sm font-medium text-ink-800">{t.product.name}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100">
                      <div className="h-full rounded-full bg-accent-400" style={{ width: `${(t.unitsSold / maxUnits) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-ink-700">{t.unitsSold}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory movement */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h2 className="mb-4 text-base font-semibold text-ink-900">Fast-Moving Inventory</h2>
            {fastMovers.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-500">No fast movers recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {fastMovers.map((i) => (
                  <div key={i.product.id} className="flex items-center gap-3 text-sm">
                    <img src={i.product.image} alt={i.product.name} className="h-9 w-9 rounded-md object-cover" />
                    <span className="flex-1 line-clamp-1 text-ink-700">{i.product.name}</span>
                    <span className="text-ink-500">{i.avgDailySales.toFixed(1)}/day</span>
                    <span className="font-medium text-ink-800">{i.product.stock} left</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card p-5">
            <h2 className="mb-4 text-base font-semibold text-ink-900">Slow-Moving Inventory</h2>
            {slowMovers.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-500">No slow movers detected.</p>
            ) : (
              <div className="space-y-2">
                {slowMovers.map((i) => (
                  <div key={i.product.id} className="flex items-center gap-3 text-sm">
                    <img src={i.product.image} alt={i.product.name} className="h-9 w-9 rounded-md object-cover" />
                    <span className="flex-1 line-clamp-1 text-ink-700">{i.product.name}</span>
                    <span className="text-ink-500">{i.avgDailySales.toFixed(2)}/day</span>
                    <span className="font-medium text-ink-800">{i.product.stock} left</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
      <AdminAssistant />
    </>
  );
}
