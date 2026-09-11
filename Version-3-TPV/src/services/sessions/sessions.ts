import type { TableRecord } from '../tables/tables'

export type TableSessionRecord = {
  sessionId: string
  tableId: string
  token: string
  createdAt: string
  expiresAt: string
  active: boolean
  closedAt?: string | null
}

const STORAGE_KEY = 'restaurant-table-session'
const TABLE_SESSION_TTL_MS = 12 * 60 * 60 * 1000

export const mockSessions: TableSessionRecord[] = [
  {
    sessionId: 'session-2',
    tableId: 'table-2',
    token: 'abc123token-demo',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + TABLE_SESSION_TTL_MS).toISOString(),
    active: true,
  },
]

export const createSessionForTable = (table: TableRecord, sessionId = `session-${table.id}-${Date.now()}`): TableSessionRecord => ({
  sessionId,
  tableId: table.id,
  token: `${table.qrIdentifier}-${Math.random().toString(36).slice(2, 10)}`,
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + TABLE_SESSION_TTL_MS).toISOString(),
  active: true,
  closedAt: null,
})

export const isSessionActive = (session: TableSessionRecord) => {
  if (!session.active) return false
  if (session.closedAt) return false
  return new Date(session.expiresAt).getTime() > Date.now()
}

export const persistSession = (session: TableSessionRecord) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export const getStoredSession = (): TableSessionRecord | null => {
  if (typeof window === 'undefined') return null

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as TableSessionRecord
    return isSessionActive(parsed) ? parsed : null
  } catch {
    return null
  }
}

export const clearStoredSession = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}

export const resolveSessionForQrIdentifier = (qrIdentifier: string, tables: TableRecord[]) => {
  const table = tables.find((entry) => entry.qrIdentifier === qrIdentifier)
  if (!table) return null

  const stored = getStoredSession()
  // If stored session exists and belongs to this table but is closed, reject it
  if (stored && stored.tableId === table.id && !isSessionActive(stored)) {
    return null
  }

  // If stored session exists and is active for this table, reuse it
  if (stored && stored.tableId === table.id && isSessionActive(stored)) {
    return { table, session: stored }
  }

  // An active table already has the canonical session for its current orders.
  const session = table.active && table.currentSessionId
    ? createSessionForTable(table, table.currentSessionId)
    : createSessionForTable(table)
  return { table, session }
}

export const closeSession = (session: TableSessionRecord): TableSessionRecord => {
  const closedSession = {
    ...session,
    active: false,
    closedAt: new Date().toISOString(),
  }
  persistSession(closedSession)
  return closedSession
}

export const forceCreateSessionForTable = (table: TableRecord): TableSessionRecord => {
  // Always create a new session, regardless of existing ones
  const session = createSessionForTable(table)
  persistSession(session)
  return session
}
