<template>
  <div class="pos-layout">
    <div v-if="rejectionDialog.open" class="rejection-modal-overlay" @click="closeRejectionDialog">
      <div class="rejection-modal" @click.stop>
        <button class="rejection-close" type="button" aria-label="Cerrar" @click="closeRejectionDialog">×</button>
        <p class="rejection-eyebrow">Producto no disponible</p>
        <h2>Rechazar {{ rejectionDialog.itemName }}</h2>
        <p class="rejection-help">El importe se descontará de la cuenta del cliente.</p>
        <div class="rejection-reasons">
          <button v-for="reason in rejectionReasons" :key="reason" type="button" :class="{ selected: rejectionDialog.reason === reason }" @click="rejectionDialog.reason = reason">{{ reason }}</button>
        </div>
        <textarea v-model="rejectionDialog.reason" rows="3" placeholder="Añade un motivo si lo necesitas..." />
        <div class="rejection-actions">
          <button type="button" class="rejection-cancel" @click="closeRejectionDialog">Cancelar</button>
          <button type="button" class="rejection-confirm" @click="confirmRejection">Confirmar rechazo</button>
        </div>
      </div>
    </div>
    <!-- PAYMENT MODAL -->
    <div v-if="paymentModal.show" class="payment-modal-overlay" @click="closePaymentModal">
      <div class="payment-modal" @click.stop>
        <button class="close-btn" @click="closePaymentModal">✕</button>
        
        <h2>💳 PROCESAR PAGO</h2>
        <p class="modal-subtitle">Mesa {{ paymentModal.tableNumber }}</p>
        
        <div class="payment-details">
          <div class="items-section">
            <h3>📦 Artículos</h3>
            <div class="items-list">
              <div v-for="item in paymentModal.items" :key="item.key" class="payment-item">
                <span class="payment-qty">{{ item.quantity }}×</span>
                <span class="payment-name" :class="{ 'rejected-payment-name': item.rejected }">
                  {{ item.name }}{{ item.rejected ? ' · Rechazado' : '' }}
                </span>
                <span class="payment-price" :class="{ 'rejected-payment-price': item.rejected }">
                  {{ item.rejected ? 'NO COBRADO' : formatPrice(item.subtotal) }}
                </span>
              </div>
            </div>
          </div>

          <div class="totals-section">
            <div class="total-line">
              <span>Subtotal</span>
              <strong>{{ formatPrice(paymentModal.subtotal) }}</strong>
            </div>
            <div class="divider"></div>
            <div class="split-controls">
              <label>Dividir por {{ paymentModal.splitCount }} personas</label>
            </div>
            <div class="divider"></div>
            <div class="total-line highlight">
              <span>Por persona</span>
              <strong>{{ formatPrice(paymentModal.perPerson) }}</strong>
            </div>
            <div class="divider"></div>
            <div class="total-line final">
              <span>TOTAL A COBRAR</span>
              <strong>{{ formatPrice(paymentModal.subtotal) }}</strong>
            </div>
          </div>

          <div class="payment-method-section">
            <h3>Reparto del cobro</h3>
            <p class="payment-split-help">Indica cuántas personas pagan con cada método.</p>
            <div class="payment-split-grid">
              <label class="payment-split-field">
                <span>💵 Efectivo</span>
                <input
                  :value="paymentModal.cashPeople"
                  type="number"
                  min="0"
                  :max="paymentModal.splitCount"
                  @input="setCashPeople(($event.target as HTMLInputElement).valueAsNumber)"
                />
                <small>{{ formatPrice(paymentCashAmount) }}</small>
              </label>
              <label class="payment-split-field">
                <span>💳 Tarjeta</span>
                <input
                  :value="paymentModal.cardPeople"
                  type="number"
                  min="0"
                  :max="paymentModal.splitCount"
                  @input="setCardPeople(($event.target as HTMLInputElement).valueAsNumber)"
                />
                <small>{{ formatPrice(paymentCardAmount) }}</small>
              </label>
            </div>
            <p class="payment-split-total" :class="{ invalid: !paymentPeopleValid }">
              {{ paymentModal.cashPeople + paymentModal.cardPeople }} de {{ paymentModal.splitCount }} personas asignadas
            </p>
          </div>

          <div v-if="paymentModal.method === 'tarjeta'" class="payment-info">
            <p>⚠️ Asegúrate de cobrar por tarjeta antes de confirmar</p>
          </div>

          <div v-if="paymentModal.note" class="payment-note">
            <strong>Nota del cliente</strong>
            <p>{{ paymentModal.note }}</p>
          </div>

          <div class="payment-actions">
            <button class="cancel-btn" @click="closePaymentModal">Cancelar</button>
            <button class="confirm-btn" :disabled="!paymentPeopleValid" @click="confirmPayment">
              ✅ Cobrar {{ formatPrice(paymentModal.subtotal) }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>🪑 Mesas del Restaurante</h2>
        <p class="sidebar-subtitle">{{ activeTables }}/30 activas</p>
      </div>

      <div class="tables-list">
        <div
          v-for="table in tables"
          :key="table.id"
          class="table-card"
          :class="{ active: table.active, empty: !table.active }"
        >
          <div class="table-number">{{ table.number }}</div>
          <div class="table-info">
            <p class="table-name">Mesa {{ table.number }}</p>
            <p class="table-status">{{ table.active ? '🔴 Activa' : '🟢 Libre' }}</p>
          </div>
        </div>
      </div>

      <div class="sidebar-footer">
        <p class="footer-text">💡 Sistema TPV en vivo</p>
      </div>
    </aside>

    <main class="content">
      <div class="topbar">
        <div class="topbar-left">
          <p class="eyebrow">📋 Gestor de Camareros</p>
          <h1>Pedidos en Tiempo Real</h1>
          <p class="topbar-subtitle">Monitoriza y gestiona todos los pedidos del restaurante</p>
          <p v-if="sessionExpiresAt" class="session-info">⏱️ Sesión expira: {{ formatSessionTime }}</p>
        </div>
        <div class="topbar-right">
          <div class="stats-mini">
            <div class="stat-mini pending">
              <span class="value">{{ pendingCount }}</span>
              <p>Nuevos</p>
            </div>
            <div class="stat-mini preparing">
              <span class="value">{{ preparingCount }}</span>
              <p>En Cocina</p>
            </div>
            <div class="stat-mini ready">
              <span class="value">{{ readyCount }}</span>
              <p>Listos</p>
            </div>
          </div>
          <button class="logout-btn" @click="handleLogout">🚪 Cerrar sesión</button>
        </div>
      </div>

      <section class="orders-board">
        <section v-for="lane in orderLanes" :key="lane.key" class="order-lane" :class="lane.key.toLowerCase()">
          <header class="lane-header">
            <div>
              <span class="lane-kicker">{{ lane.kicker }}</span>
              <h2>{{ lane.title }}</h2>
            </div>
            <span class="lane-count">{{ ordersForLane(lane.statuses).length }}</span>
          </header>

          <div v-if="ordersForLane(lane.statuses).length" class="lane-orders">
            <article
              v-for="order in ordersForLane(lane.statuses)"
              :key="order.id"
              class="order-card"
              :class="order.status.toLowerCase()"
            >
          <div class="card-status-bar" :class="order.status.toLowerCase()"></div>

          <div class="card-header">
            <div class="table-badge" :class="order.status.toLowerCase()">
              MESA {{ getTableLabel(order.tableId) }}
            </div>
            <div class="card-header-meta">
              <span class="order-id">Pedido {{ getOrderNumber(order.id) }}</span>
            </div>
          </div>

          <div class="card-time">
            <span>⏱️ {{ formatTime(order.createdAt) }}</span>
          </div>

          <div class="card-items">
            <h4>Artículos:</h4>
            <ul>
              <li v-for="(item, itemIndex) in order.items" :key="`${order.id}-${itemIndex}`" class="item" :class="{ rejected: item.status === 'REJECTED' }">
                <span class="qty">{{ item.quantity }}×</span>
                <span class="name">{{ item.name }}</span>
                <span v-if="item.status === 'REJECTED'" class="rejected-label">Rechazado</span>
                <button v-else type="button" class="reject-item-btn" @click="rejectOrderItem(order.id, itemIndex)">Rechazar</button>
              </li>
            </ul>
          </div>

          <div v-if="order.note" class="card-note">
            <strong>📝 Nota:</strong> {{ order.note }}
          </div>

          <div class="card-total">
            <span>Total:</span>
            <strong>{{ formatPrice(order.total) }}</strong>
          </div>

          <button
            v-if="isPaymentRequested(order)"
            class="status-btn payment"
            :class="getPaymentMethod(order)"
            @click="openPaymentModal(order.tableId)"
          >
            {{ getPaymentActionLabel(order) }}
          </button>

          <button
            v-else-if="order.status === 'DELIVERED'"
            class="status-btn payment tarjeta"
            @click="openPaymentModal(order.tableId)"
          >
            💳 Pagar mesa
          </button>

          <div
            v-else-if="order.items.every((item) => item.status === 'REJECTED')"
            class="status-btn rejected-order-status"
          >
            ⚠️ Comanda cerrada · producto rechazado
          </div>

          <button
            v-else
            class="status-btn"
            :class="order.status.toLowerCase()"
            @click="updateOrderStatus(order.id, nextStatus(order.status))"
          >
            {{ getStatusEmoji(order.status) }} {{ nextLabel(order.status) }}
          </button>

            </article>
          </div>

          <div v-else class="lane-empty">No hay comandas aquí</div>
        </section>

        <div v-if="paginatedOrders.length === 0" class="empty-orders compact-empty">
          <span>Sin pedidos</span>
        </div>
      </section>

      <div v-if="pageCount > 1" class="pagination">
        <p class="pagination-summary">Mostrando {{ paginationStart }}–{{ paginationEnd }} de {{ visibleOrders.length }} pedidos</p>
        <div class="pagination-controls">
          <button class="page-btn previous" :disabled="currentPage === 1" @click="currentPage = Math.max(1, currentPage - 1)">← Anterior</button>
          <span class="page-indicator">Página <strong>{{ currentPage }}</strong> de {{ pageCount }}</span>
          <button class="page-btn next" :disabled="currentPage === pageCount" @click="currentPage = Math.min(pageCount, currentPage + 1)">Siguiente →</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdersLiveStore } from '../../stores/ordersLiveStore'
