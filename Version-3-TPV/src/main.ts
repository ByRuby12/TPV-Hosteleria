import { createApp } from 'vue'
import router from './router'
import './style.css'
import App from './App.vue'

const redirect = new URLSearchParams(window.location.search).get('redirect')

if (redirect) {
  const target = decodeURIComponent(redirect)
  if (target.startsWith('/')) {
    router.replace(target)
  }
}

window.addEventListener('error', (event) => {
	const message = event.error?.message || event.message || ''
	const stack = event.error?.stack || ''

	if (message.includes("Cannot read properties of undefined (reading 'startTime')") &&
			(stack.includes('reportAllChanges') || message.includes('reportAllChanges'))) {
		event.preventDefault()
		event.stopImmediatePropagation()
	}
}, true)

const app = createApp(App)
app.use(router)
app.mount('#app')
