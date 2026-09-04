import { useState } from 'react';
import { Package, ChevronDown, ChevronUp, ShoppingBag } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { Link } from '@/lib/router';
import { formatINR, formatDate } from '@/lib/inventory';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
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

export function Orders() {
  const { orders } = useStore();
  const requestedOrder = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('order');
  const [expanded, setExpanded] = useState<string | null>(requestedOrder);

  const myOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (myOrders.length === 0) {
    return (
      <div className="container-app py-12">
        <h1 className="mb-6 text-2xl font-bold text-ink-900">My Orders</h1>
        <EmptyState
          icon={<ShoppingBag size={26} />}
          title="No orders yet"
          description="When you place an order, it will appear here."
          action={<Link to="/products" className="btn-primary">Start Shopping</Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-900">My Orders</h1>
      <div className="space-y-3">
        {myOrders.map((order) => {
          const open = expanded === order.id;
          return (
            <div key={order.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(open ? null : order.id)}
                className="flex w-full items-center gap-4 p-4 text-left hover:bg-ink-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Package size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink-900">{order.id}</p>
                    <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
                  </div>
                  <p className="text-xs text-ink-500">
                    {formatDate(order.createdAt)} · {order.items.length} item(s) · {order.customerName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-ink-900">{formatINR(order.total)}</p>
                </div>
                {open ? <ChevronUp size={18} className="text-ink-400" /> : <ChevronDown size={18} className="text-ink-400" />}
              </button>
              {open && (
                <div className="border-t border-ink-100 bg-ink-50 p-4">
                  <div className="space-y-2">
                    {order.items.map((i) => (
                      <div key={i.productId} className="flex items-center gap-3 text-sm">
                        <Link to={`/product/${i.productId}`}>
                          <img src={i.image} alt={i.name} className="h-12 w-12 rounded-md object-cover" />
                        </Link>
                        <Link to={`/product/${i.productId}`} className="flex-1 min-w-0">
                          <p className="line-clamp-1 font-medium text-ink-800 hover:text-brand-700">{i.name}</p>
                          <p className="text-xs text-ink-500">{formatINR(i.price)} x {i.quantity}</p>
                        </Link>
                        <span className="font-medium text-ink-800">{formatINR(i.price * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-4 border-t border-ink-200 pt-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="font-semibold text-ink-800">Delivery Address</p>
                      <p className="mt-1 text-ink-600">{order.customerName}<br />{order.address}, {order.city} - {order.pincode}<br />{order.phone}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-ink-800">Payment & Totals</p>
                      <div className="mt-1 space-y-1 text-ink-600">
                        <p>Method: {order.paymentMethod}</p>
                        <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
                        <div className="flex justify-between"><span>Delivery</span><span>{order.deliveryCharge === 0 ? 'FREE' : formatINR(order.deliveryCharge)}</span></div>
                        <div className="flex justify-between font-bold text-ink-800"><span>Total</span><span>{formatINR(order.total)}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
