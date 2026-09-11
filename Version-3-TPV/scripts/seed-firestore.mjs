import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || './service-account.json'

const app = initializeApp({
  credential: cert(serviceAccountPath),
})

const db = getFirestore(app)

const seed = {
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
    { id: 'raciones', name: 'Raciones', slug: 'raciones', order: 6, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'vinos-vermut', name: 'Vinos y vermuts', slug: 'vinos-vermut', order: 7, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'bocadillos', name: 'Bocadillos', slug: 'bocadillos', order: 8, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tostas', name: 'Tostas', slug: 'tostas', order: 9, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'ensaladas', name: 'Ensaladas', slug: 'ensaladas', order: 10, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'raciones-calientes', name: 'Raciones calientes', slug: 'raciones-calientes', order: 11, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'platos-combinados', name: 'Platos combinados', slug: 'platos-combinados', order: 12, active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  products: [
    { id: 'croquetas-jamon', name: 'Croquetas de jamón ibérico', description: 'Croquetas caseras con jamón ibérico y bechamel cremosa.', price: 7.5, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200', categoryId: 'starters', available: true, stock: 100, allergens: ['gluten', 'huevo', 'lactosa'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
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
    { id: 'tabla-quesos', name: 'Tabla de quesos', description: 'Selección de quesos variados con frutos secos, uvas y picos de pan.', price: 14.5, image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones', available: true, stock: 100, allergens: ['lactosa', 'frutos-secos', 'gluten'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'gambas-ajillo', name: 'Gambas al ajillo', description: 'Gambas salteadas en aceite de oliva, ajo y guindilla.', price: 13.9, image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones', available: true, stock: 100, allergens: ['marisco'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'alitas-barbacoa', name: 'Alitas de pollo barbacoa', description: 'Alitas de pollo doradas con salsa barbacoa y patatas caseras.', price: 11.9, image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones', available: true, stock: 100, allergens: ['soja'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'vino-tinto-copa', name: 'Vino tinto de la casa', description: 'Copa de vino tinto joven, equilibrado y afrutado.', price: 3.2, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80', categoryId: 'vinos-vermut', available: true, stock: 100, allergens: ['sulfitos'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'vino-blanco-copa', name: 'Vino blanco de la casa', description: 'Copa de vino blanco fresco y aromático.', price: 3.2, image: 'https://images.unsplash.com/photo-1560148218-1a83060f2a97?auto=format&fit=crop&w=800&q=80', categoryId: 'vinos-vermut', available: true, stock: 100, allergens: ['sulfitos'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'vermut-casa', name: 'Vermut de la casa', description: 'Vermut servido con hielo, naranja y aceituna.', price: 3.8, image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80', categoryId: 'vinos-vermut', available: true, stock: 100, allergens: ['sulfitos'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'bocadillo-tortilla', name: 'Bocadillo de tortilla', description: 'Pan crujiente relleno de tortilla española jugosa.', price: 5.5, image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=800&q=80', categoryId: 'bocadillos', available: true, stock: 100, allergens: ['gluten', 'huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'bocadillo-calamares', name: 'Bocadillo de calamares', description: 'Calamares fritos en pan tierno con alioli suave.', price: 8.5, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', categoryId: 'bocadillos', available: true, stock: 100, allergens: ['gluten', 'moluscos', 'huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'bocadillo-lomo-queso', name: 'Bocadillo de lomo y queso', description: 'Lomo de cerdo a la plancha con queso fundido.', price: 7.5, image: 'https://images.unsplash.com/photo-1550507992-eb63bbea18e6?auto=format&fit=crop&w=800&q=80', categoryId: 'bocadillos', available: true, stock: 100, allergens: ['gluten', 'lactosa'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'bocadillo-pollo', name: 'Bocadillo de pollo', description: 'Pollo a la plancha, lechuga, tomate y mayonesa.', price: 7.2, image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80', categoryId: 'bocadillos', available: true, stock: 100, allergens: ['gluten', 'huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'bocadillo-jamon-tomate', name: 'Bocadillo de jamón y tomate', description: 'Jamón serrano, tomate rallado y aceite de oliva.', price: 7.8, image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80', categoryId: 'bocadillos', available: true, stock: 100, allergens: ['gluten'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'bocadillo-atun', name: 'Bocadillo vegetal de atún', description: 'Atún, huevo, lechuga, tomate y mayonesa en pan crujiente.', price: 7.5, image: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80', categoryId: 'bocadillos', available: true, stock: 100, allergens: ['gluten', 'pescado', 'huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tosta-jamon-queso', name: 'Tosta de jamón y queso', description: 'Pan tostado con jamón serrano y queso fundido.', price: 6.8, image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80', categoryId: 'tostas', available: true, stock: 100, allergens: ['gluten', 'lactosa'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tosta-salmon', name: 'Tosta de salmón y queso crema', description: 'Pan tostado con salmón ahumado, queso crema y eneldo.', price: 9.5, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80', categoryId: 'tostas', available: true, stock: 100, allergens: ['gluten', 'pescado', 'lactosa'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tosta-escalivada', name: 'Tosta de escalivada', description: 'Pan tostado con pimientos, berenjena asada y aceite de oliva.', price: 7.2, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', categoryId: 'tostas', available: true, stock: 100, allergens: ['gluten'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tosta-sobrasada-miel', name: 'Tosta de sobrasada y miel', description: 'Sobrasada templada, queso y un toque de miel sobre pan crujiente.', price: 8.2, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', categoryId: 'tostas', available: true, stock: 100, allergens: ['gluten', 'lactosa'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tosta-roast-beef', name: 'Tosta de roast beef', description: 'Roast beef, rúcula, tomate seco y salsa de mostaza.', price: 10.5, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', categoryId: 'tostas', available: true, stock: 100, allergens: ['gluten', 'mostaza'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'tosta-champinones', name: 'Tosta de champiñones', description: 'Champiñones salteados, ajo, perejil y queso parmesano.', price: 7.8, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', categoryId: 'tostas', available: true, stock: 100, allergens: ['gluten', 'lactosa'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'ensalada-mixta', name: 'Ensalada mixta', description: 'Lechuga, tomate, cebolla, atún, huevo y aceitunas.', price: 8.5, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', categoryId: 'ensaladas', available: true, stock: 100, allergens: ['pescado', 'huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'ensalada-queso-cabra', name: 'Ensalada de queso de cabra', description: 'Mezcla de hojas, queso de cabra, nueces, manzana y vinagreta.', price: 11.5, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', categoryId: 'ensaladas', available: true, stock: 100, allergens: ['lactosa', 'frutos-secos'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'ensalada-pasta', name: 'Ensalada de pasta', description: 'Pasta fría con tomate cherry, maíz, atún y aceitunas.', price: 9.5, image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80', categoryId: 'ensaladas', available: true, stock: 100, allergens: ['gluten', 'pescado'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'ensalada-rusa', name: 'Ensaladilla rusa', description: 'Patata, zanahoria, guisantes, atún y mayonesa casera.', price: 8.9, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', categoryId: 'ensaladas', available: true, stock: 100, allergens: ['pescado', 'huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'ensalada-burrata', name: 'Ensalada de burrata', description: 'Burrata cremosa, tomate, rúcula, albahaca y aceite de oliva.', price: 13.5, image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=800&q=80', categoryId: 'ensaladas', available: true, stock: 100, allergens: ['lactosa'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'ensalada-pollo', name: 'Ensalada templada de pollo', description: 'Pollo a la plancha, hojas verdes, tomate, maíz y salsa César.', price: 11.9, image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=800&q=80', categoryId: 'ensaladas', available: true, stock: 100, allergens: ['huevo', 'lactosa', 'mostaza'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'racion-chorizo', name: 'Chorizo a la sidra', description: 'Rodajas de chorizo cocinadas lentamente con sidra.', price: 9.5, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones-calientes', available: true, stock: 100, allergens: ['sulfitos'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'racion-pimientos', name: 'Pimientos de padrón', description: 'Pimientos de padrón fritos con sal marina.', price: 7.5, image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones-calientes', available: true, stock: 100, allergens: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'racion-tigres', name: 'Tigres de mejillón', description: 'Mejillones rellenos y gratinados con bechamel casera.', price: 10.5, image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones-calientes', available: true, stock: 100, allergens: ['moluscos', 'gluten', 'lactosa'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'racion-morcilla', name: 'Morcilla con cebolla', description: 'Morcilla a la plancha con cebolla caramelizada.', price: 9.8, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones-calientes', available: true, stock: 100, allergens: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'racion-huevos-rotos', name: 'Huevos rotos con jamón', description: 'Patatas fritas, huevos a la plancha y jamón serrano.', price: 12.5, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones-calientes', available: true, stock: 100, allergens: ['huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'racion-croquetas-pollo', name: 'Croquetas de pollo', description: 'Croquetas cremosas de pollo elaboradas en casa.', price: 10.9, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones-calientes', available: true, stock: 100, allergens: ['gluten', 'lactosa', 'huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'plato-lomo-huevo', name: 'Lomo, huevo y patatas', description: 'Lomo de cerdo a la plancha con huevo frito y patatas.', price: 11.5, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80', categoryId: 'platos-combinados', available: true, stock: 100, allergens: ['huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'plato-pollo-huevo', name: 'Pollo, huevo y ensalada', description: 'Pechuga de pollo a la plancha con huevo y ensalada.', price: 12.5, image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80', categoryId: 'platos-combinados', available: true, stock: 100, allergens: ['huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'plato-salchichas', name: 'Salchichas, huevo y patatas', description: 'Salchichas a la plancha con huevo frito y patatas.', price: 10.9, image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80', categoryId: 'platos-combinados', available: true, stock: 100, allergens: ['huevo', 'mostaza'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'plato-merluza', name: 'Merluza, ensalada y patatas', description: 'Filete de merluza a la plancha con ensalada y patatas.', price: 14.5, image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80', categoryId: 'platos-combinados', available: true, stock: 100, allergens: ['pescado'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'plato-pechuga', name: 'Pechuga empanada y patatas', description: 'Pechuga de pollo empanada con patatas y ensalada.', price: 12.9, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80', categoryId: 'platos-combinados', available: true, stock: 100, allergens: ['gluten', 'huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'plato-bacon-huevo', name: 'Bacon, huevo y patatas', description: 'Bacon crujiente con huevo frito y patatas caseras.', price: 10.9, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80', categoryId: 'platos-combinados', available: true, stock: 100, allergens: ['huevo'], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ].map((product) => ({ ...product, stock: 100 })),
  tables: Array.from({ length: 30 }, (_, i) => {
    const num = i + 1
    return {
      id: `table-${num}`,
      number: num,
      name: `Mesa ${num}`,
      qrIdentifier: `mesa-${String(num).padStart(3, '0')}`,
      active: true,
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

async function writeCollection(collectionName, docs) {
  const collectionRef = db.collection(collectionName)

  for (const doc of docs) {
    if (doc.id) {
      await collectionRef.doc(doc.id).set(doc)
    } else {
      await collectionRef.doc(doc.uid || doc.id || `${collectionName}-doc`).set(doc)
    }
  }
}

async function main() {
  try {
    await writeCollection('users', seed.users)
    await writeCollection('categories', seed.categories)
    await writeCollection('products', seed.products)
    await writeCollection('tables', seed.tables)
    await db.collection('settings').doc('restaurant').set(seed.settings)
    console.log('Firestore seed completed successfully.')
  } catch (error) {
    console.error('Error seeding Firestore:', error)
    process.exitCode = 1
  }
}

main()
