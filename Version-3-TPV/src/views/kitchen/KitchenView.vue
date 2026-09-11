<template>
  <div class="kitchen-screen">
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
    <header class="kitchen-header">
      <div>
        <p class="eyebrow">👨‍🍳 Cocina</p>
        <h1>Panel de Preparación</h1>
        <p class="subtitle">{{ totalOrders }} pedidos en sistema</p>
        <p v-if="sessionExpiresAt" class="session-info">⏱️ Sesión expira: {{ formatSessionTime }}</p>
      </div>
      <div class="header-stats">
        <div class="header-stat">
          <span class="stat-badge pending">{{ pendingOrders.length }}</span>
          <p>Nuevos</p>
        </div>
        <div class="header-stat">
          <span class="stat-badge preparing">{{ preparingOrders.length }}</span>
          <p>Preparando</p>
        </div>
        <div class="header-stat">
          <span class="stat-badge ready">{{ readyOrders.length }}</span>
          <p>Listos</p>
        </div>
      </div>
      <button class="logout-btn" @click="handleLogout">🚪 Cerrar sesión</button>
    </header>

    <div class="kanban-board">
      <!-- NUEVOS -->
      <div class="kanban-column">
        <div class="column-header new">
          <h2>🆕 Nuevos Pedidos</h2>
          <span class="count">{{ pendingOrders.length }}</span>
        </div>
        <div class="tickets-container">
          <div v-if="pendingOrders.length === 0" class="empty-state">
            <p>✨ Sin pedidos nuevos</p>
          </div>
          <div v-for="order in pendingOrders" :key="order.id" class="ticket new-ticket">
            <div class="ticket-header">
              <div>
                <span class="table-badge">MESA {{ getTableLabel(order.tableId) }}</span>
                <span class="order-number">Pedido {{ getOrderNumber(order.id) }}</span>
              </div>
              <span class="time">{{ formatTime(order.createdAt) }}</span>
            </div>
            <div class="ticket-items">
              <div v-for="entry in activeOrderItems(order)" :key="`${order.id}-${entry.index}`" class="item order-item-line">
                <span><span class="qty">{{ entry.item.quantity }}×</span> {{ entry.item.name }}</span>
                <button class="reject-item-btn" type="button" @click="rejectOrderItem(order.id, entry.index)">Rechazar</button>
              </div>
            </div>
            <p v-if="order.note" class="ticket-note">📝 {{ order.note }}</p>
            <button class="action-btn start" @click="updateOrderStatus(order.id, 'PREPARING')">
              ▶️ Comenzar Preparación
            </button>
          </div>
        </div>
      </div>

      <!-- PREPARANDO -->
      <div class="kanban-column">
        <div class="column-header preparing">
          <h2>👨‍🍳 Preparando</h2>
          <span class="count">{{ preparingOrders.length }}</span>
        </div>
        <div class="tickets-container">
          <div v-if="preparingOrders.length === 0" class="empty-state">
            <p>🎉 Todo actualizado</p>
          </div>
          <div v-for="order in preparingOrders" :key="order.id" class="ticket preparing-ticket">
            <div class="ticket-header">
              <div>
                <span class="table-badge preparing">MESA {{ getTableLabel(order.tableId) }}</span>
                <span class="order-number">Pedido {{ getOrderNumber(order.id) }}</span>
              </div>
              <span class="time">{{ formatTime(order.createdAt) }}</span>
            </div>
            <div class="ticket-items">
              <div v-for="entry in activeOrderItems(order)" :key="`${order.id}-${entry.index}`" class="item order-item-line">
                <span><span class="qty">{{ entry.item.quantity }}×</span> {{ entry.item.name }}</span>
                <button class="reject-item-btn" type="button" @click="rejectOrderItem(order.id, entry.index)">Rechazar</button>
              </div>
            </div>
            <p v-if="order.note" class="ticket-note">📝 {{ order.note }}</p>
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            <button class="action-btn ready" @click="updateOrderStatus(order.id, 'READY')">
              ✅ Listo para Servir
            </button>
          </div>
        </div>
      </div>

      <!-- LISTOS -->
      <div class="kanban-column">
        <div class="column-header ready">
          <h2>✅ Listos</h2>
          <span class="count">{{ readyOrders.length }}</span>
        </div>
        <div class="tickets-container">
          <div v-if="readyOrders.length === 0" class="empty-state">
            <p>📭 Ninguno listo</p>
          </div>
          <div v-for="order in readyOrders" :key="order.id" class="ticket ready-ticket">
            <div class="ticket-header">
              <div>
                <span class="table-badge ready">MESA {{ getTableLabel(order.tableId) }}</span>
                <span class="order-number">Pedido {{ getOrderNumber(order.id) }}</span>
              </div>
              <span class="time">{{ formatTime(order.createdAt) }}</span>
            </div>
            <div class="ticket-items">
              <div v-for="entry in activeOrderItems(order)" :key="`${order.id}-${entry.index}`" class="item order-item-line">
                <span><span class="qty">{{ entry.item.quantity }}×</span> {{ entry.item.name }}</span>
                <button class="reject-item-btn" type="button" @click="rejectOrderItem(order.id, entry.index)">Rechazar</button>
              </div>
            </div>
            <p v-if="order.note" class="ticket-note">📝 {{ order.note }}</p>
            <div class="ready-alert">🔔 Esperando camarero para servir</div>
            <div class="action-btn delivered locked">📦 Listo para recoger</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdersLiveStore } from '../../stores/ordersLiveStore'