import { useAuthStore } from '../../stores/authStore'
import type { OrderRecord } from '../../services/orders/orders'
import { isOrderItemRejected } from '../../utils/orderItemStatus'

const router = useRouter()
const { logout, user, sessionExpiresAt } = useAuthStore()
const { orders, tables, updateOrderStatus, updateOrderItemStatus, finalizeTable } = useOrdersLiveStore()

const rejectionReasons = ['Agotado', 'Falta un ingrediente', 'No se puede preparar', 'Otro motivo']
const rejectionDialog = reactive({ open: false, orderId: '', itemIndex: -1, itemName: '', reason: '' })

const rejectOrderItem = (orderId: string, itemIndex: number) => {
  const order = orders.value.find((item) => item.id === orderId)
  const item = order?.items[itemIndex]
  if (!item) return
  rejectionDialog.open = true
  rejectionDialog.orderId = orderId
  rejectionDialog.itemIndex = itemIndex
  rejectionDialog.itemName = item.name
  rejectionDialog.reason = ''
}

const closeRejectionDialog = () => {
  rejectionDialog.open = false
}

const confirmRejection = async () => {
  if (rejectionDialog.itemIndex < 0) return
  await updateOrderItemStatus(rejectionDialog.orderId, rejectionDialog.itemIndex, 'REJECTED', rejectionDialog.reason.trim() || undefined)
  closeRejectionDialog()
}

