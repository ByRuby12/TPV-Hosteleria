export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'PAID' | 'CANCELLED'
export type OrderItemStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export type OrderRecord = {
  id: string
  tableId: string
  sessionId: string
  clientTokenId?: string
  items: Array<{
    productId: string
    name: string
    price: number
    quantity: number
    subtotal: number
    status?: OrderItemStatus
    rejectionReason?: string
    note?: string
    options?: string[]
  }>
  note?: string
  total: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
  startedAt?: string
  readyAt?: string
  deliveredAt?: string
  paidAt?: string
  paymentMethod?: 'efectivo' | 'tarjeta'
  paymentRequested?: boolean
  paymentSplitCount?: number
  paymentCashPeople?: number
  paymentCardPeople?: number
  paymentCashAmount?: number
  paymentCardAmount?: number
  paymentNote?: string
}

export const mockOrders: OrderRecord[] = []
