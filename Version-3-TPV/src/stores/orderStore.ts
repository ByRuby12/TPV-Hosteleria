import { computed, reactive } from 'vue'
import { isProductOutOfStock } from '../utils/productStock'

export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
}

const cart = reactive<CartItem[]>([])

export function addToCart(product: { id: string; name: string; price: number; available?: boolean; stock?: number; lowStockThreshold?: number }) {
  if (isProductOutOfStock(product)) {
    return
  }

  const item = cart.find((entry) => entry.id === product.id)

  if (item) {
    item.quantity += 1
    return
  }

  cart.push({
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1,
  })
}

export function incrementItem(productId: string) {
  const item = cart.find((entry) => entry.id === productId)
  if (item) item.quantity += 1
}

export function decrementItem(productId: string) {
  const item = cart.find((entry) => entry.id === productId)
  if (!item) return

  if (item.quantity <= 1) {
    const index = cart.findIndex((entry) => entry.id === productId)
    cart.splice(index, 1)
    return
  }

  item.quantity -= 1
}

export function removeFromCart(productId: string) {
  const index = cart.findIndex((entry) => entry.id === productId)
  if (index >= 0) cart.splice(index, 1)
}

export function clearCart() {
  cart.splice(0, cart.length)
}

export function useCart() {
  const total = computed(() =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  )

  return {
    cart,
    addToCart,
    incrementItem,
    decrementItem,
    removeFromCart,
    clearCart,
    total,
  }
}