// Payment Modal State
const paymentModal = ref({
  show: false,
  tableId: '',
  tableNumber: '',
  items: [] as Array<{ key: string; productId: string; name: string; quantity: number; subtotal: number; rejected?: boolean; rejectionReason?: string }>,
  subtotal: 0,
  splitCount: 1,
  method: 'tarjeta' as 'efectivo' | 'tarjeta',
  cashPeople: 0,
  cardPeople: 1,
  perPerson: 0,
  note: '',
})

const sanitizeSplitCount = (value: number) => {
  const parsed = Number.isFinite(value) ? Math.trunc(value) : 1
  return Math.min(50, Math.max(1, parsed))
}

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

const paymentPeopleValid = computed(() =>
  paymentModal.value.cashPeople >= 0 &&
  paymentModal.value.cardPeople >= 0 &&
  paymentModal.value.cashPeople + paymentModal.value.cardPeople === paymentModal.value.splitCount,
)

const paymentCashAmount = computed(() => {
  if (!paymentPeopleValid.value) return 0
  return roundCurrency(paymentModal.value.subtotal * paymentModal.value.cashPeople / paymentModal.value.splitCount)
})

const paymentCardAmount = computed(() => roundCurrency(paymentModal.value.subtotal - paymentCashAmount.value))

const setCashPeople = (value: number) => {
  const cashPeople = Math.min(paymentModal.value.splitCount, Math.max(0, Math.trunc(Number.isFinite(value) ? value : 0)))
  paymentModal.value.cashPeople = cashPeople
  paymentModal.value.cardPeople = paymentModal.value.splitCount - cashPeople
}

const setCardPeople = (value: number) => {
  const cardPeople = Math.min(paymentModal.value.splitCount, Math.max(0, Math.trunc(Number.isFinite(value) ? value : 0)))
  paymentModal.value.cardPeople = cardPeople
  paymentModal.value.cashPeople = paymentModal.value.splitCount - cardPeople
}

const openPaymentModal = (tableId: string) => {
  const table = tables.value.find(t => t.id === tableId)
  const tableOrders = orders.value.filter((order) =>
    order.tableId === tableId &&
    (!table?.currentSessionId || order.sessionId === table.currentSessionId) &&
    order.status !== 'PAID' &&
    order.status !== 'CANCELLED',
  )
  const mergedItems = new Map<string, { key: string; productId: string; name: string; quantity: number; subtotal: number; rejected?: boolean; rejectionReason?: string }>()
  tableOrders.forEach((order) => {
    order.items.forEach((item) => {
      const rejected = isOrderItemRejected(item)
      const key = `${item.productId}-${item.status ?? 'PENDING'}-${item.note ?? ''}-${(item.options ?? []).join(',')}`
      const current = mergedItems.get(key)
      if (current) {
        current.quantity += item.quantity
        current.subtotal += rejected ? 0 : item.subtotal
      } else {
        mergedItems.set(key, {
          key,
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          subtotal: rejected ? 0 : item.subtotal,
          ...(rejected ? { rejected: true, rejectionReason: item.rejectionReason } : {}),
        })
      }
    })
  })
  const items = [...mergedItems.values()]
  const subtotal = tableOrders.reduce((sum, order) => sum + order.items.reduce((orderTotal, item) =>
    orderTotal + (isOrderItemRejected(item) ? 0 : item.subtotal), 0), 0)
  const paymentRequest = tableOrders.find((order) => order.paymentRequested)
  const splitCount = sanitizeSplitCount(paymentRequest?.paymentSplitCount ?? table?.paymentSplitCount ?? 1)
  const method = paymentRequest?.paymentMethod ?? table?.paymentMethod ?? 'tarjeta'
  const note = paymentRequest?.paymentNote ?? table?.paymentNote ?? ''
  paymentModal.value = {
    show: true,
    tableId,
    tableNumber: table ? String(table.number) : '—',
    items,
    subtotal,
    splitCount,
    method,
    cashPeople: method === 'efectivo' ? splitCount : 0,
    cardPeople: method === 'tarjeta' ? splitCount : 0,
    perPerson: subtotal / splitCount,
    note,
  }
}

const closePaymentModal = () => {
  paymentModal.value.show = false
}

const confirmPayment = async () => {
  if (!paymentPeopleValid.value) return
  try {
    const table = tables.value.find((item) => item.id === paymentModal.value.tableId)
    await finalizeTable(
      paymentModal.value.tableId,
      paymentModal.value.method,
      table?.currentSessionId ?? undefined,
      user.value?.email,
      {
        cashPeople: paymentModal.value.cashPeople,
        cardPeople: paymentModal.value.cardPeople,
        cashAmount: paymentCashAmount.value,
        cardAmount: paymentCardAmount.value,
      },
    )
    closePaymentModal()
  } catch (error) {
    console.error('Error processing payment:', error)
  }
}

