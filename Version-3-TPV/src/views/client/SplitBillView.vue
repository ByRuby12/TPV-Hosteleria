<template>
  <div class="split-bill-container">
    <header>
      <h1>💰 Dividir Cuenta</h1>
      <p class="subtitle">Mesa {{ tableNumber }}</p>
    </header>

    <div class="bill-summary">
      <div class="total-info">
        <span class="label">Total de la cuenta:</span>
        <span class="amount">{{ total.toFixed(2) }} €</span>
      </div>

      <div class="split-options">
        <div class="option">
          <input
            type="radio"
            id="equal"
            v-model="splitMode"
            value="equal"
            name="split-mode"
          />
          <label for="equal">
            <span class="option-title">A partes iguales</span>
            <span class="option-desc">Cada persona paga lo mismo</span>
          </label>
        </div>

        <div class="option">
          <input
            type="radio"
            id="custom"
            v-model="splitMode"
            value="custom"
            name="split-mode"
          />
          <label for="custom">
            <span class="option-title">Cada persona paga lo suyo</span>
            <span class="option-desc">Asignar items a personas</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Equal Split -->
    <div v-if="splitMode === 'equal'" class="split-section">
      <div class="input-group">
        <label>Número de personas</label>
        <div class="number-input">
          <button @click="peopleCount--" :disabled="peopleCount <= 1">−</button>
          <input v-model.number="peopleCount" type="number" min="1" />
          <button @click="peopleCount++">+</button>
        </div>
      </div>

      <div class="calculation">
        <div class="calc-row">
          <span>Total:</span>
          <span>{{ total.toFixed(2) }} €</span>
        </div>
        <div class="calc-row divider"></div>
        <div class="calc-row highlight">
          <span>Por persona ({{ peopleCount }}):</span>
          <span>{{ (total / peopleCount).toFixed(2) }} €</span>
        </div>
      </div>

      <button class="btn btn-primary btn-lg" @click="confirmEqualSplit">
        Confirmar división
      </button>
    </div>

    <!-- Custom Split -->
    <div v-else class="split-section">
      <div class="custom-split">
        <h3>Asignar items a personas</h3>

        <div v-if="orders.length === 0" class="no-orders">
          <p>No hay pedidos para dividir</p>
        </div>

        <div v-else class="orders-list">
          <div v-for="order in orders" :key="order.id" class="order-items">
            <div class="order-header">
              <span class="order-time">{{ formatTime(order.createdAt) }}</span>
              <span class="order-total">{{ calculateOrderTotal(order) }} €</span>
            </div>

            <div v-for="item in order.items" :key="`${order.id}-${item.productId}`" class="item">
              <div class="item-info">
                <span class="item-name">{{ item.name }} x{{ item.quantity }}</span>
                <span class="item-price">{{ item.subtotal }} €</span>
              </div>

              <div class="person-select">
                <select v-model="itemPersonAssignment[`${order.id}-${item.productId}`]">
                  <option value="">Sin asignar</option>
                  <option v-for="i in 10" :key="i" :value="i">
                    Persona {{ i }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div class="person-totals">
          <h3>Total por persona</h3>
          <div v-for="person in 10" :key="person" v-show="getPersonTotal(person) > 0" class="person-total">
            <span>Persona {{ person }}:</span>
            <span>{{ getPersonTotal(person).toFixed(2) }} €</span>
          </div>
        </div>

        <button class="btn btn-primary btn-lg" @click="confirmCustomSplit">
          Confirmar división personalizada
        </button>
      </div>
    </div>

    <button class="btn btn-secondary" @click="goBack">
      Volver
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdersLiveStore } from '../../stores/ordersLiveStore'
import { useTableSessionStore } from '../../stores/tableSessionStore'

const router = useRouter()
const ordersStore = useOrdersLiveStore()
const sessionStore = useTableSessionStore()

const splitMode = ref<'equal' | 'custom'>('equal')
const peopleCount = ref(2)
const itemPersonAssignment = ref<Record<string, number>>({})

const session = computed(() => sessionStore.session as any)
const tableNumber = computed(() => session.value?.tableId?.replace('table-', '') || '')

const orders = computed(() => {
  if (!session.value) return []
  const sessionId = session.value?.sessionId
  const tableId = session.value?.tableId
  return ordersStore.orders.value.filter(
    (o: any) => o.tableId === tableId && o.sessionId === sessionId
  )
})

const total = computed(() => {
  return orders.value.reduce((sum: number, order: any) => {
    return sum + (order.items?.reduce((itemSum: number, item: any) => itemSum + (item.subtotal || 0), 0) || 0)
  }, 0)
})

