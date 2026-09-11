import { computed, reactive } from 'vue'
import type { TableRecord } from '../services/tables/tables'
import {
  clearStoredSession,
  getStoredSession,
  isSessionActive,
  persistSession,
  resolveSessionForQrIdentifier,
  closeSession,
  forceCreateSessionForTable,
  type TableSessionRecord,
} from '../services/sessions/sessions'
import { securityService } from '../services/security/security'
import { useOrdersLiveStore } from './ordersLiveStore'

const PAYMENT_CLOSED_STORAGE_KEY = 'restaurant-session-closed-after-payment'

const getPaymentClosedState = () =>
  typeof window !== 'undefined' && localStorage.getItem(PAYMENT_CLOSED_STORAGE_KEY) === 'true'

const persistPaymentClosedState = (closed: boolean) => {
  if (typeof window === 'undefined') return
  if (closed) localStorage.setItem(PAYMENT_CLOSED_STORAGE_KEY, 'true')
  else localStorage.removeItem(PAYMENT_CLOSED_STORAGE_KEY)
}

const getStoredTables = (): TableRecord[] => {
  const { tables } = useOrdersLiveStore()
  return tables.value ?? []
}

const hydrateSessionTable = () => {
  const activeSession = getStoredSession()
  if (!activeSession) {
    state.table = null
    state.session = null
    return
  }

  const availableTables = getStoredTables()
  if (!availableTables.length) {
    return
  }

  const matchingTable = availableTables.find((item) => item.id === activeSession.tableId)
  if (!matchingTable) {
    clearStoredSession()
    state.table = null
    state.session = null
    return
  }
  const synchronizedSession = matchingTable.currentSessionId && matchingTable.currentSessionId !== activeSession.sessionId
    ? {
        ...activeSession,
        tableId: matchingTable.id,
        sessionId: matchingTable.currentSessionId,
      }
    : activeSession

  state.session = synchronizedSession
  state.table = matchingTable
  state.paymentRequested = Boolean(matchingTable.paymentRequested)
  persistSession(synchronizedSession)
}

const state = reactive({
  session: getStoredSession() as TableSessionRecord | null,
  table: null as TableRecord | null,
  paymentClosed: getPaymentClosedState(),
  paymentRequested: false,
  sessionLockedForAnotherTable: false,
})

if (state.session) {
  hydrateSessionTable()
}

