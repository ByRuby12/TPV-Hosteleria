export type Category = {
  id: string
  name: string
  active: boolean
}

export type Product = {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  available: boolean
}

export const categories: Category[] = [
  { id: 'drinks', name: 'Bebidas', active: true },
  { id: 'coffee', name: 'Cafés', active: true },
  { id: 'sandwiches', name: 'Bocadillos', active: true },
  { id: 'burgers', name: 'Hamburguesas', active: true },
  { id: 'rations', name: 'Raciones', active: true },
  { id: 'breakfast', name: 'Desayunos', active: true },
  { id: 'desserts', name: 'Postres', active: true },
  { id: 'others', name: 'Otros', active: true },
]

export const products: Product[] = [
  { id: 'coca', name: 'Coca-Cola', description: 'Botella 33cl', price: 2.5, categoryId: 'drinks', available: true },
  { id: 'agua', name: 'Agua mineral', description: 'Sin gas', price: 1.8, categoryId: 'drinks', available: true },
  { id: 'latte', name: 'Café con leche', description: 'Espresso + leche', price: 1.9, categoryId: 'coffee', available: true },
  { id: 'tortilla', name: 'Bocadillo de tortilla', description: 'Con aceite y pimiento', price: 5.5, categoryId: 'sandwiches', available: true },
  { id: 'burger', name: 'Hamburguesa clásica', description: 'Con queso y salsa', price: 8.5, categoryId: 'burgers', available: true },
  { id: 'patatas', name: 'Patatas bravas', description: 'Con salsa', price: 4.2, categoryId: 'rations', available: true },
  { id: 'brownie', name: 'Brownie', description: 'Chocolate', price: 3.2, categoryId: 'desserts', available: true },
  { id: 'croissant', name: 'Croissant', description: 'Hecho hoy', price: 2.2, categoryId: 'breakfast', available: true },
]

export const tables = [
  { id: '1', number: 1, active: true },
  { id: '2', number: 2, active: false },
  { id: '3', number: 3, active: true },
  { id: '4', number: 4, active: true },
]
