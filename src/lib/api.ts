import type {
  Product,
  ProductPayload,
  Order,
  ProductsData,
  OrdersData,
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

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

type CategoryPayload = Pick<Category, 'name' | 'slug' | 'description' | 'image' | 'categoryNumber'>
type SubcategoryPayload = Pick<Subcategory, 'name' | 'categoryId'> & {
  slug?: string
}

export const productsApi = {
  async getAll(search?: string): Promise<Product[]> {
    // Use admin endpoint so productNumber is included in the response
    const query = search?.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''
    const response = await fetch(`${API_BASE_URL}/api/admin/products${query}`, {
      headers: { ...getAuthHeaders() },
    })
    const data = await response.json()
    return data.products
  },

  async getById(id: string): Promise<Product | undefined> {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`)
    if (response.ok) {
      return await response.json()
    }
    return undefined
  },

  async getBySlug(slug: string): Promise<Product | undefined> {
    const response = await fetch(`${API_BASE_URL}/api/products`)
    const data = await response.json()
    return data.products.find((p: Product) => p.slug === slug)
  },

  async create(product: ProductPayload): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(product),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => null)
      // Backend typically returns { error, details, fields }
      throw new Error(error?.details || error?.error || 'Failed to create product')
    }

    return response.json()
  },

  async update(id: string, data: Partial<ProductPayload>): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    })
    if (response.ok) return await response.json()
    const error = await response.json().catch(() => null)
    throw new Error(error?.details || error?.error || 'Failed to update product')
  },

  async delete(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    })
    return response.ok
  },

  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
      headers: { ...getAuthHeaders() },
    })
    const data = await response.json()
    return data.categories || []
  },

  async createCategory(category: CategoryPayload): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(category),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => null)
      throw new Error(error?.error || 'Failed to create category')
    }
    const data = await response.json()
    return data.category || data
  },

  async updateCategory(id: string, category: CategoryPayload): Promise<Category | null> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(category),
    })
    if (response.ok) {
      const data = await response.json()
      return data.category || data
    }
    return null
  },

  async deleteCategory(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    })
    return response.ok
  },

  async createSubcategory(subcategory: SubcategoryPayload): Promise<Subcategory> {
    const response = await fetch(`${API_BASE_URL}/api/subcategories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(subcategory),
    })
    if (!response.ok) {
      const error = await response.json().catch(() => null)
      throw new Error(error?.error || 'Failed to create subcategory')
    }
    const data = await response.json()
    return data.subcategory || data
  },

  async updateSubcategory(id: string, subcategory: Partial<SubcategoryPayload>): Promise<Subcategory | null> {
    const response = await fetch(`${API_BASE_URL}/api/subcategories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(subcategory),
    })
    if (!response.ok) return null

    if (response.ok) {
      const data = await response.json()
      return data.subcategory || data
    }
    return null
  },

  async deleteSubcategory(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/api/subcategories/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    })
    return response.ok
  },

  async getLowStock(threshold: number = 5): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/api/products`)
    const products = (await response.json()).products
    return products.filter((p: Product) =>
      p.variants.some((v: any) => v.isAvailable && v.stock <= threshold)
    )
  },
}

export const ordersApi = {
  async getAll(): Promise<Order[]> {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: { ...getAuthHeaders() },
    })
    const data = await response.json()
    return data.orders
  },

  async getById(id: string): Promise<Order | undefined> {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
      headers: { ...getAuthHeaders() },
    })
    if (response.ok) return await response.json()
    return undefined
  },

  async getByOrderNumber(orderNumber: string): Promise<Order | undefined> {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: { ...getAuthHeaders() },
    })
    const orders = (await response.json()).orders
    return orders.find((o: Order) => o.orderNumber === orderNumber)
  },

  async create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'orderNumber'>): Promise<Order> {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })
    return response.json()
  },

  async update(id: string, data: Partial<Order>): Promise<Order | null> {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    })
    if (response.ok) return await response.json()
    return null
  },

  async updateStatus(id: string, status: Order['orderStatus']): Promise<Order | null> {
    return this.update(id, { orderStatus: status })
  },

  async delete(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/api/orders/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    })
    return response.ok
  },

  async getStats() {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: { ...getAuthHeaders() },
    })
    const orders = (await response.json()).orders
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayOrders = orders.filter((o: any) => new Date(o.createdAt) >= today)
    const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + o.totalAmount, 0)
    const pendingOrders = orders.filter((o: any) => o.orderStatus === 'pending' || o.orderStatus === 'confirmed')

    return {
      todayOrders: todayOrders.length,
      todayRevenue,
      totalOrders: orders.length,
      pendingOrders: pendingOrders.length,
      totalRevenue: orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0),
    }
  },

  async getRecentOrders(limit: number = 5): Promise<Order[]> {
    const response = await fetch(`${API_BASE_URL}/api/orders`, {
      headers: { ...getAuthHeaders() },
    })
    const orders = (await response.json()).orders
    return orders
      .sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  },
}

