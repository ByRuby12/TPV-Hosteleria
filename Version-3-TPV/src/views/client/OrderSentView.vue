<template>
  <div class="page sent-page">
    <div class="card">
      <div class="check">✓</div>
      <p class="eyebrow">Pedido confirmado</p>
      <h1>Pedido enviado</h1>

      <div v-if="order" class="summary">
        <p><strong>Mesa {{ tableLabel }}</strong></p>
        <p class="order-num">Pedido #{{ orderNumber }}</p>
        <p class="order-time">⏱️ {{ formatTime(order.createdAt) }}</p>
        
        <div class="items-list">
          <div v-for="item in order.items" :key="item.productId" class="item-row">
            <div class="item-detail">
              <span class="qty">{{ item.quantity }}×</span>
              <span class="name">{{ item.name }}</span>
            </div>
            <span class="price">{{ formatPrice(item.subtotal) }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="total-row">
          <span>Total pedido</span>
          <strong>{{ formatPrice(order.total) }}</strong>
        </div>
      </div>

      <p class="message">El camarero lo recibirá en unos segundos.</p>
      <div class="actions">
        <button class="secondary" @click="router.push('/')">Volver a la carta</button>
        <button class="primary" @click="router.push('/cuenta')">Pagar ahora</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdersLiveStore } from '../../stores/ordersLiveStore'
import { useTableSessionStore } from '../../stores/tableSessionStore'

const route = useRoute()
const router = useRouter()
const { orders } = useOrdersLiveStore()
const { table } = useTableSessionStore()

const order = computed(() => {
  const orderId = String(route.query.orderId || '')
  return orders.value.find((item) => item.id === orderId) ?? null
})

const orderNumber = computed(() => {
  if (!order.value) return '—'
  const index = orders.value.findIndex(o => o.id === order.value!.id)
  return index >= 0 ? index + 1 : '—'
})

const tableLabel = computed(() => table.value?.number ?? '—')
const formatPrice = (value: number) => `${value.toFixed(2)} €`

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
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: var(--bg-color);
  padding: 24px 16px;
}

.card {
  max-width: 420px;
  width: 100%;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 28px 24px;
  text-align: center;
  box-shadow: var(--shadow);
}

.check {
  width: 76px;
  height: 76px;
  margin: 0 auto 14px;
  border-radius: 20px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  display: grid;
  place-items: center;
  color: white;
  font-size: 2.5rem;
  font-weight: 800;
}

.eyebrow {
  margin: 0;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.72rem;
}

h1 {
  margin: 12px 0 18px;
  color: var(--text-main);
  font-size: 2rem;
}

.summary {
  background: rgba(232, 93, 4, 0.05);
  border: 1px solid rgba(232, 93, 4, 0.15);
  border-radius: 16px;
  padding: 14px 16px;
  margin: 18px 0;
  text-align: left;
}

.summary p:first-child {
  margin: 0 0 12px 0;
  color: var(--text-main);
  font-weight: 600;
}

.order-num {
  margin: 0 0 4px 0 !important;
  color: var(--text-main);
  font-weight: 700;
  font-size: 1.1rem;
}

.order-time {
  margin: 0 0 12px 0 !important;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.items-list {
  margin: 12px 0;
  display: grid;
  gap: 8px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  color: var(--text-main);
  font-size: 0.9rem;
}

.item-detail {
  display: flex;
  gap: 8px;
  align-items: center;
}

.qty {
  font-weight: 700;
  color: var(--text-main);
  min-width: 28px;
}

.name {
  color: var(--text-muted);
}

.price {
  font-weight: 600;
  color: var(--text-main);
}

.divider {
  height: 1px;
  background: var(--border);
  margin: 12px 0;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  font-weight: 600;
  color: var(--text-main);
}

.message {
  color: var(--text-muted);
  margin: 12px 0 22px;
}

.actions {
  display: grid;
  gap: 12px;
}

button {
  border: none;
  border-radius: 14px;
  padding: 14px 18px;
  font-weight: 800;
  width: 100%;
  box-shadow: 0 12px 24px rgba(17, 24, 39, 0.18);
}

.primary {
  background: linear-gradient(135deg, var(--primary) 0%, #d95502 100%);
  color: white;
}

.secondary {
  background: rgba(17, 24, 39, 0.07);
  border: 1px solid var(--border);
  color: var(--text-main);
}

body.dark-mode .secondary {
  background: rgba(255, 255, 255, 0.08);
}
</style>
