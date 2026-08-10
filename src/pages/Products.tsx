import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, X, Search, Package } from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { useRouter } from '@/lib/router';
import { ProductCard } from '@/components/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { CATEGORIES } from '@/types';
import { getStockStatus } from '@/lib/inventory';

type SortKey = 'popular' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

export function Products() {
  const { products } = useStore();
  const { path } = useRouter();

  const params = useMemo(() => {
    const query = path.split('?')[1] ?? '';
    return new URLSearchParams(query);
  }, [path]);

  const initialQ = params.get('q') ?? '';
  const initialCat = params.get('category') ?? '';
  const filterParam = params.get('filter');

  const [search, setSearch] = useState(initialQ);
  const [category, setCategory] = useState(initialCat);
  const [maxPrice, setMaxPrice] = useState<number>(60000);
  const [minRating, setMinRating] = useState<number>(0);
  const [sort, setSort] = useState<SortKey>('popular');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setSearch(initialQ);
    setCategory(initialCat);
  }, [initialQ, initialCat]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }
    if (category) list = list.filter((p) => p.category === category);
    if (filterParam === 'offers') list = list.filter((p) => p.specialOffer);
    list = list.filter((p) => p.price <= maxPrice);
    list = list.filter((p) => p.rating >= minRating);

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        list.reverse();
        break;
      default:
        list.sort(
          (a, b) =>
            b.rating * 100 + b.ratingCount / 50 - (a.rating * 100 + a.ratingCount / 50),
        );
    }
    return list;
  }, [products, search, category, maxPrice, minRating, sort, filterParam]);

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setMaxPrice(60000);
    setMinRating(0);
    setSort('popular');
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-800">Categories</h3>
        <div className="space-y-1.5">
          <button
            onClick={() => setCategory('')}
            className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${!category ? 'bg-brand-50 font-medium text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`}
          >
            All Categories
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${category === c ? 'bg-brand-50 font-medium text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-800">Max Price</h3>
        <input
          type="range"
          min={500}
          max={60000}
          step={500}
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-brand-600"
        />
        <p className="mt-1 text-xs text-ink-500">Up to ₹{maxPrice.toLocaleString('en-IN')}</p>
      </div>
      <div>
        <h3 className="mb-3 text-sm font-semibold text-ink-800">Minimum Rating</h3>
        <div className="space-y-1.5">
          {[0, 3, 4, 4.5].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(r)}
              className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm ${minRating === r ? 'bg-brand-50 font-medium text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`}
            >
              {r === 0 ? 'All ratings' : `${r}★ & above`}
            </button>
          ))}
        </div>
      </div>
      <button onClick={clearFilters} className="btn-ghost w-full justify-center">
        Clear all filters
      </button>
    </div>
  );

  return (
    <div className="container-app py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-900">
          {category || filterParam === 'offers' ? (filterParam === 'offers' ? 'Special Offers' : category) : 'All Products'}
        </h1>
        <p className="text-sm text-ink-500">{filtered.length} product(s) found</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input pl-10"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="input w-auto"
        >
          <option value="popular">Sort: Popularity</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Rating: High to Low</option>
          <option value="newest">Newest</option>
        </select>
        <button
          onClick={() => setShowFilters(true)}
          className="btn-outline lg:hidden"
        >
          <SlidersHorizontal size={16} /> Filters
        </button>
      </div>

      <div className="flex gap-6">
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <div className="card sticky top-20 p-5">
            <FilterPanel />
          </div>
        </aside>

        <div className="flex-1">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Package size={26} />}
              title="No products found"
              description="Try adjusting your search or filters to see more results."
              action={
                <button onClick={clearFilters} className="btn-primary">
                  Clear filters
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-5 shadow-xl animate-slide-in-right">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="rounded-lg p-1.5 hover:bg-ink-100">
                <X size={20} />
              </button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}
    </div>
  );
}
