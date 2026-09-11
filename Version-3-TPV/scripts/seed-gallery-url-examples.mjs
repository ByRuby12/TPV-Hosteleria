import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import serviceAccount from '../service-account.json' with { type: 'json' }

initializeApp({ credential: cert(serviceAccount) })

const db = getFirestore()
const now = new Date().toISOString()
const galleryUrls = [
  {
    id: 'example-gallery-paella',
    name: 'Ejemplo - Paella de marisco',
    url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=1200&q=80',
  },
  {
    id: 'example-gallery-burger',
    name: 'Ejemplo - Burger clásica',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80',
  },
  {
    id: 'example-gallery-pasta',
    name: 'Ejemplo - Pasta carbonara',
    url: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=1200&q=80',
  },
  {
    id: 'example-gallery-dessert',
    name: 'Ejemplo - Tarta de queso',
    url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=1200&q=80',
  },
  {
    id: 'example-gallery-restaurant',
    name: 'Ejemplo - Interior del restaurante',
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80',
  },
]

const batch = db.batch()
galleryUrls.forEach((image) => {
  batch.set(db.collection('galleryImages').doc(image.id), {
    name: image.name,
    url: image.url,
    createdAt: now,
    updatedAt: now,
  }, { merge: true })
})

await batch.commit()
console.log(`URLs de galería de ejemplo guardadas: ${galleryUrls.length}`)
