import { computed, reactive } from 'vue'
import { collection, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { commitPaymentTransaction, createDocumentWithId, getCollectionSnapshot, updateDocument, upsertDocument } from '../services/firebase/firestore'
import type { OrderRecord } from '../services/orders/orders'
import { deduplicateTables, type TableRecord } from '../services/tables/tables'
import { getOrderBillableTotal } from '../utils/orderItemStatus'

// Convert Firestore Timestamp to ISO string
const normalizeTimestamp = (value: any): string => {
  if (!value) return new Date().toISOString()
  if (typeof value === 'string') return value
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object' && value.toDate) return value.toDate().toISOString()
  return new Date().toISOString()
}

// Normalize order data from Firestore
const normalizeOrder = (order: any): OrderRecord => ({
  ...order,
  createdAt: normalizeTimestamp(order.createdAt),
  updatedAt: normalizeTimestamp(order.updatedAt),
  paidAt: order.paidAt ? normalizeTimestamp(order.paidAt) : undefined,
})

const playOrderNotification = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()

    oscillator.connect(gain)
    gain.connect(audioContext.destination)

    oscillator.frequency.value = 1046.5
    oscillator.type = 'sine'
    gain.gain.setValueAtTime(0.3, audioContext.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  } catch {
    // Fallback: silent if audio context unavailable
  }
}

const state = reactive({
  orders: [] as OrderRecord[],
  tables: [] as TableRecord[],
  lastOrderId: null as string | null,
})

