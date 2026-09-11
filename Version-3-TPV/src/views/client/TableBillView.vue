<template>
  <div class="bill-page">
    <div v-if="sessionInvalid" class="error-banner">
      <p>Esta sesión ha sido cerrada. Redirigiendo...</p>
    </div>

    <header class="return-header">
      <button class="return-btn" @click="router.push('/')">← Volver a la carta</button>
    </header>

    <div class="card">
      <p class="eyebrow">Cuenta de mesa</p>
      <h1>Mesa {{ table?.number ?? '—' }}</h1>

      <div v-if="orders.length === 0" class="empty">
        No hay pedidos para esta mesa.
      </div>

      <div v-else class="orders-list">
        <div class="order-item">
          <div class="order-header">
            <div>
              <strong>Comanda de la mesa</strong>
              <p>{{ orders.length }} {{ orders.length === 1 ? 'pedido agrupado' : 'pedidos agrupados' }}</p>
            </div>
          </div>

          <div class="order-items">
            <div v-for="item in mergedItems" :key="item.key" class="item-detail">
              <span class="qty">{{ item.quantity }}×</span>
              <span class="name">{{ item.name }}</span>
              <span class="price">{{ formatPrice(item.subtotal) }}</span>
            </div>
            <div v-for="item in rejectedItems" :key="item.key" class="item-detail rejected-item">
              <span class="qty">{{ item.quantity }}×</span>
              <span class="name">{{ item.name }} (Rechazado{{ item.rejectionReason ? `: ${item.rejectionReason}` : '' }})</span>
              <span class="price">No cobrado</span>
            </div>
          </div>

          <div class="order-total">{{ formatPrice(total) }}</div>
        </div>
      </div>

      <div class="totals-box">
        <div class="total-row">
          <span>Total mesa</span>
          <strong>{{ formatPrice(total) }}</strong>
        </div>
        <div class="total-row split-row">
          <span>Dividir por</span>
          <div class="split-controls">
            <button type="button" class="stepper" @click="decreasePeopleCount">−</button>
            <input
              v-model.number="peopleCount"
              type="number"
              min="1"
              max="50"
              inputmode="numeric"
              class="people-input"
              aria-label="Número de personas"
            />
            <button type="button" class="stepper" @click="increasePeopleCount">+</button>
          </div>
        </div>
        <div class="total-row highlight">
          <span>Por persona</span>
          <strong>{{ formatPrice(splitTotal) }}</strong>
        </div>
      </div>

      <div class="payment-methods">
        <button
          :class="{ active: paymentMethod === 'efectivo' }"
          class="method-btn"
          @click="paymentMethod = 'efectivo'"
        >
          Efectivo
        </button>
        <button
          :class="{ active: paymentMethod === 'tarjeta' }"
          class="method-btn"
          @click="paymentMethod = 'tarjeta'"
        >
          Tarjeta
        </button>
      </div>

      <label class="payment-note" for="payment-note">
        <span>Nota para el cobro (opcional)</span>
        <textarea
          id="payment-note"
          v-model="paymentNote"
          rows="2"
          maxlength="250"
          placeholder="Ej. Una persona paga en efectivo y otra con tarjeta"
        />
      </label>

      <div class="actions">
        <button class="primary" :disabled="!orders.length || paid" @click="payAndCloseTable">Pagar ahora</button>
      </div>

      <div v-if="paid" class="payment-success">
        <template v-if="paymentConfirmed">
          <strong>Pago confirmado</strong>
          <p>Tu mesa ya está cerrada. Puedes descargar la factura en PDF.</p>
          <button class="primary" type="button" @click="downloadInvoice">Descargar factura PDF</button>
        </template>
        <template v-else>
          <strong>Solicitud de cobro enviada</strong>
          <p>El personal confirmará el pago. La factura aparecerá cuando el pago quede confirmado.</p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdersLiveStore } from '../../stores/ordersLiveStore'
import { useTableSessionStore } from '../../stores/tableSessionStore'
import { useCompanySettings } from '../../stores/companySettings'
import { downloadInvoicePdf } from '../../utils/invoicePdf'
import { isOrderItemRejected } from '../../utils/orderItemStatus'

const router = useRouter()
const { table, session, paymentRequested, ensureActiveSession, markPaymentRequested } = useTableSessionStore()
const { getTableSessionOrders, requestPayment } = useOrdersLiveStore()
const { settings: companySettings } = useCompanySettings()

