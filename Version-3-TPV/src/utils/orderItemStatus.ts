export type OrderItemStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export const isOrderItemRejected = (item: { status?: OrderItemStatus }) => item.status === 'REJECTED'

export const hasBillableOrderItems = (items: Array<{ status?: OrderItemStatus }>) =>
  items.some((item) => !isOrderItemRejected(item))

export const getOrderBillableTotal = (items: Array<{ subtotal: number; status?: OrderItemStatus }>) =>
  items.reduce((total, item) => total + (isOrderItemRejected(item) ? 0 : Number(item.subtotal || 0)), 0)

type PaymentAmounts = {
  total: number
  paymentMethod?: 'efectivo' | 'tarjeta'
  paymentCashAmount?: number
  paymentCardAmount?: number
}

export const getPaymentCashAmount = (payment: PaymentAmounts) =>
  typeof payment.paymentCashAmount === 'number'
    ? payment.paymentCashAmount
    : payment.paymentMethod === 'tarjeta' ? 0 : Number(payment.total || 0)

export const getPaymentCardAmount = (payment: PaymentAmounts) =>
  typeof payment.paymentCardAmount === 'number'
    ? payment.paymentCardAmount
    : payment.paymentMethod === 'tarjeta' ? Number(payment.total || 0) : 0
