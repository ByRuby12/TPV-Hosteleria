import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  runTransaction,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'

const stripUndefined = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((entry) => stripUndefined(entry)) as T
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, stripUndefined(entryValue)]),
    ) as T
  }

  return value
}

export async function getCollectionSnapshot<T>(path: string) {
  if (!db) return [] as T[]

  try {
    // Try with orderBy first
    console.log(`[firestore] Fetching ${path} with orderBy createdAt...`)
    const q = query(collection(db, path), orderBy('createdAt', 'asc'))
    const snapshot = await getDocs(q)
    console.log(`[firestore] ✅ ${path} fetched successfully: ${snapshot.docs.length} documents`)
    return snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) as T[]
  } catch (error) {
    // Fallback: query without orderBy if createdAt doesn't exist
    console.warn(`[firestore] orderBy createdAt failed for ${path}, retrying without sort:`, error)
    try {
      const snapshot = await getDocs(collection(db, path))
      console.log(`[firestore] ✅ ${path} fetched successfully (no orderBy): ${snapshot.docs.length} documents`)
      return snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) as T[]
    } catch (fallbackError) {
      console.error(`[firestore] ❌ Failed to fetch ${path} even without orderBy:`, fallbackError)
      if (fallbackError instanceof Error && fallbackError.message.includes('permission')) {
        console.error(`[firestore] ⚠️ Permission denied for ${path}. Check Firestore security rules.`)
      }
      return [] as T[]
    }
  }
}

export async function getDocumentById<T>(path: string, id: string) {
  if (!db) return null as T | null

  const snapshot = await getDoc(doc(db, path, id))
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null
}

export async function createDocument<T extends Record<string, unknown>>(path: string, data: T) {
  if (!db) return null

  try {
    const customId = typeof data.id === 'string' && data.id.trim() ? data.id : null
    const payload = stripUndefined({
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    if (customId) {
      console.log(`[firestore] Creating document in ${path} with stable ID ${customId}...`)
      await setDoc(doc(db, path, customId), payload)
      console.log(`[firestore] ✅ Document created in ${path}: ${customId}`)
      return { id: customId, ...payload }
    }

    console.log(`[firestore] Creating document in ${path} with generated ID...`)
    const result = await addDoc(collection(db, path), payload)
    console.log(`[firestore] ✅ Document created in ${path}: ${result.id}`)
    return result
  } catch (error) {
    console.error(`[firestore] ❌ Error creating document in ${path}:`, error)
    throw error
  }
}

export async function createDocumentWithId<T extends Record<string, unknown>>(path: string, docId: string, data: T) {
  if (!db) return null

  try {
    console.log(`[firestore] Creating document in ${path} with ID ${docId}...`)
    const payload = stripUndefined({
      ...data,
      // Keep createdAt from data if it exists, otherwise use serverTimestamp
      createdAt: data.createdAt || serverTimestamp(),
      updatedAt: data.updatedAt || serverTimestamp(),
    })

    await setDoc(doc(db, path, docId), payload)
    console.log(`[firestore] ✅ Document created in ${path}: ${docId}`, { createdAt: payload.createdAt })
    return { id: docId, ...payload }
  } catch (error) {
    console.error(`[firestore] ❌ Error creating document in ${path} with ID ${docId}:`, error)
    throw error
  }
}


export async function upsertDocument<T extends Record<string, unknown>>(path: string, id: string, data: T) {
  if (!db) return null

  try {
    console.log(`[firestore] Upserting ${path}/${id}...`)
    const payload = stripUndefined({
      ...data,
      updatedAt: serverTimestamp(),
    })

    await setDoc(doc(db, path, id), payload, { merge: true })
    console.log(`[firestore] ✅ ${path}/${id} upserted successfully`)
    return id
  } catch (error) {
    console.error(`[firestore] ❌ Error upserting ${path}/${id}:`, error)
    throw error
  }
}

export async function updateDocument(path: string, id: string, data: Record<string, unknown>) {
  if (!db) return null

  try {
    console.log(`[firestore] Updating ${path}/${id}...`)
    const ref = doc(db, path, id)
    const payload = stripUndefined({ ...data, updatedAt: serverTimestamp() })
    await updateDoc(ref, payload)
    console.log(`[firestore] ✅ ${path}/${id} updated successfully`)
    return id
  } catch (error) {
    console.error(`[firestore] ❌ Error updating ${path}/${id}:`, error)
    throw error
  }
}

export async function deleteDocument(path: string, id: string) {
  if (!db) return null

  await deleteDoc(doc(db, path, id))
  return id
}

export async function commitPaymentTransaction(
  paymentId: string,
  payment: Record<string, unknown>,
  orders: Array<{ id: string; data: Record<string, unknown> }>,
  table: { id: string; data: Record<string, unknown> },
) {
  if (!db) return null
  const firestore = db

  await runTransaction(firestore, async (transaction) => {
    const paymentRef = doc(firestore, 'payments', paymentId)
    const tableRef = doc(firestore, 'tables', table.id)
    const orderRefs = orders.map((order) => doc(firestore, 'orders', order.id))

    await transaction.get(paymentRef)
    await transaction.get(tableRef)
    for (const orderRef of orderRefs) {
      await transaction.get(orderRef)
    }

    transaction.set(paymentRef, stripUndefined(payment))
    orders.forEach((order, index) => {
      transaction.update(orderRefs[index], stripUndefined(order.data) as Record<string, any>)
    })
    transaction.update(tableRef, stripUndefined(table.data) as Record<string, any>)
  })

  return paymentId
}

export async function listDocumentsByField<T>(path: string, fieldName: string, value: string) {
  if (!db) return [] as T[]

  const q = query(collection(db, path), where(fieldName, '==', value))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) as T[]
}

export function timestampToDate(value?: Timestamp | { seconds: number } | string | null) {
  if (!value) return ''

  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'toDate' in value) return value.toDate().toLocaleString()
  if (typeof value === 'object' && 'seconds' in value) {
    return new Date(value.seconds * 1000).toLocaleString()
  }

  return String(value)
}
