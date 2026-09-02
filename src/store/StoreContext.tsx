import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Address, CartItem, Order, OrderStatus, PaymentMethod, Product } from '@/types';
import { PRODUCTS } from '@/data/demoData';
import {
  createOrder,
  createProduct,
  deleteProduct as apiDeleteProduct,
  getOrders,
  getProducts,
  updateOrderStatus as apiUpdateOrderStatus,
  updateProduct as apiUpdateProduct,
  type ApiOrder,
  type ApiProduct,
  type ApiAddress,
  getAddresses,
  updateUser,
  createAddress as apiCreateAddress,
  updateAddress as apiUpdateAddress,
  deleteAddress as apiDeleteAddress,
  setDefaultAddress as apiSetDefaultAddress,
} from '@/services/api';
import { registerUser, loginUser, meUser, logoutUser, loginAdmin, meAdmin, logoutAdmin } from '@/services/api';

const STORAGE_KEYS = {
  cart: 'shopsense_cart_guest',
} as const;

function cartKey(userId?: string | null): string { return userId ? `shopsense_cart_${userId}` : STORAGE_KEYS.cart; }

function apiProductToProduct(product: ApiProduct): Product {
  return {
    id: product.id,
    name: product.name,
    category: product.category as Product['category'],
    price: product.price,
    oldPrice: product.oldPrice,
    stock: product.stock,
    reorderLevel: product.reorderLevel,
    rating: product.rating,
    ratingCount: product.ratingCount,
    image: product.image,
    description: product.description,
    specs: product.specs ?? {},
    featured: product.featured,
    trending: product.trending,
    bestSeller: product.bestSeller,
    specialOffer: product.specialOffer,
  };
}

function apiAddressToAddress(address: ApiAddress): Address {
  return { id: address._id, userId: address.userId, label: address.label, street: address.street, city: address.city, state: address.state, pincode: address.pincode, isDefault: address.isDefault };
}

