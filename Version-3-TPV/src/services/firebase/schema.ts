export type FirestoreCollections = {
  users: 'users'
  tables: 'tables'
  products: 'products'
  categories: 'categories'
  tableSessions: 'tableSessions'
  orders: 'orders'
  payments: 'payments'
  settings: 'settings'
}

export const firestoreCollections: FirestoreCollections = {
  users: 'users',
  tables: 'tables',
  products: 'products',
  categories: 'categories',
  tableSessions: 'tableSessions',
  orders: 'orders',
  payments: 'payments',
  settings: 'settings',
}

export type UserRole = 'admin' | 'kitchen' | 'waiter'

export type AppUser = {
  uid: string
  email: string
  name?: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export type TableRecord = {
  id: string
  number: number
  name?: string
  qrIdentifier: string
  active: boolean
  currentSessionId?: string | null
  createdAt: string
  updatedAt: string
}

export type TableSessionRecord = {
  sessionId: string
  tableId: string
  token: string
  createdAt: string
  expiresAt: string
  active: boolean
  closedAt?: string | null
}

export type ProductRecord = {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  image?: string
  available: boolean
  stock?: number
  lowStockThreshold?: number
  createdAt: string
  updatedAt: string
}

export type CategoryRecord = {
  id: string
  name: string
  slug: string
  order: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'PAID' | 'CANCELLED'

export type OrderItem = {
  productId: string
  name: string
  price: number
  quantity: number
  subtotal: number
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  rejectionReason?: string
  note?: string
  options?: string[]
}

export type OrderRecord = {
  id: string
  tableId: string
  sessionId: string
  clientTokenId?: string
  items: OrderItem[]
  note?: string
  total: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
  startedAt?: string
  readyAt?: string
  deliveredAt?: string
}

export type PaymentRecord = {
  id: string
  tableId: string
  sessionId: string
  total: number
  splitBy: number
  status: 'OPEN' | 'PAID' | 'PARTIAL'
  createdAt: string
  updatedAt: string
}

export type AppSettings = {
  restaurantName: string
  address: string
  phone: string
  email: string
  openingHours: string
  socials: {
    tiktok?: string
    whatsapp?: string
    instagram?: string
    facebook?: string
    googleReviews?: string
  }
  taxRate: number
  sessionTTLMinutes: number
  defaultCurrency: string
  updatedAt: string
}

export const firestoreSchema = {
  users: 'users',
  tables: 'tables',
  products: 'products',
  categories: 'categories',
  tableSessions: 'tableSessions',
  orders: 'orders',
  payments: 'payments',
  settings: 'settings',
} as const
