import { useState } from 'react';
import {
  Search,
  ShoppingBag,
  User,
  Menu,
  X,
  Package,
  LayoutDashboard,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '@/store/StoreContext';
import { Link, useRouter } from '@/lib/router';
import { CATEGORIES } from '@/types';

export function Navbar() {
  const { cartCount } = useStore();
  const { currentUser, logout, admin } = useStore();
  const { path, navigate } = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/products?q=${encodeURIComponent(query)}`);
    setOpen(false);
  };

  const navLink = (to: string, label: string) => {
    const active = path === to || (to !== '/' && path.startsWith(to));
    return (
      <Link
        to={to}
        onClick={() => setOpen(false)}
        className={`text-sm font-medium transition-colors ${
          active ? 'text-brand-700' : 'text-ink-600 hover:text-ink-900'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur-md">
      <div className="container-app">
        <div className="flex h-16 items-center gap-4">
          <button
            className="lg:hidden text-ink-600"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Sparkles size={20} />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-ink-900">
              ShopSense
            </span>
          </Link>

          <form
            onSubmit={submitSearch}
            className="relative hidden flex-1 md:block"
          >
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products, brands and more..."
              className="input pl-10"
              aria-label="Search products"
            />
          </form>

          <nav className="ml-auto hidden items-center gap-6 lg:flex">
            {navLink('/', 'Home')}
            {navLink('/products', 'Products')}
            {navLink('/categories', 'Categories')}
            {navLink('/orders', 'My Orders')}
            {!currentUser && navLink('/login', 'Login')}
            {!currentUser && navLink('/register', 'Register')}
            {currentUser && (
              <button onClick={() => logout()} className="text-sm font-medium text-ink-600 hover:text-ink-900">Logout</button>
            )}
            {admin && navLink('/admin', 'Admin')}
          </nav>

          <div className="ml-auto flex items-center gap-1 lg:ml-2">
            <Link
              to="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900"
              aria-label="Cart"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              to="/profile"
              className="hidden h-10 w-10 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100 hover:text-ink-900 sm:flex"
              aria-label="Account"
            >
              <User size={20} />
            </Link>
          </div>
        </div>

        <form onSubmit={submitSearch} className="relative pb-3 md:hidden">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="input pl-10"
            aria-label="Search products"
          />
        </form>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-white lg:hidden">
          <nav className="container-app flex flex-col gap-1 py-3">
            <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
              <Sparkles size={16} /> Home
            </Link>
            <Link to="/products" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
              <Package size={16} /> Products
            </Link>
            <Link to="/categories" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
              <LayoutDashboard size={16} /> Categories
            </Link>
            <Link to="/orders" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
              <Package size={16} /> My Orders
            </Link>
            {admin ? (
              <Link to="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-brand-700 hover:bg-brand-50">
                <ShieldCheck size={16} /> Admin Dashboard
              </Link>
            ) : (
              <Link to="/admin/login" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50">
                <ShieldCheck size={16} /> Admin
              </Link>
            )}
            <div className="mt-2 border-t border-ink-100 pt-2">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Categories</p>
              {CATEGORIES.map((c) => (
                <Link key={c} to={`/products?category=${encodeURIComponent(c)}`} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm text-ink-600 hover:bg-ink-50">
                  {c}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
