<template>
  <main class="status-page">
    <header class="header">
      <button class="return-btn" @click="router.push('/')">← Volver a la carta</button>
      <div>
        <p class="eyebrow">Mesa {{ table?.number ?? '—' }}</p>
        <h1>Estado del pedido</h1>
      </div>
    </header>

    <section v-if="orders.length" class="orders-list">
      <article v-for="order in paginatedOrders" :key="order.id" class="order-card">
        <div class="order-heading">
          <div>
            <p>Pedido</p>
            <strong>{{ formatTime(order.createdAt) }}</strong>
          </div>
          <span class="status" :class="order.status.toLowerCase()">{{ getStatusLabel(order.status) }}</span>
        </div>

        <p class="status-message">{{ getStatusMessage(order.status) }}</p>

        <div v-if="rejectedItems(order).length" class="rejection-alert" role="alert">
          <strong>Producto no disponible</strong>
          <p v-for="item in rejectedItems(order)" :key="`${order.id}-${item.productId}-${item.name}`">
            {{ item.quantity }}× {{ item.name }}{{ item.rejectionReason ? `: ${item.rejectionReason}` : '' }}
          </p>
          <small>Este producto no se cobrará en la cuenta.</small>
        </div>

        <ul>
          <li v-for="(item, itemIndex) in order.items" :key="`${order.id}-${itemIndex}`" :class="{ 'rejected-order-item': item.status === 'REJECTED' }">
            <span>{{ item.quantity }} × {{ item.name }}{{ item.status === 'REJECTED' ? ' · Rechazado' : '' }}</span>
          </li>
        </ul>
      </article>
    </section>

    <section v-else class="empty-state" aria-live="polite">
      <div aria-hidden="true">🍽️</div>
      <h2>No hay ningún pedido actualmente</h2>
      <p>Cuando envíes una comanda, aparecerá aquí su estado y podrás seguirla en tiempo real.</p>
      <button type="button" @click="router.push('/')">Volver a la carta</button>
    </section>

    <nav v-if="pageCount > 1" class="pagination" aria-label="Paginación de pedidos">
      <p>Mostrando {{ paginationStart }}–{{ paginationEnd }} de {{ orders.length }}</p>
      <div>
        <button :disabled="currentPage === 1" @click="currentPage--">←</button>
        <span>Página <strong>{{ currentPage }}</strong> de {{ pageCount }}</span>
        <button :disabled="currentPage === pageCount" @click="currentPage++">→</button>
      </div>
    </nav>

  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdersLiveStore } from '../../stores/ordersLiveStore'
import { useTableSessionStore } from '../../stores/tableSessionStore'
import type { OrderStatus } from '../../services/orders/orders'

const router = useRouter()
const { table, session, ensureActiveSession } = useTableSessionStore()
const { getTableSessionOrders } = useOrdersLiveStore()

onMounted(() => {
  ensureActiveSession('mesa-001')
})

