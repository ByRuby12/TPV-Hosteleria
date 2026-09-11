import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT || './service-account.json'

initializeApp({
  credential: cert(serviceAccountPath),
})

const db = getFirestore()
const snapshot = await db.collection('products').get()
const batch = db.batch()

snapshot.docs.forEach((product) => {
  batch.update(product.ref, {
    stock: 100,
    updatedAt: FieldValue.serverTimestamp(),
  })
})

if (snapshot.empty) {
  console.log('No se encontraron productos en Firestore.')
} else {
  await batch.commit()
  console.log(`Stock actualizado a 100 en ${snapshot.size} productos.`)
}
