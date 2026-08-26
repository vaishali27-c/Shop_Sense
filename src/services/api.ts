const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const googleOAuthStartUrl = `${API_BASE_URL}/google/oauth/start`;

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
    ...init,
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    throw new Error(errorPayload.message ?? `API request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

function googleQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  return query.toString();
}

export type ApiProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  stock: number;
  reorderLevel: number;
  rating: number;
  ratingCount: number;
  description: string;
  specs: Record<string, string>;
  image: string;
  featured?: boolean;
  trending?: boolean;
  bestSeller?: boolean;
  specialOffer?: boolean;
};

export type ApiOrder = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  pincode: string;
  paymentMethod: 'Cash on Delivery' | 'Credit / Debit Card' | 'UPI / Wallet';
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  totalAmount: number;
  orderDate: string;
  status: 'Placed' | 'Confirmed' | 'Shipped' | 'Delivered';
};

export async function getProducts(): Promise<ApiProduct[]> {
  return apiRequest<ApiProduct[]>('/products');
}

export async function getProduct(productId: string): Promise<ApiProduct> {
  return apiRequest<ApiProduct>(`/products/${productId}`);
}

export async function createProduct(input: Partial<ApiProduct>): Promise<ApiProduct> {
  return apiRequest<ApiProduct>('/products', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateProduct(productId: string, input: Partial<ApiProduct>): Promise<ApiProduct> {
  return apiRequest<ApiProduct>(`/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteProduct(productId: string): Promise<void> {
  await apiRequest<void>(`/products/${productId}`, {
    method: 'DELETE',
  });
}

export async function getOrders(): Promise<ApiOrder[]> {
  return apiRequest<ApiOrder[]>('/orders');
}

export interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  pincode: string;
  paymentMethod: 'Cash on Delivery' | 'Credit / Debit Card' | 'UPI / Wallet';
  items: Array<{ productId: string; quantity: number }>;
}