watch(() => paymentModal.value.splitCount, (newCount) => {
  const safeCount = sanitizeSplitCount(Number(newCount) || 1)
  paymentModal.value.splitCount = safeCount
  paymentModal.value.perPerson = paymentModal.value.subtotal / safeCount
})

const formatSessionTime = computed(() => {
  if (!sessionExpiresAt.value) return ''
  const expiresAt = new Date(sessionExpiresAt.value)
  return expiresAt.toLocaleString([], {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
})

const handleLogout = async () => {
  await logout()
  router.replace('/login')
}

const isPaymentRequested = (order: OrderRecord) =>
  order.status === 'DELIVERED' && Boolean(order.paymentRequested)

const getPaymentMethod = (order: OrderRecord) =>
  order.paymentMethod
    ?? 'tarjeta'

const getPaymentActionLabel = (order: OrderRecord) =>
  getPaymentMethod(order) === 'tarjeta' ? 'Cobrar con tarjeta' : 'Cobrar en efectivo'

const mergeOrderItems = (ordersToMerge: OrderRecord[]) => {
  const mergedMap = new Map<string, { key: string; productId: string; name: string; price: number; quantity: number; subtotal: number }>()

  ordersToMerge.forEach((order) => {
    order.items.forEach((item) => {
      if (isOrderItemRejected(item)) return
      const key = `${item.productId}-${item.note ?? ''}-${(item.options ?? []).join(',')}`
      const existing = mergedMap.get(key)

      if (existing) {
        existing.quantity += item.quantity
        existing.subtotal += item.subtotal
      } else {
        mergedMap.set(key, {
          key,
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.subtotal,
        })
      }
    })
  })

  return [...mergedMap.values()]
}

const mergePaymentRequestedOrders = (sourceOrders: OrderRecord[]) => {
  const merged: OrderRecord[] = []
  const tableGroups = new Map<string, OrderRecord[]>()
  sourceOrders.forEach((order) => {
    if (order.paymentRequested && order.status === 'DELIVERED') {
      const group = tableGroups.get(order.tableId) ?? []
      group.push(order)
      tableGroups.set(order.tableId, group)
    } else {
      merged.push(order)
    }
  })

  tableGroups.forEach((group) => {
    const primary = group[0]
    const tableOrders = [...group].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    merged.push({
      ...primary,
      id: `table-${primary.tableId}-payment`,
      items: mergeOrderItems(tableOrders),
      total: tableOrders.reduce((sum, order) => sum + order.total, 0),
      note: tableOrders
        .map((order) => order.note)
        .filter((note): note is string => Boolean(note && note.trim()))
        .join(' | ') || primary.note,
      createdAt: tableOrders[0].createdAt,
      updatedAt: tableOrders[tableOrders.length - 1]?.updatedAt ?? primary.updatedAt,
      paymentRequested: true,
      paymentMethod: primary.paymentMethod ?? tableOrders[0].paymentMethod ?? 'tarjeta',
      paymentSplitCount: primary.paymentSplitCount ?? tableOrders[0].paymentSplitCount ?? 1,
      paymentNote: primary.paymentNote ?? tableOrders[0].paymentNote,
    })
  })

  return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

const visibleOrders = computed(() => {
  const filtered = orders.value
    .filter((order) => order.status !== 'PAID' && order.status !== 'CANCELLED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return mergePaymentRequestedOrders(filtered)
})

const pageSize = 4
const currentPage = ref(1)
const pageCount = computed(() => Math.max(1, Math.ceil(visibleOrders.value.length / pageSize)))
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return visibleOrders.value.slice(start, start + pageSize)
})

const orderLanes = [
  { key: 'PENDING', kicker: '01', title: 'Nuevos', statuses: ['PENDING'] as OrderRecord['status'][] },
  { key: 'PREPARING', kicker: '02', title: 'En preparación', statuses: ['PREPARING'] as OrderRecord['status'][] },
  { key: 'READY', kicker: '03', title: 'Listos', statuses: ['READY', 'DELIVERED'] as OrderRecord['status'][] },
]

const ordersForLane = (statuses: OrderRecord['status'][]) =>
  paginatedOrders.value.filter((order) => statuses.includes(order.status))

const paginationStart = computed(() => (currentPage.value - 1) * pageSize + 1)
const paginationEnd = computed(() => Math.min(currentPage.value * pageSize, visibleOrders.value.length))

watch(visibleOrders, () => {
  if (currentPage.value > pageCount.value) {
    currentPage.value = pageCount.value
  }
})

const getTableLabel = (tableId: string) => {
  const match = tables.value.find((table) => table.id === tableId)
  return match ? String(match.number).padStart(2, '0') : '—'
}

const formatTime = (value: string | undefined) => {
  if (!value) return '—'
  try {
    const date = new Date(value)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

const getOrderNumber = (orderId: string) => {
  const index = paginatedOrders.value.findIndex(o => o.id === orderId)
  return index >= 0 ? index + 1 : '—'
}
const formatPrice = (value: number) => `${value.toFixed(2)} €`

const activeTables = computed(() => tables.value.filter((t) => t.active).length)
const pendingCount = computed(() => visibleOrders.value.filter((o) => o.status === 'PENDING').length)
const preparingCount = computed(() => visibleOrders.value.filter((o) => o.status === 'PREPARING').length)
const readyCount = computed(() => visibleOrders.value.filter((o) => o.status === 'READY').length)

const sequence: OrderRecord['status'][] = ['PENDING', 'PREPARING', 'READY', 'DELIVERED']

const nextStatus = (status: OrderRecord['status']) => {
  if (status === 'PAID' || status === 'CANCELLED' || status === 'DELIVERED') return 'DELIVERED'
  const index = sequence.indexOf(status)
  return sequence[Math.min(index + 1, sequence.length - 1)]
}

const nextLabel = (status: OrderRecord['status']) => {
  if (status === 'PENDING') return 'Pasando a Cocina'
  if (status === 'PREPARING') return 'Marcar como Listo'
  if (status === 'READY') return 'Entregar a Mesa'
  return 'Completado'
}

const getStatusEmoji = (status: OrderRecord['status']) => {
  if (status === 'PENDING') return '🎯'
  if (status === 'PREPARING') return '👨‍🍳'
  if (status === 'READY') return '✅'
  return '🚀'
}

</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.pos-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
  background: #eef2f6;
  min-width: 0;
}

.logout-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  margin-left: 16px;
}

.logout-btn:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.logout-btn:active {
  transform: translateY(0);
}

/* ==================== SIDEBAR ==================== */
.sidebar {
  background: #172235;
  color: white;
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-shadow: 8px 0 24px rgba(15, 23, 42, 0.1);
  overflow: hidden;
  min-width: 0;
}

.sidebar-header {
  padding: 24px 20px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sidebar-header h2 {
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: 6px;
}

.sidebar-subtitle {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  font-weight: 600;
}

.tables-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 12px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.tables-list::-webkit-scrollbar {
  width: 6px;
}

.tables-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.tables-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.table-card {
  background: rgba(255, 255, 255, 0.06);
  padding: 14px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  backdrop-filter: blur(10px);
}

.table-card:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateX(4px);
}

.table-card.active {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(245, 158, 11, 0.1) 100%);
  border-color: #f59e0b;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
}

.table-card.empty:hover {
  background: rgba(34, 197, 94, 0.1);
  border-color: #22c55e;
}

.table-number {
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  font-weight: 800;
  font-size: 1.1rem;
}

.table-card.active .table-number {
  background: #f59e0b;
  color: white;
}

.table-info {
  flex: 1;
}

.table-name {
  font-weight: 700;
  margin: 0 0 2px;
  font-size: 0.95rem;
}

.table-status {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.footer-text {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  font-weight: 600;
}

/* ==================== CONTENT ==================== */
.content {
  padding: 24px clamp(18px, 2.6vw, 36px) 40px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  scrollbar-width: none;
  -ms-overflow-style: none;
  min-width: 0;
  min-height: 0;
}

.content::-webkit-scrollbar {
  display: none;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: white;
  padding: 24px clamp(20px, 2.5vw, 30px);
  border-radius: 16px;
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  gap: 32px;
}

.topbar-left {
  flex: 1;
  min-width: 0;
}

.eyebrow {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #6b7280;
  margin-bottom: 8px;
}

.topbar h1 {
  font-size: clamp(1.55rem, 2.6vw, 2rem);
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 6px;
  letter-spacing: -0.03em;
}

.topbar-subtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
}

.session-info {
  font-size: 0.85rem;
  color: #f59e0b;
  margin-top: 12px;
  font-weight: 600;
  padding: 8px 12px;
  background: #fef3c7;
  border-radius: 8px;
  border-left: 3px solid #f59e0b;
  display: inline-block;
}

.topbar-right {
  display: flex;
  align-items: center;
  min-width: 0;
}

.stats-mini {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-mini {
  text-align: center;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.stat-mini:hover {
  transform: translateY(-2px);
}

.stat-mini.pending {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%);
  border-left: 3px solid #f59e0b;
}

.stat-mini.preparing {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%);
  border-left: 3px solid #3b82f6;
}

.stat-mini.ready {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.05) 100%);
  border-left: 3px solid #22c55e;
}

