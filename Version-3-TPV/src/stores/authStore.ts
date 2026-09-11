import { computed, reactive } from 'vue'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

export type AuthRole = 'admin' | 'kitchen' | 'waiter'

export type AuthUser = {
  uid: string
  email: string
  role: AuthRole
}

const STORAGE_SESSION_KEY = 'auth_session_expires_at'
const STORAGE_USER_KEY = 'auth_user'
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000 // 12 hours

const demoUserRoles: Record<string, AuthRole> = {
  'admin@restaurante.com': 'admin',
  'cocina@restaurante.com': 'kitchen',
  'camarero@restaurante.com': 'waiter',
}

export const roleToLandingRoute: Record<AuthRole, string> = {
  admin: '/admin',
  kitchen: '/kitchen',
  waiter: '/pos',
}

export const getRoleLandingRoute = (role: AuthRole) => roleToLandingRoute[role] ?? '/login'

const state = reactive({
  user: null as AuthUser | null,
  loading: false,
  sessionExpiresAt: null as string | null,
})

const inferRoleFromEmail = (email: string | null | undefined): AuthRole => {
  const normalized = (email || '').trim().toLowerCase()
  return demoUserRoles[normalized] ?? 'waiter'
}

const persistSessionExpiration = (expiresAt: string | null) => {
  if (typeof window === 'undefined') return
  if (expiresAt) {
    localStorage.setItem(STORAGE_SESSION_KEY, expiresAt)
  } else {
    localStorage.removeItem(STORAGE_SESSION_KEY)
  }
}

const getStoredSessionExpiration = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_SESSION_KEY)
}

const persistUser = (user: AuthUser | null) => {
  if (typeof window === 'undefined') return
  if (user) {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(STORAGE_USER_KEY)
  }
}

const getStoredUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

const isSessionExpired = (expiresAt: string | null): boolean => {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() <= Date.now()
}

const createSessionExpirationTime = (): string => {
  return new Date(Date.now() + SESSION_DURATION_MS).toISOString()
}

const ensureUserRoleDocument = async (firebaseUser: User) => {
  if (!db) return

  const userDocRef = doc(db, 'users', firebaseUser.uid)
  const userDoc = await getDoc(userDocRef)

  if (!userDoc.exists()) {
    await setDoc(userDocRef, {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      role: inferRoleFromEmail(firebaseUser.email),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }
}

export function useAuthStore() {
  const user = computed(() => state.user)
  const isAuthenticated = computed(() => !!state.user)
  const isFirebaseReady = computed(() => !!auth)

  const syncFirebaseUser = async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      state.user = null
      persistUser(null)
      return
    }

    if (!db) {
      state.user = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || 'admin@demo.local',
        role: inferRoleFromEmail(firebaseUser.email),
      }
      persistUser(state.user)
      return
    }

    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
    const role = (userDoc.data()?.role as AuthRole | undefined) ?? inferRoleFromEmail(firebaseUser.email)

    if (!userDoc.exists()) {
      await ensureUserRoleDocument(firebaseUser)
    }

    state.user = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || 'admin@demo.local',
      role,
    }
    persistUser(state.user)
  }

  const listenToAuth = () => {
    // Restore session expiration from localStorage
    const storedExpiration = getStoredSessionExpiration()
    if (storedExpiration && !isSessionExpired(storedExpiration)) {
      state.sessionExpiresAt = storedExpiration
      // Also restore the user if session is still valid
      const storedUser = getStoredUser()
      if (storedUser) {
        state.user = storedUser
      }
    } else if (storedExpiration && isSessionExpired(storedExpiration)) {
      // Session expired, clean up
      persistSessionExpiration(null)
      persistUser(null)
      state.sessionExpiresAt = null
      state.user = null
    }

    if (!auth) {
      if (!state.user) {
        state.user = {
          uid: 'demo-admin',
          email: 'admin@demo.local',
          role: 'admin',
        }
      }
      return
    }

    onAuthStateChanged(auth, async (firebaseUser) => {
      await syncFirebaseUser(firebaseUser)
    })
  }

  const login = async (email: string, password: string) => {
    if (!auth) {
      const expiresAt = createSessionExpirationTime()
      state.user = {
        uid: 'demo-admin',
        email,
        role: inferRoleFromEmail(email),
      }
      state.sessionExpiresAt = expiresAt
      persistSessionExpiration(expiresAt)
      return state.user
    }

    state.loading = true
    try {
      let credentials
      try {
        credentials = await signInWithEmailAndPassword(auth, email, password)
      } catch (error: any) {
        const normalized = email.trim().toLowerCase()
        const isSeedUser = !!demoUserRoles[normalized]

        if ((error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') && isSeedUser) {
          const createdUser = await createUserWithEmailAndPassword(auth, email, password)
          await ensureUserRoleDocument(createdUser.user)
          await syncFirebaseUser(createdUser.user)
          
          // Set session expiration on successful creation/login
          const expiresAt = createSessionExpirationTime()
          state.sessionExpiresAt = expiresAt
          persistSessionExpiration(expiresAt)
          
          return state.user
        }

        throw error
      }

      await syncFirebaseUser(credentials.user)
      
      // Set session expiration on successful login
      const expiresAt = createSessionExpirationTime()
      state.sessionExpiresAt = expiresAt
      persistSessionExpiration(expiresAt)
      
      return state.user
    } finally {
      state.loading = false
    }
  }

  const logout = async () => {
    if (!auth) {
      state.user = null
      state.sessionExpiresAt = null
      persistSessionExpiration(null)
      return
    }

    await signOut(auth)
    state.user = null
    state.sessionExpiresAt = null
    persistSessionExpiration(null)
  }

  return {
    user,
    isAuthenticated,
    isFirebaseReady,
    loading: computed(() => state.loading),
    sessionExpiresAt: computed(() => state.sessionExpiresAt),
    isSessionExpired: computed(() => isSessionExpired(state.sessionExpiresAt)),
    login,
    logout,
    listenToAuth,
  }
}

const authStore = useAuthStore()
authStore.listenToAuth()
