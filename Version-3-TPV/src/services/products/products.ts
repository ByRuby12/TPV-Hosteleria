export type ProductRecord = {
  id: string
  name: string
  description: string
  price: number
  image?: string
  categoryId: string
  available: boolean
  order?: number
  createdAt?: string
  updatedAt?: string
}

export const mockCategories = [
  { id: 'drinks', name: 'Bebidas' },
  { id: 'coffee', name: 'Cafés' },
  { id: 'sandwiches', name: 'Bocadillos' },
  { id: 'burgers', name: 'Hamburguesas' },
]

export const mockProducts: ProductRecord[] = [
  { id: 'coca', name: 'Coca-Cola', description: 'Botella 33cl', price: 2.5, categoryId: 'drinks', available: true },
  { id: 'agua', name: 'Agua mineral', description: 'Sin gas', price: 1.8, categoryId: 'drinks', available: true },
  { id: 'latte', name: 'Café con leche', description: 'Espresso + leche', price: 1.9, categoryId: 'coffee', available: true },
  { id: 'espresso', name: 'Café espresso', description: 'Solo', price: 1.2, categoryId: 'coffee', available: true },
  { id: 'tortilla', name: 'Bocadillo de tortilla', description: 'Con pimiento', price: 5.5, categoryId: 'sandwiches', available: true },
  { id: 'jamon', name: 'Bocadillo de jamón', description: 'Jamón serrano', price: 6.2, categoryId: 'sandwiches', available: true },
  { id: 'burger', name: 'Hamburguesa clásica', description: 'Con queso', price: 8.5, categoryId: 'burgers', available: true },
  { id: 'bacon-burger', name: 'Hamburguesa de bacon', description: 'Con bacon y queso', price: 9.8, categoryId: 'burgers', available: true },
]
