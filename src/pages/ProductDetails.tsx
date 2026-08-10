import { useState } from 'react';
import { Minus, Plus, ShoppingBag, Zap, ArrowLeft, Truck, ShieldCheck, RotateCcw, Check } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { Link, useRouter } from '@/lib/router';
import { formatINR, getStockStatus } from '@/lib/inventory';
import { StarRating } from '@/components/ui/StarRating';
import { StockBadge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/ProductCard';
import { findSimilar } from '@/lib/shoppingAssistant';

export function ProductDetails({ id }: { id: string }) {
  const { products, addToCart } = useStore();
  const { navigate } = useRouter();
  const product = products.find((p) => p.id === id);
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <div className="container-app py-20 text-center">
        <h1 className="text-2xl font-bold text-ink-900">Product not found</h1>
        <p className="mt-2 text-ink-500">This product may have been removed.</p>
        <Link to="/products" className="btn-primary mt-6 inline-flex">
          <ArrowLeft size={16} /> Back to Products
        </Link>
      </div>
    );
  }

  const status = getStockStatus(product);
  const out = status === 'Out of Stock';
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;
  const similar = findSimilar(product, products);

  const buyNow = () => {
    addToCart(product.id, qty);
    navigate('/checkout');
  };

  return (
    <div className="container-app py-8">
      <Link to="/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800">
        <ArrowLeft size={16} /> Back to Products
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="relative aspect-square bg-ink-50">
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            {discount > 0 && (
              <span className="absolute left-4 top-4 badge bg-accent-500 text-ink-900 font-semibold">
                {discount}% OFF
              </span>
            )}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-brand-600">
            {product.category}
          </span>
          <h1 className="mt-1 text-2xl font-bold text-ink-900 md:text-3xl">
            {product.name}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <StarRating rating={product.rating} size={18} showValue count={product.ratingCount} />
            <StockBadge status={status} />
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl font-bold text-ink-900">{formatINR(product.price)}</span>
            {product.oldPrice && (
              <span className="text-lg text-ink-400 line-through">{formatINR(product.oldPrice)}</span>
            )}
            {discount > 0 && (
              <span className="text-sm font-semibold text-brand-600">Save {formatINR(product.oldPrice! - product.price)}</span>
            )}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-ink-600">{product.description}</p>

          <div className="mt-5">
            <p className="text-sm font-medium text-ink-700">Quantity</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center rounded-lg border border-ink-200">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center text-ink-600 hover:bg-ink-50 disabled:opacity-40"
                  disabled={qty <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  className="flex h-10 w-10 items-center justify-center text-ink-600 hover:bg-ink-50 disabled:opacity-40"
                  disabled={qty >= product.stock}
                >
                  <Plus size={16} />
                </button>
              </div>
              <span className="text-xs text-ink-500">
                {product.stock} unit(s) available
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => addToCart(product.id, qty)}
              disabled={out}
              className="btn-primary flex-1 py-3"
            >
              <ShoppingBag size={18} /> Add to Cart
            </button>
            <button
              onClick={buyNow}
              disabled={out}
              className="btn-accent flex-1 py-3"
            >
              <Zap size={18} /> Buy Now
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 rounded-xl bg-ink-50 p-4">
            {[
              { icon: Truck, label: 'Free Delivery' },
              { icon: ShieldCheck, label: 'Secure Checkout' },
              { icon: RotateCcw, label: '7-Day Returns' },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-1 text-center">
                <f.icon size={20} className="text-brand-600" />
                <span className="text-xs font-medium text-ink-600">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Specs */}
      <div className="mt-10 card p-6">
        <h2 className="text-lg font-semibold text-ink-900">Specifications</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {Object.entries(product.specs).map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-ink-100 pb-2 text-sm">
              <dt className="text-ink-500">{k}</dt>
              <dd className="font-medium text-ink-800">{v}</dd>
            </div>
          ))}
          <div className="flex justify-between border-b border-ink-100 pb-2 text-sm">
            <dt className="text-ink-500">Availability</dt>
            <dd className="flex items-center gap-1.5 font-medium text-ink-800">
              {status === 'In Stock' ? (
                <>
                  <Check size={14} className="text-brand-600" /> In Stock
                </>
              ) : (
                status
              )}
            </dd>
          </div>
        </dl>
      </div>

      {/* Similar */}
      {similar.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-5 text-xl font-bold text-ink-900">Similar Products</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {similar.map((p) => {
              const full = products.find((pp) => pp.id === p.id)!;
              return <ProductCard key={p.id} product={full} />;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
