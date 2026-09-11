<template>
  <div v-if="hydrated && paymentClosed && !isTableQrRoute && !isStaffRoute" class="session-closed-screen">
    <div class="session-closed-card">
      <p class="session-closed-icon">✓</p>
      <p class="session-closed-eyebrow">Cuenta cerrada</p>
      <h1>Pago confirmado</h1>
      <p class="session-closed-description">El pago ha sido confirmado por el personal. Descarga tu factura. Para volver a pedir, tendrás que escanear de nuevo el código QR de la mesa.</p>
      <button v-if="closedInvoice" class="invoice-download-btn" type="button" @click="downloadClosedInvoice">
        Descargar factura PDF
      </button>
    </div>
  </div>

  <div v-else-if="hydrated && paymentRequested && !isStaffRoute && !isTableQrRoute && route.name !== 'table-bill'" class="payment-lock-screen">
    <div class="payment-lock-card">
      <p class="session-closed-icon">✓</p>
      <p class="session-closed-eyebrow">Pago solicitado</p>
      <h1>Tu mesa está pendiente de cobro</h1>
      <p>El personal debe confirmar el pago. No puedes añadir más productos hasta que la mesa quede liberada.</p>
    </div>
  </div>

  <template v-else>
    <router-view v-if="hydrated" />

    <div v-else class="loading">
      <div class="spinner"></div>
      <p>Cargando...</p>
    </div>
  </template>

  <div v-if="showBottomNav && hydrated" class="bottom-nav-cluster">
    <button class="nav-btn" :class="{ active: route.path === '/estado-pedido' }" @click="router.push('/estado-pedido')">
      <span class="nav-icon">📦</span>
      <span>Pedido</span>
    </button>
    <button class="nav-btn center" :class="{ active: route.path === '/carrito' }" @click="router.push('/carrito')">
      <span class="nav-icon">🛒</span>
      <span>Cesta</span>
    </button>
    <button class="nav-btn" :class="{ active: route.path === '/cuenta' }" @click="router.push('/cuenta')">
      <span class="nav-icon">💳</span>
      <span>Pagar</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdersLiveStore } from './stores/ordersLiveStore'
import { useTableSessionStore } from './stores/tableSessionStore'
import { useCompanySettings } from './stores/companySettings'
import { downloadInvoicePdf, type InvoiceItem } from './utils/invoicePdf'

type ClosedInvoice = {
  tableNumber: string
  items: InvoiceItem[]
  total: number
  paymentMethod: 'efectivo' | 'tarjeta'
  splitCount?: number
  paidAt?: string
}

const CLOSED_INVOICE_STORAGE_KEY = 'restaurant-closed-invoice'

const readClosedInvoice = (): ClosedInvoice | null => {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(CLOSED_INVOICE_STORAGE_KEY)
    return stored ? JSON.parse(stored) as ClosedInvoice : null
  } catch {
    return null
  }
}

const { hydrateFromFirestore, listenForFirestoreChanges, orders, tables } = useOrdersLiveStore()
const { session, paymentClosed, paymentRequested, invalidateAfterPayment, restoreSession } = useTableSessionStore()
const { loadSettings, settings } = useCompanySettings()
const route = useRoute()
const router = useRouter()
const hydrated = ref(false)
const closedInvoice = ref<ClosedInvoice | null>(readClosedInvoice())
const isTableQrRoute = computed(() => route.name === 'table-session')
const isStaffRoute = computed(() => ['pos', 'kitchen', 'admin', 'login'].includes(String(route.name ?? '')))
const showBottomNav = computed(() => !isStaffRoute.value && !isTableQrRoute.value && !paymentClosed.value)

const createClosedInvoice = (paidOrders: typeof orders.value, tableNumber: string): ClosedInvoice => {
  const mergedItems = new Map<string, InvoiceItem>()
  paidOrders.forEach((order) => {
    order.items.forEach((item) => {
      const key = `${item.productId}-${item.status ?? 'PENDING'}-${item.note ?? ''}-${(item.options ?? []).join(',')}`
      const current = mergedItems.get(key)
      if (current) {
        current.quantity += item.quantity
        current.subtotal += item.status === 'REJECTED' ? 0 : item.subtotal
      } else {
        mergedItems.set(key, {
          name: item.name,
          quantity: item.quantity,
              subtotal: item.status === 'REJECTED' ? 0 : item.subtotal,
              ...(item.status === 'REJECTED' ? { rejected: true, rejectionReason: item.rejectionReason } : {}),
        })
      }
    })
  })

  return {
    tableNumber,
    items: [...mergedItems.values()],
    total: paidOrders.reduce((sum, order) => sum + order.total, 0),
    paymentMethod: paidOrders[0]?.paymentMethod ?? 'efectivo',
    splitCount: paidOrders[0]?.paymentSplitCount ?? 1,
    paidAt: paidOrders[0]?.paidAt,
  }
}

const persistClosedInvoice = (invoice: ClosedInvoice) => {
  closedInvoice.value = invoice
  localStorage.setItem(CLOSED_INVOICE_STORAGE_KEY, JSON.stringify(invoice))
}

