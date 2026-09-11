export type OrderItemStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export const isOrderItemRejected = (item: { status?: OrderItemStatus }) => item.status === 'REJECTED'

export const getOrderBillableTotal = (items: Array<{ subtotal: number; status?: OrderItemStatus }>) =>
  items.reduce((total, item) => total + (isOrderItemRejected(item) ? 0 : Number(item.subtotal || 0)), 0)
