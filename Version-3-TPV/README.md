# Proyecto TPV / pedidos para hostelería

Este proyecto está basado en Vue 3 + Vite + TypeScript y está preparado para evolucionar hacia una app completa de pedidos por QR, TPV, cocina y administración.

## Requisitos

- Node.js 18+
- npm

## Instalar

```bash
npm install
```

## Ejecutar en desarrollo

```bash
npm run dev
```

## Compilar para producción

```bash
npm run build
```

## Firebase

Copia el archivo `.env.example` a `.env` y rellena las credenciales del proyecto web de Firebase.

```bash
cp .env.example .env
```

No uses el JSON de service account dentro del frontend. Ese archivo sirve para backend/admin con Firebase Admin SDK y Cloud Functions.

Las credenciales que sí deben ir en la app web se obtienen en:

- Firebase Console
- Project settings
- Your apps
- Web app
- SDK setup and configuration

Ejemplo:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Para la documentación completa de configuración y estructura Firestore, mira [FIREBASE.md](FIREBASE.md).

## Estructura principal

- `src/router` para rutas de cliente, TPV, cocina y administración
- `src/views` para pantallas principales
- `src/services` para lógica con Firebase
- `src/types` para tipos del dominio

## Nota importante

La versión actual del proyecto es una base funcional para empezar a desarrollar el sistema siguiendo el prompt del proyecto. Es una estructura modular y lista para incorporar Firebase, autenticación y lógica de pedidos.
