import {
  Package,
  ClipboardList,
  IndianRupee,
  AlertTriangle,
  XCircle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { Link } from '@/lib/router';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAssistant } from '@/components/admin/AdminAssistant';
import { GoogleIntegrationPanel } from '@/components/admin/GoogleIntegrationPanel';
import { WebsiteScoreCard } from '@/components/admin/WebsiteScoreCard';
import { Badge, StockBadge } from '@/components/ui/Badge';
import {
  formatINR,
  formatDate,
  getStockStatus,
  totalRevenue,
  topSellers,
  computeInventoryInsights,
  restockPriorityList,
} from '@/lib/inventory';
import type { OrderStatus } from '@/types';

const STATUS_TONE: Record<OrderStatus, 'neutral' | 'info' | 'warning' | 'success'> = {
  Placed: 'neutral',
  Confirmed: 'info',
  Processing: 'info',
  Shipped: 'warning',
  'Out for Delivery': 'warning',
  Delivered: 'success',
  Cancelled: 'warning',
};

export function AdminDashboard() {
  const { products, orders } = useStore();
  const revenue = totalRevenue(orders);
  const lowStock = products.filter((p) => {
    const s = getStockStatus(p);
    return s === 'Low Stock';
  });
  const outStock = products.filter((p) => getStockStatus(p) === 'Out of Stock');
  const recent = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const ts = topSellers(products, orders, 5);
  const insights = computeInventoryInsights(products, orders);
  const restock = restockPriorityList(insights).slice(0, 4);

  const stats = [
    { label: 'Total Products', value: products.length, icon: Package, tone: 'bg-brand-50 text-brand-600' },
    { label: 'Total Orders', value: orders.length, icon: ClipboardList, tone: 'bg-sky-50 text-sky-600' },
    { label: 'Revenue', value: formatINR(revenue), icon: IndianRupee, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Low Stock', value: lowStock.length, icon: AlertTriangle, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Out of Stock', value: outStock.length, icon: XCircle, tone: 'bg-red-50 text-red-600' },
  ];

  return (
    <>
      <AdminLayout title="Dashboard">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="card p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.tone}`}>
                <s.icon size={20} />
              </div>
              <p className="mt-3 text-2xl font-bold text-ink-900">{s.value}</p>
              <p className="text-xs text-ink-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Recent orders */}
          <div className="card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink-900">Recent Orders</h2>
              <Link to="/admin/orders" className="text-sm text-brand-700 hover:text-brand-800">
                View all <ArrowRight size={14} className="inline" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-ink-500">
                  <tr className="border-b border-ink-100">
                    <th className="pb-2 font-medium">Order</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {recent.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2.5 font-medium text-ink-800">{o.id}</td>
                      <td className="py-2.5 text-ink-600">{o.customerName}</td>
                      <td className="py-2.5 text-ink-500">{formatDate(o.createdAt)}</td>
                      <td className="py-2.5 font-medium text-ink-800">{formatINR(o.total)}</td>
                      <td className="py-2.5"><Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Restock priority */}
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink-900">Restock Priority</h2>
              <Link to="/admin/inventory" className="text-sm text-brand-700 hover:text-brand-800">
                Details <ArrowRight size={14} className="inline" />
              </Link>
            </div>
            {restock.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-500">All stock levels are healthy.</p>
            ) : (
              <div className="space-y-3">
                {restock.map((i) => (
                  <div key={i.product.id} className="flex items-center gap-3">
                    <img src={i.product.image} alt={i.product.name} className="h-10 w-10 rounded-md object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-1 text-sm font-medium text-ink-800">{i.product.name}</p>
                      <p className="text-xs text-ink-500">Stock: {i.product.stock} · {i.status}</p>
                    </div>
                    <Badge tone={i.priority === 'High' ? 'danger' : i.priority === 'Medium' ? 'warning' : 'neutral'}>
                      {i.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top sellers + low stock */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-600" />
              <h2 className="text-base font-semibold text-ink-900">Top-Selling Products</h2>
            </div>
            <div className="space-y-3">
              {ts.map((t, idx) => (
                <div key={t.product.id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {idx + 1}
                  </span>
                  <img src={t.product.image} alt={t.product.name} className="h-10 w-10 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-1 text-sm font-medium text-ink-800">{t.product.name}</p>
                    <p className="text-xs text-ink-500">{t.unitsSold} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-ink-800">{formatINR(t.revenue)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <h2 className="text-base font-semibold text-ink-900">Low / Out of Stock</h2>
            </div>
            {lowStock.length + outStock.length === 0 ? (
              <p className="py-8 text-center text-sm text-ink-500">No stock issues.</p>
            ) : (
              <div className="space-y-3">
                {[...outStock, ...lowStock].slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <img src={p.image} alt={p.name} className="h-10 w-10 rounded-md object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-1 text-sm font-medium text-ink-800">{p.name}</p>
                      <p className="text-xs text-ink-500">Stock: {p.stock} · Reorder: {p.reorderLevel}</p>
                    </div>
                    <StockBadge status={getStockStatus(p)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <GoogleIntegrationPanel />
        <WebsiteScoreCard />
      </AdminLayout>
      <AdminAssistant />
    </>
  );
}
