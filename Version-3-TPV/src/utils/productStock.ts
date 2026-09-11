export type ProductStockConfig = {
  stock?: number
  available?: boolean
  lowStockThreshold?: number
}

export const DEFAULT_LOW_STOCK_THRESHOLD = 5

export const isProductOutOfStock = (product: ProductStockConfig) => {
  const stock = Number(product?.stock ?? 0)
  const available = product?.available ?? true

  return !available || stock <= 0
}

export const isProductLowStock = (product: ProductStockConfig) => {
  const stock = Number(product?.stock ?? 0)
  const threshold = Number(product?.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD)

  return stock > 0 && stock <= threshold
}

export const normalizeProductStock = (product: Record<string, any> | null | undefined) => {
  const stock = Number(product?.stock ?? 0)
  const explicitAvailable = typeof product?.available === 'boolean' ? product.available : true

  return {
    ...product,
    stock: Number.isFinite(stock) ? stock : 0,
    available: explicitAvailable,
    lowStockThreshold: Number(product?.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD),
  }
}
