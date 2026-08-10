import { Sparkles, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from '@/lib/router';
import { CATEGORIES } from '@/types';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-100 bg-white">
      <div className="container-app py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Sparkles size={18} />
              </div>
              <span className="font-display text-lg font-bold text-ink-900">ShopSense</span>
            </div>
            <p className="mt-3 text-sm text-ink-500">
              AI-assisted shopping and inventory management. A college project prototype built with demo data.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink-800">Shop</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><Link to="/products" className="hover:text-brand-700">All Products</Link></li>
              <li><Link to="/categories" className="hover:text-brand-700">Categories</Link></li>
              {CATEGORIES.slice(0, 3).map((c) => (
                <li key={c}>
                  <Link to={`/products?category=${encodeURIComponent(c)}`} className="hover:text-brand-700">{c}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink-800">Account</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><Link to="/orders" className="hover:text-brand-700">My Orders</Link></li>
              <li><Link to="/cart" className="hover:text-brand-700">Cart</Link></li>
              <li><Link to="/admin" className="hover:text-brand-700">Admin Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ink-800">Contact</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li className="flex items-center gap-2"><Mail size={14} /> support@shopsense.demo</li>
              <li className="flex items-center gap-2"><Phone size={14} /> 1800-123-4567</li>
              <li className="flex items-center gap-2"><MapPin size={14} /> Bengaluru, India</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-ink-100 pt-6 text-center text-xs text-ink-400">
          © {new Date().getFullYear()} ShopSense. Prototype for educational use. Not a real store.
        </div>
      </div>
    </footer>
  );
}
