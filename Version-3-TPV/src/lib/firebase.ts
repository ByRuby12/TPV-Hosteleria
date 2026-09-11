import { initializeApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { firebaseConfigStatic } from '../firebase-config'

// Try to build config from environment variables first (development)
// Fall back to static config (production)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigStatic.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigStatic.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigStatic.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigStatic.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigStatic.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigStatic.appId || '',
}

// Check only the fields needed by the app services.
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'] as const
const isFirebaseConfigured = requiredFields.every((field) => {
  const value = firebaseConfig[field]
  return value !== '' && value !== undefined && value !== null
})

let app: ReturnType<typeof initializeApp> | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null

if (isFirebaseConfigured) {
  console.log('[Firebase] ✅ Initializing Firebase...')
  console.log('[Firebase] Project ID:', firebaseConfig.projectId)
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)

  console.log('[Firebase] ✅ Firebase initialized successfully!')
  console.log('[Firebase] Firestore ready:', db ? '✅' : '❌')
} else {
  console.error('[Firebase] ❌ Firebase configuration is incomplete. Check environment variables or firebase-config.ts')
  console.error('[Firebase] Config:', firebaseConfig)
  console.error('[Firebase] Required fields check:')
  requiredFields.forEach((field) => {
    console.error(`  - ${field}: ${firebaseConfig[field] ? '✅' : '❌'}`)
  })
}

export { app, auth, db, storage }
