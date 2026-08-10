import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { Link, useRouter } from '@/lib/router';
import { formatINR } from '@/lib/inventory';
import { EmptyState } from '@/components/ui/EmptyState';

export function Cart() {
  const { cart, products, updateCartQty, removeFromCart } = useStore();
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

  if (items.length === 0) {
    return (
      <div className="container-app py-12">
        <h1 className="mb-6 text-2xl font-bold text-ink-900">Shopping Cart</h1>
        <EmptyState
          icon={<ShoppingBag size={26} />}
          title="Your cart is empty"
          description="Browse our products and add items to your cart to get started."
          action={
            <Link to="/products" className="btn-primary">
              Start Shopping <ArrowRight size={16} />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-900">Shopping Cart</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="card flex gap-4 p-4">
              <Link to={`/product/${product.id}`} className="flex-shrink-0">
                <img src={product.image} alt={product.name} className="h-24 w-24 rounded-lg object-cover" />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="text-sm font-semibold text-ink-800 hover:text-brand-700">{product.name}</h3>
                  </Link>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="text-ink-400 hover:text-red-500"
                    aria-label="Remove"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-xs text-ink-500">{product.category}</p>
                <div className="mt-auto flex items-end justify-between">
                  <div className="flex items-center rounded-lg border border-ink-200">
                    <button
                      onClick={() => updateCartQty(product.id, quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center text-ink-600 hover:bg-ink-50"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                    <button
                      onClick={() => updateCartQty(product.id, quantity + 1)}
                      className="flex h-8 w-8 items-center justify-center text-ink-600 hover:bg-ink-50"
                      disabled={quantity >= product.stock}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ink-900">{formatINR(product.price * quantity)}</p>
                    {quantity > 1 && (
                      <p className="text-xs text-ink-400">{formatINR(product.price)} each</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Link to="/products" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
            <ArrowLeft size={16} /> Continue Shopping
          </Link>
        </div>

        <div className="lg:col-span-1">
          <div className="card sticky top-20 p-5">
            <h2 className="text-base font-semibold text-ink-900">Order Summary</h2>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-500">Subtotal ({items.length} items)</span>
                <span className="font-medium text-ink-800">{formatINR(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Delivery</span>
                <span className="font-medium text-ink-800">
                  {deliveryCharge === 0 ? <span className="text-brand-600">FREE</span> : formatINR(deliveryCharge)}
                </span>
              </div>
              {deliveryCharge > 0 && (
                <p className="text-xs text-ink-400">
                  Add {formatINR(1000 - subtotal)} more for free delivery.
                </p>
              )}
              <div className="border-t border-ink-100 pt-2.5">
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-ink-900">Total</span>
                  <span className="font-bold text-brand-700">{formatINR(total)}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="btn-primary mt-5 w-full py-3"
            >
              Proceed to Checkout <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
