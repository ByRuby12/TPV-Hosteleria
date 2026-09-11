import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const serviceAccountPath = './service-account.json'

const app = initializeApp({
  credential: cert(serviceAccountPath),
})

const auth = getAuth(app)

const users = [
  {
    email: 'admin@restaurante.com',
    password: 'Admin123!',
    displayName: 'Administrador',
  },
  {
    email: 'cocina@restaurante.com',
    password: 'Kitchen123!',
    displayName: 'Cocina',
  },
  {
    email: 'camarero@restaurante.com',
    password: 'Waiter123!',
    displayName: 'Camarero',
  },
]

async function createUsers() {
  for (const user of users) {
    try {
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      })
      console.log(`✓ Created user: ${user.email} (UID: ${userRecord.uid})`)
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠ User already exists: ${user.email}`)
      } else {
        console.error(`✗ Error creating user ${user.email}:`, error.message)
      }
    }
  }
  console.log('\n✅ Firebase Auth users setup completed!')
}

createUsers().catch(console.error)