import { useAuthStore } from '../../stores/authStore'

const router = useRouter()
const { logout, sessionExpiresAt } = useAuthStore()
const { orders, tables, updateOrderStatus, updateOrderItemStatus } = useOrdersLiveStore()

const rejectionReasons = ['Agotado', 'Falta un ingrediente', 'No se puede preparar', 'Otro motivo']
const rejectionDialog = reactive({ open: false, orderId: '', itemIndex: -1, itemName: '', reason: '' })

const activeOrderItems = (order: { items: Array<{ name: string; quantity: number; status?: string }> }) =>
  order.items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.status !== 'REJECTED')

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

const activeKitchenOrders = computed(() => orders.value.filter((order) =>
  order.items.some((item) => item.status !== 'REJECTED'),
))
const pendingOrders = computed(() => activeKitchenOrders.value.filter((order) => order.status === 'PENDING'))
const preparingOrders = computed(() => activeKitchenOrders.value.filter((order) => order.status === 'PREPARING'))
const readyOrders = computed(() => activeKitchenOrders.value.filter((order) => order.status === 'READY'))
const totalOrders = computed(() => orders.value.length)

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
  const index = orders.value.findIndex(o => o.id === orderId)
  return index >= 0 ? index + 1 : '—'
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.kitchen-screen {
  min-height: 100vh;
  height: auto;
  overflow-y: auto;
  overflow-x: hidden;
  background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
  padding: 30px 20px;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.kitchen-screen::-webkit-scrollbar {
  display: none;
}

.kitchen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  padding: 32px;
  border-radius: 18px;
  margin-bottom: 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  gap: 40px;
  min-width: 0;
}

.eyebrow {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #6b7280;
  margin-bottom: 6px;
}

.kitchen-header h1 {
  font-size: 2.2rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 4px;
}

.subtitle {
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

.logout-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 12px 20px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.logout-btn:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.logout-btn:active {
  transform: translateY(0);
}

.header-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.header-stat {
  text-align: center;
}

.header-stat p {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 600;
  margin-top: 8px;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 1.5rem;
  color: white;
}

.stat-badge.pending {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
}

.stat-badge.preparing {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.stat-badge.ready {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
  min-width: 0;
}

.kanban-column {
  display: flex;
  flex-direction: column;
  height: fit-content;
  max-height: calc(100vh - 250px);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 0;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  font-weight: 700;
  color: white;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.column-header h2 {
  font-size: 1.1rem;
  margin: 0;
}

.column-header.new {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(249, 115, 22, 0.1) 100%);
  border-bottom-color: #f59e0b;
}

.column-header.preparing {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.1) 100%);
  border-bottom-color: #3b82f6;
}

.column-header.ready {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.1) 100%);
  border-bottom-color: #22c55e;
}

.count {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  min-width: 30px;
  text-align: center;
}

.tickets-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tickets-container::-webkit-scrollbar {
  width: 6px;
}

.tickets-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.tickets-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.tickets-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  font-size: 1rem;
}

.empty-state p {
  margin: 0;
}

.ticket {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  border-left: 4px solid #ccc;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.ticket.new-ticket {
  border-left-color: #f59e0b;
  background: linear-gradient(to right, rgba(245, 158, 11, 0.05), white);
}

.ticket.new-ticket:hover {
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.2);
  transform: translateY(-2px);
}

.ticket.preparing-ticket {
  border-left-color: #3b82f6;
  background: linear-gradient(to right, rgba(59, 130, 246, 0.05), white);
}

.ticket.preparing-ticket:hover {
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
  transform: translateY(-2px);
}

.ticket.ready-ticket {
  border-left-color: #22c55e;
  background: linear-gradient(to right, rgba(34, 197, 94, 0.05), white);
}

.ticket.ready-ticket:hover {
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.2);
  transform: translateY(-2px);
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  gap: 8px;
}

