import { RouterProvider, useRouter } from '@/lib/router';
import { StoreProvider, useStore } from '@/store/StoreContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ShoppingAssistant } from '@/components/ShoppingAssistant';
import { Home } from '@/pages/Home';
import { Products } from '@/pages/Products';
import { ProductDetails } from '@/pages/ProductDetails';
import { Cart } from '@/pages/Cart';
import { Checkout } from '@/pages/Checkout';
import { Orders } from '@/pages/Orders';
import { Categories } from '@/pages/Categories';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { ProductManagement } from '@/pages/admin/ProductManagement';
import { InventoryManagement } from '@/pages/admin/InventoryManagement';
import { OrderManagement } from '@/pages/admin/OrderManagement';
import { SalesAnalytics } from '@/pages/admin/SalesAnalytics';
import ContentIntelligence from '@/pages/admin/ContentIntelligence';
import ContentPageDetails from '@/pages/admin/ContentPageDetails';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Profile from '@/pages/Profile';
import AdminLogin from '@/pages/admin/AdminLogin';

function Routes() {
  const { path } = useRouter();
  const base = path.split('?')[0];
  const { admin } = useStore();

  // Admin routes — no storefront chrome
  if (base.startsWith('/admin')) {
    const { navigate } = useRouter();
    if (!admin && base !== '/admin/login') {
      navigate('/admin/login');
      return null;
    }

    if (base === '/admin') return <AdminDashboard />;
    if (base === '/admin/products') return <ProductManagement />;
    if (base === '/admin/inventory') return <InventoryManagement />;
    if (base === '/admin/orders') return <OrderManagement />;
    if (base === '/admin/analytics') return <SalesAnalytics />;
    if (base === '/admin/content-intelligence') return <ContentIntelligence />;
    if (base.startsWith('/admin/content-intelligence/')) return <ContentPageDetails />;
    if (base === '/admin/login') return <AdminLogin />;
  }

  // Product details
  const productMatch = base.match(/^\/product\/(.+)$/);
  if (productMatch) return <ProductDetails id={productMatch[1]} />;

  let page: React.ReactNode;
  if (base === '/' || base === '') page = <Home />;
  else if (base === '/products') page = <Products />;
  else if (base === '/categories') page = <Categories />;
  else if (base === '/cart') page = <Cart />;
  else if (base === '/checkout') page = <Checkout />;
  else if (base === '/orders') page = <Orders />;
  else if (base === '/login') page = <Login />;
  else if (base === '/register') page = <Register />;
  else if (base === '/profile') page = <Profile />;
  else page = <NotFound />;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{page}</main>
      <Footer />
      <ShoppingAssistant />
    </div>
  );
}

function NotFound() {
  return (
    <div className="container-app py-20 text-center">
      <h1 className="text-3xl font-bold text-ink-900">404</h1>
      <p className="mt-2 text-ink-500">Page not found.</p>
      <a href="#/" className="btn-primary mt-6 inline-flex">Go Home</a>
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <StoreProvider>
        <Routes />
      </StoreProvider>
    </RouterProvider>
  );
}