function calculateOrderTotal(order: any): number {
  return order.items?.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0) || 0
}

function getPersonTotal(person: number): number {
  let personTotal = 0
  orders.value.forEach((order: any) => {
    order.items?.forEach((item: any) => {
      const key = `${order.id}-${item.productId}`
      if (itemPersonAssignment.value[key] === person) {
        personTotal += item.subtotal || 0
      }
    })
  })
  return personTotal
}

function formatTime(timestamp: any): string {
  if (!timestamp) return ''
  const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp)
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function confirmEqualSplit() {
  const perPerson = total.value / peopleCount.value
  alert(`Cada persona paga: ${perPerson.toFixed(2)} €\n\nNúmero de personas: ${peopleCount.value}`)
  goBack()
}

function confirmCustomSplit() {
  // Validar que todos los items estén asignados
  let unassigned = false
  orders.value.forEach((order: any) => {
    order.items?.forEach((item: any) => {
      const key = `${order.id}-${item.productId}`
      if (!itemPersonAssignment.value[key]) {
        unassigned = true
      }
    })
  })

  if (unassigned) {
    alert('Por favor, asigna todos los items a una persona')
    return
  }

  alert('División de cuenta guardada. Prepara el cobro por persona.')
  goBack()
}

function goBack() {
  router.back()
}

onMounted(() => {
  if (!session.value) {
    router.push('/')
  }
})
</script>

<style scoped lang="css">
.split-bill-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

header {
  text-align: center;
  color: white;
  padding: 1rem 0;
}

header h1 {
  margin: 0;
  font-size: 2rem;
}

.subtitle {
  margin: 0.5rem 0 0;
  opacity: 0.9;
}

.bill-summary {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.total-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #eee;
}

.total-info .label {
  font-weight: 600;
  color: #333;
}

.total-info .amount {
  font-size: 1.8rem;
  font-weight: bold;
  color: #667eea;
}

.split-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.option:hover {
  border-color: #667eea;
  background: #f8f9ff;
}

.option input[type="radio"] {
  margin-top: 0.25rem;
  cursor: pointer;
  accent-color: #667eea;
  width: 20px;
  height: 20px;
}

.option label {
  flex: 1;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.option-title {
  font-weight: 600;
  color: #333;
}

.option-desc {
  font-size: 0.875rem;
  color: #666;
}

.split-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.input-group {
  margin-bottom: 1.5rem;
}

.input-group label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
}

.number-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.number-input button {
  width: 40px;
  height: 40px;
  border: 2px solid #667eea;
  background: white;
  color: #667eea;
  border-radius: 6px;
  font-size: 1.2rem;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s;
}

.number-input button:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.number-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.number-input input {
  flex: 1;
  padding: 0.75rem;
  font-size: 1.2rem;
  text-align: center;
  border: 2px solid #ddd;
  border-radius: 6px;
}

.calculation {
  background: #f8f9ff;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  color: #333;
}

.calc-row.divider {
  border-bottom: 1px solid #ddd;
  padding: 0.5rem 0;
}

.calc-row.highlight {
  font-size: 1.25rem;
  font-weight: bold;
  color: #667eea;
  margin-top: 0.5rem;
}

.custom-split h3 {
  color: #333;
  margin-bottom: 1rem;
}

.no-orders {
  text-align: center;
  padding: 2rem;
  color: #999;
}

.orders-list {
  margin-bottom: 1.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.order-items {
  background: #f8f9ff;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.order-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #ddd;
  font-size: 0.875rem;
  color: #666;
}

.order-time {
  font-weight: 500;
}

.order-total {
  font-weight: 600;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
}

.item-info {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-name {
  font-weight: 500;
  color: #333;
}

.item-price {
  color: #667eea;
  font-weight: 600;
}

.person-select select {
  padding: 0.5rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  color: #333;
}

.person-select select:focus {
  outline: none;
  border-color: #667eea;
}

.person-totals {
  background: #fff3cd;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.person-totals h3 {
  margin: 0 0 0.75rem;
  color: #333;
  font-size: 1rem;
}

.person-total {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  color: #333;
}

.person-total span:last-child {
  font-weight: 600;
}

.btn {
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  margin-bottom: 0.5rem;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #f8f9ff;
}

.btn-lg {
  font-size: 1.1rem;
  padding: 1.25rem;
}

@media (max-width: 640px) {
  .split-bill-container {
    padding: 0.5rem;
  }

  header h1 {
    font-size: 1.5rem;
  }

  .bill-summary,
  .split-section {
    padding: 1rem;
  }

  .total-info .amount {
    font-size: 1.5rem;
  }
}
</style>
