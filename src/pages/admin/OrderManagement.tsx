import { useState } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminAssistant } from '@/components/admin/AdminAssistant';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatINR, formatDateTime } from '@/lib/inventory';
import type { OrderStatus } from '@/types';

const STATUSES: OrderStatus[] = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];
const STATUS_TONE: Record<OrderStatus, 'neutral' | 'info' | 'warning' | 'success'> = {
  Placed: 'neutral',
  Confirmed: 'info',
  Shipped: 'warning',
  Delivered: 'success',
};

export function OrderManagement() {
  const { orders, updateOrderStatus } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = orders
    .filter((o) =>
      (o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase())) &&
      (statusFilter === 'all' || o.status === statusFilter),
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <>
      <AdminLayout title="Order Management">
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID or customer..."
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | OrderStatus)}
            className="input w-auto"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={26} />}
            title="No orders found"
            description="Try a different search or status filter."
          />
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-50 text-xs text-ink-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {filtered.map((o) => (
                    <>
                      <tr
                        key={o.id}
                        className="cursor-pointer hover:bg-ink-50"
                        onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                      >
                        <td className="px-4 py-3 font-medium text-ink-800">{o.id}</td>
                        <td className="px-4 py-3 text-ink-700">{o.customerName}</td>
                        <td className="px-4 py-3 text-ink-500">{formatDateTime(o.createdAt)}</td>
                        <td className="px-4 py-3 text-ink-700">{o.items.length}</td>
                        <td className="px-4 py-3 font-medium text-ink-800">{formatINR(o.total)}</td>
                        <td className="px-4 py-3"><Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge></td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={o.status}
                            onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                            className="input w-auto py-1.5 text-xs"
                          >
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                      {expanded === o.id && (
                        <tr key={`${o.id}-detail`} className="bg-ink-50">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase text-ink-500">Items</p>
                                <div className="space-y-2">
                                  {o.items.map((i) => (
                                    <div key={i.productId} className="flex items-center gap-3 text-sm">
                                      <img src={i.image} alt={i.name} className="h-10 w-10 rounded-md object-cover" />
                                      <span className="flex-1 line-clamp-1 text-ink-700">{i.name}</span>
                                      <span className="text-ink-500">x{i.quantity}</span>
                                      <span className="font-medium text-ink-800">{formatINR(i.price * i.quantity)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase text-ink-500">Delivery</p>
                                <div className="text-sm text-ink-600">
                                  <p>{o.customerName}</p>
                                  <p>{o.address}, {o.city} - {o.pincode}</p>
                                  <p>{o.phone} · {o.email}</p>
                                  <p className="mt-2 text-ink-500">Payment: {o.paymentMethod}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
