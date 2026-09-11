<template>
  <div class="page cart-page">
    <header class="return-header">
      <button class="return-btn" @click="router.push('/')">← Volver a la carta</button>
    </header>

    <div v-if="cart.length === 0" class="empty-state">
      <h3>Tu carrito está vacío</h3>
      <p>Añade algo de la carta para continuar</p>
    </div>

    <div v-else class="cart-items">
      <div v-for="item in cart" :key="item.id" class="cart-item">
        <div class="item-main">
          <strong>{{ item.name }}</strong>
          <div class="meta">{{ formatPrice(item.price) }} cada uno</div>
        </div>
        <div class="controls">
          <button @click="decrementItem(item.id)">−</button>
          <span>{{ item.quantity }}</span>
          <button @click="incrementItem(item.id)">+</button>
        </div>
      </div>
    </div>

    <div class="summary">
      <div class="summary-row">
        <span>Subtotal</span>
        <strong>{{ formatPrice(total) }}</strong>
      </div>
      <div class="summary-row highlight">
        <span>Total</span>
        <strong>{{ formatPrice(total) }}</strong>
      </div>
      <button class="primary-btn" :disabled="cart.length === 0" @click="router.push('/confirmar')">
        Confirmar pedido
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCart } from '../../stores/orderStore'

const router = useRouter()
const { cart, decrementItem, incrementItem, total } = useCart()

const formatPrice = (value: number) => `${value.toFixed(2)} €`
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

.cart-page > .return-header,
.cart-page > .empty-state,
.cart-page > .cart-items,
.cart-page > .summary {
  width: min(100%, 760px);
  margin-inline: auto;
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
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.nav-header h2 {
  margin: 4px 0 0;
  font-size: 1.8rem;
  color: var(--text-main);
}

.cart-items {
  display: grid;
  gap: 12px;
}

.cart-item {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 22px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow);
}

.item-main strong {
  display: block;
  color: var(--text-main);
  margin-bottom: 4px;
}

.meta {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.controls {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(232, 93, 4, 0.06);
  border: 1px solid rgba(232, 93, 4, 0.12);
  border-radius: 14px;
  padding: 8px 10px;
}

.controls button {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 10px;
  background: var(--primary);
  color: #ffffff;
  font-size: 1.2rem;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(232, 93, 4, 0.18);
}

.controls span {
  min-width: 18px;
  text-align: center;
  color: var(--text-main);
  font-weight: 800;
}

.summary {
  margin-top: 28px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 20px 18px;
  box-shadow: var(--shadow);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  color: var(--text-main);
}

.summary-row.highlight {
  margin-top: 10px;
  padding: 18px 14px;
  background: rgba(232, 93, 4, 0.06);
  border: 1px solid rgba(232, 93, 4, 0.12);
  border-radius: 14px;
  color: var(--text-main);
  font-size: 1.08rem;
}

.summary-row strong {
  font-size: 1.05rem;
}

.primary-btn {
  width: 100%;
  border: none;
  border-radius: 14px;
  padding: 14px 16px;
  background: linear-gradient(135deg, var(--primary) 0%, #d95502 100%);
  color: #ffffff;
  font-weight: 800;
  margin-top: 18px;
  box-shadow: 0 14px 24px rgba(232, 93, 4, 0.24);
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  background: var(--card-bg);
  border: 1px solid var(--border);
  padding: 26px 18px;
  border-radius: 24px;
  text-align: center;
  box-shadow: var(--shadow);
}

.empty-state h3 {
  margin: 0 0 6px;
  color: var(--text-main);
}

.empty-state p {
  margin: 0;
  color: var(--text-muted);
}
</style>
