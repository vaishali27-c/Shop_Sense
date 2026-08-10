import { useMemo, useState } from 'react';
import { Boxes, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAssistant } from '@/components/admin/AdminAssistant';
import { Badge, StockBadge } from '@/components/ui/Badge';
import {
  computeInventoryInsights,
  restockPriorityList,
} from '@/lib/inventory';

const PRIORITY_TONE = {
  High: 'danger',
  Medium: 'warning',
  Low: 'neutral',
  None: 'neutral',
} as const;

export function InventoryManagement() {
  const { products, orders } = useStore();
  const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'restock'>('all');

  const insights = useMemo(
    () => computeInventoryInsights(products, orders),
    [products, orders],
  );
  const restock = restockPriorityList(insights);

  let list = insights;
  if (filter === 'low') list = insights.filter((i) => i.status === 'Low Stock');
  else if (filter === 'out') list = insights.filter((i) => i.status === 'Out of Stock');
  else if (filter === 'restock') list = restock;

  const counts = {
    all: insights.length,
    low: insights.filter((i) => i.status === 'Low Stock').length,
    out: insights.filter((i) => i.status === 'Out of Stock').length,
    restock: restock.length,
  };

  return (
    <>
      <AdminLayout title="Inventory Management">
        <div className="mb-4 flex flex-wrap gap-2">
          {([
            ['all', `All (${counts.all})`],
            ['restock', `Needs Restock (${counts.restock})`],
            ['low', `Low Stock (${counts.low})`],
            ['out', `Out of Stock (${counts.out})`],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                filter === key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-ink-600 border border-ink-200 hover:bg-ink-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filter === 'restock' && restock.length > 0 && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Intelligent Restock Priority</p>
              <p className="mt-0.5 text-amber-700">
                Priority is computed from current stock vs. reorder level and recent average daily sales (last 14 days). This is a simple rule-based estimate, not a demand-forecasting model. Advanced prediction is future scope.
              </p>
            </div>
          </div>
        )}

        {list.length === 0 ? (
          <div className="card flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <Boxes size={26} />
            </div>
            <h3 className="text-base font-semibold text-ink-800">Nothing here</h3>
            <p className="mt-1 text-sm text-ink-500">No products match this filter.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-50 text-xs text-ink-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Current Stock</th>
                    <th className="px-4 py-3 font-medium">Units Sold</th>
                    <th className="px-4 py-3 font-medium">Avg/day</th>
                    <th className="px-4 py-3 font-medium">Reorder Lvl</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {list.map((i) => (
                    <tr key={i.product.id} className="hover:bg-ink-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={i.product.image} alt={i.product.name} className="h-10 w-10 rounded-md object-cover" />
                          <span className="line-clamp-1 font-medium text-ink-800 max-w-[180px]">{i.product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-ink-800">{i.product.stock}</td>
                      <td className="px-4 py-3 text-ink-700">{i.unitsSold}</td>
                      <td className="px-4 py-3 text-ink-700">{i.avgDailySales.toFixed(1)}</td>
                      <td className="px-4 py-3 text-ink-700">{i.product.reorderLevel}</td>
                      <td className="px-4 py-3"><StockBadge status={i.status} /></td>
                      <td className="px-4 py-3">
                        {i.priority !== 'None' ? (
                          <Badge tone={PRIORITY_TONE[i.priority]}>{i.priority}</Badge>
                        ) : (
                          <span className="text-ink-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-600 max-w-[220px]">{i.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </AdminLayout>
      <AdminAssistant />
    </>
  );
}