export async function createOrder(input: CreateOrderInput): Promise<ApiOrder> {
  return apiRequest<ApiOrder>('/orders', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateOrderStatus(orderId: string, status: string): Promise<ApiOrder> {
  return apiRequest<ApiOrder>(`/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export async function getInventory(): Promise<unknown[]> {
  return apiRequest<unknown[]>('/inventory');
}

export async function getAnalytics(): Promise<Record<string, unknown>> {
  return apiRequest<Record<string, unknown>>('/analytics/summary');
}

// Content Intelligence admin APIs
export async function getContentPages(q?: string, page = 1, limit = 20) {
  const qs = new URLSearchParams({ q: q ?? '', page: String(page), limit: String(limit) });
  return apiRequest(`/content-intelligence/pages?${qs.toString()}`);
}

export async function getContentPage(id: string) {
  return apiRequest(`/content-intelligence/pages/${encodeURIComponent(id)}`);
}

export async function getContentSummary() {
  return apiRequest('/content-intelligence/summary');
}

export async function seedContent() {
  return apiRequest('/content-intelligence/seed', { method: 'POST' });
}

export async function recalcContent() {
  return apiRequest('/content-intelligence/recalculate', { method: 'POST' });
}

// User authentication
export async function registerUser(payload: { fullName: string; email: string; phone?: string; password: string }) {
  return apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
}

export async function loginUser(payload: { email: string; password: string }) {
  return apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
}

export async function meUser() {
  return apiRequest('/auth/me');
}

export async function logoutUser() {
  return apiRequest('/auth/logout', { method: 'POST' });
}

// Admin auth (separate)
export async function loginAdmin(payload: { email: string; password: string }) {
  return apiRequest('/admin/auth/login', { method: 'POST', body: JSON.stringify(payload) });
}

export async function meAdmin() {
  return apiRequest('/admin/auth/me');
}

export async function logoutAdmin() {
  return apiRequest('/admin/auth/logout', { method: 'POST' });
}

export type GoogleStatus = {
  connected: boolean;
  googleAccount: { email: string } | null;
  selectedGscProperty: string | null;
  selectedGa4Property: string | null;
  status: 'connected' | 'disconnected' | 'error';
  lastError: string | null;
};

export type GoogleReportRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
  dimensions?: string[];
  metrics?: Record<string, number>;
};

export type Ga4DashboardSection = { rows: GoogleReportRow[]; error: string | null };
export type Ga4Dashboard = {
  property: string;
  dateRange: { startDate: string; endDate: string };
  overview: Ga4DashboardSection;
  traffic: Ga4DashboardSection;
  acquisition: Ga4DashboardSection;
  trafficAcquisition: Ga4DashboardSection;
  userAcquisition: Ga4DashboardSection;
  pages: Ga4DashboardSection;
  events: Ga4DashboardSection;
  keyEvents: Ga4DashboardSection;
  audience: Ga4DashboardSection;
  demographics: Ga4DashboardSection;
  technology: Ga4DashboardSection;
  geography: Ga4DashboardSection;
  landingPages: Ga4DashboardSection;
};

export type WebsiteScore = {
  current_score: number;
  predicted_score: number;
  issue: string;
  recommendation: string;
  priority: string;
  dateRange: { startDate: string; endDate: string };
  ga4_score: number;
  gsc_score: number;
  overall_score: number;
  ga4_metrics: { active_users: number; sessions: number; engaged_sessions: number; engagement_rate_pct: number; bounce_rate_pct: number };
  gsc_metrics: { search_ctr_pct: number; search_impressions: number; search_clicks: number; avg_search_position: number };
  feature_count: number;
  fallback_count: number;
  fallback_fields: string[];
  generated_at: string;
  ga4Property: string;
  gscProperty: string;
};

export async function getGoogleStatus() { return apiRequest<GoogleStatus>('/google/status'); }
export async function disconnectGoogle() { return apiRequest<void>('/google/disconnect', { method: 'POST' }); }
export async function saveGoogleSelection(selection: { gscProperty?: string; ga4Property?: string }) { return apiRequest('/google/selection', { method: 'PUT', body: JSON.stringify(selection) }); }
export async function getGscProperties() { return apiRequest<Array<{ siteUrl: string; permissionLevel: string }>>('/google/search-console/properties'); }
export async function getGa4Properties() { return apiRequest<Array<{ id: string; displayName: string; accountName: string }>>('/google/analytics/properties'); }
export async function getGscReport(params: { startDate?: string; endDate?: string; days?: number; dimensions?: string } = {}) { return apiRequest<{ rows: GoogleReportRow[]; property: string; dateRange: { startDate: string; endDate: string } }>(`/google/search-console/performance?${googleQuery(params)}`); }
export async function getGscPages(params: { startDate?: string; endDate?: string; days?: number } = {}) { return apiRequest<{ rows: GoogleReportRow[] }>(`/google/search-console/pages?${googleQuery({ ...params, dimensions: 'page' })}`); }
export async function getGscQueries(params: { startDate?: string; endDate?: string; days?: number } = {}) { return apiRequest<{ rows: GoogleReportRow[] }>(`/google/search-console/queries?${googleQuery({ ...params, dimensions: 'query' })}`); }
export async function getGa4Report(params: { startDate?: string; endDate?: string; days?: number; dimensions?: string; metrics?: string } = {}) { return apiRequest<{ rows: GoogleReportRow[]; property: string; dateRange: { startDate: string; endDate: string } }>(`/google/analytics/report?${googleQuery(params)}`); }
export async function getGa4Dashboard(params: { startDate?: string; endDate?: string; days?: number } = {}) { return apiRequest<Ga4Dashboard>(`/google/analytics/dashboard?${googleQuery(params)}`); }
export async function getWebsiteScore(params: { startDate?: string; endDate?: string; days?: number } = {}) { return apiRequest<WebsiteScore>(`/ml/website-score?${googleQuery(params)}`); }
