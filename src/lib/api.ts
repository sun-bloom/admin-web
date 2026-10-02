import type {
  Product,
  ProductPayload,
  Order,
  SettingsData,
  DeliverySettingsData,
  DeliveryRegion,
  Category,
  Customer,
  AdminUser,
  Subcategory,
} from '@/types'

// Render Backend Production URL
const RENDER_BACKEND_URL = 'https://backend-api-bonr.onrender.com';
const RAW_ENV_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  ''
).trim();
const isBrowser = typeof window !== 'undefined';
const isProductionHost =
  isBrowser && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const pointsToLocalhost = /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(RAW_ENV_URL);

// In development, default to '' so requests go through the Vite '/api' proxy.
// In production on Cloudflare Pages, default to the Render backend URL.
export const API_BASE_URL = RAW_ENV_URL
  ? (isProductionHost && pointsToLocalhost ? RENDER_BACKEND_URL : RAW_ENV_URL)
  : (import.meta.env.DEV ? '' : RENDER_BACKEND_URL);

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const getAuthHeaders = (): Record<string, string> => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface AdminFetchOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  skipAuth?: boolean;
}

// In-flight GET request deduplication map to prevent cold-start storms
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Production-safe API fetcher for admin-web:
 * - 55s default timeout allows Render free-tier cold starts (~30-45s) to wake up cleanly.
 * - Exponential backoff retry (up to 2 retries, 3 attempts total) on network failures or 502/503/504 gateway responses.
 * - Never retries 4xx client errors (400, 401, 403, 404, 409).
 * - Always passes `cache: 'no-store'` and appends a `_t` timestamp to GET queries to guarantee fresh data.
 * - Coalesces concurrent identical in-flight GET requests.
 * - Accurately propagates server error messages without silently masking them.
 */