.ticket-header > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.table-badge {
  background: #f59e0b;
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
}

.table-badge.preparing {
  background: #3b82f6;
}

.table-badge.ready {
  background: #22c55e;
}

.order-number {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  background: #f8fafc;
  color: #0f172a;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.time {
  font-size: 0.85rem;
  color: #475569;
  font-weight: 700;
}

.ticket-items {
  margin-bottom: 12px;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 10px;
  padding: 10px 12px;
}

.item {
  margin: 6px 0;
  color: #1f2937;
  font-size: 0.95rem;
  line-height: 1.5;
  font-weight: 600;
}

.item:first-child {
  margin-top: 0;
}

.item:last-child {
  margin-bottom: 0;
}

.order-item-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.order-item-line.rejected {
  color: #991b1b;
  text-decoration: line-through;
}

.rejected-label {
  flex: 0 0 auto;
  color: #b91c1c;
  font-size: 0.72rem;
  font-weight: 800;
  text-decoration: none;
  text-transform: uppercase;
}

.reject-item-btn {
  flex: 0 0 auto;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 4px 7px;
  background: #fff1f2;
  color: #b91c1c;
  cursor: pointer;
  font-size: 0.7rem;
  font-weight: 800;
  min-height: 32px;
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
  font-weight: 700;
  color: #1f2937;
  margin-right: 4px;
}

.ticket-note {
  background: #fff7ed;
  border-left: 3px solid #f59e0b;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #7c2d12;
  margin-bottom: 12px;
  margin: 12px 0;
  font-weight: 600;
}

.progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  animation: progress 2s infinite;
}

@keyframes progress {
  0% { width: 30%; }
  50% { width: 70%; }
  100% { width: 30%; }
}

.ready-alert {
  background: #dcfce7;
  border-left: 3px solid #22c55e;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #166534;
  margin-bottom: 12px;
  font-weight: 600;
}

.action-btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  color: white;
}

.action-btn.start {
  background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
}

.action-btn.start:hover {
  background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
  transform: scale(1.02);
}

.action-btn.ready {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.action-btn.ready:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: scale(1.02);
}

.action-btn.delivered {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.action-btn.delivered:hover {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  transform: scale(1.02);
}

@media (max-width: 1100px) {
  .kitchen-screen {
    padding: 22px 16px 32px;
  }

  .kitchen-header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
    padding: 26px 24px;
    text-align: center;
  }

  .header-stats {
    align-self: center;
  }

  .logout-btn {
    align-self: center;
  }

  .kanban-board {
    grid-template-columns: 1fr;
    gap: 18px;
  }

  .kanban-column {
    max-height: none;
  }

  .tickets-container {
    max-height: none;
    overflow: visible;
  }
}

@media (max-width: 640px) {
  .kitchen-screen {
    padding: 10px 10px 24px;
  }

  .kitchen-header {
    padding: 20px 16px;
    margin-bottom: 18px;
    border-radius: 14px;
  }

  .kitchen-header h1 {
    font-size: clamp(1.45rem, 7vw, 1.9rem);
    line-height: 1.1;
    overflow-wrap: anywhere;
  }

  .subtitle {
    line-height: 1.4;
  }

  .header-stats {
    width: 100%;
    gap: 8px;
    justify-content: space-between;
  }

  .header-stat {
    flex: 1 1 0;
  }

  .stat-badge {
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }

  .header-stat p {
    margin-top: 5px;
    font-size: 0.72rem;
  }

  .logout-btn {
    width: 100%;
    min-height: 44px;
  }

  .column-header {
    padding: 15px 14px;
  }

  .column-header h2 {
    font-size: 0.98rem;
  }

  .tickets-container {
    padding: 10px;
    gap: 10px;
  }

  .ticket {
    padding: 13px;
    border-radius: 10px;
  }

  .ticket-header {
    gap: 10px;
  }

  .table-badge,
  .order-number {
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  .time {
    flex: 0 0 auto;
    font-size: 0.75rem;
  }

  .order-item-line {
    align-items: stretch;
    flex-direction: column;
  }

  .reject-item-btn {
    width: 100%;
    min-height: 38px;
  }

  .action-btn {
    min-height: 44px;
    padding: 11px 10px;
  }

  .rejection-modal-overlay {
    padding: 10px;
  }

  .rejection-modal {
    max-height: calc(100vh - 20px);
    overflow-y: auto;
    padding: 22px 16px 16px;
    border-radius: 16px;
  }

  .rejection-actions {
    flex-direction: column-reverse;
  }

  .rejection-cancel,
  .rejection-confirm {
    width: 100%;
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kitchen-screen *,
  .kitchen-screen *::before,
  .kitchen-screen *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
