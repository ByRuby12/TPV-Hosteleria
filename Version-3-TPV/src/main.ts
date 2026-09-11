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

const bootstrap = async () => {
	const redirect = new URLSearchParams(window.location.search).get('redirect')
	const target = redirect ? decodeURIComponent(redirect) : ''

	if (target.startsWith('/')) {
		await router.replace(target)
	}

	await router.isReady()
	app.mount('#app')
}

bootstrap()
