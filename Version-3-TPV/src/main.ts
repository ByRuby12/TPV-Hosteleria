import { createApp } from 'vue'
import router from './router'
import './style.css'
import App from './App.vue'

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