export const customersApi = {
  async getAll(): Promise<Customer[]> {
    const response = await fetch(`${API_BASE_URL}/api/customers`, {
      headers: { ...getAuthHeaders() },
    })
    const data = await response.json()
    return data.customers
  },

  async getById(id: string): Promise<Customer | undefined> {
    const response = await fetch(`${API_BASE_URL}/api/customers`, {
      headers: { ...getAuthHeaders() },
    })
    const customers = (await response.json()).customers
    return customers.find((c: Customer) => c.id === id)
  },

  async getByEmail(email: string): Promise<Customer | undefined> {
    const response = await fetch(`${API_BASE_URL}/api/customers`, {
      headers: { ...getAuthHeaders() },
    })
    const customers = (await response.json()).customers
    return customers.find((c: Customer) => c.email === email)
  },

  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const response = await fetch(`${API_BASE_URL}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    })
    return response.json()
  },

  async update(id: string, data: Partial<Customer>): Promise<Customer | null> {
    const response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    })
    if (response.ok) return await response.json()
    return null
  },

  async delete(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/api/customers/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    })
    return response.ok
  },

  async getCustomerStats() {
    const response = await fetch(`${API_BASE_URL}/api/customers`, {
      headers: { ...getAuthHeaders() },
    })
    const customers = (await response.json()).customers
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const newCustomers = customers.filter((c: any) => new Date(c.createdAt) >= today)
    const activeCustomers = customers.filter((c: any) => c.lastOrderDate &&
      new Date(c.lastOrderDate) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )

    return {
      totalCustomers: customers.length,
      newCustomers: newCustomers.length,
      activeCustomers: activeCustomers.length,
    }
  },
}

export const settingsApi = {
  async getAll(): Promise<SettingsData> {
    const response = await fetch(`${API_BASE_URL}/api/settings`)
    return response.json()
  },

  async updateSite(data: Partial<SettingsData['site']>): Promise<SettingsData['site']> {
    const response = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  async updateUPI(data: Partial<SettingsData['upi']>): Promise<SettingsData['upi']> {
    const response = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  async updateSocial(data: Partial<SettingsData['social']>): Promise<SettingsData['social']> {
    const response = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  async updatePolicies(data: Partial<SettingsData['policies']>): Promise<SettingsData['policies']> {
    const response = await fetch(`${API_BASE_URL}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    })
    return response.json()
  },
}

export const deliveryApi = {
  async getAll(): Promise<DeliverySettingsData> {
    const response = await fetch(`${API_BASE_URL}/api/delivery`)
    return response.json()
  },

  async getRegionByPincode(pincode: string) {
    const response = await fetch(`${API_BASE_URL}/api/delivery`)
    const data = await response.json()
    return data.regions.find((r: any) => {
      const start = parseInt(r.pincodeStart)
      const end = parseInt(r.pincodeEnd)
      const pc = parseInt(pincode)
      return pc >= start && pc <= end && r.isEnabled
    })
  },

  async createRegion(region: any): Promise<any> {
    const current = await this.getAll()
    const response = await fetch(`${API_BASE_URL}/api/delivery`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        ...current,
        regions: [
          ...current.regions,
          { ...region, id: generateId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ]
      }),
    })
    return response.json()
  },

  async updateRegion(id: string, data: any): Promise<any | null> {
    const current = await this.getAll()
    const index = current.regions.findIndex((r: any) => r.id === id)
    if (index === -1) return null

    const response = await fetch(`${API_BASE_URL}/api/delivery`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        ...current,
        regions: [
          ...current.regions.slice(0, index),
          { ...current.regions[index], ...data, updatedAt: new Date().toISOString() },
          ...current.regions.slice(index + 1)
        ]
      }),
    })
    return response.json()
  },

  async deleteRegion(id: string): Promise<boolean> {
    const current = await this.getAll()
    const index = current.regions.findIndex((r: any) => r.id === id)
    if (index === -1) return false

    const response = await fetch(`${API_BASE_URL}/api/delivery`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        ...current,
        regions: current.regions.filter((r: any) => r.id !== id)
      }),
    })
    return response.ok
  },

  async createManagedRegion(region: Partial<DeliveryRegion>) {
    const response = await fetch(`${API_BASE_URL}/api/admin/delivery/regions`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(region) })
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Failed to create region'); return data
  },
  async updateManagedRegion(id: string, region: Partial<DeliveryRegion>) {
    const response = await fetch(`${API_BASE_URL}/api/admin/delivery/regions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(region) })
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Failed to update region'); return data
  },
  async deleteManagedRegion(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/delivery/regions/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } })
    const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Failed to delete region'); return data
  },
  async getAdminRegions(): Promise<DeliverySettingsData> {
    const response = await fetch(`${API_BASE_URL}/api/admin/delivery/regions`, { headers: { ...getAuthHeaders() } })
    if (!response.ok) throw new Error('Failed to load regions')
    return response.json()
  },
  async getGeoStates(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/delivery/geo`)
    const data = await response.json()
    return data.states || []
  },
  async getGeoCities(state: string): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/delivery/geo?state=${encodeURIComponent(state)}`)
    const data = await response.json()
    return data.cities || []
  },
}


export const consultantApi = {
  async getCount() { const r = await fetch(`${API_BASE_URL}/api/admin/order-consultants/count`, { headers: getAuthHeaders() }); return (await r.json()).count as number },
  async getAll() { const r = await fetch(`${API_BASE_URL}/api/admin/order-consultants`, { headers: getAuthHeaders() }); return (await r.json()).requests as any[] },
  async updateStatus(id: string, status: string) { const r = await fetch(`${API_BASE_URL}/api/admin/order-consultants/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ status }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Failed to update request'); return d.request },
}