function apiOrderToOrder(order: ApiOrder): Order {
  return {
    id: order.orderId,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    })),
    subtotal: order.totalAmount,
    deliveryCharge: 0,
    total: order.totalAmount,
    customerName: order.customerName,
    email: order.customerEmail,
    phone: order.customerPhone ?? '',
    address: order.address ?? '',
    city: order.city ?? '',
    pincode: order.pincode ?? '',
    state: order.shippingAddress?.state ?? order.state ?? '',
    recipient: order.recipient,
    paymentMethod: order.paymentMethod ?? 'Cash on Delivery',
    paymentStatus: order.paymentStatus ?? 'Pending',
    status: order.status,
    createdAt: order.orderDate,
  };
}

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
  currentUser?: { id: string; fullName: string; email: string; phone?: string } | null;
  addresses: Address[];
  refreshAddresses: () => Promise<void>;
  saveAddress: (input: Omit<Address, 'id' | 'userId'>) => Promise<void>;
  editAddress: (id: string, input: Omit<Address, 'id' | 'userId'>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  makeDefaultAddress: (id: string) => Promise<void>;
  updateProfile: (payload: { fullName: string; email: string; phone?: string }) => Promise<void>;
  admin?: { id: string; email: string; name?: string } | null;
  cart: CartItem[];
  orders: Order[];
  loading: boolean;
  apiError: string | null;
  cartMessage: string | null;
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
    state: string;
    pincode: string;
    addressLabel?: string;
    recipient?: { name: string; phone: string; email?: string };
    paymentMethod: PaymentMethod;
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  // product admin
  addProduct: (input: NewProductInput) => Promise<void>;
  updateProduct: (id: string, input: Partial<NewProductInput>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  resetData: () => void;
  // auth
  register: (payload: { fullName: string; email: string; phone?: string; password: string }) => Promise<void>;
  login: (payload: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  adminLogin: (payload: { email: string; password: string }) => Promise<void>;
  adminLogout: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>(() => load(STORAGE_KEYS.cart, []));
  const [orders, setOrders] = useState<Order[]>(() => []);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; fullName: string; email: string; phone?: string } | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [admin, setAdmin] = useState<{ id: string; email: string; name?: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadApiData() {
      setLoading(true);
      setApiError(null);

      try {
        const apiProducts = await getProducts();

        if (!cancelled) {
          setProducts(apiProducts.map(apiProductToProduct));
        }
      } catch (error) {
        if (!cancelled) {
          setApiError(error instanceof Error ? error.message : 'API error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    async function loadAuth() {
      try {
        const me = await meUser().catch(() => null);
        if (me) {
          const user = { id: (me as any).id, fullName: (me as any).fullName, email: (me as any).email, phone: (me as any).phone };
          setCurrentUser(user);
          setCart(load(cartKey(user.id), []));
          const apiOrders = await getOrders();
          if (!cancelled) setOrders(apiOrders.map(apiOrderToOrder));
          const apiAddresses = await getAddresses();
          if (!cancelled) setAddresses(apiAddresses.map(apiAddressToAddress));
        }
      } catch {}

      try {
        const adm = await meAdmin().catch(() => null);
        if (adm) {
          setAdmin({ id: (adm as any).id, email: (adm as any).email, name: (adm as any).name });
          const apiOrders = await getOrders();
          if (!cancelled) setOrders(apiOrders.map(apiOrderToOrder));
        }
      } catch {}
    }

    loadAuth();

    loadApiData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => save(cartKey(currentUser?.id), cart), [cart, currentUser?.id]);

  const sanitizeCart = useCallback(
    (currentCart: CartItem[], availableProducts: Product[]) => {
      let removed = false;
      let adjusted = false;

      const validItems = currentCart
        .map((item) => {
          const product = availableProducts.find((p) => p.id === item.productId);
          if (!product || product.stock <= 0) {
            removed = true;
            return null;
          }

          if (item.quantity > product.stock) {
            adjusted = true;
            return { productId: item.productId, quantity: product.stock };
          }

          return item;
        })
        .filter((item): item is CartItem => item !== null);

      if (removed) {
        setCartMessage('Some unavailable products were removed from your cart.');
      } else if (adjusted) {
        setCartMessage('Some quantities were adjusted due to updated stock availability.');
      }

      return validItems;
    },
    [],
  );

  useEffect(() => {
    if (products.length === 0 || cart.length === 0) return;
    const validated = sanitizeCart(cart, products);
    const sameCart =
      validated.length === cart.length &&
      validated.every((item, index) => item.productId === cart[index].productId && item.quantity === cart[index].quantity);
    if (!sameCart) {
      setCart(validated);
    }
  }, [products, cart, sanitizeCart]);

  const addToCart = useCallback(
    (productId: string, quantity = 1) => {
      const product = products.find((p) => p.id === productId);
      if (!product) {
        setApiError('Product is no longer available.');
        return;
      }
      if (product.stock <= 0) {
        setApiError('This product is currently out of stock.');
        return;
      }

      setCart((prev) => {
        const existing = prev.find((i) => i.productId === productId);
        const maxQuantity = product.stock;
        if (existing) {
          const nextQty = Math.min(existing.quantity + quantity, maxQuantity);
          return prev.map((i) =>
            i.productId === productId ? { ...i, quantity: nextQty } : i,
          );
        }

        return [{ productId, quantity: Math.min(quantity, maxQuantity) }, ...prev];
      });
      setCartMessage('Added to cart');
    },
    [products],
  );

  const updateCartQty = useCallback(
    (productId: string, quantity: number) => {
      setApiError(null);
      setCartMessage(null);

      const product = products.find((p) => p.id === productId);
      if (product && quantity > product.stock) {
        quantity = product.stock;
      }

      setCart((prev) =>
        quantity <= 0
          ? prev.filter((i) => i.productId !== productId)
          : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
      );
    },
    [products],
  );

  const removeFromCart = useCallback((productId: string) => {
    setApiError(null);
    setCartMessage(null);
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setApiError(null);
    setCart([]);
    setCartMessage(null);
    try {
      localStorage.removeItem(cartKey(currentUser?.id));
    } catch {
      /* ignore */
    }
  }, [currentUser?.id]);

  const placeOrder: StoreContextValue['placeOrder'] = useCallback(
    async (info) => {
      setApiError(null);
      setCartMessage(null);

      const refreshedProducts = await getProducts();
      const currentProducts = refreshedProducts.map(apiProductToProduct);
      setProducts(currentProducts);

      const validatedCart = sanitizeCart(cart, currentProducts);
      const cartChanged =
        validatedCart.length !== cart.length ||
        validatedCart.some(
          (item, index) =>
            !cart[index] ||
            cart[index].productId !== item.productId ||
            cart[index].quantity !== item.quantity,
        );

      if (cartChanged) {
        setCart(validatedCart);
      }

      if (validatedCart.length === 0) {
        setCart([]);
        const message = 'Your cart is empty or contains unavailable products.';
        setApiError(message);
        throw new Error(message);
      }

      const orderItems = validatedCart.map((ci) => {
        const product = currentProducts.find((p) => p.id === ci.productId);
        if (!product) {
          throw new Error(`Product ${ci.productId} is unavailable.`);
        }
        if (ci.quantity > product.stock) {
          throw new Error(`Only ${product.stock} items of ${product.name} are available.`);
        }
        return { productId: ci.productId, quantity: ci.quantity };
      });

      const payload = {
        customerName: info.customerName,
        customerEmail: info.email,
        customerPhone: info.phone,
        address: info.address,
        city: info.city,
        state: info.state,
        pincode: info.pincode,
        addressLabel: info.addressLabel,
        recipient: info.recipient,
        paymentMethod: info.paymentMethod,
        items: orderItems,
      };

      try {
        const apiOrder = await createOrder(payload);
        const latestProducts = await getProducts();
        setProducts(latestProducts.map(apiProductToProduct));

        const order = apiOrderToOrder(apiOrder);
        const orderWithContext: Order = {
          ...order,
          customerName: info.customerName,
          email: info.email,
          phone: info.phone,
          address: info.address,
          city: info.city,
          pincode: info.pincode,
          state: info.state,
          recipient: info.recipient,
          paymentMethod: info.paymentMethod,
          subtotal: apiOrder.totalAmount,
          deliveryCharge: 0,
          total: apiOrder.totalAmount,
        };

        setOrders((prev) => [orderWithContext, ...prev]);
        setCart([]);
        try {
          localStorage.removeItem(cartKey(currentUser?.id));
        } catch {
          /* ignore */
        }
        setCartMessage('Order placed successfully.');
        return orderWithContext;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not place order';
        setApiError(message);
        throw error;
      }
    },
    [cart, currentUser?.id, sanitizeCart],
  );

  const refreshAddresses = useCallback(async () => {
    const next = await getAddresses();
    setAddresses(next.map(apiAddressToAddress));
  }, []);

  const saveAddress = useCallback(async (input: Omit<Address, 'id' | 'userId'>) => {
    await apiCreateAddress(input);
    await refreshAddresses();
  }, [refreshAddresses]);

  const editAddress = useCallback(async (id: string, input: Omit<Address, 'id' | 'userId'>) => {
    await apiUpdateAddress(id, input);
    await refreshAddresses();
  }, [refreshAddresses]);

  const removeAddress = useCallback(async (id: string) => {
    await apiDeleteAddress(id);
    await refreshAddresses();
  }, [refreshAddresses]);

  const makeDefaultAddress = useCallback(async (id: string) => {
    const next = await apiSetDefaultAddress(id);
    setAddresses(next.map(apiAddressToAddress));
  }, []);

  const updateProfile = useCallback(async (payload: { fullName: string; email: string; phone?: string }) => {
    const updated = await updateUser(payload);
    setCurrentUser(updated);
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      try {
        const apiOrder = await apiUpdateOrderStatus(orderId, status);
        const updated = apiOrderToOrder(apiOrder);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...updated, status } : o)),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not update order status';
        setApiError(message);
      }
    },
    [],
  );

  const addProduct = useCallback(async (input: NewProductInput) => {
    try {
      const created = await createProduct(input);
      const product = apiProductToProduct(created);
      setProducts((prev) => [product, ...prev]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not add product';
      setApiError(message);
    }
  }, []);

  const updateProduct = useCallback(
    async (id: string, input: Partial<NewProductInput>) => {
      try {
        const updated = await apiUpdateProduct(id, input);
        const mapped = apiProductToProduct(updated);
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? mapped : p)),
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not update product';
        setApiError(message);
      }
    },
    [],
  );

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await apiDeleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete product';
      setApiError(message);
    }
  }, []);

  const resetData = useCallback(() => {
    setProducts(PRODUCTS);
    setOrders([]);
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
    loading,
    apiError,
    cartMessage,
    currentUser,
    addresses,
    refreshAddresses,
    saveAddress,
    editAddress,
    removeAddress,
    makeDefaultAddress,
    updateProfile,
    admin,
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
    register: async (payload) => {
      try {
        await registerUser(payload);
        const me = await meUser();
        setCurrentUser({ id: (me as any).id, fullName: (me as any).fullName, email: (me as any).email, phone: (me as any).phone });
        const apiOrders = await getOrders();
        setOrders(apiOrders.map(apiOrderToOrder));
        setCart(load(cartKey((me as any).id), []));
        const apiAddresses = await getAddresses();
        setAddresses(apiAddresses.map(apiAddressToAddress));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        setApiError(message);
        throw err;
      }
    },
    login: async (payload) => {
      try {
        await loginUser(payload);
        const me = await meUser();
        setCurrentUser({ id: (me as any).id, fullName: (me as any).fullName, email: (me as any).email, phone: (me as any).phone });
        const apiOrders = await getOrders();
        setOrders(apiOrders.map(apiOrderToOrder));
        setCart(load(cartKey((me as any).id), []));
        const apiAddresses = await getAddresses();
        setAddresses(apiAddresses.map(apiAddressToAddress));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setApiError(message);
        throw err;
      }
    },
    logout: async () => {
      try {
        await logoutUser();
      } finally {
        setCurrentUser(null);
        setOrders([]);
        setAddresses([]);
        setCart(load(STORAGE_KEYS.cart, []));
      }
    },
    adminLogin: async (payload) => {
      try {
        await loginAdmin(payload);
        const adm = await meAdmin();
        setAdmin({ id: (adm as any).id, email: (adm as any).email, name: (adm as any).name });
        const apiOrders = await getOrders();
        setOrders(apiOrders.map(apiOrderToOrder));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Admin login failed';
        setApiError(message);
        throw err;
      }
    },
    adminLogout: async () => {
      try {
        await logoutAdmin();
      } finally {
        setAdmin(null);
      }
    },
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
