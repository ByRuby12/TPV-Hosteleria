import { createRouter, createWebHistory } from 'vue-router'
import { getRoleLandingRoute, useAuthStore } from '../stores/authStore'
import CartView from '../views/client/CartView.vue'
import ConfirmOrderView from '../views/client/ConfirmOrderView.vue'
import OrderSentView from '../views/client/OrderSentView.vue'
import OrderStatusView from '../views/client/OrderStatusView.vue'
import TableSessionView from '../views/client/TableSessionView.vue'
import TableBillView from '../views/client/TableBillView.vue'
import SplitBillView from '../views/client/SplitBillView.vue'
import PosView from '../views/pos/PosView.vue'
import KitchenView from '../views/kitchen/KitchenView.vue'
import LoginView from '../views/auth/LoginView.vue'
import AdminView from '../views/admin/AdminView.vue'

const authStore = useAuthStore()

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/carrito', name: 'cart', component: CartView },
    { path: '/confirmar', name: 'confirm-order', component: ConfirmOrderView },
    { path: '/pedido/confirmado', name: 'order-sent', component: OrderSentView },
    { path: '/estado-pedido', name: 'order-status', component: OrderStatusView },
    { path: '/mesa/:qrIdentifier', name: 'table-session', component: TableSessionView },
    { path: '/pedido/:token', name: 'order-session', component: TableSessionView },
    { path: '/cuenta', name: 'table-bill', component: TableBillView },
    { path: '/dividir', name: 'split-bill', component: SplitBillView },
    { path: '/pos', name: 'pos', component: PosView, meta: { role: 'waiter' } },
    { path: '/kitchen', name: 'kitchen', component: KitchenView, meta: { role: 'kitchen' } },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/admin', name: 'admin', component: AdminView, meta: { role: 'admin' } },
  ],
})

router.beforeEach((to, _from, next) => {
  const user = authStore.user.value
  const isSessionExpired = authStore.isSessionExpired.value

  // Check if session expired for protected routes
  if (isSessionExpired && to.meta.role) {
    authStore.logout()
    return next('/login')
  }

  if (to.path === '/login') {
    if (user) {
      return next(getRoleLandingRoute(user.role))
    }
    return next()
  }

  const requiredRole = to.meta.role as 'admin' | 'kitchen' | 'waiter' | undefined

  if (!requiredRole) {
    return next()
  }

  if (!user) {
    return next('/login')
  }

  if (user.role !== requiredRole) {
    return next(getRoleLandingRoute(user.role))
  }

  return next()
})

export default router