const peopleCount = ref(2)
const paymentMethod = ref<'efectivo' | 'tarjeta'>('efectivo')
const paymentNote = ref('')
const paid = ref(false)
const sessionInvalid = ref(false)
const invoiceDownloaded = ref(false)

const sanitizePeopleCount = (value: number) => {
  const parsed = Number.isFinite(value) ? Math.trunc(value) : 1
  return Math.min(50, Math.max(1, parsed))
}

const increasePeopleCount = () => {
  peopleCount.value = sanitizePeopleCount(peopleCount.value + 1)
}

const decreasePeopleCount = () => {
  peopleCount.value = sanitizePeopleCount(peopleCount.value - 1)
}

onMounted(() => {
  ensureActiveSession('mesa-001')
  paid.value = paymentRequested.value
})

const activeTableId = computed(() => table.value?.id ?? 'table-1')
const activeSessionId = computed(() => session.value?.sessionId ?? '')
const orders = computed(() => {
  if (!activeSessionId.value) return []
  return getTableSessionOrders(activeTableId.value, activeSessionId.value)
})
const total = computed(() => orders.value.reduce((sum, order) => sum + order.total, 0))
const mergedItems = computed(() => {
  const items = new Map<string, { key: string; name: string; quantity: number; subtotal: number }>()
  orders.value.forEach((order) => {
    order.items.forEach((item) => {
      if (isOrderItemRejected(item)) return
      const key = `${item.productId}-${item.note ?? ''}-${(item.options ?? []).join(',')}`
      const current = items.get(key)
      if (current) {
        current.quantity += item.quantity
        current.subtotal += item.subtotal
      } else {
        items.set(key, { key, name: item.name, quantity: item.quantity, subtotal: item.subtotal })
      }
    })
  })
  return [...items.values()]
})
const rejectedItems = computed(() => orders.value.flatMap((order) =>
  order.items
    .filter((item) => isOrderItemRejected(item))
    .map((item, index) => ({
      key: `${order.id}-rejected-${index}`,
      name: item.name,
      quantity: item.quantity,
      subtotal: item.subtotal,
      rejectionReason: item.rejectionReason,
    })),
))
const splitTotal = computed(() => {
  const safePeopleCount = sanitizePeopleCount(peopleCount.value)
  peopleCount.value = safePeopleCount
  return safePeopleCount > 0 ? total.value / safePeopleCount : total.value
})

const paymentConfirmed = computed(() =>
  paid.value && orders.value.length > 0 && orders.value.every((order) => order.status === 'PAID'),
)

const formatPrice = (value: number) => `${value.toFixed(2)} €`

const downloadInvoice = () => {
  downloadInvoicePdf({
    tableNumber: String(table.value?.number ?? '—'),
    items: [
      ...mergedItems.value,
      ...rejectedItems.value.map((item) => ({ ...item, rejected: true, subtotal: 0 })),
    ],
    total: total.value,
    paymentMethod: orders.value[0]?.paymentMethod ?? paymentMethod.value,
    splitCount: orders.value[0]?.paymentSplitCount ?? peopleCount.value,
    paidAt: orders.value[0]?.paidAt,
    company: companySettings.value,
  })
  invoiceDownloaded.value = true
}

watch(paymentConfirmed, (confirmed) => {
  if (confirmed && !invoiceDownloaded.value) {
    downloadInvoice()
  }
})

const payAndCloseTable = async () => {
  if (!orders.value.length || paid.value) return
  await requestPayment(activeTableId.value, paymentMethod.value, peopleCount.value, activeSessionId.value, paymentNote.value)
  markPaymentRequested()
  paid.value = true
}
</script>

<style scoped>
.bill-page {
  min-height: 100vh;
  display: grid;
  align-content: start;
  justify-items: center;
  padding: 24px clamp(16px, 4vw, 56px) 90px;
  background: var(--bg-color);
}

.error-banner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  padding: 16px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

.error-banner p {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
}

.card {
  width: min(760px, 100%);
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 28px;
  padding: 28px 22px;
  box-shadow: var(--shadow);
}

.return-btn {
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(232, 93, 4, 0.08);
  border-color: rgba(232, 93, 4, 0.2);
  color: var(--primary);
  font-size: 0.82rem;
  font-weight: 800;
  box-shadow: var(--shadow);
  cursor: pointer;
}