.stat-mini .value {
  display: block;
  font-size: 1.8rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 4px;
}

.stat-mini p {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 600;
  margin: 0;
}

.filters {
  display: flex;
  gap: 12px;
  margin-bottom: 22px;
  padding: 4px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
  padding-bottom: 16px;
  overflow-x: auto;
}

.filters::-webkit-scrollbar {
  height: 4px;
}

.filters::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.filter-btn {
  padding: 10px 18px;
  border: 1px solid transparent;
  background: transparent;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-size: 0.9rem;
}

.filter-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.filter-btn.active {
  background: #1d4ed8;
  color: white;
  border-color: #3b82f6;
}

/* ==================== ORDERS GRID ==================== */
.orders-board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  flex: 1;
  align-content: start;
  min-width: 0;
  padding-bottom: 12px;
}

.order-lane {
  min-width: 0;
  padding: 12px;
  border: 1px solid #dbe4ee;
  border-top: 4px solid #f59e0b;
  border-radius: 16px;
  background: #f8fafc;
}

.order-lane.preparing {
  border-top-color: #3b82f6;
}

.order-lane.ready {
  border-top-color: #22c55e;
}

.lane-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 58px;
  padding: 2px 4px 12px;
}

.lane-kicker {
  display: block;
  margin-bottom: 3px;
  color: #94a3b8;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.12em;
}

.lane-header h2 {
  margin: 0;
  color: #172033;
  font-size: 1rem;
  font-weight: 850;
}

.lane-count {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: #fff;
  color: #172033;
  font-size: 0.9rem;
  font-weight: 900;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.lane-orders {
  display: grid;
  gap: 14px;
}

.lane-empty {
  display: grid;
  place-items: center;
  min-height: 110px;
  padding: 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  color: #94a3b8;
  font-size: 0.8rem;
  font-weight: 700;
  text-align: center;
}

.order-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
  transition: all 0.3s ease;
  animation: cardSlideIn 0.4s ease;
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.order-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
}