const orders = computed(() => {
  if (!table.value || !session.value) return []
  return getTableSessionOrders(table.value.id, session.value.sessionId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const currentPage = ref(1)
const pageSize = 3
const pageCount = computed(() => Math.max(1, Math.ceil(orders.value.length / pageSize)))
const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return orders.value.slice(start, start + pageSize)
})
const paginationStart = computed(() => (currentPage.value - 1) * pageSize + 1)
const paginationEnd = computed(() => Math.min(currentPage.value * pageSize, orders.value.length))

watch(orders, () => {
  if (currentPage.value > pageCount.value) currentPage.value = pageCount.value
})

const getStatusLabel = (status: OrderStatus) => ({
  PENDING: 'Recibido',
  PREPARING: 'En preparación',
  READY: 'Listo para servir',
  DELIVERED: 'Entregado',
  PAID: 'Pagado',
  CANCELLED: 'Cancelado',
}[status])

const getStatusMessage = (status: OrderStatus) => ({
  PENDING: 'Hemos recibido tu pedido y lo enviaremos a cocina enseguida.',
  PREPARING: 'El equipo de cocina ya está preparando tu pedido.',
  READY: 'Tu pedido está listo y saldrá en breve.',
  DELIVERED: 'Pedido entregado. ¡Que lo disfrutes!',
  PAID: 'Este pedido ya está pagado.',
  CANCELLED: 'Este pedido ha sido cancelado.',
}[status])

const rejectedItems = (order: { items: Array<{ productId: string; name: string; quantity: number; status?: string; rejectionReason?: string }> }) =>
  order.items.filter((item) => item.status === 'REJECTED')

const formatTime = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.status-page {
  width: 100%;
  max-width: none;
  min-height: 100vh;
  margin: 0 auto;
  padding: 24px clamp(16px, 4vw, 56px) 90px;
  background: var(--bg-color);
}

.status-page > .header,
.status-page > .orders-list,
.status-page > .empty-state,
.status-page > .pagination {
  width: min(100%, 760px);
  margin-inline: auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.return-btn {
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(232, 93, 4, 0.08);
  border-color: rgba(232, 93, 4, 0.2);
  color: var(--primary);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 800;
  box-shadow: var(--shadow);
}

body.dark-mode .return-btn {
  background: rgba(232, 93, 4, 0.08);
  border-color: rgba(232, 93, 4, 0.2);
  color: var(--primary);
}

.eyebrow {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h1 { margin: 4px 0 0; color: var(--text-main); font-size: 1.85rem; }

.orders-list { display: grid; gap: 14px; }

.pagination {
  display: grid;
  gap: 10px;
  margin-top: 18px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--card-bg);
  box-shadow: var(--shadow);
}

.pagination p {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 700;
  text-align: center;
}

.pagination div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.pagination button {
  width: 42px;
  height: 38px;
  border: 0;
  border-radius: 10px;
  background: rgba(17, 24, 39, 0.07);
  color: var(--text-main);
  cursor: pointer;
  font-size: 1.15rem;
  font-weight: 800;
}

body.dark-mode .pagination button {
  background: rgba(255, 255, 255, 0.08);
}

.pagination button:disabled { cursor: not-allowed; opacity: 0.35; }
.pagination span { color: var(--text-muted); font-size: 0.82rem; }
.pagination strong { color: var(--text-main); }

.order-card {
  padding: 18px;
  border-radius: 18px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.order-heading { display: flex; justify-content: space-between; gap: 12px; }
.order-heading p { margin: 0 0 3px; color: var(--text-muted); font-size: 0.8rem; }
.order-heading strong { color: var(--text-main); }

.status {
  align-self: flex-start;
  padding: 6px 9px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
}
.status.pending { background: #fef3c7; color: #92400e; }
.status.preparing { background: #dbeafe; color: #1d4ed8; }
.status.ready { background: #dcfce7; color: #166534; }
.status.delivered { background: #e5e7eb; color: #374151; }
.status.paid { background: #e0e7ff; color: #3730a3; }
.status.cancelled { background: #fee2e2; color: #991b1b; }

.status-message { margin: 16px 0 12px; color: var(--text-muted); line-height: 1.5; }
ul { display: grid; gap: 6px; margin: 0; padding: 12px 0 0; border-top: 1px solid var(--border); list-style: none; }
li { color: var(--text-main); font-size: 0.92rem; }

.rejected-order-item {
  color: #b91c1c;
  text-decoration: line-through;
}

.rejection-alert {
  margin: 14px 0;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-left: 4px solid #dc2626;
  border-radius: 12px;
  background: #fff1f2;
  color: #991b1b;
}

.rejection-alert strong {
  display: block;
  margin-bottom: 5px;
  color: #991b1b;
}

.rejection-alert p {
  margin: 3px 0;
  font-size: 0.88rem;
}

.rejection-alert small {
  display: block;
  margin-top: 7px;
  color: #7f1d1d;
  font-weight: 700;
}

:global(body.dark-mode) .rejection-alert {
  border-color: rgba(248, 113, 113, 0.45);
  background: rgba(127, 29, 29, 0.3);
  color: #fecaca;
}

:global(body.dark-mode) .rejection-alert strong,
:global(body.dark-mode) .rejection-alert small {
  color: #fecaca;
}

.empty-state {
  padding: 34px 22px;
  border-radius: 20px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  text-align: center;
  box-shadow: var(--shadow);
}
.empty-state div { font-size: 2.4rem; }
.empty-state h2 { margin: 12px 0 8px; color: var(--text-main); }
.empty-state p { margin: 0 0 20px; color: var(--text-muted); line-height: 1.5; }
.empty-state button { border: 0; border-radius: 12px; padding: 12px 16px; background: var(--text-main); color: var(--bg-color); cursor: pointer; font-weight: 800; }
</style>
