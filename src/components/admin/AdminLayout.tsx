import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ClipboardList,
  BarChart3,
  Sparkles,
  ShieldCheck,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react';
import { Link, useRouter } from '@/lib/router';
import { useStore } from '@/store/StoreContext';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/content-intelligence', label: 'Content Intelligence', icon: Sparkles },
];

export function AdminLayout({
  children,
  title,
  action,
}: {
  children: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  const { path } = useRouter();
  const [open, setOpen] = useState(false);
  const { admin, adminLogout } = useStore();

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-ink-100 bg-white transition-transform lg:static lg:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center gap-2 border-b border-ink-100 px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-white">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-ink-900">ShopSense</p>
              <p className="text-[11px] text-ink-500">Admin Console</p>
            </div>
          </div>
          <nav className="space-y-1 p-3">
            {NAV.map((n) => {
              const active = path === n.to || (n.to !== '/admin' && path.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                  }`}
                >
                  <n.icon size={18} />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 border-t border-ink-100 p-3">
            <Link to="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-500 hover:bg-ink-50">
              <ArrowLeft size={16} /> Back to Store
            </Link>
          </div>
        </aside>

        {open && (
          <div className="fixed inset-0 z-30 bg-ink-900/40 lg:hidden" onClick={() => setOpen(false)} />
        )}

        {/* Main */}
        <div className="flex-1 lg:ml-0">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-100 bg-white/90 px-4 backdrop-blur lg:px-8">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden text-ink-600"
              aria-label="Menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className="text-lg font-bold text-ink-900">{title}</h1>
            <div className="ml-auto flex items-center gap-3">
              {action}
              {admin && (
                <div className="flex items-center gap-3">
                  <div className="hidden flex-col text-right text-xs sm:flex">
                    <span className="font-medium text-ink-800">{admin.name ?? 'Admin'}</span>
                    <span className="text-ink-500">{admin.email}</span>
                  </div>
                  <button onClick={() => adminLogout()} className="text-sm text-ink-600">Logout</button>
                </div>
              )}
              <span className="hidden items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 sm:flex">
                <Sparkles size={12} /> Admin Mode
              </span>
            </div>
          </header>
          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
