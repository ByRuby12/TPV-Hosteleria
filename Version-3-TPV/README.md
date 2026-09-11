# TPV de hostelería y pedidos por QR

Plataforma web para gestionar un restaurante o bar desde una sola aplicación. El cliente pide desde el móvil escaneando el QR de la mesa; el camarero, la cocina y administración trabajan sobre esos pedidos en tiempo real.

## Resumen para cualquier persona

El funcionamiento diario es sencillo:

1. El cliente escanea el QR de una mesa y abre la carta en su móvil.
2. Añade productos a la cesta, confirma el pedido y ve su estado.
3. El camarero recibe la comanda y controla su avance.
4. La cocina prepara los productos y los marca como listos.
5. El camarero entrega el pedido y, cuando el cliente solicita pagar, cobra la mesa.
6. Administración consulta las ventas, controla la caja y mantiene actualizado el restaurante.

Toda la información se sincroniza para que cada perfil vea los cambios sin tener que actualizar manualmente la pantalla.

## Perfiles de uso

### Cliente

- Accede a la carta mediante el QR de la mesa.
- Consulta categorías, precios, descripciones, imágenes y alérgenos.
- Añade productos, cantidades, notas y opciones al carrito.
- Envía una o varias comandas durante la sesión.
- Consulta el estado de cada pedido.
- Revisa la cuenta de la mesa y solicita el cobro.
- Puede dividir la cuenta por personas y elegir efectivo o tarjeta como preferencia.

### Camarero / TPV

- Ve las mesas activas y libres.
- Recibe las comandas nuevas en tiempo real.
- Organiza los pedidos en `Nuevos`, `En preparación`, `Listos` y `Pendiente de pago`.
- Avanza cada comanda hasta cocina, lista y entrega.
- Rechaza únicamente el producto que no esté disponible, indicando el motivo.
- Mantiene activos los demás productos de la misma comanda.
- Cobra la mesa y registra efectivo, tarjeta o una combinación de ambos.
- Puede repartir un pago, por ejemplo, entre tres personas en efectivo y dos con tarjeta.

### Cocina

- Ve las comandas pendientes de preparar.
- Pasa los pedidos a preparación.
- Marca una comanda como lista para que el camarero la entregue.
- Puede rechazar una línea concreta si falta el producto o un ingrediente.

### Administración

- Gestiona productos, categorías, precios, stock e imágenes.
- Gestiona mesas, usuarios y permisos.
- Consulta el historial de pagos.
- Controla la caja diaria, apertura, cierre y movimientos manuales.
- Consulta estadísticas de ventas por periodo.
- Separa las ventas de efectivo y tarjeta, incluidos los pagos mixtos.
- Exporta información operativa y datos del restaurante.

## Flujo de una comanda

Una comanda normal sigue este recorrido:

```text
PENDING -> PREPARING -> READY -> DELIVERED -> PAID
```

- `PENDING`: el pedido acaba de entrar.
- `PREPARING`: cocina está trabajando en él.
- `READY`: está preparado para entregar.
- `DELIVERED`: el camarero lo ha entregado y queda pendiente de cobro.
- `PAID`: el pago está confirmado.
- `CANCELLED`: todas las líneas fueron rechazadas o la comanda se canceló.

Cuando el cliente solicita pagar, la comanda entregada aparece en `Pendiente de pago`. Allí el camarero puede abrir la cuenta, revisar los artículos y confirmar el cobro.

## Productos rechazados

El rechazo se aplica a una línea, no a toda la comanda. Por ejemplo, si una comanda tiene agua, hamburguesa y postre, y no queda postre:

- El postre aparece como rechazado.
- El postre no se cobra.
- El agua y la hamburguesa continúan su flujo normal.
- La comanda solo se cierra automáticamente si todas sus líneas están rechazadas.

Los productos rechazados siguen visibles en la cuenta y en el histórico para dejar claro qué ocurrió.

## Pagos y caja

El sistema admite tres situaciones:

