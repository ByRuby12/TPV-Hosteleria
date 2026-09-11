import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import serviceAccount from '../service-account.json' with { type: 'json' }

initializeApp({ credential: cert(serviceAccount) })

const db = getFirestore()
const now = new Date().toISOString()

const categories = [
  { id: 'raciones', name: 'Raciones', slug: 'raciones', order: 6, active: true, createdAt: now, updatedAt: now },
  { id: 'vinos-vermut', name: 'Vinos y vermuts', slug: 'vinos-vermut', order: 7, active: true, createdAt: now, updatedAt: now },
  { id: 'bocadillos', name: 'Bocadillos', slug: 'bocadillos', order: 8, active: true, createdAt: now, updatedAt: now },
  { id: 'tostas', name: 'Tostas', slug: 'tostas', order: 9, active: true, createdAt: now, updatedAt: now },
  { id: 'ensaladas', name: 'Ensaladas', slug: 'ensaladas', order: 10, active: true, createdAt: now, updatedAt: now },
  { id: 'raciones-calientes', name: 'Raciones calientes', slug: 'raciones-calientes', order: 11, active: true, createdAt: now, updatedAt: now },
  { id: 'platos-combinados', name: 'Platos combinados', slug: 'platos-combinados', order: 12, active: true, createdAt: now, updatedAt: now },
]

