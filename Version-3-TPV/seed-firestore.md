# Seed de Firestore para el proyecto TPV

## 1. Colecciones recomendadas

### users
```json
{
  "uid": "admin-demo-1",
  "email": "admin@restaurante.com",
  "name": "Administrador",
  "role": "admin",
  "createdAt": "2026-08-13T10:00:00.000Z",
  "updatedAt": "2026-08-13T10:00:00.000Z"
}
```

### tables
```json
{
  "id": "table-1",
  "number": 1,
  "name": "Mesa 1",
  "qrIdentifier": "mesa-001",
  "active": true,
  "currentSessionId": null,
  "createdAt": "2026-08-13T10:00:00.000Z",
  "updatedAt": "2026-08-13T10:00:00.000Z"
}
```

### categories
```json
{
  "id": "drinks",
  "name": "Bebidas",
  "slug": "bebidas",
  "order": 1,
  "active": true,
  "createdAt": "2026-08-13T10:00:00.000Z",
  "updatedAt": "2026-08-13T10:00:00.000Z"
}
```

### products
```json
{
  "id": "coca",
  "name": "Coca-Cola",
  "description": "Botella 33cl",
  "price": 2.5,
  "categoryId": "drinks",
  "available": true,
  "createdAt": "2026-08-13T10:00:00.000Z",
  "updatedAt": "2026-08-13T10:00:00.000Z"
}
```

### tableSessions
```json
{
  "sessionId": "session-001",
  "tableId": "table-2",
  "token": "mesa-002-abc123xyz",
  "createdAt": "2026-08-13T12:00:00.000Z",
  "expiresAt": "2026-08-13T15:00:00.000Z",
  "active": true,
  "closedAt": null
}
```

### orders
```json
{
  "id": "order-001",
  "tableId": "table-2",
  "sessionId": "session-001",
  "clientTokenId": "mesa-002-abc123xyz",
  "items": [
    {
      "productId": "coca",
      "name": "Coca-Cola",
      "price": 2.5,
      "quantity": 2,
      "subtotal": 5,
      "note": "Sin hielo"
    }
  ],
  "note": "Sin hielo",
  "total": 5,
  "status": "PENDING",
  "createdAt": "2026-08-13T12:05:00.000Z",
  "updatedAt": "2026-08-13T12:05:00.000Z"
}
```

### settings
```json
{
  "restaurantName": "Mi Restaurante",
  "taxRate": 0.1,
  "sessionTTLMinutes": 180,
  "defaultCurrency": "EUR",
  "updatedAt": "2026-08-13T10:00:00.000Z"
}
```

## 2. Cómo cargar estos datos

Puedes crearlos desde Firebase Console o con un script en Node.js usando la Firebase Admin SDK.

Ejemplo de estructura de colección:

```text
users/
products/
categories/
tables/
orders/
tableSessions/
settings/
```

## 3. Roles recomendados

- admin
- kitchen
- waiter

## 4. Reglas de negocio recomendadas

- Los clientes sólo necesitan el token de mesa y la sesión activa.
- El staff usa Firebase Auth con rol.
- Los pedidos nuevos pasan a estado `PENDING`.
- Cocina va: `PENDING -> PREPARING -> READY -> DELIVERED`.
- La mesa se cierra cuando finaliza la cuenta.
