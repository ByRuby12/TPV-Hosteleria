import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import serviceAccount from '../service-account.json' with { type: 'json' }

initializeApp({ credential: cert(serviceAccount) })

const db = getFirestore()
const operationalCollections = [
  'orders',
  'tableSessions',
  'payments',
  'cashRegisters',
  'cashClosures',
  'cashMovements',
]

const deleteCollection = async (collectionName) => {
  const snapshot = await db.collection(collectionName).get()
  await Promise.all(snapshot.docs.map((document) => document.ref.delete()))
  console.log(`[clear] ${collectionName}: ${snapshot.size} documentos eliminados`)
}

const resetTables = async () => {
  const snapshot = await db.collection('tables').get()
  const batch = db.batch()

  snapshot.docs.forEach((document) => {
    batch.set(document.ref, {
      active: false,
      currentSessionId: null,
      paymentRequested: false,
      paymentMethod: null,
      paymentSplitCount: null,
      paymentNote: null,
      updatedAt: new Date().toISOString(),
    }, { merge: true })
  })

  await batch.commit()
  console.log(`[clear] tables: ${snapshot.size} mesas reiniciadas como libres`)
}

await Promise.all(operationalCollections.map(deleteCollection))
await resetTables()
console.log('[clear] Limpieza operativa completada')