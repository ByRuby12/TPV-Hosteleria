<template>
  <div class="login-page">
    <div class="login-panel">
      <div class="brand-block">
        <div class="brand-badge">🍽️</div>
        <div>
          <p class="eyebrow">Restaurante</p>
          <h1>{{ restaurantName }}</h1>
        </div>
      </div>

      <div class="welcome-copy">
        <h2>Acceso al sistema</h2>
        <p>Selecciona tu perfil y entra con tus credenciales.</p>
      </div>

      <div class="role-tabs" role="tablist" aria-label="Selecciona tu perfil">
        <button
          v-for="option in roleOptions"
          :key="option.value"
          type="button"
          class="role-tab"
          :class="{ active: selectedRole === option.value }"
          @click="selectRole(option.value)"
        >
          <span class="tab-icon">{{ option.icon }}</span>
          {{ option.label }}
        </button>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <label>
          <span>Email</span>
          <input v-model="email" type="email" :placeholder="selectedOption.email" required />
        </label>
        <label>
          <span>Contraseña</span>
          <input v-model="password" type="password" :placeholder="selectedOption.passwordPlaceholder" required />
        </label>
        <button type="submit" :disabled="loading">
          {{ loading ? 'Entrando...' : `Entrar como ${selectedOption.label}` }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getRoleLandingRoute, useAuthStore, type AuthRole } from '../../stores/authStore'
import { useCompanySettings } from '../../stores/companySettings'

const router = useRouter()
const { login, loading } = useAuthStore()
const { settings, loadSettings } = useCompanySettings()

const roleOptions = [
  { value: 'admin', label: 'Administrador', icon: '👑', email: 'admin@restaurante.com', passwordPlaceholder: '••••••••', defaultPassword: 'Admin123!' },
  { value: 'kitchen', label: 'Cocina', icon: '👨‍🍳', email: 'cocina@restaurante.com', passwordPlaceholder: '••••••••', defaultPassword: 'Kitchen123!' },
  { value: 'waiter', label: 'Camarero', icon: '🪑', email: 'camarero@restaurante.com', passwordPlaceholder: '••••••••', defaultPassword: 'Waiter123!' },
] as const

const selectedRole = ref<AuthRole>('waiter')
const email = ref('camarero@restaurante.com')
const password = ref('admin123')
const error = ref('')
const restaurantName = computed(() => settings.value.restaurantName || 'Restaurante')

const selectedOption = computed(() => roleOptions.find((option) => option.value === selectedRole.value) ?? roleOptions[2])

onMounted(async () => {
  await loadSettings()
})

const selectRole = (role: AuthRole) => {
  selectedRole.value = role
  const option = roleOptions.find((item) => item.value === role)
  if (!option) return

  email.value = option.email
  password.value = 'admin123'
  error.value = ''
}

const handleLogin = async () => {
  try {
    error.value = ''
    const user = await login(email.value, password.value)
    const nextRoute = getRoleLandingRoute(user?.role ?? selectedRole.value)
    router.push(nextRoute)
  } catch (e) {
    error.value = 'Credenciales incorrectas para este perfil.'
  }
}
</script>

<style scoped>
:global(body) {
  margin: 0;
  min-height: 100vh;
  font-family: Inter, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #f5efe6 0%, #f8fafc 100%);
}

.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  box-sizing: border-box;
  overflow-y: auto;
  background:
    radial-gradient(circle at top, rgba(180, 83, 9, 0.12), transparent 30%),
    linear-gradient(135deg, #1f2937 0%, #111827 100%);
}

.login-panel {
  width: min(100%, 460px);
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 28px;
  padding: 28px 26px 22px;
  box-shadow: 0 28px 60px rgba(0, 0, 0, 0.25);
}

.brand-block {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}

.brand-badge {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f59e0b, #f97316);
  display: grid;
  place-items: center;
  font-size: 1.6rem;
  box-shadow: 0 12px 24px rgba(245, 158, 11, 0.3);
}

.eyebrow {
  margin: 0;
  color: #f59e0b;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.brand-block h1 {
  margin: 6px 0 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  color: #111827;
  overflow-wrap: anywhere;
}

.welcome-copy {
  margin-bottom: 20px;
}

.welcome-copy h2 {
  margin: 0 0 8px;
  color: #111827;
  font-size: 1.7rem;
}

.welcome-copy p {
  margin: 0;
  color: #6b7280;
  font-size: 0.96rem;
}

.role-tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 20px;
}

.role-tab {
  border: 1px solid #e5e7eb;
  background: #f8fafc;
  color: #374151;
  border-radius: 12px;
  font-weight: 700;
  padding: 10px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 76px;
  overflow-wrap: anywhere;
}

.role-tab.active {
  background: linear-gradient(135deg, #111827, #1f2937);
  color: white;
  border-color: #111827;
  box-shadow: 0 12px 24px rgba(17, 24, 39, 0.18);
}

.tab-icon {
  font-size: 1.2rem;
}

.login-form {
  display: grid;
  gap: 16px;
}

label {
  display: grid;
  gap: 8px;
  font-weight: 700;
  color: #374151;
}

input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 1rem;
  background: #fff;
  color: #111827;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus {
  outline: none;
  border-color: #f59e0b;
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.16);
}

button {
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  color: white;
  font-weight: 800;
  padding: 13px 16px;
  cursor: pointer;
  min-height: 46px;
  transition: filter 0.2s ease, transform 0.2s ease;
}

button:hover {
  filter: brightness(1.03);
}

button:disabled {
  opacity: 0.7;
  cursor: wait;
}

.error {
  margin: 0;
  color: #b91c1c;
  font-size: 0.9rem;
  font-weight: 600;
}

@media (max-width: 520px) {
  .login-page {
    align-items: start;
    padding: 14px 10px;
  }

  .login-panel {
    margin: auto 0;
    padding: 22px 18px 18px;
    border-radius: 20px;
  }

  .brand-block {
    gap: 10px;
    margin-bottom: 16px;
  }

  .brand-badge {
    width: 46px;
    height: 46px;
    border-radius: 13px;
    font-size: 1.35rem;
  }

  .welcome-copy {
    margin-bottom: 16px;
  }

  .welcome-copy h2 {
    font-size: 1.45rem;
  }

  .welcome-copy p {
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .role-tabs {
    grid-template-columns: 1fr;
    gap: 7px;
  }

  .role-tab {
    min-height: 54px;
    flex-direction: row;
    justify-content: flex-start;
    padding: 10px 14px;
    text-align: left;
  }

  .tab-icon {
    width: 28px;
    text-align: center;
  }

  input {
    min-height: 48px;
    font-size: 16px;
  }

  .login-form > button {
    min-height: 50px;
  }
}

@media (max-width: 360px) {
  .login-page {
    padding: 8px;
  }

  .login-panel {
    padding: 18px 14px 14px;
  }

  .brand-block h1 {
    font-size: 1.35rem;
  }

  .eyebrow {
    font-size: 0.66rem;
  }

  .welcome-copy h2 {
    font-size: 1.3rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-panel *,
  .login-panel *::before,
  .login-panel *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
</style>
