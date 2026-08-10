import {
  ArrowRight,
  Cpu,
  Shirt,
  Home as HomeIcon,
  BookOpen,
  Watch,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Flame,
  Star,
  Tag,
} from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { Link } from '@/lib/router';
import { ProductCard } from '@/components/ProductCard';
import { CATEGORY_INFO } from '@/data/demoData';
import { formatINR } from '@/lib/inventory';

const ICONS: Record<string, typeof Cpu> = {
  Cpu,
  Shirt,
  Home: HomeIcon,
  BookOpen,
  Watch,
};

export function Home() {
  const { products } = useStore();
  const featured = products.filter((p) => p.featured).slice(0, 4);
  const trending = products.filter((p) => p.trending).slice(0, 4);
  const bestSellers = products.filter((p) => p.bestSeller).slice(0, 4);
  const offers = products.filter((p) => p.specialOffer).slice(0, 8);
  const hero = featured[0] ?? products[0];

  return (
    <div className="bg-ink-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="container-app relative py-12 md:py-20">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div className="animate-slide-up">
              <span className="badge bg-white/15 text-white backdrop-blur">
                <Sparkles size={12} /> AI-assisted shopping
              </span>
              <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
                Smart shopping,<br />smarter inventory.
              </h1>
              <p className="mt-4 max-w-md text-brand-50">
                Discover great products, get instant help from our AI assistant, and manage inventory with intelligent insights — all in one place.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/products" className="btn-accent">
                  Shop Now <ArrowRight size={16} />
                </Link>
                <Link to="/categories" className="btn border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/20">
                  Browse Categories
                </Link>
              </div>
              <div className="mt-8 flex gap-6 text-sm">
                <div>
                  <p className="text-2xl font-bold">{products.length}+</p>
                  <p className="text-brand-100">Products</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-brand-100">Categories</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">4.5★</p>
                  <p className="text-brand-100">Avg rating</p>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="overflow-hidden rounded-2xl shadow-2xl">
                  <img src={hero.image} alt={hero.name} className="aspect-[4/3] w-full object-cover" />
                </div>
                <div className="absolute -bottom-5 -left-5 rounded-xl bg-white p-4 text-ink-900 shadow-xl">
                  <p className="text-xs text-ink-500">Featured</p>
                  <p className="text-sm font-semibold">{hero.name}</p>
                  <p className="text-lg font-bold text-brand-700">{formatINR(hero.price)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="container-app -mt-8 relative z-10">
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card md:grid-cols-4 md:gap-4 md:p-6">
          {[
            { icon: Truck, title: 'Free Delivery', desc: 'On orders over ₹999' },
            { icon: ShieldCheck, title: 'Secure', desc: 'Safe checkout (demo)' },
            { icon: RotateCcw, title: '7-Day Returns', desc: 'Easy return policy' },
            { icon: Sparkles, title: 'AI Assistant', desc: '24/7 shopping help' },
          ].map((b) => (
            <div key={b.title} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <b.icon size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-800">{b.title}</p>
                <p className="text-xs text-ink-500">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-app py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">Shop by Category</h2>
            <p className="text-sm text-ink-500">Find exactly what you're looking for</p>
          </div>
          <Link to="/categories" className="text-sm font-medium text-brand-700 hover:text-brand-800">
            View all <ArrowRight size={14} className="inline" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {CATEGORY_INFO.map((cat) => {
            const Icon = ICONS[cat.icon] ?? Cpu;
            const count = products.filter((p) => p.category === cat.name).length;
            return (
              <Link
                key={cat.name}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="group card flex flex-col items-center p-5 text-center transition hover:border-brand-300 hover:shadow-card-hover"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon size={26} />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-ink-800">{cat.name}</h3>
                <p className="mt-0.5 text-xs text-ink-500">{count} items</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      <Section title="Featured Products" icon={<Star size={20} />} products={featured} viewAll="/products" />

      {/* Special offers banner */}
      <section className="container-app py-4">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-accent-500 to-accent-400 p-6 md:p-8">
          <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-ink-900">
              <span className="badge bg-ink-900/10 text-ink-900">
                <Tag size={12} /> Limited time
              </span>
              <h2 className="mt-3 text-2xl font-bold md:text-3xl">Special Offers</h2>
              <p className="mt-1 text-sm text-ink-800">Save up to 40% on selected items. Grab them before they're gone.</p>
            </div>
            <Link to="/products?filter=offers" className="btn bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-800">
              Shop Deals <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Offers grid */}
      <section className="container-app py-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {offers.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Trending */}
      <Section title="Trending Now" icon={<Flame size={20} />} products={trending} viewAll="/products" />

      {/* Best sellers */}
      <Section title="Best Sellers" icon={<Star size={20} />} products={bestSellers} viewAll="/products" />
    </div>
  );
}

function Section({
  title,
  icon,
  products,
  viewAll,
}: {
  title: string;
  icon: React.ReactNode;
  products: { id: string }[];
  viewAll: string;
}) {
  const { products: all } = useStore();
  const items = products
    .map((p) => all.find((pp) => pp.id === p.id))
    .filter(Boolean) as typeof all;
  if (items.length === 0) return null;
  return (
    <section className="container-app py-8">
      <div className="mb-6 flex items-end justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            {icon}
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-900">{title}</h2>
          </div>
        </div>
        <Link to={viewAll} className="text-sm font-medium text-brand-700 hover:text-brand-800">
          View all <ArrowRight size={14} className="inline" />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