.card-status-bar {
  width: 100%;
  min-height: 5px;
  height: 5px;
  background: #f59e0b;
}

.card-status-bar.preparing {
  background: #3b82f6;
}

.card-status-bar.ready {
  background: #22c55e;
}

.card-status-bar.delivered {
  background: #6b7280;
}

.order-card > * {
  padding: 0 18px;
}

.order-card > *:first-of-type {
  padding-top: 16px;
}

.card-header {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  padding-top: 20px !important;
  padding-bottom: 10px !important;
  gap: 8px;
}

.card-header-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.table-badge {
  background: #f59e0b;
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
}

.table-badge.preparing {
  background: #3b82f6;
}

.table-badge.ready {
  background: #22c55e;
}

.table-badge.delivered {
  background: #9ca3af;
}

.order-id {
  font-size: 0.85rem;
  color: #9ca3af;
  font-weight: 600;
}

.card-time {
  padding-bottom: 12px !important;
  font-size: 0.9rem;
  color: #9ca3af;
  font-weight: 600;
}

.card-items {
  padding-bottom: 14px !important;
  background: #f8fafc;
  border-radius: 10px;
  margin: 0 18px 14px;
  padding: 14px !important;
}

.card-items h4 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  font-weight: 700;
  margin: 0 0 8px;
}

.card-items ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.item {
  min-height: 42px;
  padding: 8px 0;
  font-size: 0.95rem;
  color: #1e293b;
  display: flex;
  gap: 10px;
  line-height: 1.4;
  min-width: 0;
}

.item.rejected {
  color: #991b1b;
  text-decoration: line-through;
}

.rejected-label {
  flex: 0 0 auto;
  color: #b91c1c;
  font-size: 0.7rem;
  font-weight: 800;
  text-decoration: none;
  text-transform: uppercase;
}

.reject-item-btn {
  flex: 0 0 auto;
  border: 1px solid #fecaca;
  border-radius: 8px;
  min-height: 32px;
  padding: 5px 9px;
  background: #fff1f2;
  color: #b91c1c;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 800;
}

.rejected-order-status {
  width: auto;
  margin: 10px 18px 14px;
  border-radius: 12px;
  background: #fff1f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  cursor: default;
  text-align: center;
}

.rejection-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.68);
}

.rejection-modal {
  position: relative;
  width: min(100%, 460px);
  padding: 26px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.3);
}

.rejection-close {
  position: absolute;
  top: 12px;
  right: 14px;
  border: 0;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  font-size: 1.6rem;
}

.rejection-eyebrow {
  margin: 0;
  color: #b91c1c;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.rejection-modal h2 {
  margin: 6px 28px 6px 0;
  color: #172033;
  font-size: 1.35rem;
}

.rejection-help {
  margin: 0 0 18px;
  color: #64748b;
  font-size: 0.9rem;
}

.rejection-reasons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.rejection-reasons button {
  border: 1px solid #fecaca;
  border-radius: 999px;
  padding: 8px 10px;
  background: #fff7f7;
  color: #991b1b;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 700;
}

.rejection-reasons button.selected {
  background: #b91c1c;
  color: #ffffff;
}

.rejection-modal textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 11px 12px;
  color: #172033;
  font: inherit;
}

.rejection-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
}

.rejection-cancel,
.rejection-confirm {
  border: 0;
  border-radius: 10px;
  padding: 11px 14px;
  cursor: pointer;
  font-weight: 800;
}

