<template>
  <main class="session-view">
    <section v-if="table && !sessionLockedForAnotherTable" class="card">
      <div class="brand-mark" aria-label="Logo del restaurante">
        <img v-if="settings.logoImage" :src="normalizeImage(settings.logoImage)" :alt="settings.restaurantName" />
        <span v-else>{{ restaurantInitials }}</span>
      </div>
      <p class="eyebrow">{{ settings.restaurantName }}</p>
      <div class="table-badge">Mesa {{ table.number }}</div>
      <h1>Tu mesa está lista</h1>
      <div class="welcome-box">
        <span>Bienvenido a tu mesa</span>
        <strong>Disfruta de la carta con calma</strong>
      </div>
      <p class="welcome-copy">Consulta la carta, añade lo que te apetezca y envía tu pedido cuando estés listo.</p>

      <button class="primary" @click="router.push('/')">
        <span>Acceder a la carta</span>
        <span aria-hidden="true">→</span>
      </button>
    </section>

    <section v-else class="card">
      <div class="brand-mark error-mark" aria-hidden="true">!</div>
      <template v-if="sessionLockedForAnotherTable">
        <p class="eyebrow">Sesión activa</p>
        <h1>Ya estás dentro de otra mesa</h1>
        <p class="welcome-copy">Esta sesión seguirá activa hasta que se complete el pago de la mesa actual.</p>
      </template>
      <template v-else>
        <p class="eyebrow">Mesa no disponible</p>
        <h1>No hemos podido abrir la mesa</h1>
        <p class="welcome-copy">Escanea de nuevo el código QR situado en tu mesa.</p>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTableSessionStore } from '../../stores/tableSessionStore'
import { useCompanySettings } from '../../stores/companySettings'

const route = useRoute()
const router = useRouter()
const { table, resolveByQrIdentifier, sessionLockedForAnotherTable } = useTableSessionStore()
const { settings, loadSettings } = useCompanySettings()

const restaurantInitials = computed(() => {
  const words = settings.value.restaurantName.split(/\s+/).filter(Boolean)
  return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('') || 'R'
})

const normalizeImage = (value: string) => {
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  const assetPath = value.replace(/^\.\//, '').replace(/^\//, '')
  return `${import.meta.env.BASE_URL}${assetPath}`
}

onMounted(async () => {
  const qrIdentifier = String(route.params.qrIdentifier || '')
  if (qrIdentifier) resolveByQrIdentifier(qrIdentifier)
  await loadSettings()
})
</script>

<style scoped>
.session-view {
  position: relative;
  display: grid;
  min-height: 100vh;
  place-items: center;
  overflow: hidden;
  padding: 24px;
  background:
    radial-gradient(circle at 12% 8%, rgba(232, 93, 4, 0.18), transparent 30%),
    radial-gradient(circle at 88% 92%, rgba(16, 42, 67, 0.14), transparent 34%),
    var(--bg-color);
}

.card {
  position: relative;
  z-index: 1;
  width: min(100%, 440px);
  padding: 34px 28px 28px;
  border: 1px solid var(--border);
  border-radius: 30px;
  background: color-mix(in srgb, var(--surface) 94%, transparent);
  box-shadow: var(--shadow);
  text-align: center;
  backdrop-filter: blur(16px);
}

.brand-mark {
  display: grid;
  width: 72px;
  height: 72px;
  margin: 0 auto 18px;
  place-items: center;
  border: 2px solid rgba(232, 93, 4, 0.26);
  border-radius: 50%;
  background: linear-gradient(145deg, #ff7a18, #e85d04);
  box-shadow: 0 16px 30px rgba(232, 93, 4, 0.24);
  color: white;
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: 0.04em;
}

.brand-mark img {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  object-fit: cover;
}

.error-mark {
  background: rgba(232, 93, 4, 0.12);
  color: var(--primary);
  box-shadow: none;
}

.eyebrow {
  margin: 0 0 14px;
  color: var(--primary);
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.table-badge {
  display: inline-flex;
  margin-bottom: 14px;
  padding: 7px 13px;
  border: 1px solid rgba(232, 93, 4, 0.2);
  border-radius: 999px;
  background: rgba(232, 93, 4, 0.1);
  color: var(--primary);
  font-size: 0.82rem;
  font-weight: 800;
}

h1 {
  margin: 0 0 22px;
  color: var(--text-main);
  font-size: clamp(1.7rem, 7vw, 2.2rem);
  line-height: 1.1;
}

.welcome-box {
  display: grid;
  gap: 5px;
  margin: 0 0 18px;
  padding: 17px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: rgba(232, 93, 4, 0.07);
}

.welcome-box span {
  color: var(--text-muted);
  font-size: 0.82rem;
}

.welcome-box strong {
  color: var(--text-main);
  font-size: 1.05rem;
}

.welcome-copy {
  margin: 0 0 24px;
  color: var(--text-muted);
  line-height: 1.6;
}

.welcome-copy strong {
  color: var(--text-main);
}

.primary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border: 0;
  border-radius: 14px;
  padding: 14px 18px;
  background: linear-gradient(135deg, #f97316, #f43f5e);
  box-shadow: 0 12px 24px rgba(249, 115, 22, 0.24);
  color: white;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 800;
}

.primary span:last-child {
  font-size: 1.35rem;
  line-height: 1;
}

.primary:hover {
  filter: brightness(1.04);
  transform: translateY(-1px);
}

:global(body.dark-mode) .session-view {
  background:
    radial-gradient(circle at 12% 8%, rgba(232, 93, 4, 0.16), transparent 30%),
    radial-gradient(circle at 88% 92%, rgba(96, 165, 250, 0.08), transparent 34%),
    var(--bg-color);
}

:global(body.dark-mode) .card {
  background: rgba(11, 23, 36, 0.94);
}

:global(body.dark-mode) .welcome-box {
  background: rgba(232, 93, 4, 0.12);
}
</style>
