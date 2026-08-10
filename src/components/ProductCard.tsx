import { ShoppingBag, Eye } from 'lucide-react';
import type { Product } from '@/types';
import { useStore } from '@/store/StoreContext';
import { Link } from '@/lib/router';
import { formatINR, getStockStatus } from '@/lib/inventory';
import { StarRating } from '@/components/ui/StarRating';
import { StockBadge } from '@/components/ui/Badge';

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore();
  const status = getStockStatus(product);
  const out = status === 'Out of Stock';
  const discount = product.oldPrice
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;

  return (
    <div className="group card flex flex-col overflow-hidden transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5">
      <Link to={`/product/${product.id}`} className="relative block">
        <div className="relative aspect-square overflow-hidden bg-ink-50">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {discount > 0 && (
            <span className="absolute left-3 top-3 badge bg-accent-500 text-ink-900 font-semibold">
              {discount}% OFF
            </span>
          )}
          {out && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <span className="badge bg-ink-900 text-white">Out of Stock</span>
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-600">
            {product.category}
          </span>
          <StockBadge status={status} />
        </div>
        <Link to={`/product/${product.id}`}>
          <h3 className="line-clamp-2 text-sm font-semibold text-ink-800 hover:text-brand-700">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1.5">
          <StarRating rating={product.rating} showValue count={product.ratingCount} />
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-ink-900">
                {formatINR(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-xs text-ink-400 line-through">
                  {formatINR(product.oldPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={out}
            onClick={() => addToCart(product.id)}
            className="btn-primary flex-1 px-3 py-2 text-xs"
          >
            <ShoppingBag size={14} /> Add to Cart
          </button>
          <Link
            to={`/product/${product.id}`}
            className="btn-outline px-3 py-2 text-xs"
          >
            <Eye size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