- Pago completo en efectivo.
- Pago completo con tarjeta.
- Pago mixto, con personas e importes separados por método.

En un pago mixto se guardan las personas y el importe de cada método. Administración usa esos importes para calcular correctamente:

- Ventas en efectivo.
- Ventas con tarjeta.
- Total de ventas.
- Dinero esperado en la caja física.
- Diferencias al cerrar la caja.

La tarjeta no se suma al efectivo físico. Los movimientos manuales de caja, como entradas, retiradas o gastos, se registran por separado.

## Arquitectura técnica

La aplicación está construida con:

- Vue 3 para la interfaz.
- TypeScript para tipos y contratos del dominio.
- Vite para desarrollo y compilación.
- Vue Router para las rutas y perfiles.
- Firebase Authentication para las sesiones de usuarios.
- Cloud Firestore para pedidos, mesas, productos, pagos, caja y configuración.
- Firebase Storage o URLs configuradas para recursos visuales.
- jsPDF y html2canvas para facturas e informes descargables.
- Chart.js para las estadísticas del administrador.

La lógica se divide en varias capas:

- `src/views`: pantallas completas de cliente, TPV, cocina y administración.
- `src/components`: componentes reutilizables de interfaz.
- `src/stores`: estado compartido de autenticación, mesas, sesiones, pedidos y configuración.
- `src/services`: acceso a Firestore y reglas de negocio de pedidos, mesas, usuarios y productos.
- `src/utils`: cálculos de totales, stock, estados, facturas y exportaciones.
- `src/types`: tipos comunes de la aplicación.
- `src/router`: rutas y protección de acceso por perfil.

Los pedidos se escuchan con sincronización en tiempo real. Cuando un cliente crea un pedido o un trabajador cambia su estado, las pantallas conectadas reciben el cambio mediante Firestore.

## Requisitos

- Node.js 18 o superior.
- npm.
- Proyecto Firebase con Authentication y Cloud Firestore.

## Instalación

Desde esta carpeta:

```bash
npm install
```

## Desarrollo

Inicia el servidor local:

```bash
npm run dev
```

Vite mostrará la dirección local disponible en la terminal.

## Compilación

Comprueba tipos y genera la versión de producción:

```bash
npm run build
```

Para servir localmente el resultado compilado:

```bash
npm run preview
```

## Configuración de Firebase

La aplicación web necesita las credenciales públicas de la aplicación web de Firebase. Se configuran mediante variables `VITE_` o el archivo de configuración que utilice el proyecto.

Ejemplo de variables:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

No se debe incluir una clave privada ni un JSON de service account en el frontend. Las credenciales de administrador solo deben utilizarse en scripts de backend o tareas administrativas protegidas.

La configuración de colecciones, índices y reglas se explica en [FIREBASE.md](FIREBASE.md).

## Colecciones principales de Firestore

- `users`: usuarios y roles.
- `tables`: mesas, sesiones activas y solicitudes de pago.
- `orders`: comandas, líneas, estados, rechazos y totales.
- `payments`: cobros confirmados y desglose por método.
- `cashRegisters`: caja abierta.
- `cashClosures`: cierres históricos.
- `cashMovements`: entradas y salidas manuales.
- `products`: catálogo, stock y disponibilidad.
- `categories`: categorías del menú.
- `settings`: configuración del restaurante.

## Seguridad y operación

El acceso a las funciones se controla por rol. Las reglas de Firestore limitan qué puede leer o modificar cada tipo de usuario. Antes de publicar una instalación real se deben revisar las reglas, configurar correctamente Firebase Authentication y proteger cualquier credencial privada.

Los datos operativos deben vivir en Firebase cuando la aplicación se ejecuta en producción. Los datos locales solo sirven para estados temporales de interfaz y preferencias del dispositivo.

## Documentación relacionada

- [FIREBASE.md](FIREBASE.md): configuración de Firebase, Firestore y despliegue.
- [seed-firestore.md](seed-firestore.md): carga inicial de datos.
- `scripts/`: herramientas de mantenimiento y ejemplos de datos.
