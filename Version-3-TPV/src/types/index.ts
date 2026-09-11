export type Role = 'admin' | 'kitchen' | 'waiter'

export type ProductCategory = {
  id: string
  name: string
  order?: number
  active: boolean
  createdAt?: string
}

export type Product = {
  id: string
  name: string
  description?: string
  price: number
  image?: string
  categoryId: string
  available: boolean
  stock?: number
  lowStockThreshold?: number
  order?: number
  createdAt?: string
  updatedAt?: string
}

export type TableItem = {
  id: string
  number: number
  name?: string
  active: boolean
  qrIdentifier: string
  currentSessionId?: string | null
  createdAt?: string
  updatedAt?: string
}

export type TableSession = {
  sessionId: string
  tableId: string
  token: string
  createdAt: string
  expiresAt: string
  active: boolean
  closedAt?: string | null
}

export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'PAID' | 'CANCELLED'

export type OrderItem = {
  productId: string
  name: string
  price: number
  quantity: number
  subtotal: number
  options?: string[]
  note?: string
}

export type Order = {
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