export function useOrdersLiveStore() {
  const orders = computed(() => state.orders)
  const tables = computed(() => state.tables)
  const lastOrderId = computed(() => state.lastOrderId)

  const hydrateFromFirestore = async () => {
    console.log('[ordersLiveStore] Starting hydration from Firebase...')
    if (!db) {
      console.error('[ordersLiveStore] ❌ Firebase not available. Business data must live in Firebase.')
      state.orders = []
      state.tables = []
      return
    }

    try {
      const [ordersSnapshot, tablesSnapshot] = await Promise.all([
        getCollectionSnapshot<OrderRecord>('orders'),
        getCollectionSnapshot<TableRecord>('tables'),
      ])

      state.orders = ordersSnapshot.map(order => normalizeOrder(order))
      state.tables = deduplicateTables(tablesSnapshot)
      console.log('[ordersLiveStore] ✅ Firebase data loaded:', {
        ordersCount: state.orders.length,
        tablesCount: state.tables.length,
        sample: state.orders[0] ? { id: state.orders[0].id, createdAt: state.orders[0].createdAt } : null,
      })
    } catch (error) {
      console.error('[ordersLiveStore] ❌ Failed to load from Firebase:', error)
      state.orders = []
      state.tables = []
    }
  }

  const listenForFirestoreChanges = () => {
    if (!db) {
      console.error('[ordersLiveStore] ❌ Firebase not available. Real-time sync requires Firebase.')
      return
    }

    try {
      console.log('[ordersLiveStore] Setting up onSnapshot listener for orders...')
      onSnapshot(collection(db, 'orders'), (snapshot) => {
        const incoming = snapshot.docs.map((document) => {
          const data = document.data()
          const normalized = normalizeOrder({ id: document.id, ...data })
          console.log('[ordersLiveStore] 📦 Order normalized:', { 
            id: normalized.id, 
            createdAt: normalized.createdAt,
            tableId: normalized.tableId 
          })
          return normalized
        })
        state.orders = incoming
        console.log('[ordersLiveStore] ✅ Orders synced:', incoming.length)
      }, (error) => {
        console.error('[ordersLiveStore] ❌ Error listening for orders:', error)
      })
    } catch (error) {
      console.error('[ordersLiveStore] ❌ Failed to attach orders listener:', error)
    }

    try {
      console.log('[ordersLiveStore] Setting up onSnapshot listener for tables...')
      onSnapshot(collection(db, 'tables'), (snapshot) => {
        const incoming = snapshot.docs.map((document) => ({ id: document.id, ...document.data() })) as TableRecord[]
        state.tables = deduplicateTables(incoming)
        console.log('[ordersLiveStore] ✅ Tables synced from Firestore:', incoming.map(t => ({ id: t.id, number: t.number, active: t.active })))
      }, (error) => {
        console.error('[ordersLiveStore] ❌ Error listening for tables:', error)
      })
    } catch (error) {
      console.error('[ordersLiveStore] ❌ Failed to attach tables listener:', error)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: OrderRecord['status']) => {
    const order = state.orders.find((item) => item.id === orderId)
    if (!order) return

    order.status = newStatus
    order.updatedAt = new Date().toISOString()
    if (newStatus === 'PAID') {
      order.paidAt = order.updatedAt
    }

    if (db) {
      try {
        await updateDocument('orders', orderId, {
          status: newStatus,
          updatedAt: order.updatedAt,
          paidAt: order.paidAt,
          paymentMethod: order.paymentMethod,
        })
      } catch (error) {
        console.warn('No se pudo sincronizar el estado del pedido con Firestore.', error)
      }
    }
  }

  const updateOrderItemStatus = async (
    orderId: string,
    itemIndex: number,
    status: 'ACCEPTED' | 'REJECTED',
    rejectionReason?: string,
  ) => {
    const order = state.orders.find((item) => item.id === orderId)
    if (!order || !order.items[itemIndex]) return

    const previousOrder = { ...order, items: [...order.items] }
    const items = order.items.map((item, index) => index === itemIndex
      ? {
          ...item,
          status,
          ...(status === 'REJECTED' && rejectionReason ? { rejectionReason } : { rejectionReason: undefined }),
        }
      : item)
    const total = getOrderBillableTotal(items)
    const updatedOrder = {
      ...order,
      items,
      total,
      updatedAt: new Date().toISOString(),
    }
    state.orders = state.orders.map((item) => item.id === orderId ? updatedOrder : item)

    if (db) {
      try {
        await updateDocument('orders', orderId, {
          items,
          total,
          status: updatedOrder.status,
          updatedAt: updatedOrder.updatedAt,
        })
      } catch (error) {
        state.orders = state.orders.map((item) => item.id === orderId ? previousOrder : item)
        console.warn('No se pudo actualizar el estado del producto pedido.', error)
        throw error
      }
    }
  }

  const addOrder = (order: OrderRecord) => {
    state.orders = [order, ...state.orders]
    state.lastOrderId = order.id
  }

  const clearOrders = () => {
    state.orders = []
  }

  const activateTableSession = async (tableId: string, sessionId: string) => {
    const tableIndex = state.tables.findIndex((table) => table.id === tableId)
    if (tableIndex < 0) return

    const updatedTable = {
      ...state.tables[tableIndex],
      active: true,
      currentSessionId: sessionId,
      updatedAt: new Date().toISOString(),
      ...(state.tables[tableIndex].currentSessionId !== sessionId
        ? {
            paymentRequested: false,
            paymentMethod: undefined,
            paymentSplitCount: undefined,
            paymentNote: undefined,
          }
        : {}),
    }

    state.tables = [
      ...state.tables.slice(0, tableIndex),
      updatedTable,
      ...state.tables.slice(tableIndex + 1),
    ]

    if (!db) return

    try {
      await upsertDocument('tables', tableId, updatedTable)
    } catch (error) {
      console.warn('No se pudo marcar la mesa como activa en Firestore.', error)
    }
  }

  const createOrder = async (input: {
    tableId: string
    sessionId: string
    clientTokenId?: string
    items: OrderRecord['items']
    note?: string
    total: number
  }) => {
    console.log('[ordersLiveStore] 📝 Creating order for table:', { 
      tableId: input.tableId, 
      sessionId: input.sessionId, 
      itemsCount: input.items.length,
      tablesInStore: state.tables.length
    })

    const table = state.tables.find((item) => item.id === input.tableId)
    const tablePaymentRequested = Boolean(table?.paymentRequested)
    const hasPaymentRequestForSession = state.orders.some((order) =>
      order.tableId === input.tableId &&
      order.sessionId === input.sessionId &&
      order.paymentRequested,
    )
    const paymentRequested = tablePaymentRequested || hasPaymentRequestForSession

    const order: OrderRecord = {
      id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tableId: input.tableId,
      sessionId: input.sessionId,
      ...(input.clientTokenId ? { clientTokenId: input.clientTokenId } : {}),
      items: input.items.map((item) => ({
        ...item,
        status: item.status ?? 'PENDING',
        ...(item.note ? { note: item.note } : {}),
      })),
      ...(input.note ? { note: input.note } : {}),
      total: input.total,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(paymentRequested
        ? {
            paymentRequested: true,
            paymentMethod: table?.paymentMethod ?? 'tarjeta',
            paymentSplitCount: Math.max(1, table?.paymentSplitCount ?? 1),
            paymentNote: table?.paymentNote,
          }
        : {}),
    }

    // Mark table as active when order is created
    const tableIndex = state.tables.findIndex((t) => t.id === input.tableId)
    console.log('[ordersLiveStore] 🔍 Searching for table:', { 
      tableId: input.tableId, 
      tableIndex,
      availableTables: state.tables.map(t => ({ id: t.id, number: t.number }))
    })
    
    if (tableIndex >= 0) {
      const table = state.tables[tableIndex]
      const updatedTable = {
        ...table,
        active: true,
        currentSessionId: input.sessionId,
        updatedAt: new Date().toISOString(),
        ...(paymentRequested
          ? {
              paymentRequested: true,
              paymentMethod: table.paymentMethod ?? 'tarjeta',
              paymentSplitCount: Math.max(1, table.paymentSplitCount ?? 1),
              paymentNote: table.paymentNote,
            }
          : {
              paymentRequested: false,
              paymentMethod: undefined,
              paymentSplitCount: undefined,
              paymentNote: undefined,
            }),
      }
      
      // Update local state immediately for real-time UI feedback using spread to trigger reactivity
      state.tables = [
        ...state.tables.slice(0, tableIndex),
        updatedTable,
        ...state.tables.slice(tableIndex + 1),
      ]
      console.log('[ordersLiveStore] ✅ Table marked as active locally:', { tableId: input.tableId, active: true, currentSessionId: input.sessionId })
      
      if (db) {
        try {
          await upsertDocument('tables', input.tableId, updatedTable)
          console.log('[ordersLiveStore] ✅ Table updated in Firestore:', { tableId: input.tableId, active: true })
        } catch (error) {
          console.error('[ordersLiveStore] ❌ Failed to mark table as active in Firestore:', { error, tableId: input.tableId })
        }
      }
    } else {
      console.error('[ordersLiveStore] ❌ TABLE NOT FOUND to mark as active!', { 
        requestedTableId: input.tableId,
        availableTableIds: state.tables.map(t => t.id),
        storeHasFirebase: !!db
      })
    }

    addOrder(order)
    playOrderNotification()

    if (db) {
      try {
        await createDocumentWithId('orders', order.id, order)
        console.log('[ordersLiveStore] ✅ Order created in Firestore:', { orderId: order.id })
      } catch (error) {
        console.error('[ordersLiveStore] ❌ Failed to save order in Firestore:', error)
        state.orders = state.orders.filter((item) => item.id !== order.id)
        throw error
      }
    }

    return order
  }

  const getOrdersByStatus = (status: OrderRecord['status']) =>
    state.orders.filter((order) => order.status === status)

  const getTableOrders = (tableId: string) =>
    state.orders.filter((order) => order.tableId === tableId)

  const getTableSessionOrders = (tableId: string, sessionId: string) =>
    state.orders.filter((order) => order.tableId === tableId && order.sessionId === sessionId)

  const getTableHistory = (tableId: string) =>
    [...state.orders]
      .filter((order) => order.tableId === tableId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const getPaidHistory = () =>
    [...state.orders]
      .filter((order) => order.status === 'PAID')
      .sort((a, b) => new Date(b.paidAt ?? b.updatedAt).getTime() - new Date(a.paidAt ?? a.updatedAt).getTime())

  const getTableTotal = (tableId: string) =>
    getTableOrders(tableId).reduce((sum, order) => sum + (order.status === 'PAID' ? 0 : order.total), 0)

  const requestPayment = async (
    tableId: string,
    paymentMethod: 'efectivo' | 'tarjeta' = 'efectivo',
    paymentSplitCount = 1,
    sessionId?: string,
    paymentNote?: string,
  ) => {
    const table = state.tables.find((item) => item.id === tableId)
    if (!table) return

    table.paymentRequested = true
    table.paymentMethod = paymentMethod
    table.paymentSplitCount = Math.max(1, paymentSplitCount)
    table.paymentNote = paymentNote?.trim().slice(0, 250) || undefined
    table.updatedAt = new Date().toISOString()

    state.orders = state.orders.map((order) => {
      if (order.tableId !== tableId || (sessionId && order.sessionId !== sessionId)) return order
      return {
        ...order,
        paymentRequested: true,
        paymentMethod,
        paymentSplitCount: Math.max(1, paymentSplitCount),
        paymentNote: paymentNote?.trim().slice(0, 250) || undefined,
        updatedAt: new Date().toISOString(),
      }
    })

    if (db) {
      try {
        await Promise.all(
          state.orders
            .filter((order) => order.tableId === tableId && (!sessionId || order.sessionId === sessionId))
            .map((order) => updateDocument('orders', order.id, {
              paymentRequested: true,
              paymentMethod,
              paymentSplitCount: Math.max(1, paymentSplitCount),
              paymentNote: paymentNote?.trim().slice(0, 250) || undefined,
              updatedAt: order.updatedAt,
            })),
        )
        // The customer can update their own order, but not the table document.
        // Send this after the order updates so POS always receives the request.
        await upsertDocument('tables', tableId, table)
      } catch (error) {
        console.warn('No se pudo sincronizar la solicitud de pago con Firestore.', error)
      }
    }
  }

  const closeTable = async (tableId: string) => {
    const table = state.tables.find((item) => item.id === tableId)
    if (!table) return

    table.active = false
    table.currentSessionId = null
    table.paymentRequested = false
    table.paymentMethod = undefined
    table.paymentSplitCount = undefined
    table.paymentNote = undefined
    table.updatedAt = new Date().toISOString()

    if (db) {
      try {
        await upsertDocument('tables', tableId, table)
      } catch (error) {
        console.warn('No se pudo cerrar la mesa en Firestore.', error)
      }
    }
  }

  const finalizeTable = async (
    tableId: string,
    paymentMethod: 'efectivo' | 'tarjeta' = 'efectivo',
    sessionId?: string,
    paidBy?: string,
  ) => {
    const now = new Date().toISOString()
    const ordersToPay = state.orders.filter((order) =>
      order.tableId === tableId &&
      (!sessionId || order.sessionId === sessionId) &&
      order.status !== 'PAID' &&
      (order.status !== 'CANCELLED' || order.items.some((item) => item.status === 'REJECTED')),
    )
    const previousOrders = state.orders

    state.orders = state.orders.map((order) => {
      if (order.tableId !== tableId || (sessionId && order.sessionId !== sessionId)) return order

      return {
        ...order,
        status: 'PAID',
        total: getOrderBillableTotal(order.items),
        paymentRequested: false,
        paymentSplitCount: undefined,
        paymentNote: undefined,
        paymentMethod,
        paidAt: now,
        updatedAt: now,
      }
    })

    const table = state.tables.find((item) => item.id === tableId)
  const previousTable = table ? { ...table } : null
    if (table) {
      table.active = false
      table.currentSessionId = null
      table.paymentRequested = false
      table.paymentMethod = undefined
      table.paymentSplitCount = undefined
      table.paymentNote = undefined
      table.updatedAt = now
    }

    if (db && table && ordersToPay.length) {
      const paymentId = `payment-${tableId}-${sessionId ?? 'session'}-${Date.now()}`
      const orderUpdates = ordersToPay.map((order) => ({
        id: order.id,
        data: {
          status: 'PAID',
          total: getOrderBillableTotal(order.items),
          paymentRequested: false,
          paymentSplitCount: undefined,
          paymentNote: undefined,
          paymentMethod,
          paidAt: now,
          updatedAt: now,
        },
      }))

      try {
        await commitPaymentTransaction(
          paymentId,
          {
            id: paymentId,
            tableId,
            sessionId: sessionId ?? ordersToPay[0].sessionId,
            orderIds: ordersToPay.map((order) => order.id),
            total: ordersToPay.reduce((sum, order) => sum + getOrderBillableTotal(order.items), 0),
            paymentMethod,
            splitCount: ordersToPay[0].paymentSplitCount ?? 1,
            paidAt: now,
            paidBy: paidBy ?? null,
            status: 'PAID',
            createdAt: now,
            updatedAt: now,
          },
          orderUpdates,
          { id: tableId, data: table },
        )
      } catch (error) {
        state.orders = previousOrders
        if (previousTable) {
          state.tables = state.tables.map((item) => item.id === tableId ? previousTable : item)
        }
        console.warn('No se pudo confirmar el pago de forma atomica en Firestore.', error)
        throw error
      }
    }
  }

  return {
    orders,
    tables,
    lastOrderId,
    hydrateFromFirestore,
    listenForFirestoreChanges,
    updateOrderStatus,
    updateOrderItemStatus,
    addOrder,
    clearOrders,
    activateTableSession,
    createOrder,
    getOrdersByStatus,
    getTableOrders,
    getTableSessionOrders,
    getTableHistory,
    getPaidHistory,
    getTableTotal,
    requestPayment,
    closeTable,
    finalizeTable,
  }
}