.rejection-cancel { background: #f1f5f9; color: #475569; }
.rejection-confirm { background: #b91c1c; color: #ffffff; }

.qty {
  font-weight: 800;
  color: #1f2937;
  min-width: 30px;
}

.name {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.card-note {
  background: #fef3c7;
  margin: 0 0 12px !important;
  padding: 10px 14px !important;
  border-left: 3px solid #f59e0b;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #78350f;
  line-height: 1.4;
}

.card-note strong {
  display: block;
  margin-bottom: 4px;
}

.card-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 14px !important;
  border-top: 1px solid #e5e7eb;
  padding-top: 12px !important;
  font-weight: 700;
  color: #1f2937;
}

.card-total strong {
  font-size: 1.1rem;
  color: #f59e0b;
}

.status-btn {
  width: auto;
  margin: 10px 18px 14px;
  align-self: stretch;
  border-radius: 12px;
  min-height: 52px;
  padding: 14px 12px;
  border: none;
  background: #f59e0b;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  border-top: 1px solid #e5e7eb;
  font-size: 0.96rem;
  letter-spacing: 0.01em;
}

.status-btn.payment {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
}

.status-btn.payment:hover {
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
}

.status-btn.payment.tarjeta {
  background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);
}

.status-btn.payment.tarjeta:hover {
  background: linear-gradient(135deg, #4338ca 0%, #312e81 100%);
}

.status-btn.payment.efectivo {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

.status-btn.payment.efectivo:hover {
  background: linear-gradient(135deg, #047857 0%, #065f46 100%);
}

.status-btn.pending {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
}

.status-btn.pending:hover {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
}

.status-btn.preparing {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.status-btn.preparing:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.status-btn.ready {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.status-btn.ready:hover {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
}

.status-btn.delivered {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
}

.status-btn.delivered:hover {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.empty-orders {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  min-height: auto;
  color: #9ca3af;
}

.compact-empty {
  background: rgba(148, 163, 184, 0.08);
  border: 1px dashed rgba(148, 163, 184, 0.4);
  border-radius: 12px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}

.pagination {
  position: sticky;
  bottom: 16px;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: 26px 0 0;
  padding: 12px 14px 12px 18px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(12px);
}

.pagination-summary {
  margin: 0;
  color: #64748b;
  font-size: 0.86rem;
  font-weight: 700;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-btn {
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  color: #1f2937;
  background: #f1f5f9;
  cursor: pointer;
  font-size: 0.86rem;
  font-weight: 800;
  transition: transform 0.18s ease, background 0.18s ease;
}

.page-btn.next {
  color: white;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
}

.page-btn:not(:disabled):hover {
  transform: translateY(-1px);
  background: #e2e8f0;
}

.page-btn.next:not(:disabled):hover {
  background: linear-gradient(135deg, #1d4ed8, #1e40af);
}

.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.page-indicator {
  min-width: 106px;
  color: #64748b;
  font-size: 0.82rem;
  text-align: center;
  white-space: nowrap;
}

.page-indicator strong {
  color: #1f2937;
  font-size: 1rem;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1200px) {
  .orders-board {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .topbar {
    flex-direction: column;
    gap: 16px;
  }

  .stats-mini {
    width: 100%;
  }

  .topbar-right {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 768px) {
  .pos-layout {
    grid-template-columns: 1fr;
    height: 100dvh;
    min-height: 100dvh;
  }

  .sidebar {
    height: auto;
    max-height: 184px;
    border-bottom: 2px solid rgba(0, 0, 0, 0.1);
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px 10px;
  }

  .sidebar-header h2 {
    margin: 0;
    font-size: 1.05rem;
  }

  .tables-list {
    display: flex;
    grid-template-columns: none;
    max-height: 112px;
    padding: 8px 12px 12px;
    gap: 10px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x proximity;
  }

  .table-card {
    flex: 0 0 82px;
    min-height: 82px;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    padding: 8px 6px;
    text-align: center;
    border-radius: 14px;
    scroll-snap-align: start;
  }

  .table-info {
    min-width: 0;
  }

  .table-name {
    margin: 0;
    font-size: 0.72rem;
    line-height: 1.1;
  }

  .table-status {
    margin-top: 3px;
    font-size: 0.65rem;
    line-height: 1;
    white-space: nowrap;
  }

  .table-number {
    width: 36px;
    height: 36px;
    border-radius: 11px;
    font-size: 1rem;
  }

  .sidebar-footer {
    display: none;
  }

  .topbar h1 {
    font-size: clamp(1.45rem, 7vw, 1.8rem);
    line-height: 1.1;
    overflow-wrap: anywhere;
  }

  .orders-board {
    grid-template-columns: 1fr;
  }

  .content {
    padding: 14px 12px 28px;
    min-height: 0;
    overflow-y: auto;
  }

  .pagination {
    position: static;
    align-items: stretch;
    flex-direction: column;
    gap: 10px;
  }

  .pagination-controls {
    width: 100%;
  }

  .page-btn {
    flex: 1;
    padding-inline: 10px;
  }

  .topbar {
    padding: 18px 16px;
    gap: 18px;
    border-radius: 14px;
  }

  .topbar-right {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
  }

  .stats-mini {
    gap: 8px;
  }

  .stat-mini {
    padding: 12px 8px;
  }

  .stat-mini .value {
    font-size: 1.5rem;
  }

  .logout-btn {
    width: 100%;
    min-height: 44px;
    margin-left: 0;
  }

  .filters {
    margin-inline: 2px;
    border-radius: 11px;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 10px;
  }

  .filter-btn {
    min-height: 42px;
    padding: 9px 12px;
  }

  .order-card {
    border-radius: 15px;
    display: flex;
    flex-direction: column;
  }

  .card-status-bar {
    width: 100%;
    min-height: 4px;
    height: 4px;
  }

  .card-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 7px;
    padding-top: 16px !important;
    padding-bottom: 8px !important;
  }

  .card-header-meta {
    width: 100%;
    justify-content: space-between;
  }

  .order-id {
    font-size: 0.78rem;
  }

  .item {
    align-items: center;
    gap: 8px;
  }

  .item .name {
    flex: 1 1 calc(100% - 40px);
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .reject-item-btn {
    width: auto;
    min-height: 34px;
    margin-left: auto;
    padding-inline: 10px;
  }

  .status-btn {
    width: calc(100% + 32px);
    margin: 0 -16px;
    border-radius: 0;
    min-height: 50px;
    padding-inline: 16px;
  }

  .rejected-order-status {
    width: calc(100% + 32px);
    margin: 0 -16px;
    border-radius: 0;
  }

  .card-items {
    margin-inline: 16px;
    padding: 12px !important;
  }

  .order-card > * {
    padding-inline: 16px;
  }

  .card-total {
    padding-top: 10px !important;
    padding-bottom: 12px !important;
  }

  .orders-board {
    gap: 16px;
  }

  .pagination {
    padding: 12px;
  }

  .pagination-summary {
    text-align: center;
    line-height: 1.35;
  }

  .rejection-modal-overlay,
  .payment-modal-overlay {
    padding: 10px;
  }

  .rejection-modal,
  .payment-modal {
    width: 100%;
    max-width: none;
    max-height: calc(100vh - 20px);
    padding: 20px 16px 16px;
    border-radius: 16px;
  }

  .rejection-actions,
  .payment-actions {
    grid-template-columns: 1fr;
    display: grid;
  }

  .rejection-cancel,
  .rejection-confirm,
  .cancel-btn,
  .confirm-btn {
    min-height: 44px;
    width: 100%;
  }

  .payment-modal h2 {
    font-size: 1.3rem;
    padding-right: 24px;
  }

  .method-btn {
    min-height: 46px;
  }
}

/* ==================== PAYMENT MODAL ==================== */
.payment-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.payment-modal {
  background: white;
  border-radius: 20px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
  position: relative;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #6b7280;
  transition: color 0.2s;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #1f2937;
}

.payment-modal h2 {
  color: #1f2937;
  font-size: 1.8rem;
  margin-bottom: 4px;
  font-weight: 800;
}

.modal-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 24px;
  font-weight: 600;
}

.payment-details {
  display: grid;
  gap: 24px;
}

.items-section h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
}

.items-list {
  background: #f9fafb;
  border-radius: 12px;
  padding: 12px;
  display: grid;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: white;
  border-radius: 8px;
  font-size: 0.9rem;
}

.payment-qty {
  font-weight: 700;
  color: #1f2937;
  min-width: 35px;
}

.payment-name {
  flex: 1;
  padding: 0 12px;
  color: #4b5563;
}

.payment-price {
  font-weight: 600;
  color: #1f2937;
  text-align: right;
  min-width: 55px;
}

.rejected-payment-name,
.rejected-payment-price {
  color: #b91c1c;
}

.rejected-payment-price {
  font-size: 0.72rem;
  font-weight: 800;
}

.totals-section {
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  display: grid;
  gap: 12px;
}

.total-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
  color: #4b5563;
}

.total-line strong {
  color: #1f2937;
  font-size: 1rem;
}

.total-line.highlight {
  padding: 12px;
  background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
  border-radius: 10px;
  font-weight: 600;
  color: #1e40af;
}

.total-line.highlight strong {
  color: #1e3a8a;
  font-size: 1.2rem;
}

.total-line.final {
  padding: 14px 12px;
  background: linear-gradient(135deg, #fef08a 0%, #fce7f3 100%);
  border-radius: 10px;
  font-weight: 700;
  color: #92400e;
}

.total-line.final strong {
  color: #78350f;
  font-size: 1.3rem;
}

.divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.1);
}

.split-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
}

.split-controls label {
  font-weight: 600;
  color: #4b5563;
  white-space: nowrap;
}

.split-label {
  color: #4b5563;
  font-size: 0.85rem;
  white-space: nowrap;
}

.payment-method-section h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
}

.payment-split-help {
  margin: -4px 0 12px;
  color: #6b7280;
  font-size: 0.84rem;
}

.payment-split-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.payment-split-field {
  display: grid;
  gap: 6px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  color: #374151;
  font-weight: 700;
}

.payment-split-field input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #111827;
  font-size: 1rem;
  font-weight: 700;
}

.payment-split-field small {
  color: #047857;
  font-size: 0.82rem;
}

.payment-split-total {
  margin: 10px 0 0;
  color: #047857;
  font-size: 0.84rem;
  font-weight: 700;
}

.payment-split-total.invalid {
  color: #b91c1c;
}

.method-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.method-btn {
  padding: 14px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  color: #4b5563;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.method-btn:hover {
  border-color: #d1d5db;
  background: #f9fafb;
}

.method-btn.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.payment-info {
  background: linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%);
  border-left: 4px solid #f59e0b;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #92400e;
  font-weight: 600;
}

.payment-info p {
  margin: 0;
}

.payment-actions {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
  margin-top: 12px;
}

.payment-note {
  background: #eff6ff;
  border-left: 4px solid #2563eb;
  border-radius: 8px;
  color: #1e3a8a;
  padding: 12px;
}

.payment-note strong {
  display: block;
  font-size: 0.82rem;
  margin-bottom: 4px;
  text-transform: uppercase;
}

.payment-note p {
  margin: 0;
  white-space: pre-wrap;
}

.cancel-btn {
  padding: 14px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  color: #6b7280;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.cancel-btn:hover {
  border-color: #d1d5db;
  background: #f3f4f6;
}

.cancel-btn:active {
  transform: translateY(1px);
}

.confirm-btn {
  padding: 14px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.confirm-btn:active {
  transform: translateY(0);
}

.confirm-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
  box-shadow: none;
}

@media (max-width: 768px) {
  .payment-modal {
    max-width: 95%;
    padding: 20px;
  }

  .payment-modal h2 {
    font-size: 1.4rem;
  }

  .method-buttons {
    grid-template-columns: 1fr;
  }

  .payment-split-grid {
    grid-template-columns: 1fr;
  }

  .payment-actions {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .content {
    padding: 10px;
  }

  .sidebar-header {
    padding: 16px 14px;
  }

  .sidebar-header h2 {
    font-size: 1.05rem;
  }

  .table-card {
    padding: 8px;
  }

  .table-number {
    width: 38px;
    height: 38px;
    font-size: 1rem;
  }

  .table-badge,
  .card-note {
    overflow-wrap: anywhere;
  }

  .page-btn {
    min-height: 42px;
    font-size: 0.78rem;
  }

  .payment-item {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 4px;
  }

  .payment-name {
    flex: 1 1 calc(100% - 45px);
    min-width: 0;
    padding: 0;
    overflow-wrap: anywhere;
  }

  .payment-price {
    flex: 1 1 100%;
    min-width: 0;
    padding-left: 35px;
    text-align: left;
  }

  .total-line {
    gap: 10px;
    flex-wrap: wrap;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pos-layout *,
  .pos-layout *::before,
  .pos-layout *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
