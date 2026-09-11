import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import serviceAccount from '../service-account.json' with { type: 'json' }

initializeApp({ credential: cert(serviceAccount) })

const db = getFirestore()
const now = new Date().toISOString()

const categories = [
  { id: 'raciones', name: 'Raciones', slug: 'raciones', order: 6, active: true, createdAt: now, updatedAt: now },
  { id: 'vinos-vermut', name: 'Vinos y vermuts', slug: 'vinos-vermut', order: 7, active: true, createdAt: now, updatedAt: now },
]

const products = [
  { id: 'tabla-quesos', name: 'Tabla de quesos', description: 'Selección de quesos variados con frutos secos, uvas y picos de pan.', price: 14.5, image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones', available: true, stock: 100, allergens: ['lactosa', 'frutos-secos', 'gluten'], createdAt: now, updatedAt: now },
  { id: 'gambas-ajillo', name: 'Gambas al ajillo', description: 'Gambas salteadas en aceite de oliva, ajo y guindilla.', price: 13.9, image: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones', available: true, stock: 100, allergens: ['marisco'], createdAt: now, updatedAt: now },
  { id: 'alitas-barbacoa', name: 'Alitas de pollo barbacoa', description: 'Alitas de pollo doradas con salsa barbacoa y patatas caseras.', price: 11.9, image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&w=800&q=80', categoryId: 'raciones', available: true, stock: 100, allergens: ['soja'], createdAt: now, updatedAt: now },
  { id: 'vino-tinto-copa', name: 'Vino tinto de la casa', description: 'Copa de vino tinto joven, equilibrado y afrutado.', price: 3.2, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80', categoryId: 'vinos-vermut', available: true, stock: 100, allergens: ['sulfitos'], createdAt: now, updatedAt: now },
  { id: 'vino-blanco-copa', name: 'Vino blanco de la casa', description: 'Copa de vino blanco fresco y aromático.', price: 3.2, image: 'https://images.unsplash.com/photo-1560148218-1a83060f2a97?auto=format&fit=crop&w=800&q=80', categoryId: 'vinos-vermut', available: true, stock: 100, allergens: ['sulfitos'], createdAt: now, updatedAt: now },
  { id: 'vermut-casa', name: 'Vermut de la casa', description: 'Vermut servido con hielo, naranja y aceituna.', price: 3.8, image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=800&q=80', categoryId: 'vinos-vermut', available: true, stock: 100, allergens: ['sulfitos'], createdAt: now, updatedAt: now },
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