export function useTableSessionStore() {
  const session = computed(() => state.session)
  const table = computed(() => state.table)
  const paymentClosed = computed(() => state.paymentClosed)
  const paymentRequested = computed(() => state.paymentRequested || Boolean(state.table?.paymentRequested))
  const sessionLockedForAnotherTable = computed(() => state.sessionLockedForAnotherTable)

  const setSession = (nextTable: TableRecord, nextSession: TableSessionRecord) => {
    state.table = nextTable
    state.session = nextSession
    persistSession(nextSession)
  }

  const resolveByQrIdentifier = (qrIdentifier: string) => {
    state.sessionLockedForAnotherTable = false
    if (!securityService.checkRateLimit(`qr-${qrIdentifier}`)) {
      securityService.logSecurityEvent('RATE_LIMIT_EXCEEDED', { qrIdentifier })
      return null
    }

    const sanitizedQr = securityService.sanitizeInput(qrIdentifier, 50)
    const availableTables = getStoredTables()
    const requestedTable = availableTables.find((item) => item.qrIdentifier === sanitizedQr)
    const storedSession = getStoredSession()
    const activeSession = state.session && isSessionActive(state.session) ? state.session : storedSession

    if (activeSession && requestedTable && activeSession.tableId !== requestedTable.id) {
      state.sessionLockedForAnotherTable = true
      securityService.logSecurityEvent('SESSION_ACCESS_BLOCKED_FOR_OTHER_TABLE', {
        activeTableId: activeSession.tableId,
        requestedTableId: requestedTable.id,
      })
      return null
    }

    const result = resolveSessionForQrIdentifier(sanitizedQr, availableTables)
    if (!result) return null

    if (!securityService.isSessionActive(result.session)) {
      securityService.logSecurityEvent('EXPIRED_SESSION_ACCESS', {
        tableId: result.table.id,
        sessionId: result.session.sessionId,
      })
      return null
    }

    const restoringStoredSession = Boolean(
      storedSession &&
      isSessionActive(storedSession) &&
      storedSession.tableId === result.table.id,
    )
    const synchronizedSession = restoringStoredSession && result.table.currentSessionId && result.table.currentSessionId !== result.session.sessionId
      ? {
          ...result.session,
          tableId: result.table.id,
          sessionId: result.table.currentSessionId,
        }
      : result.session

    state.table = result.table
    state.session = synchronizedSession
    state.paymentRequested = Boolean(result.table.paymentRequested)
    state.paymentClosed = false
    persistPaymentClosedState(false)
    void useOrdersLiveStore().activateTableSession(result.table.id, synchronizedSession.sessionId)
    persistSession(synchronizedSession)

    securityService.logSecurityEvent('SESSION_ACCESSED', {
      tableId: result.table.id,
      sessionId: synchronizedSession.sessionId,
    })

    return { table: result.table, session: synchronizedSession }
  }

  const ensureActiveSession = (fallbackQrIdentifier = 'mesa-001') => {
    if (state.paymentClosed) return null
    const availableTables = getStoredTables()
    const activeStored = getStoredSession()

    if (activeStored && isSessionActive(activeStored)) {
      const activeTable = availableTables.find((item) => item.id === activeStored.tableId)
      if (!activeTable) return null

      const synchronizedSession = activeTable.currentSessionId && activeTable.currentSessionId !== activeStored.sessionId
        ? {
            ...activeStored,
            tableId: activeTable.id,
            sessionId: activeTable.currentSessionId,
          }
        : activeStored

      state.table = activeTable
      state.session = synchronizedSession
      state.paymentRequested = Boolean(activeTable.paymentRequested)
      persistSession(synchronizedSession)
      return { table: activeTable, session: synchronizedSession }
    }

    const fallbackTable = availableTables.find((item) => item.qrIdentifier === fallbackQrIdentifier) ?? availableTables[0]
    if (!fallbackTable) return null
    
    const sessionResult = resolveByQrIdentifier(fallbackTable.qrIdentifier)

    if (sessionResult) {
      return sessionResult
    }

    const createdSession = {
      sessionId: `session-${fallbackTable.id}-${Date.now()}`,
      tableId: fallbackTable.id,
      token: `${fallbackTable.qrIdentifier}-${Math.random().toString(36).slice(2, 10)}`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      active: true,
      closedAt: null,
    }

    state.table = fallbackTable
    state.session = createdSession
    persistSession(createdSession)
    return { table: fallbackTable, session: createdSession }
  }

  const resetSession = () => {
    if (state.session) {
      securityService.logSecurityEvent('SESSION_CLOSED', {
        tableId: state.table?.id,
        sessionId: state.session.sessionId,
      })
    }

    clearStoredSession()
    state.session = null
    state.table = null
    state.paymentRequested = false
    state.sessionLockedForAnotherTable = false
  }

  const invalidateAfterPayment = () => {
    if (!state.session) return

    securityService.logSecurityEvent('SESSION_EXPIRED_AFTER_PAYMENT', {
      tableId: state.table?.id,
      sessionId: state.session.sessionId,
    })
    clearStoredSession()
    state.session = null
    state.table = null
    state.paymentRequested = false
    state.sessionLockedForAnotherTable = false
    state.paymentClosed = true
    persistPaymentClosedState(true)
  }

  const forceOpenTableByQrIdentifier = (qrIdentifier: string) => {
    const sanitizedQr = securityService.sanitizeInput(qrIdentifier, 50)
    const availableTables = getStoredTables()
    const table = availableTables.find((entry) => entry.qrIdentifier === sanitizedQr)
    
    if (!table) return null

    // Force create a new session regardless of existing state
    const newSession = forceCreateSessionForTable(table)
    state.table = table
    state.session = newSession
    state.paymentRequested = Boolean(table.paymentRequested)
    state.paymentClosed = false
    persistPaymentClosedState(false)

    securityService.logSecurityEvent('ADMIN_FORCE_OPEN_TABLE', {
      tableId: table.id,
      qrIdentifier: sanitizedQr,
      sessionId: newSession.sessionId,
    })

    return { table, session: newSession }
  }

  const closeCurrentSession = () => {
    if (!state.session) return null

    const closedSession = closeSession(state.session)
    state.session = closedSession

    securityService.logSecurityEvent('SESSION_CLOSED_BY_ADMIN', {
      tableId: state.table?.id,
      sessionId: closedSession.sessionId,
    })

    return closedSession
  }

  const markPaymentRequested = () => {
    state.paymentRequested = true
    if (state.table) state.table.paymentRequested = true
  }

  return {
    session,
    table,
    paymentClosed,
    paymentRequested,
    sessionLockedForAnotherTable,
    setSession,
    resolveByQrIdentifier,
    ensureActiveSession,
    resetSession,
    invalidateAfterPayment,
    forceOpenTableByQrIdentifier,
    closeCurrentSession,
    markPaymentRequested,
    restoreSession: hydrateSessionTable,
  }
}