export const authApi = {
  async login(email: string, password: string): Promise<{ user: AdminUser; token: string }> {
    const ALLOWED_ADMIN_EMAILS = ['sunbloomadornwork@gmail.com', 'skavinraj.dev@gmail.com'];
    const normalizedEmail = email.toLowerCase().trim();
    if (!ALLOWED_ADMIN_EMAILS.includes(normalizedEmail)) {
      throw new Error('Access denied. Only authorized admin accounts are permitted to access this dashboard.');
    }

    const { adminLoginWithEmail, adminLogout } = await import('@/lib/firebase');
    const firebaseUser = await adminLoginWithEmail(normalizedEmail, password);
    const idToken = await firebaseUser.getIdToken();
    localStorage.setItem('admin_token', idToken);

    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${idToken}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      localStorage.removeItem('admin_token');
      await adminLogout().catch(() => {});
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.message || `Admin authorization failed (${response.status}). Ensure this account has admin permissions.`);
    }

    const data = await response.json();
    const user = (data?.user ?? data) as AdminUser;
    return { token: idToken, user };
  },

  async loginWithGoogle(): Promise<{ user: AdminUser; token: string }> {
    const ALLOWED_ADMIN_EMAILS = ['sunbloomadornwork@gmail.com', 'skavinraj.dev@gmail.com'];
    const { adminLoginWithGoogle, adminLogout } = await import('@/lib/firebase');
    const firebaseUser = await adminLoginWithGoogle();

    const email = (firebaseUser.email || '').toLowerCase().trim();
    if (!ALLOWED_ADMIN_EMAILS.includes(email)) {
      await adminLogout().catch(() => {});
      throw new Error(`Access denied (${email || 'unknown'}). Only authorized admin accounts are permitted to access this dashboard.`);
    }

    const idToken = await firebaseUser.getIdToken();
    localStorage.setItem('admin_token', idToken);

    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${idToken}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      localStorage.removeItem('admin_token');
      await adminLogout().catch(() => {});
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.message || `Admin authorization failed (${response.status}). Ensure this Google account has admin permissions.`);
    }

    const data = await response.json();
    const user = (data?.user ?? data) as AdminUser;
    return { token: idToken, user };
  },

  async getAllUsers(): Promise<AdminUser[]> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { ...getAuthHeaders() },
    });
    const data = await response.json();
    const user = (data?.user ?? data) as AdminUser;
    return [user];
  },
};

export const mediaApi = {
  async upload(file: File, folder: string = 'products'): Promise<{ secure_url: string; public_id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const response = await fetch(`${API_BASE_URL}/api/admin/media/upload`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.message || error?.error || 'Failed to upload image');
    }

    return response.json();
  },

  async delete(publicId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/api/admin/media`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ public_id: publicId }),
    });
    return response.ok;
  },
};

export interface PaymentGatewayStatus {
  gateway: string;
  environment: 'sandbox' | 'production';
  isConfigured: boolean;
  webhookConfigured: boolean;
  supportedMethods: string[];
  appIdConfigured: boolean;
  secretKeyConfigured: boolean;
  siteUrl: string;
  frontendUrl: string;
  webhookUrl: string;
}

export const paymentSettingsApi = {
  async getStatus(): Promise<PaymentGatewayStatus> {
    const response = await fetch(`${API_BASE_URL}/api/admin/payment-gateway-status`, {
      headers: { ...getAuthHeaders() },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch payment gateway status');
    }
    return await response.json();
  },
};
