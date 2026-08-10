import { useState } from 'react';
import { CheckCircle2, CreditCard, Banknote, Wallet, ArrowLeft } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { Link, useRouter } from '@/lib/router';
import { formatINR } from '@/lib/inventory';
import type { Order } from '@/types';

export function Checkout() {
  const { cart, products, placeOrder } = useStore();
  const { navigate } = useRouter();

  const items = cart
    .map((ci) => {
      const product = products.find((p) => p.id === ci.productId);
      return product ? { product, quantity: ci.quantity } : null;
    })
    .filter(Boolean) as { product: NonNullable<ReturnType<typeof products.find>>; quantity: number }[];

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const deliveryCharge = subtotal === 0 || subtotal > 999 ? 0 : 49;
  const total = subtotal + deliveryCharge;

  const [form, setForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: '',
    paymentMethod: 'Cash on Delivery',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [placed, setPlaced] = useState<Order | null>(null);

  const update = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ''))) e.phone = 'Enter a 10-digit phone number';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.city.trim()) e.city = 'City is required';
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Enter a 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    const order = placeOrder(form);
    setPlaced(order);
    window.scrollTo({ top: 0 });
  };

  if (placed) {
    return (
      <div className="container-app py-12">
        <div className="mx-auto max-w-2xl">
          <div className="card p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <CheckCircle2 size={36} />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-ink-900">Order Placed!</h1>
            <p className="mt-2 text-sm text-ink-500">
              Thank you for your purchase. Your order <span className="font-semibold text-ink-800">{placed.id}</span> has been received.
            </p>
            <div className="mt-6 rounded-xl bg-ink-50 p-5 text-left">
              <h2 className="mb-3 text-sm font-semibold text-ink-800">Order Summary</h2>
              <div className="space-y-2">
                {placed.items.map((i) => (
                  <div key={i.productId} className="flex items-center gap-3 text-sm">
                    <img src={i.image} alt={i.name} className="h-10 w-10 rounded-md object-cover" />
                    <span className="flex-1 text-ink-700">{i.name}</span>
                    <span className="text-ink-500">x{i.quantity}</span>
                    <span className="font-medium text-ink-800">{formatINR(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1 border-t border-ink-200 pt-3 text-sm">
                <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span>{formatINR(placed.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Delivery</span><span>{placed.deliveryCharge === 0 ? 'FREE' : formatINR(placed.deliveryCharge)}</span></div>
                <div className="flex justify-between text-base font-bold"><span>Total</span><span className="text-brand-700">{formatINR(placed.total)}</span></div>
              </div>
              <div className="mt-3 border-t border-ink-200 pt-3 text-sm">
                <p><span className="text-ink-500">Delivery to:</span> {placed.customerName}, {placed.address}, {placed.city} - {placed.pincode}</p>
                <p><span className="text-ink-500">Payment:</span> {placed.paymentMethod}</p>
                <p><span className="text-ink-500">Status:</span> {placed.status}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/orders" className="btn-primary">View My Orders</Link>
              <Link to="/products" className="btn-outline">Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-app py-12 text-center">
        <h1 className="text-2xl font-bold text-ink-900">Your cart is empty</h1>
        <p className="mt-2 text-ink-500">Add items to your cart before checking out.</p>
        <Link to="/products" className="btn-primary mt-6 inline-flex">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      <Link to="/cart" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft size={16} /> Back to Cart
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-ink-900">Checkout</h1>
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-6">
            <h2 className="mb-4 text-base font-semibold text-ink-900">Customer Information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={form.customerName} onChange={(e) => update('customerName', e.target.value)} placeholder="John Doe" />
                {errors.customerName && <p className="mt-1 text-xs text-red-500">{errors.customerName}</p>}
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="john@example.com" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="9876543210" />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>
              <div>
                <label className="label">Pincode</label>
                <input className="input" value={form.pincode} onChange={(e) => update('pincode', e.target.value)} placeholder="560001" />
                {errors.pincode && <p className="mt-1 text-xs text-red-500">{errors.pincode}</p>}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 text-base font-semibold text-ink-900">Delivery Address</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Street Address</label>
                <textarea className="input min-h-[80px]" value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="House no, street, area" />
                {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Bengaluru" />
                {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="mb-4 text-base font-semibold text-ink-900">Payment Method</h2>
            <p className="mb-3 text-xs text-ink-500">This is a prototype — no real payment will be processed.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Cash on Delivery', icon: Banknote },
                { label: 'Credit / Debit Card', icon: CreditCard },
                { label: 'UPI / Wallet', icon: Wallet },
              ].map((m) => (
                <button
                  type="button"
                  key={m.label}
                  onClick={() => update('paymentMethod', m.label)}
                  className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center text-sm transition ${
                    form.paymentMethod === m.label
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-ink-200 text-ink-600 hover:border-ink-300'
                  }`}
                >
                  <m.icon size={22} />
                  <span className="font-medium">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card sticky top-20 p-5">
            <h2 className="text-base font-semibold text-ink-900">Order Summary</h2>
            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center gap-3 text-sm">
                  <img src={product.image} alt={product.name} className="h-12 w-12 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-1 font-medium text-ink-800">{product.name}</p>
                    <p className="text-xs text-ink-500">x{quantity}</p>
                  </div>
                  <span className="font-medium text-ink-800">{formatINR(product.price * quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Subtotal</span><span>{formatINR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Delivery</span><span>{deliveryCharge === 0 ? 'FREE' : formatINR(deliveryCharge)}</span></div>
              <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-bold"><span>Total</span><span className="text-brand-700">{formatINR(total)}</span></div>
            </div>
            <button type="submit" className="btn-primary mt-5 w-full py-3">Place Order</button>
          </div>
        </div>
      </form>
    </div>
  );
}