const products = [
  { id: 'tabla-quesos', name: 'Tabla de quesos', description: 'Selección de quesos variados con frutos secos, uvas y picos de pan.', price: 14.5, image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones', available: true, stock: 100, allergens: ['lactosa', 'frutos-secos', 'gluten'], createdAt: now, updatedAt: now },
  { id: 'gambas-ajillo', name: 'Gambas al ajillo', description: 'Gambas salteadas en aceite de oliva, ajo y guindilla.', price: 13.9, image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones', available: true, stock: 100, allergens: ['marisco'], createdAt: now, updatedAt: now },
  { id: 'alitas-barbacoa', name: 'Alitas de pollo barbacoa', description: 'Alitas de pollo doradas con salsa barbacoa y patatas caseras.', price: 11.9, image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones', available: true, stock: 100, allergens: ['soja'], createdAt: now, updatedAt: now },
  { id: 'vino-tinto-copa', name: 'Vino tinto de la casa', description: 'Copa de vino tinto joven, equilibrado y afrutado.', price: 3.2, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80', categoryId: 'vinos-vermut', available: true, stock: 100, allergens: ['sulfitos'], createdAt: now, updatedAt: now },
  { id: 'vino-blanco-copa', name: 'Vino blanco de la casa', description: 'Copa de vino blanco fresco y aromático.', price: 3.2, image: 'https://images.unsplash.com/photo-1560148218-1a83060f2a97?auto=format&fit=crop&w=800&q=80', categoryId: 'vinos-vermut', available: true, stock: 100, allergens: ['sulfitos'], createdAt: now, updatedAt: now },
  { id: 'vermut-casa', name: 'Vermut de la casa', description: 'Vermut servido con hielo, naranja y aceituna.', price: 3.8, image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80', categoryId: 'vinos-vermut', available: true, stock: 100, allergens: ['sulfitos'], createdAt: now, updatedAt: now },
  { id: 'bocadillo-tortilla', name: 'Bocadillo de tortilla', description: 'Pan crujiente relleno de tortilla española jugosa.', price: 5.5, image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=800&q=80', categoryId: 'bocadillos', available: true, stock: 100, allergens: ['gluten', 'huevo'], createdAt: now, updatedAt: now },
  { id: 'bocadillo-calamares', name: 'Bocadillo de calamares', description: 'Calamares fritos en pan tierno con alioli suave.', price: 8.5, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', categoryId: 'bocadillos', available: true, stock: 100, allergens: ['gluten', 'moluscos', 'huevo'], createdAt: now, updatedAt: now },
  { id: 'bocadillo-lomo-queso', name: 'Bocadillo de lomo y queso', description: 'Lomo de cerdo a la plancha con queso fundido.', price: 7.5, image: 'https://images.unsplash.com/photo-1550507992-eb63bbea18e6?auto=format&fit=crop&w=800&q=80', categoryId: 'bocadillos', available: true, stock: 100, allergens: ['gluten', 'lactosa'], createdAt: now, updatedAt: now },
  { id: 'bocadillo-pollo', name: 'Bocadillo de pollo', description: 'Pollo a la plancha, lechuga, tomate y mayonesa.', price: 7.2, image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80', categoryId: 'bocadillos', available: true, stock: 100, allergens: ['gluten', 'huevo'], createdAt: now, updatedAt: now },
  { id: 'bocadillo-jamon-tomate', name: 'Bocadillo de jamón y tomate', description: 'Jamón serrano, tomate rallado y aceite de oliva.', price: 7.8, image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80', categoryId: 'bocadillos', available: true, stock: 100, allergens: ['gluten'], createdAt: now, updatedAt: now },
  { id: 'bocadillo-atun', name: 'Bocadillo vegetal de atún', description: 'Atún, huevo, lechuga, tomate y mayonesa en pan crujiente.', price: 7.5, image: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=800&q=80', categoryId: 'bocadillos', available: true, stock: 100, allergens: ['gluten', 'pescado', 'huevo'], createdAt: now, updatedAt: now },
  { id: 'tosta-jamon-queso', name: 'Tosta de jamón y queso', description: 'Pan tostado con jamón serrano y queso fundido.', price: 6.8, image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80', categoryId: 'tostas', available: true, stock: 100, allergens: ['gluten', 'lactosa'], createdAt: now, updatedAt: now },
  { id: 'tosta-salmon', name: 'Tosta de salmón y queso crema', description: 'Pan tostado con salmón ahumado, queso crema y eneldo.', price: 9.5, image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80', categoryId: 'tostas', available: true, stock: 100, allergens: ['gluten', 'pescado', 'lactosa'], createdAt: now, updatedAt: now },
  { id: 'tosta-escalivada', name: 'Tosta de escalivada', description: 'Pan tostado con pimientos, berenjena asada y aceite de oliva.', price: 7.2, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', categoryId: 'tostas', available: true, stock: 100, allergens: ['gluten'], createdAt: now, updatedAt: now },
  { id: 'tosta-sobrasada-miel', name: 'Tosta de sobrasada y miel', description: 'Sobrasada templada, queso y un toque de miel sobre pan crujiente.', price: 8.2, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', categoryId: 'tostas', available: true, stock: 100, allergens: ['gluten', 'lactosa'], createdAt: now, updatedAt: now },
  { id: 'tosta-roast-beef', name: 'Tosta de roast beef', description: 'Roast beef, rúcula, tomate seco y salsa de mostaza.', price: 10.5, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', categoryId: 'tostas', available: true, stock: 100, allergens: ['gluten', 'mostaza'], createdAt: now, updatedAt: now },
  { id: 'tosta-champinones', name: 'Tosta de champiñones', description: 'Champiñones salteados, ajo, perejil y queso parmesano.', price: 7.8, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', categoryId: 'tostas', available: true, stock: 100, allergens: ['gluten', 'lactosa'], createdAt: now, updatedAt: now },
  { id: 'ensalada-mixta', name: 'Ensalada mixta', description: 'Lechuga, tomate, cebolla, atún, huevo y aceitunas.', price: 8.5, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', categoryId: 'ensaladas', available: true, stock: 100, allergens: ['pescado', 'huevo'], createdAt: now, updatedAt: now },
  { id: 'ensalada-queso-cabra', name: 'Ensalada de queso de cabra', description: 'Mezcla de hojas, queso de cabra, nueces, manzana y vinagreta.', price: 11.5, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', categoryId: 'ensaladas', available: true, stock: 100, allergens: ['lactosa', 'frutos-secos'], createdAt: now, updatedAt: now },
  { id: 'ensalada-pasta', name: 'Ensalada de pasta', description: 'Pasta fría con tomate cherry, maíz, atún y aceitunas.', price: 9.5, image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80', categoryId: 'ensaladas', available: true, stock: 100, allergens: ['gluten', 'pescado'], createdAt: now, updatedAt: now },
  { id: 'ensalada-rusa', name: 'Ensaladilla rusa', description: 'Patata, zanahoria, guisantes, atún y mayonesa casera.', price: 8.9, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80', categoryId: 'ensaladas', available: true, stock: 100, allergens: ['pescado', 'huevo'], createdAt: now, updatedAt: now },
  { id: 'ensalada-burrata', name: 'Ensalada de burrata', description: 'Burrata cremosa, tomate, rúcula, albahaca y aceite de oliva.', price: 13.5, image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=800&q=80', categoryId: 'ensaladas', available: true, stock: 100, allergens: ['lactosa'], createdAt: now, updatedAt: now },
  { id: 'ensalada-pollo', name: 'Ensalada templada de pollo', description: 'Pollo a la plancha, hojas verdes, tomate, maíz y salsa César.', price: 11.9, image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=800&q=80', categoryId: 'ensaladas', available: true, stock: 100, allergens: ['huevo', 'lactosa', 'mostaza'], createdAt: now, updatedAt: now },
  { id: 'racion-chorizo', name: 'Chorizo a la sidra', description: 'Rodajas de chorizo cocinadas lentamente con sidra.', price: 9.5, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones-calientes', available: true, stock: 100, allergens: ['sulfitos'], createdAt: now, updatedAt: now },
  { id: 'racion-pimientos', name: 'Pimientos de padrón', description: 'Pimientos de padrón fritos con sal marina.', price: 7.5, image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones-calientes', available: true, stock: 100, allergens: [], createdAt: now, updatedAt: now },
  { id: 'racion-tigres', name: 'Tigres de mejillón', description: 'Mejillones rellenos y gratinados con bechamel casera.', price: 10.5, image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones-calientes', available: true, stock: 100, allergens: ['moluscos', 'gluten', 'lactosa'], createdAt: now, updatedAt: now },
  { id: 'racion-morcilla', name: 'Morcilla con cebolla', description: 'Morcilla a la plancha con cebolla caramelizada.', price: 9.8, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones-calientes', available: true, stock: 100, allergens: [], createdAt: now, updatedAt: now },
  { id: 'racion-huevos-rotos', name: 'Huevos rotos con jamón', description: 'Patatas fritas, huevos a la plancha y jamón serrano.', price: 12.5, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones-calientes', available: true, stock: 100, allergens: ['huevo'], createdAt: now, updatedAt: now },
  { id: 'racion-croquetas-pollo', name: 'Croquetas de pollo', description: 'Croquetas cremosas de pollo elaboradas en casa.', price: 10.9, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones-calientes', available: true, stock: 100, allergens: ['gluten', 'lactosa', 'huevo'], createdAt: now, updatedAt: now },
  { id: 'plato-lomo-huevo', name: 'Lomo, huevo y patatas', description: 'Lomo de cerdo a la plancha con huevo frito y patatas.', price: 11.5, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80', categoryId: 'platos-combinados', available: true, stock: 100, allergens: ['huevo'], createdAt: now, updatedAt: now },
  { id: 'plato-pollo-huevo', name: 'Pollo, huevo y ensalada', description: 'Pechuga de pollo a la plancha con huevo y ensalada.', price: 12.5, image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80', categoryId: 'platos-combinados', available: true, stock: 100, allergens: ['huevo'], createdAt: now, updatedAt: now },
  { id: 'plato-salchichas', name: 'Salchichas, huevo y patatas', description: 'Salchichas a la plancha con huevo frito y patatas.', price: 10.9, image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80', categoryId: 'platos-combinados', available: true, stock: 100, allergens: ['huevo', 'mostaza'], createdAt: now, updatedAt: now },
  { id: 'plato-merluza', name: 'Merluza, ensalada y patatas', description: 'Filete de merluza a la plancha con ensalada y patatas.', price: 14.5, image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80', categoryId: 'platos-combinados', available: true, stock: 100, allergens: ['pescado'], createdAt: now, updatedAt: now },
  { id: 'plato-pechuga', name: 'Pechuga empanada y patatas', description: 'Pechuga de pollo empanada con patatas y ensalada.', price: 12.9, image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80', categoryId: 'platos-combinados', available: true, stock: 100, allergens: ['gluten', 'huevo'], createdAt: now, updatedAt: now },
  { id: 'plato-bacon-huevo', name: 'Bacon, huevo y patatas', description: 'Bacon crujiente con huevo frito y patatas caseras.', price: 10.9, image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80', categoryId: 'platos-combinados', available: true, stock: 100, allergens: ['huevo'], createdAt: now, updatedAt: now },
]

const toFirestoreValue = (value) => {
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } }
  if (typeof value === 'boolean') return { booleanValue: value }
  if (typeof value === 'number') return { doubleValue: value }
  return { stringValue: String(value) }
}

const writeWithCliToken = async (collectionName, documents) => {
  const projectId = 'prueba-tpv-37e02'
  await Promise.all(documents.map(async (document) => {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionName}/${document.id}`
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.FIREBASE_CLI_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: Object.fromEntries(Object.entries(document).filter(([key]) => key !== 'id').map(([key, value]) => [key, toFirestoreValue(value)])),
      }),
    })
    if (!response.ok) throw new Error(`${collectionName}/${document.id}: ${response.status} ${await response.text()}`)
  }))
}

const main = async () => {
  if (process.env.FIREBASE_CLI_TOKEN) {
    await writeWithCliToken('categories', categories)
    await writeWithCliToken('products', products)
  } else {
    await Promise.all([
      ...categories.map((category) => db.collection('categories').doc(category.id).set(category, { merge: true })),
      ...products.map((product) => db.collection('products').doc(product.id).set(product, { merge: true })),
    ])
  }
  console.log(`Catalogo actualizado: ${categories.length} categorias y ${products.length} productos.`)
}

main().catch((error) => {
  console.error('No se pudo actualizar el catalogo:', error)
  process.exitCode = 1
})