export async function adminApiFetch<T = any>(
  pathOrUrl: string,
  options: AdminFetchOptions = {}
): Promise<T> {
  const {
    timeoutMs = 55000,
    retries = 2,
    retryDelayMs = 2000,
    skipAuth = false,
    headers: customHeaders = {},
    ...fetchOptions
  } = options;

  const url = pathOrUrl.startsWith('http') ? pathOrUrl : `${API_BASE_URL}${pathOrUrl}`;
  const method = (fetchOptions.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  // Deduplicate concurrent in-flight GET requests
  const cacheKey = isGet ? `${method}:${url}` : null;
  if (cacheKey && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey) as Promise<T>;
  }

  const execute = async (): Promise<T> => {
    let lastError: Error | null = null;
    const maxAttempts = isGet ? 1 + retries : 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort(new Error(`Request timed out after ${timeoutMs}ms waiting for backend server`));
      }, timeoutMs);

      try {
        const authHeaders = skipAuth ? {} : getAuthHeaders();
        const requestHeaders: Record<string, string> = {
          Accept: 'application/json',
          ...authHeaders,
          ...(customHeaders as Record<string, string>),
        };

        // Cache-busting query parameter for GET requests
        let finalUrl = url;
        if (isGet) {
          const sep = finalUrl.includes('?') ? '&' : '?';
          finalUrl = `${finalUrl}${sep}_t=${Date.now()}`;
        }

        const response = await fetch(finalUrl, {
          ...fetchOptions,
          method,
          headers: requestHeaders,
          cache: 'no-store',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // If transient server error (Render cold-start proxy 502/503/504) and attempts remain
        if ([502, 503, 504].includes(response.status) && attempt < maxAttempts) {
          const delay = retryDelayMs * attempt;
          console.warn(`[adminApiFetch] Transient HTTP ${response.status} on attempt ${attempt}. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          const message =
            errData?.details ||
            errData?.error ||
            errData?.message ||
            `HTTP ${response.status}: ${response.statusText}`;
          const err = new Error(message);
          (err as any).status = response.status;
          (err as any).data = errData;
          throw err;
        }

        if (response.status === 204) {
          return null as T;
        }

        const data = await response.json();
        return data as T;
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err instanceof Error ? err : new Error(String(err));

        // Do NOT retry 4xx errors
        if (err?.status && err.status >= 400 && err.status < 500) {
          throw err;
        }

        // Retry on network/timeout error if attempts remain
        if (attempt < maxAttempts) {
          const delay = retryDelayMs * attempt;
          console.warn(`[adminApiFetch] Network/timeout failure on attempt ${attempt}: ${lastError.message}. Retrying in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Request failed');
  };

  if (cacheKey) {
    const promise = execute().finally(() => {
      inFlightRequests.delete(cacheKey);
    });
    inFlightRequests.set(cacheKey, promise);
    return promise;
  }

  return execute();
}

type CategoryPayload = Pick<Category, 'name' | 'slug' | 'description' | 'image' | 'categoryNumber'>
type SubcategoryPayload = Pick<Subcategory, 'name' | 'categoryId'> & {
  slug?: string
}

export const productsApi = {
  async getAll(search?: string): Promise<Product[]> {
    // Use admin endpoint so productNumber is included in the response
    const query = search?.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''
    const data = await adminApiFetch<{ products: Product[] }>(`/api/admin/products${query}`)
    return data.products || []
  },

  async getById(id: string): Promise<Product | undefined> {
    try {
      const product = await adminApiFetch<Product>(`/api/admin/products/${encodeURIComponent(id)}`)
      return product
    } catch (err: any) {
      if (err?.status === 404) {
        try {
          return await adminApiFetch<Product>(`/api/products/${encodeURIComponent(id)}`)
        } catch {
          return undefined
        }
      }
      throw err
    }
  },

  async getBySlug(slug: string): Promise<Product | undefined> {
    const data = await adminApiFetch<{ products: Product[] }>('/api/products')
    return (data.products || []).find((p: Product) => p.slug === slug)
  },

  async create(product: ProductPayload): Promise<Product> {
    const created = await adminApiFetch<Product>('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('product-updated', { detail: { id: created?.id, product: created } }))
    }
    return created
  },

  async update(id: string, data: Partial<ProductPayload>): Promise<Product> {
    const updated = await adminApiFetch<Product>(`/api/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('product-updated', { detail: { id, product: updated } }))
    }
    return updated
  },

  async delete(id: string): Promise<boolean> {
    await adminApiFetch(`/api/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('product-updated', { detail: { id } }))
    }
    return true
  },

  async getCategories(): Promise<Category[]> {
    const data = await adminApiFetch<{ categories: Category[] }>('/api/admin/categories')
    return data.categories || []
  },

  async createCategory(category: CategoryPayload): Promise<Category> {
    const data = await adminApiFetch<any>('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    })
    return data.category || data
  },

  async updateCategory(id: string, category: CategoryPayload): Promise<Category | null> {
    const data = await adminApiFetch<any>(`/api/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    })
    return data.category || data
  },

  async deleteCategory(id: string): Promise<boolean> {
    await adminApiFetch(`/api/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
    return true
  },

  async createSubcategory(subcategory: SubcategoryPayload): Promise<Subcategory> {
    const data = await adminApiFetch<any>('/api/subcategories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subcategory),
    })
    return data.subcategory || data
  },

  async updateSubcategory(id: string, subcategory: Partial<SubcategoryPayload>): Promise<Subcategory | null> {
    const data = await adminApiFetch<any>(`/api/subcategories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subcategory),
    })
    return data.subcategory || data
  },

  async deleteSubcategory(id: string): Promise<boolean> {
    try {
      await adminApiFetch(`/api/subcategories/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      return true
    } catch {
      return false
    }
  },

  async getLowStock(threshold: number = 5): Promise<Product[]> {
    const data = await adminApiFetch<{ products: Product[] }>('/api/admin/products')
    const products = data.products || []
    return products.filter((p: Product) =>
      p.variants?.some((v: any) => v.isAvailable && v.stock <= threshold)
    )
  },
}

export const ordersApi = {
  async getAll(): Promise<Order[]> {
    const data = await adminApiFetch<{ orders: Order[] }>('/api/orders')
    return data.orders || []
  },

  async getById(id: string): Promise<Order | undefined> {
    try {
      return await adminApiFetch<Order>(`/api/orders/${encodeURIComponent(id)}`)
    } catch {
      return undefined
    }
  },

  async getByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    const data = await adminApiFetch<{ orders: Order[] }>('/api/orders')
    const orders = data.orders || []
    return orders.find((o: Order) => o.orderNumber === orderNumber)
  },

  async create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'orderNumber'>): Promise<Order> {
    return await adminApiFetch<Order>('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })
  },

  async update(id: string, data: Partial<Order>): Promise<Order | null> {
    try {
      return await adminApiFetch<Order>(`/api/orders/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch {
      return null
    }
  },

  async updateStatus(id: string, status: Order['orderStatus']): Promise<Order | null> {
    return this.update(id, { orderStatus: status })
  },

  async delete(id: string): Promise<boolean> {
    try {
      await adminApiFetch(`/api/orders/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      return true
    } catch {
      return false
    }
  },

  async getStats() {
    const data = await adminApiFetch<{ orders: Order[] }>('/api/orders')
    const orders = data.orders || []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayOrders = orders.filter((o: any) => new Date(o.createdAt) >= today)
    const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
    const pendingOrders = orders.filter((o: any) => o.orderStatus === 'pending' || o.orderStatus === 'confirmed')

    return {
      todayOrders: todayOrders.length,
      todayRevenue,
      totalOrders: orders.length,
      pendingOrders: pendingOrders.length,
      totalRevenue: orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0),
    }
  },

  async getRecentOrders(limit: number = 5): Promise<Order[]> {
    const data = await adminApiFetch<{ orders: Order[] }>('/api/orders')
    const orders = data.orders || []
    return orders
      .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  },
}

export const dashboardApi = {
  async getStats(): Promise<import('@/types').AdminDashboardStats> {
    return await adminApiFetch<import('@/types').AdminDashboardStats>('/api/admin/dashboard/stats')
  },
}

export const customersApi = {
  async getAll(search?: string): Promise<Customer[]> {
    const query = search?.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''
    const data = await adminApiFetch<{ customers: Customer[] }>(`/api/customers${query}`)
    return data.customers || []
  },

  async getById(id: string): Promise<Customer | undefined> {
    try {
      const data = await adminApiFetch<{ customer: Customer }>(`/api/customers/${encodeURIComponent(id)}`)
      return data.customer
    } catch {
      return undefined
    }
  },

  async getByEmail(email: string): Promise<Customer | undefined> {
    const customers = await this.getAll(email)
    return customers.find((c: Customer) => c.email.toLowerCase() === email.toLowerCase())
  },

  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    return await adminApiFetch<Customer>('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    })
  },

  async update(id: string, data: Partial<Customer>): Promise<Customer | null> {
    try {
      return await adminApiFetch<Customer>(`/api/customers/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch {
      return null
    }
  },

  async delete(id: string): Promise<boolean> {
    try {
      await adminApiFetch(`/api/customers/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      return true
    } catch {
      return false
    }
  },

  async getCustomerStats() {
    const customers = await this.getAll()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const newCustomers = customers.filter((c: any) => new Date(c.createdAt) >= today)
    const activeCustomers = customers.filter((c: any) => c.totalOrders > 0)

    return {
      totalCustomers: customers.length,
      newCustomers: newCustomers.length,
      activeCustomers: activeCustomers.length,
    }
  },
}

export const settingsApi = {
  async getAll(): Promise<SettingsData> {
    return await adminApiFetch<SettingsData>('/api/settings')
  },

  async updateSite(data: Partial<SettingsData['site']>): Promise<SettingsData['site']> {
    return await adminApiFetch<SettingsData['site']>('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  async updateUPI(data: Partial<SettingsData['upi']>): Promise<SettingsData['upi']> {
    return await adminApiFetch<SettingsData['upi']>('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  async updateSocial(data: Partial<SettingsData['social']>): Promise<SettingsData['social']> {
    return await adminApiFetch<SettingsData['social']>('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  async updatePolicies(data: Partial<SettingsData['policies']>): Promise<SettingsData['policies']> {
    return await adminApiFetch<SettingsData['policies']>('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },
}

export const deliveryApi = {
  async getAll(): Promise<DeliverySettingsData> {
    return await adminApiFetch<DeliverySettingsData>('/api/delivery')
  },

  async getRegionByPincode(pincode: string) {
    const data = await adminApiFetch<{ regions: any[] }>('/api/delivery')
    return (data.regions || []).find((r: any) => {
      const start = parseInt(r.pincodeStart)
      const end = parseInt(r.pincodeEnd)
      const pc = parseInt(pincode)
      return pc >= start && pc <= end && r.isEnabled
    })
  },

  async createRegion(region: any): Promise<any> {
    const current = await this.getAll()
    return await adminApiFetch<any>('/api/delivery', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...current,
        regions: [
          ...current.regions,
          { ...region, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ]
      }),
    })
  },

  async updateRegion(id: string, data: any): Promise<any | null> {
    const current = await this.getAll()
    const index = current.regions.findIndex((r: any) => r.id === id)
    if (index === -1) return null

    return await adminApiFetch<any>('/api/delivery', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...current,
        regions: [
          ...current.regions.slice(0, index),
          { ...current.regions[index], ...data, updatedAt: new Date().toISOString() },
          ...current.regions.slice(index + 1)
        ]
      }),
    })
  },

  async deleteRegion(id: string): Promise<boolean> {
    const current = await this.getAll()
    const index = current.regions.findIndex((r: any) => r.id === id)
    if (index === -1) return false

    await adminApiFetch('/api/delivery', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...current,
        regions: current.regions.filter((r: any) => r.id !== id)
      }),
    })
    return true
  },

  async createManagedRegion(region: Partial<DeliveryRegion>) {
    return await adminApiFetch('/api/admin/delivery/regions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(region),
    })
  },

  async updateManagedRegion(id: string, region: Partial<DeliveryRegion>) {
    return await adminApiFetch(`/api/admin/delivery/regions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(region),
    })
  },

  async deleteManagedRegion(id: string) {
    return await adminApiFetch(`/api/admin/delivery/regions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },

  async getAdminRegions(): Promise<DeliverySettingsData> {
    return await adminApiFetch<DeliverySettingsData>('/api/admin/delivery/regions')
  },

  async getGeoStates(): Promise<string[]> {
    const data = await adminApiFetch<{ states: string[] }>('/api/delivery/geo')
    return data.states || []
  },

  async getGeoCities(state: string): Promise<string[]> {
    const data = await adminApiFetch<{ cities: string[] }>(`/api/delivery/geo?state=${encodeURIComponent(state)}`)
    return data.cities || []
  },
}

