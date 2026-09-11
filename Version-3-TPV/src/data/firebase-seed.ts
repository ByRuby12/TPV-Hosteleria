export const firebaseSeed = {
  users: [
    {
      uid: 'admin-demo-1',
      email: 'admin@restaurante.com',
      name: 'Administrador',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'kitchen-demo-1',
      email: 'cocina@restaurante.com',
      name: 'Cocina',
      role: 'kitchen',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'waiter-demo-1',
      email: 'camarero@restaurante.com',
      name: 'Camarero',
      role: 'waiter',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],

  categories: [
    { id: 'starters', name: 'Entrantes', slug: 'entrantes', order: 1, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'mains', name: 'Platos principales', slug: 'platos-principales', order: 2, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'burgers', name: 'Hamburguesas', slug: 'hamburguesas', order: 3, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'drinks', name: 'Bebidas', slug: 'bebidas', order: 4, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'desserts', name: 'Postres', slug: 'postres', order: 5, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],

  products: [
    { id: 'croquetas-jamon', name: 'Croquetas de jamón ibérico', description: 'Croquetas caseras con jamón ibérico y bechamel cremosa.', price: 7.5, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200', categoryId: 'starters', available: true, allergens: ['gluten', 'huevo', 'lactosa'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'patatas-bravas', name: 'Patatas bravas', description: 'Patatas fritas con salsa brava y alioli casero.', price: 6.5, image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=200', categoryId: 'starters', available: true, allergens: ['huevo', 'soja'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'calamari', name: 'Calamares a la romana', description: 'Calamares tiernos rebozados con limón y perejil.', price: 8.9, image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=200', categoryId: 'starters', available: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'ensalada-cesar', name: 'Ensalada César', description: 'Lechuga romana, pollo a la plancha, parmesano y aderezo César.', price: 9.2, image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=200', categoryId: 'starters', available: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'paella-marisco', name: 'Paella de marisco', description: 'Paella tradicional con gambas, mejillones, calamares y arroz socarrat.', price: 18.5, image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=200', categoryId: 'mains', available: true, allergens: ['marisco'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'entrecot', name: 'Entrecot a la plancha', description: 'Entrecot de 250 g con patatas fritas y salsa de la casa.', price: 22.0, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200', categoryId: 'mains', available: true, allergens: ['lactosa'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'pollo-ajillo', name: 'Pollo al ajillo', description: 'Pechuga de pollo con ajos, perejil y guarnición de verduras.', price: 16.9, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=200', categoryId: 'mains', available: true, allergens: ['lactosa'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'carbonara', name: 'Pasta carbonara', description: 'Espaguetis con panceta, huevo, parmesano y pimienta negra.', price: 14.8, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=200', categoryId: 'mains', available: true, allergens: ['gluten', 'huevo', 'lactosa'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'burger-clasica', name: 'Burger clásica', description: 'Hamburguesa de 180 g, queso cheddar, lechuga y tomate.', price: 11.5, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200', categoryId: 'burgers', available: true, allergens: ['gluten', 'lactosa', 'huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'burger-bacon', name: 'Burger de bacon', description: 'Hamburguesa con bacon crispy, queso y salsa barbacoa.', price: 13.5, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=200', categoryId: 'burgers', available: true, allergens: ['gluten', 'lactosa', 'huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'burger-doble', name: 'Burger doble', description: 'Doble carne, queso gouda, cebolla caramelizada y salsa especial.', price: 15.5, image: 'https://images.unsplash.com/photo-1550317138-10000687a72b?w=200', categoryId: 'burgers', available: true, allergens: ['gluten', 'lactosa', 'huevo', 'soja'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'coca-cola', name: 'Coca-Cola', description: 'Botella 33 cl.', price: 2.6, image: 'https://images.unsplash.com/photo-1554866585-c4db4d1f5e91?w=200', categoryId: 'drinks', available: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'agua-mineral', name: 'Agua mineral', description: 'Botella 50 cl de agua natural.', price: 1.9, image: 'https://images.unsplash.com/photo-1523362628745-0c100c5a7c75?w=200', categoryId: 'drinks', available: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'cerveza', name: 'Cerveza artesanal', description: 'Cerveza de barril, tirada de 20 cl.', price: 3.4, image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=200', categoryId: 'drinks', available: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'limonada', name: 'Limonada casera', description: 'Refrescante bebida de limón natural con menta.', price: 3.1, image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=200', categoryId: 'drinks', available: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tarta-queso', name: 'Tarta de queso', description: 'Tarta cremosa con base de galleta y coulis de frutos rojos.', price: 6.2, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200', categoryId: 'desserts', available: true, allergens: ['gluten', 'lactosa', 'huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'flan-casa', name: 'Flan de la casa', description: 'Flan casero con nata y caramelo líquido.', price: 5.8, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200', categoryId: 'desserts', available: true, allergens: ['lactosa', 'huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'brownie-helado', name: 'Brownie con helado', description: 'Brownie de chocolate caliente con helado vainilla.', price: 6.8, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=200', categoryId: 'desserts', available: true, allergens: ['gluten', 'lactosa', 'huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],

  tables: Array.from({ length: 30 }, (_, i) => {
    const num = i + 1
    return {
      id: `table-${num}`,
      number: num,
      name: `Mesa ${num}`,
      qrIdentifier: `mesa-${String(num).padStart(3, '0')}`,
      active: false,
      currentSessionId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }),

  settings: {
    restaurantName: 'Le Petit Bistro',
    address: 'Calle Mayor 123, Madrid',
    phone: '+34 600 000 000',
    email: 'hola@lepetitbistro.com',
    openingHours: 'Lunes a Domingo · 12:00 - 00:00',
    socials: {
      tiktok: 'https://www.tiktok.com/@lepetitbistro',
      whatsapp: 'https://wa.me/34600000000',
      instagram: 'https://www.instagram.com/lepetitbistro',
      facebook: 'https://www.facebook.com/lepetitbistro',
      googleReviews: 'https://maps.google.com/?q=Le+Petit+Bistro+Madrid',
    },
    taxRate: 0.1,
    sessionTTLMinutes: 180,
    defaultCurrency: 'EUR',
    updatedAt: new Date().toISOString(),
  },
}
