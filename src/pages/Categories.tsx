import { Cpu, Shirt, Home as HomeIcon, BookOpen, Watch, ArrowRight } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { Link } from '@/lib/router';
import { CATEGORY_INFO } from '@/data/demoData';
import { formatINR } from '@/lib/inventory';

const ICONS: Record<string, typeof Cpu> = {
  Cpu,
  Shirt,
  Home: HomeIcon,
  BookOpen,
  Watch,
};

export function Categories() {
  const { products } = useStore();
  return (
    <div className="container-app py-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-900">All Categories</h1>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {CATEGORY_INFO.map((cat) => {
          const Icon = ICONS[cat.icon] ?? Cpu;
          const catProducts = products.filter((p) => p.category === cat.name);
          const from = Math.min(...catProducts.map((p) => p.price));
          return (
            <div key={cat.name} className="card overflow-hidden">
              <div className="flex items-center gap-3 border-b border-ink-100 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-ink-900">{cat.name}</h2>
                  <p className="text-xs text-ink-500">{cat.blurb}</p>
                </div>
              </div>
              <div className="p-5">
                <div className="mb-4 flex gap-2 overflow-x-auto">
                  {catProducts.slice(0, 4).map((p) => (
                    <Link key={p.id} to={`/product/${p.id}`} className="flex-shrink-0">
                      <img src={p.image} alt={p.name} className="h-16 w-16 rounded-lg object-cover" />
                    </Link>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-ink-500">{catProducts.length} products</p>
                    <p className="text-xs text-ink-500">From {formatINR(from)}</p>
                  </div>
                  <Link
                    to={`/products?category=${encodeURIComponent(cat.name)}`}
                    className="btn-primary px-3 py-2 text-xs"
                  >
                    Shop Now <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
