# Firebase para el proyecto de hostelería

## 1. Crear el proyecto en Firebase

1. Entra en Firebase Console.
2. Crea un nuevo proyecto o usa uno existente.
3. Activa Authentication.
4. Activa Firestore Database.
5. Si vas a usar imágenes de productos, activa Storage.
6. En Project settings > General > Your apps crea una app web.

## 2. Credenciales que deben ir en la app web

No uses el JSON de service account dentro del frontend. Ese JSON es para backend/admin con Firebase Admin SDK o Cloud Functions.

Las variables necesarias para la app web van en un archivo `.env` dentro de la raíz del proyecto:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Puedes copiar el ejemplo desde `.env.example`.

## 3. Dónde ponerlas exactamente

En la carpeta raíz del proyecto:

```text
Version-3-TPV/
├── .env
├── .env.example
├── src/
```

El contenido real debería verse así:

```env
VITE_FIREBASE_API_KEY=AIza... 
VITE_FIREBASE_AUTH_DOMAIN=mi-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mi-proyecto
VITE_FIREBASE_STORAGE_BUCKET=mi-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcd1234
```

## 4. Estructura recomendada de Firestore

```text
users/
  userId

tables/
  tableId

products/
  productId

categories/
  categoryId

tableSessions/
  sessionId

orders/
  orderId

payments/
  paymentId

settings/
  restaurant
```

## 5. Modelo de datos sugerido

### users
- uid
- email
- name
- role: admin | waiter | kitchen
- createdAt
- updatedAt

### tables
- id
- number
- qrIdentifier
- active
- currentSessionId
- createdAt
- updatedAt

### tableSessions
- sessionId
- tableId
- token
- createdAt
- expiresAt
- active
- closedAt

### products
- id
- name
- description
- price
- categoryId
- available
- image
- createdAt
- updatedAt

### categories
- id
- name
- slug
- order
- active
- createdAt
- updatedAt

### orders
- id
- tableId
- sessionId
- clientTokenId
- items[]
- note
- total
- status
- createdAt
- updatedAt

### payments
- id
- tableId
- sessionId
- total
- splitBy
- status
- createdAt
- updatedAt

## 6. Seguridad y reglas

Se recomienda:

- permitir lectura/escritura solo a usuarios autenticados para la parte administrativa
- permitir lectura pública de la carta si la haces pública
- controlar la sesión de mesa con token y expiración
- usar Cloud Functions si necesitas lógica sensible o permisos de servidor

## 7. Siguiente paso

Una vez pongas las variables de entorno, la app está preparada para conectarse a Firebase y usar Firestore + Auth en lugar de mocks.
