// ===========================================
// Shared Types from Customer Web
// ===========================================

// Cart Types
export interface CartItem {
  productId: string
  variantId: string
  productName: string
  productSlug: string
  productImage: string
  color: string
  pattern: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface CartSummary {
  items: CartItem[]
  subtotal: number
  shippingCharge: number
  total: number
  itemCount: number
}

// Product Types
export interface Variant {
  id: string
  color: string
  pattern: string
  stock: number
  additionalPrice: number
  variantNumber?: string | null
  sku?: string
  images: string[]
  isAvailable: boolean
}

// Payload types (create/update) often don't have server-generated ids yet.
export type VariantPayload = Omit<Variant, 'id'> & { id?: string }

export interface Product {
  id: string
  name: string
  slug: string
  category: string | Category
  categoryDetails?: Category | null
  categoryId: string
  subcategory?: string | Subcategory | null
  subcategoryId?: string | null
  description: string
  basePrice: number
  images: string[]
  variants: Variant[]
  isActive: boolean
  /** Admin-only: business identifier in ###-## format. Never sent to customers. */
  productNumber?: string | null
  createdAt: string
  updatedAt: string
}


export type ProductPayload = Omit<
  Product,
  'id' | 'createdAt' | 'updatedAt' | 'category' | 'variants'
> & {
  variants: VariantPayload[]
}
export interface Subcategory {
  id: string
  name: string
  slug: string
  categoryId: string
}

export interface Category {
  id: string
  name: string
  slug: string
  categoryNumber: string
  description: string
  image: string
  subcategories?: Subcategory[]
}

export interface ProductsData {
  products: Product[]
  categories: Category[]
}

// Order Types
export type PaymentStatus = 'pending' | 'paid' | 'failed'
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  productId: string
  variantId: string
  productName: string
  productNumber?: string | null
  variantNumber?: string | null
  color?: string
  pattern?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  image?: string
  variant?: string
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  whatsappNumber?: string | null
  customerEmail: string
  deliveryAddress: string
  city: string
  state: string
  pincode: string
  items: OrderItem[]
  subtotal: number
  shippingCharge: number
  totalAmount: number
  paymentMethod: string
  paymentStatus: PaymentStatus
  paymentScreenshot?: string
  upiTransactionId?: string
  paidAt?: string
  orderStatus: OrderStatus
  trackingRequested?: boolean
  trackingCarrier?: string
  trackingNumber?: string
  trackingUrl?: string
  shippedAt?: string
  deliveredAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface OrdersData {
  orders: Order[]
  nextOrderNumber: number
}

// Settings Types
export interface SiteSettings {
  name: string
  tagline: string
  contactEmail: string
  contactPhone: string
  whatsappNumber: string
  address: string
}

export interface UPISettings {
  vpa: string
  name: string
  qrCode: string
}

export interface SocialSettings {
  instagram: string
  facebook: string
  whatsapp: string
}

export interface PolicySettings {
  returnDays: number
  replacementDays: number
  minOrderAmount: number
  freeShippingAbove: number
}

export interface SettingsData {
  site: SiteSettings
  upi: UPISettings
  social: SocialSettings
  policies: PolicySettings
}

// Delivery Settings Types
export interface DeliveryRegion {
  id: string
  city: string
  state: string
  pincodeStart: string
  pincodeEnd: string
  isEnabled: boolean
  deliveryCharge: number
}

export interface DeliverySettingsData {
  regions: DeliveryRegion[]
  freeShippingThreshold?: number
  defaultShippingCharge?: number
}

// Admin Types
export interface AdminPermissions {
  products: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
  }
  orders: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
  }
  settings: {
    update: boolean
  }
  admins?: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
  }
}

export type AdminRole = 'super_admin' | 'order_manager' | 'product_manager'

export interface Admin {
  id: string
  username: string
  email: string
  passwordHash: string
  role: AdminRole
  permissions: AdminPermissions
  isActive: boolean
  lastLogin?: string
  createdAt: string
}

export interface AdminsData {
  admins: Admin[]
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ===========================================
// Admin-Specific Types
// ===========================================

export interface DashboardStats {
  todayOrders: number
  todayRevenue: number
  pendingOrders: number
  lowStockCount: number
  ordersChange: number
  revenueChange: number
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

// ===========================================
// Customer Types
// ===========================================

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  city?: string
  pincode?: string
  totalOrders: number
  totalSpent: number
  lastOrderDate?: string
  createdAt: string
  updatedAt: string
}

export interface CustomersData {
  customers: Customer[]
}

// ===========================================
// Admin User Types
// ===========================================

export interface AdminUser {
  id: string
  username: string
  email: string
  passwordHash: string
  role: 'super_admin' | 'admin' | 'manager'
  permissions: {
    products: { create: boolean; read: boolean; update: boolean; delete: boolean }
    orders: { create: boolean; read: boolean; update: boolean; delete: boolean }
    customers: { create: boolean; read: boolean; update: boolean; delete: boolean }
    settings: { update: boolean }
  }
  isActive: boolean
  lastLogin: string | null
  createdAt: string
  updatedAt?: string
}

export interface AdminUsersData {
  users: AdminUser[]
}
