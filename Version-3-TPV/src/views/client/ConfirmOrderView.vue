<template>
  <div class="page confirm-page">
    <div class="header">
      <button class="return-btn" @click="router.push('/carrito')">← Volver a la carta</button>
      <div>
        <p class="eyebrow">Finalizar</p>
        <h1>Confirmar pedido</h1>
      </div>
    </div>

    <div class="summary-box">
      <div class="table-row">
        <span>Mesa</span>
        <strong>{{ table?.number || 'Sin número' }}</strong>
      </div>

      <ul v-if="cart.length">
        <li v-for="item in cart" :key="item.id">
          <span>{{ item.quantity }}× {{ item.name }}</span>
          <strong>{{ formatPrice(item.price * item.quantity) }}</strong>
        </li>
      </ul>

      <label class="note-block" for="special-note">
        <span>Nota especial</span>
        <textarea id="special-note" v-model="note" rows="3" placeholder="Ej. sin tomate, sin cebolla..." />
      </label>

      <div class="total-row">
        <span>Total</span>
        <strong>{{ formatPrice(total) }}</strong>
      </div>
    </div>

    <div class="actions">
      <button class="secondary" @click="router.push('/carrito')">Volver</button>
      <button class="primary" :disabled="!cart.length || !session || !table || paymentRequested" @click="confirmOrder">
        Confirmar pedido
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCart } from '../../stores/orderStore'
import { useOrdersLiveStore } from '../../stores/ordersLiveStore'
import { useTableSessionStore } from '../../stores/tableSessionStore'

const router = useRouter()
const { cart, total, clearCart } = useCart()
const { session, table, paymentRequested, ensureActiveSession } = useTableSessionStore()
const { createOrder } = useOrdersLiveStore()
const note = ref('')

onMounted(() => {
  if (!session.value || !table.value) {
    ensureActiveSession('mesa-001')
  }
})

const formatPrice = (value: number) => `${value.toFixed(2)} €`

const confirmOrder = async () => {
  if (cart.length === 0 || paymentRequested.value) return

  const ensuredSession = session.value ? { session: session.value, table: table.value } : ensureActiveSession('mesa-001')
  if (!ensuredSession) return
  
  const activeSession = ensuredSession.session
  const activeTable = ensuredSession.table

  if (!activeSession || !activeTable) return

  const order = await createOrder({
    tableId: activeTable.id,
    sessionId: activeSession.sessionId,
    clientTokenId: activeSession.token,
    items: cart.map((item) => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
      ...(note.value ? { note: note.value } : {}),
    })),
    ...(note.value ? { note: note.value } : {}),
    total: total.value,
  })

  clearCart()
  router.push({ path: '/pedido/confirmado', query: { orderId: order.id } })
}
</script>

<style scoped>
.page {
  width: 100%;
  max-width: none;
  margin: 0 auto;
  padding: 24px clamp(16px, 4vw, 56px) 90px;
  min-height: 100vh;
  background: var(--bg-color);
}

.confirm-page > .header,
.confirm-page > .summary-box,
.confirm-page > .actions {
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
  border: 1px solid rgba(232, 93, 4, 0.2);
  border-radius: 12px;
  background: rgba(232, 93, 4, 0.08);
  color: var(--primary);
  font-size: 0.82rem;
  font-weight: 800;
  box-shadow: var(--shadow);
  cursor: pointer;
}

body.dark-mode .return-btn {
  background: rgba(232, 93, 4, 0.08);
  border-color: rgba(232, 93, 4, 0.2);
  color: var(--primary);
}

.header > div {
  min-width: 0;
}

.eyebrow {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

h1 {
  margin: 4px 0 0;
  color: var(--text-main);
  font-size: 2rem;
}

.summary-box {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 20px;
  box-shadow: var(--shadow);
}

.table-row,
.total-row,
.summary-box li {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-row {
  color: var(--text-main);
  font-weight: 600;
  padding-bottom: 12px;
}

.summary-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.summary-box li {
  padding: 12px 0;
  color: var(--text-main);
}

.note-block {
  display: grid;
  gap: 8px;
  margin-top: 14px;
  color: var(--text-main);
  font-weight: 600;
}

.note-block textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 14px;
  resize: vertical;
  font: inherit;
  background: rgba(16, 42, 67, 0.02);
  color: var(--text-main);
}

.note-block textarea:focus {
  outline: 2px solid rgba(232, 93, 4, 0.22);
  border-color: rgba(232, 93, 4, 0.32);
}

.total-row {
  margin-top: 18px;
  padding: 18px 14px;
  background: rgba(232, 93, 4, 0.06);
  border: 1px solid rgba(232, 93, 4, 0.12);
  border-radius: 14px;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-main);
}

.actions {
  display: grid;
  grid-template-columns: 1fr 1.3fr;
  gap: 12px;
  margin-top: 24px;
}

button {
  border: none;
  border-radius: 14px;
  padding: 14px;
  font-weight: 800;
}

.primary {
  background: linear-gradient(135deg, var(--primary) 0%, #d95502 100%);
  color: #ffffff;
  box-shadow: 0 14px 24px rgba(232, 93, 4, 0.24);
}

.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary {
  background: rgba(16, 42, 67, 0.04);
  border: 1px solid var(--border);
  color: var(--text-main);
}
</style>