export const consultantApi = {
  async getCount(): Promise<number> {
    const data = await adminApiFetch<{ count: number }>('/api/admin/order-consultants/count')
    return data.count
  },
  async getAll(): Promise<any[]> {
    const data = await adminApiFetch<{ requests: any[] }>('/api/admin/order-consultants')
    return data.requests || []
  },
  async updateStatus(id: string, status: string): Promise<any> {
    const data = await adminApiFetch<{ request: any }>(`/api/admin/order-consultants/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    return data.request
  },
}

export const authApi = {
  async login(email: string, password: string): Promise<{ user: AdminUser; token: string }> {
    const ALLOWED_ADMIN_EMAILS = ['sunbloomadornwork@gmail.com', 'skavinraj.dev@gmail.com']
    const normalizedEmail = email.toLowerCase().trim()
    if (!ALLOWED_ADMIN_EMAILS.includes(normalizedEmail)) {
      throw new Error('Access denied. Only authorized admin accounts are permitted to access this dashboard.')
    }

    const { adminLoginWithEmail, adminLogout } = await import('@/lib/firebase')
    const firebaseUser = await adminLoginWithEmail(normalizedEmail, password)
    const idToken = await firebaseUser.getIdToken()
    localStorage.setItem('admin_token', idToken)

    try {
      const data = await adminApiFetch<{ user?: AdminUser } & AdminUser>('/api/auth/me', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const user = (data?.user ?? data) as AdminUser
      return { token: idToken, user }
    } catch (err: any) {
      localStorage.removeItem('admin_token')
      await adminLogout().catch(() => {})
      throw new Error(err?.message || 'Admin authorization failed. Ensure this account has admin permissions.')
    }
  },

  async loginWithGoogle(): Promise<{ user: AdminUser; token: string }> {
    const ALLOWED_ADMIN_EMAILS = ['sunbloomadornwork@gmail.com', 'skavinraj.dev@gmail.com']
    const { adminLoginWithGoogle, adminLogout } = await import('@/lib/firebase')
    const firebaseUser = await adminLoginWithGoogle()

    const email = (firebaseUser.email || '').toLowerCase().trim()
    if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
      await adminLogout().catch(() => {})
      throw new Error(`Access denied (${email || 'unknown'}). Only authorized admin accounts are permitted to access this dashboard.`)
    }

    const idToken = await firebaseUser.getIdToken()
    localStorage.setItem('admin_token', idToken)

    try {
      const data = await adminApiFetch<{ user?: AdminUser } & AdminUser>('/api/auth/me', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const user = (data?.user ?? data) as AdminUser
      return { token: idToken, user }
    } catch (err: any) {
      localStorage.removeItem('admin_token')
      await adminLogout().catch(() => {})
      throw new Error(err?.message || 'Admin authorization failed. Ensure this Google account has admin permissions.')
    }
  },

  async getAllUsers(): Promise<AdminUser[]> {
    const data = await adminApiFetch<{ user?: AdminUser } & AdminUser>('/api/auth/me')
    const user = (data?.user ?? data) as AdminUser
    return [user]
  },
}

export const mediaApi = {
  async upload(file: File, folder: string = 'products'): Promise<{ secure_url: string; public_id: string }> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    return await adminApiFetch<{ secure_url: string; public_id: string }>('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    })
  },

  async delete(publicId: string): Promise<boolean> {
    try {
      await adminApiFetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_id: publicId }),
      })
      return true
    } catch {
      return false
    }
  },
}

export interface PaymentGatewayStatus {
  gateway: string
  environment: 'sandbox' | 'production'
  isConfigured: boolean
  webhookConfigured: boolean
  supportedMethods: string[]
  appIdConfigured: boolean
  secretKeyConfigured: boolean
  siteUrl: string
  frontendUrl: string
  webhookUrl: string
}

export const paymentSettingsApi = {
  async getStatus(): Promise<PaymentGatewayStatus> {
    return await adminApiFetch<PaymentGatewayStatus>('/api/admin/payment-gateway-status')
  },
}

export interface AdminCustomerQueryMessage {
  id: string
  queryId: string
  senderType: 'CUSTOMER' | 'ADMIN'
  senderId?: string | null
  senderName?: string | null
  message: string
  attachment?: string | null
  isInternal: boolean
  createdAt: string
}

export interface AdminCustomerQueryListItem {
  id: string
  queryNumber: string
  customerId: string
  orderId?: string | null
  category: string
  subject: string
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_FOR_CUSTOMER' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  createdAt: string
  updatedAt: string
  resolvedAt?: string | null
  customer: {
    id: string
    name: string
    email: string
    phone?: string | null
    whatsappNumber?: string | null
  }
  order?: {
    id: string
    orderNumber: string
    status: string
    totalAmount: number
  } | null
  messages?: AdminCustomerQueryMessage[]
  _count?: {
    messages: number
  }
}

export interface AdminCustomerQueryDetail extends AdminCustomerQueryListItem {
  customer: {
    id: string
    name: string
    email: string
    phone?: string | null
    whatsappNumber?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
  }
  order?: any | null
  messages: AdminCustomerQueryMessage[]
}

export interface AdminCustomerQueryStats {
  total: number
  open: number
  inProgress: number
  waitingForCustomer: number
  resolved: number
  closed: number
  active: number
}

export const customerQueryApi = {
  async getStats(): Promise<AdminCustomerQueryStats> {
    const data = await adminApiFetch<{ stats: AdminCustomerQueryStats }>('/api/admin/customer-queries/stats')
    return data.stats
  },

  async getAll(params?: {
    category?: string
    status?: string
    priority?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<{ queries: AdminCustomerQueryListItem[]; pagination: any }> {
    const searchParams = new URLSearchParams()
    if (params?.category && params.category !== 'ALL') searchParams.set('category', params.category)
    if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status)
    if (params?.priority && params.priority !== 'ALL') searchParams.set('priority', params.priority)
    if (params?.search?.trim()) searchParams.set('search', params.search.trim())
    if (params?.page) searchParams.set('page', String(params.page))
    if (params?.limit) searchParams.set('limit', String(params.limit))

    const qs = searchParams.toString()
    return await adminApiFetch<{ queries: AdminCustomerQueryListItem[]; pagination: any }>(
      `/api/admin/customer-queries${qs ? `?${qs}` : ''}`
    )
  },

  async getById(id: string): Promise<AdminCustomerQueryDetail> {
    const data = await adminApiFetch<{ query: AdminCustomerQueryDetail }>(
      `/api/admin/customer-queries/${encodeURIComponent(id)}`
    )
    return data.query
  },

  async sendMessage(
    id: string,
    payload: { message: string; isInternal?: boolean; status?: string }
  ): Promise<{ message: AdminCustomerQueryMessage; query: any }> {
    return await adminApiFetch<{ message: AdminCustomerQueryMessage; query: any }>(
      `/api/admin/customer-queries/${encodeURIComponent(id)}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )
  },

  async update(
    id: string,
    payload: { status?: string; priority?: string }
  ): Promise<any> {
    return await adminApiFetch<any>(
      `/api/admin/customer-queries/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )
  },
}

// ── Hero Banner Slider API (Admin) ────────────────────────────────────────────
export interface HeroBanner {
  id: string
  imageUrl: string
  publicId: string | null
  altText: string | null
  linkUrl: string | null
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const bannersApi = {
  /** Fetch all banners (including inactive) for admin management view */
  async getAll(): Promise<HeroBanner[]> {
    const data = await adminApiFetch<{ banners: HeroBanner[] }>('/api/admin/banners/admin-list')
    return data.banners || []
  },

  /** Upload a new banner image via the backend (Cloudinary) */
  async upload(file: File, altText?: string, linkUrl?: string): Promise<HeroBanner> {
    const formData = new FormData()
    formData.append('file', file)
    if (altText) formData.append('altText', altText)
    if (linkUrl) formData.append('linkUrl', linkUrl)

    const data = await adminApiFetch<{ banner: HeroBanner }>('/api/admin/banners/upload', {
      method: 'POST',
      body: formData,
    })
    return data.banner
  },

  /** Update banner metadata (altText, linkUrl, sortOrder, isActive) */
  async patch(id: string, payload: Partial<Pick<HeroBanner, 'altText' | 'linkUrl' | 'sortOrder' | 'isActive'>>): Promise<HeroBanner> {
    const data = await adminApiFetch<{ banner: HeroBanner }>(`/api/admin/banners/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return data.banner
  },

  /** Delete a banner (removes DB record and Cloudinary asset) */
  async remove(id: string): Promise<void> {
    await adminApiFetch(`/api/admin/banners/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })
  },
}
