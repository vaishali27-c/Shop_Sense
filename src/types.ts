export type Category =
  | 'Electronics'
  | 'Fashion'
  | 'Home'
  | 'Books'
  | 'Accessories';

export const CATEGORIES: Category[] = [
  'Electronics',
  'Fashion',
  'Home',
  'Books',
  'Accessories',
];

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  oldPrice?: number;
  stock: number;
  reorderLevel: number;
  rating: number;
  ratingCount: number;
  image: string;
  description: string;
  specs: Record<string, string>;
  featured?: boolean;
  trending?: boolean;
  bestSeller?: boolean;
  specialOffer?: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export type PaymentMethod = 'Cash on Delivery' | 'Credit / Debit Card' | 'UPI / Wallet';

export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export type OrderStatus = 'Placed' | 'Confirmed' | 'Shipped' | 'Delivered';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  recipient?: { name: string; phone: string; email?: string };
  paymentMethod: PaymentMethod;
  paymentStatus: 'Pending' | 'Successful' | 'Failed';
  status: OrderStatus;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: Pick<Product, 'id' | 'name' | 'price' | 'image' | 'rating' | 'stock'>[];
  createdAt: string;
}
