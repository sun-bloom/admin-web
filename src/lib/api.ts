import type {
  Product,
  ProductPayload,
  Order,
  ProductsData,
  OrdersData,
  SettingsData,
  DeliverySettingsData,
  Category,
  Customer,
  AdminUser,
  Subcategory,
} from '@/types'

// Default to same-origin so dev tunnels (e.g. LocalTunnel/Ngrok) work via the Vite proxy.
// If `VITE_API_URL` points to localhost but the app is opened from a non-localhost hostname
// (mobile + tunnel), ignore it so requests go through `/api` proxy instead.
const ENV_API_URL = (import.meta.env.VITE_API_URL || '').trim()
const isBrowser = typeof window !== 'undefined'
const isNonLocalhostOrigin =
  isBrowser && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
const envPointsToLocalhost = /localhost|127\.0\.0\.1/.test(ENV_API_URL)

export const API_BASE_URL = ENV_API_URL && !(isNonLocalhostOrigin && envPointsToLocalhost) ? ENV_API_URL : ''

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const productsApi = {
  async getAll(): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/api/products`)
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
    return response.json()
  },

  async update(id: string, data: Partial<ProductPayload>): Promise<Product | null> {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(data),
    })
    if (response.ok) return await response.json()
    return null
  },

  async delete(id: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    })
    return response.ok
  },

  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/api/categories`)
    const data = await response.json()
    return data.categories || []
  },

  async createCategory(category: Omit<Category, 'id' | 'subcategories'>): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(category),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => null)
      throw new Error(error?.error || 'Failed to create category')
    }

    return response.json()
  },

  async updateCategory(id: string, category: Partial<Omit<Category, 'id' | 'subcategories'>>): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(category),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => null)
      throw new Error(error?.error || 'Failed to update category')
    }

    return response.json()
  },

  async deleteCategory(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => null)
      throw new Error(error?.error || 'Failed to delete category')
    }
  },

  async createSubcategory(
    subcategory: Pick<Subcategory, 'name' | 'slug' | 'categoryId'>
  ): Promise<Subcategory> {
    const response = await fetch(`${API_BASE_URL}/api/subcategories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(subcategory),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => null)
      throw new Error(error?.error || 'Failed to create subcategory')
    }

    return response.json()
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
}

export const authApi = {
  async login(email: string, password: string): Promise<{ user: AdminUser; token: string } | null> {
    let response: Response
    try {
      // Use form-encoded body to avoid OPTIONS preflight (common tunnel/proxy failure on mobile).
      const body = new URLSearchParams({ email, password }).toString()
      response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body,
      })
    } catch (err) {
      // Most common on mobile+tunnels: preflight/proxy issues surface as a network error.
      let healthHint = 'unknown'
      try {
        const health = await fetch(`${API_BASE_URL}/api/health`, { cache: 'no-store' })
        healthHint = `${health.status}`
      } catch {
        healthHint = 'unreachable'
      }
      const apiHint = API_BASE_URL || `${typeof window !== 'undefined' ? window.location.origin : ''} (same-origin)`
      throw new Error(`Failed to fetch. api=${apiHint}. /api/health=${healthHint}. This usually means the tunnel/proxy is blocking requests (often OPTIONS preflight or VITE_API_URL pointing to localhost).`)
    }

    if (!response.ok) {
      let message = `Login failed (${response.status})`
      try {
        const error = await response.json()
        message = error?.error ? `${error.error} (${response.status})` : message
      } catch {
        try {
          const text = await response.text()
          if (text) message = `${message}: ${text.slice(0, 200)}`
        } catch {
          // ignore
        }
      }
      throw new Error(message)
    }

    let result: any
    try {
      result = await response.json()
    } catch {
      throw new Error('Login failed: invalid JSON response from server')
    }
    localStorage.setItem('admin_token', result.token)
    return result
  },

  async getAllUsers(): Promise<AdminUser[]> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { ...getAuthHeaders() },
    })
    const data = await response.json()
    const user = (data?.user ?? data) as AdminUser
    return [user]
  },
}
