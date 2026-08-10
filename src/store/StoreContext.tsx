import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { CartItem, Order, OrderStatus, Product } from '@/types';
import { PRODUCTS, SEED_ORDERS } from '@/data/demoData';

const STORAGE_KEYS = {
  products: 'shopsense.products',
  cart: 'shopsense.cart',
  orders: 'shopsense.orders',
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

export interface NewProductInput {
  name: string;
  category: Product['category'];
  price: number;
  stock: number;
  reorderLevel: number;
  description: string;
  rating: number;
  image: string;
  specs?: Record<string, string>;
  oldPrice?: number;
}

interface StoreContextValue {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  // cart
  addToCart: (productId: string, quantity?: number) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  // orders
  placeOrder: (info: {
    customerName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
    paymentMethod: string;
  }) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  // product admin
  addProduct: (input: NewProductInput) => void;
  updateProduct: (id: string, input: Partial<NewProductInput>) => void;
  deleteProduct: (id: string) => void;
  resetData: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() =>
    load(STORAGE_KEYS.products, PRODUCTS),
  );
  const [cart, setCart] = useState<CartItem[]>(() =>
    load(STORAGE_KEYS.cart, []),
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    load(STORAGE_KEYS.orders, SEED_ORDERS),
  );

  useEffect(() => save(STORAGE_KEYS.products, products), [products]);
  useEffect(() => save(STORAGE_KEYS.cart, cart), [cart]);
  useEffect(() => save(STORAGE_KEYS.orders, orders), [orders]);

  const addToCart = useCallback((productId: string, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        );
      }
      return [...prev, { productId, quantity }];
    });
  }, []);

  const updateCartQty = useCallback((productId: string, quantity: number) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const placeOrder: StoreContextValue['placeOrder'] = useCallback(
    (info) => {
      const orderItems = cart.map((ci) => {
        const p = products.find((pp) => pp.id === ci.productId)!;
        return {
          productId: ci.productId,
          name: p.name,
          price: p.price,
          quantity: ci.quantity,
          image: p.image,
        };
      });
      const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
      const deliveryCharge = subtotal > 999 ? 0 : 49;
      const order: Order = {
        id: `ORD-${1000 + orders.length + 1}`,
        items: orderItems,
        subtotal,
        deliveryCharge,
        total: subtotal + deliveryCharge,
        ...info,
        status: 'Placed',
        createdAt: new Date().toISOString(),
      };
      setOrders((prev) => [order, ...prev]);
      // decrement stock
      setProducts((prev) =>
        prev.map((p) => {
          const item = cart.find((c) => c.productId === p.id);
          if (!item) return p;
          return { ...p, stock: Math.max(0, p.stock - item.quantity) };
        }),
      );
      setCart([]);
      return order;
    },
    [cart, products, orders.length],
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
      );
    },
    [],
  );

  const addProduct = useCallback((input: NewProductInput) => {
    setProducts((prev) => {
      const id = `p${prev.length + 1}-${Date.now().toString(36).slice(-4)}`;
      const product: Product = {
        id,
        ...input,
        ratingCount: 0,
        specs: input.specs ?? {},
      };
      return [product, ...prev];
    });
  }, []);

  const updateProduct = useCallback(
    (id: string, input: Partial<NewProductInput>) => {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...input } : p)),
      );
    },
    [],
  );

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const resetData = useCallback(() => {
    setProducts(PRODUCTS);
    setOrders(SEED_ORDERS);
    setCart([]);
  }, []);

  const cartCount = useMemo(
    () => cart.reduce((s, i) => s + i.quantity, 0),
    [cart],
  );

  const value: StoreContextValue = {
    products,
    cart,
    orders,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    cartCount,
    placeOrder,
    updateOrderStatus,
    addProduct,
    updateProduct,
    deleteProduct,
    resetData,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