watch([orders, tables, session, route], () => {
  const activeSession = session.value
  if (!activeSession || isStaffRoute.value) return

  const sessionOrders = orders.value.filter((order) =>
    order.tableId === activeSession.tableId && order.sessionId === activeSession.sessionId,
  )
  const activeTable = tables.value.find((table) => table.id === activeSession.tableId)

  const tableWasReleased = Boolean(activeTable && !activeTable.active && sessionOrders.length > 0)
  const sessionOrdersWerePaid = sessionOrders.length > 0 && sessionOrders.every((order) => order.status === 'PAID')

  if (tableWasReleased || sessionOrdersWerePaid) {
    if (sessionOrdersWerePaid && activeTable) {
      persistClosedInvoice(createClosedInvoice(sessionOrders, String(activeTable.number)))
    }

    invalidateAfterPayment()
  }
})

watch([paymentClosed, orders, tables], () => {
  if (!paymentClosed.value || closedInvoice.value) return

  const latestPaidOrder = [...orders.value]
    .filter((order) => order.status === 'PAID')
    .sort((left, right) => new Date(right.paidAt ?? right.updatedAt).getTime() - new Date(left.paidAt ?? left.updatedAt).getTime())[0]
  if (!latestPaidOrder) return

  const paidOrders = orders.value.filter((order) =>
    order.status === 'PAID' &&
    order.tableId === latestPaidOrder.tableId &&
    order.sessionId === latestPaidOrder.sessionId,
  )
  const table = tables.value.find((item) => item.id === latestPaidOrder.tableId)
  if (paidOrders.length && table) {
    persistClosedInvoice(createClosedInvoice(paidOrders, String(table.number)))
  }
})

const downloadClosedInvoice = () => {
  if (closedInvoice.value) {
    downloadInvoicePdf({ ...closedInvoice.value, company: settings.value })
  }
}

watch(
  () => settings.value.restaurantName,
  (restaurantName) => {
    if (typeof document !== 'undefined' && restaurantName) {
      document.title = restaurantName
    }
  },
  { immediate: true },
)

onMounted(async () => {
  const storedTheme = localStorage.getItem('tpv-client-theme')
  document.body.classList.toggle('dark-mode', storedTheme === 'dark')

  console.log('[App] Starting hydration...')
  await Promise.all([
    hydrateFromFirestore(),
    loadSettings(),
  ])
  restoreSession()
  console.log('[App] Hydration complete, starting listeners...')
  listenForFirestoreChanges()
  console.log('[App] Listeners started, marking as hydrated')
  hydrated.value = true
})
</script>

<style>
:root {
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: #111827;
  background: #f3f4f6;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* { box-sizing: border-box; }
html, body, #app {
  margin: 0;
  width: 100%;
  height: 100%;
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-x: none;
  touch-action: pan-y;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
body {
  min-height: 100vh;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
html::-webkit-scrollbar,
body::-webkit-scrollbar,
#app::-webkit-scrollbar {
  display: none;
}
a { color: inherit; text-decoration: none; }
button, input { font: inherit; }

.bottom-nav-cluster {
  position: fixed;
  left: 50%;
  bottom: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(8px);
  z-index: 1200;
  transform: translateX(-50%);
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 42px;
  padding: 0 16px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #374151;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.nav-btn.center {
  background: rgba(249, 115, 22, 0.12);
  color: #c2410c;
}

.nav-btn.active {
  background: rgba(17, 24, 39, 0.06);
  color: #111827;
}

.nav-btn.center.active {
  background: rgba(249, 115, 22, 0.18);
  color: #9a3f11;
}

.nav-btn:hover {
  transform: translateY(-1px);
}

.nav-btn:active {
  transform: translateY(0);
}

.nav-icon {
  font-size: 0.95rem;
}

body.dark-mode .bottom-nav-cluster {
  background: rgba(17, 24, 39, 0.8);
  border-color: rgba(255, 255, 255, 0.1);
  box-shadow: 0 16px 30px rgba(2, 6, 23, 0.38);
}

body.dark-mode .nav-btn {
  color: #e5e7eb;
}

body.dark-mode .nav-btn.active {
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

body.dark-mode .nav-btn.center {
  background: rgba(249, 115, 22, 0.18);
  color: #fed7aa;
}

body.dark-mode .nav-btn.center.active {
  background: rgba(249, 115, 22, 0.22);
  color: #fff7ed;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  gap: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(17, 24, 39, 0.1);
  border-top-color: #f59e0b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading p {
  font-size: 1.1rem;
  color: #6b7280;
  font-weight: 600;
}

.session-closed-screen {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  background: linear-gradient(135deg, #ecfdf5, #eff6ff);
}

.session-closed-card {
  width: min(100%, 440px);
  padding: 32px 28px;
  border-radius: 24px;
  background: white;
  text-align: center;
  box-shadow: 0 22px 50px rgba(15, 23, 42, 0.12);
}

.session-closed-icon {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: #16a34a;
  color: white;
  font-size: 1.8rem;
  font-weight: 800;
}

.session-closed-eyebrow {
  margin: 0;
  color: #15803d;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.session-closed-card h1 {
  margin: 10px 0;
  color: #111827;
  font-size: 1.8rem;
}

.session-closed-description {
  margin: 0;
  color: #4b5563;
  line-height: 1.6;
}

.invoice-download-btn {
  width: 100%;
  margin-top: 22px;
  border: 0;
  border-radius: 12px;
  padding: 14px 16px;
  background: var(--primary);
  color: white;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
}

.payment-lock-screen {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  background: var(--bg-color);
}

.payment-lock-card {
  width: min(100%, 440px);
  padding: 32px 28px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--card-bg);
  text-align: center;
  box-shadow: var(--shadow);
}

.payment-lock-card h1 {
  margin: 10px 0;
  color: var(--text-main);
  font-size: 1.8rem;
}

.payment-lock-card p:last-child {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.6;
}
</style>