.return-header {
  display: flex;
  align-items: center;
  width: min(760px, 100%);
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--primary);
  font-size: 0.72rem;
}

h1 {
  margin: 8px 0 18px;
  color: var(--text-main);
  font-size: 1.9rem;
}

.orders-list {
  display: grid;
  gap: 12px;
  margin-bottom: 18px;
}

.order-item {
  background: rgba(232, 93, 4, 0.06);
  border: 1px solid rgba(232, 93, 4, 0.14);
  border-radius: 18px;
  padding: 16px;
  display: grid;
  gap: 8px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.order-header > div {
  flex: 1;
  display: grid;
  gap: 4px;
}

.order-header strong {
  color: var(--text-main);
  font-size: 0.95rem;
}

.order-item p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.order-items {
  display: grid;
  gap: 6px;
  padding: 8px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.item-detail {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.qty {
  font-weight: 700;
  color: var(--text-main);
  min-width: 28px;
}

.name {
  flex: 1;
  padding: 0 8px;
}

.price {
  font-weight: 600;
  color: var(--text-main);
  text-align: right;
  min-width: 50px;
}

.rejected-item {
  color: #b91c1c;
  text-decoration: line-through;
}

.rejected-item .price {
  color: #b91c1c;
  font-size: 0.78rem;
  text-decoration: none;
}

.order-total {
  font-weight: 700;
  color: #111827;
  text-align: right;
  padding-top: 4px;
  font-size: 1rem;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.preparing {
  background: #fce7f3;
  color: #831843;
}

.status-badge.ready {
  background: #dcfce7;
  color: #166534;
}

.status-badge.delivered {
  background: #dbeafe;
  color: #0c2340;
}

.status-badge.paid {
  background: #c7d2fe;
  color: #312e81;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.totals-box {
  background: #102a43;
  color: white;
  border-radius: 16px;
  padding: 16px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.split-row {
  gap: 12px;
}

.split-controls {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 10px;
  padding: 4px 8px;
  min-height: 40px;
}

.stepper {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 8px;
  background: rgba(255,255,255,0.12);
  color: white;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.people-input {
  width: 56px;
  height: 30px;
  border: none;
  background: rgba(255,255,255,0.04);
  color: white;
  text-align: center;
  font-size: 1rem;
  font-weight: 700;
  outline: none;
  border-radius: 8px;
  padding: 0;
}

.people-input::-webkit-outer-spin-button,
.people-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.highlight {
  border-top: 1px solid rgba(255,255,255,0.15);
  margin-top: 6px;
  padding-top: 12px;
}

.payment-methods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 18px;
}

.payment-note {
  display: grid;
  gap: 8px;
  margin-top: 18px;
  color: var(--text-main);
  font-size: 0.9rem;
  font-weight: 700;
}

.payment-note textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
  color: var(--text-main);
  background: var(--surface);
}

.method-btn {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-main);
  font-weight: 700;
}

.method-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 18px;
}

button {
  border: none;
  border-radius: 12px;
  padding: 12px 14px;
  font-weight: 700;
}

.primary { background: var(--primary); color: white; box-shadow: 0 12px 24px rgba(232, 93, 4, 0.2); }
.secondary { background: rgba(232, 93, 4, 0.08); color: var(--text-main); border: 1px solid var(--border); }
.payment-success {
  margin-top: 16px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  border-radius: 12px;
  padding: 12px 14px;
}

.payment-success p {
  margin: 6px 0 0;
}
.empty {
  background: rgba(232, 93, 4, 0.06);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
  color: var(--text-muted);
  text-align: center;
}

:global(body.dark-mode) .bill-page {
  background: var(--bg-color);
}

:global(body.dark-mode) .totals-box {
  background: #0f2130;
  border: 1px solid var(--border);
}

:global(body.dark-mode) .bill-page .order-total,
:global(body.dark-mode) .bill-page .total-row strong {
  color: #ffffff !important;
}

:global(body.dark-mode) .order-header strong,
:global(body.dark-mode) .order-item p,
:global(body.dark-mode) .item-detail,
:global(body.dark-mode) .qty,
:global(body.dark-mode) .name,
:global(body.dark-mode) .price {
  color: #ffffff;
}

:global(body.dark-mode) .payment-success {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(52, 211, 153, 0.28);
  color: #a7f3d0;
}
</style>
