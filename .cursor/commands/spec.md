# Product Specification: SamiPacks Mobile App

> **Nota de actualización:** este documento fue revisado a partir del código real ya desarrollado (`app.js`, `index.html`, `styles.css`, `sw.js`, `server.js`). El alcance del producto creció respecto a la versión original: ahora es una app **dual-rol** (Cliente / Negocio) con backend propio en Node.js + MySQL, verificación real de correo, recuperación de contraseña y notificaciones push para negocios.

## 1. Selección de Rol (pantalla previa al login)
Tras el Splash Screen, el usuario elige cómo desea ingresar:
- **Ingresar como Cliente** → lleva al flujo de Login/Registro de usuario final.
- **Ingresar como Negocio** → lleva al flujo de Login de negocio y al Panel de Administración.

## 2. Flujo de Cliente

- **1. Splash Screen**: Logo central (hoja verde), eslogan "Salva comida, ahorra dinero." e indicador de carga de 3 puntos.
- **2. Inicio de Sesión**: Campos de correo y contraseña, enlaces a Registrarse y a "¿Olvidaste tu contraseña?". Conectado a `POST /api/login` contra MySQL, con migración automática de contraseñas antiguas en texto plano a `bcrypt`.
- **2B. Registro (en dos pasos, con verificación de correo real)**:
  - Paso 1: el usuario llena nombre, correo y contraseña (mínimo 6 caracteres) → `POST /api/register/send-code` valida los datos, genera un código de 6 dígitos y lo envía por correo (Brevo). La cuenta **todavía no existe**.
  - Paso 2: el usuario ingresa el código recibido (expira en 10 min, máx. 5 intentos) → `POST /api/register/verify-code` crea la cuenta recién ahí. Incluye opción de reenviar código con temporizador de espera.
- **2C. Recuperar contraseña** (accesible desde el login):
  - Paso 1: ingresa su correo → `POST /api/forgot-password/send-code` (mismo mecanismo de código de 6 dígitos por Brevo).
  - Paso 2: ingresa el código → `POST /api/forgot-password/verify-code`.
  - Paso 3: define una contraseña nueva (mínimo 6 caracteres) → `POST /api/forgot-password/reset`, que vuelve a validar el código antes de guardar.
- **3. Pantalla Principal (Inicio)**: Buscador, ubicación actual (con geolocalización del navegador y nombre de ubicación inverso), carrusel de categorías (Todos, Comidas, Cafés, Bebidas, Panadería, Postres) y lista de tarjetas de SamiPacks con foto, precio original, precio con descuento, distancia y botón "Ver detalles". Los packs se cargan dinámicamente desde `GET /api/samipacks` (solo los que tienen `remainingPacks > 0`).
- **4. Resultados Filtrados**: Filtro por categoría, por distancia y por texto de búsqueda, con botón para "Limpiar filtros".
- **5. Detalle del SamiPack**: Foto grande, descripción, stock disponible, horario de recojo, dirección, coordenadas y botón "Reservar SamiPack", con selector de cantidad.
- **6. Confirmación de Reserva**: Resumen del pedido, desglose de precios y botón "Confirmar reserva". Antes de crear la reserva, el servidor descuenta el stock de forma atómica (si ya no alcanza, rechaza la operación con un mensaje claro en vez de crear la reserva). Se crea vía `POST /api/reservas`.
- **7. Reserva Realizada**: Boleta digital con código QR (generado como imagen vía `api.qrserver.com` a partir de `qr_data`), código alfanumérico único (ej: `SP-84A9QX`), estado "Pendiente de recoger", datos del negocio (dirección, horario, teléfono, categoría) y botones de Guardar/Compartir. Incluye botón "❌ Cancelar" mientras siga pendiente.
- **7B. Cancelar reserva**: `POST /api/reservas/:id/cancelar`; solo funciona si la reserva sigue "Pendiente de recoger" y devuelve el stock descontado al SamiPack correspondiente.
- **8. Mis Reservas**: Listado de reservas activas e historial (pestañas Activas/Historial), con estados por color (🟢 Pendiente de recoger, ⚪ Recogida, 🔴 Cancelada/Expirada). Datos desde `GET /api/reservas/:usuario_id` y `GET /api/historial/:usuario_id`.
- **9. Perfil de Usuario**: Foto, nombre, y menú (Mis reservas, Historial, Calificar pedidos, Ayuda, Configuración, Cerrar sesión).
- **10. Historial**: Lista de compras anteriores indicando negocio, fecha, monto, calificación y estado (Recogido/Cancelado/Expirado).

### Pantallas adicionales del Perfil
- **Calificar Pedidos**: lista de packs retirados pendientes de calificar (`GET /api/pendientes-calificar/:usuario_id`), con selector de estrellas (1-5) y envío a `POST /api/guardar-calificacion` (marca la reserva como "Calificado").
- **Ayuda**: pantalla de soporte/FAQ para el usuario.
- **Configuración**: incluye interruptor de **Modo Oscuro** persistente (guardado en `localStorage`).

## 3. Flujo de Negocio (Panel de Administración)
4 pestañas:
- **Publicar**: listado de "Mis SamiPacks publicados" (`GET /api/samipacks/negocio/:nombreNegocio`) + formulario para publicar una nueva oferta excedente (producto, categoría, descripción, imagen —por URL o archivo, comprimida automáticamente antes de subirse—, precio original/final, stock, horario de recojo, dirección con autocompletado de coordenadas vía Nominatim/OpenStreetMap). Crea/edita/elimina vía `POST /api/samipacks`, `PUT /api/samipacks/:id`, `DELETE /api/samipacks/:id`.
- **Reservas**: reservas entrantes del negocio, filtradas por estado `Pendiente de recoger` (`GET /api/admin/reservas/negocio/:negocio`), con confirmación de recojo por escaneo de cámara con **jsQR** o por ingreso manual del código alfanumérico (`POST /api/admin/confirmar-recogida-codigo`), o por selección directa en lista (`POST /api/admin/confirmar-recogida`).
- **Notificaciones push**: switch para activar/desactivar el aviso en tiempo real de nuevas reservas (Web Push + Service Worker `sw.js`), funciona aunque la app esté cerrada.
- **Historial**: historial de ventas del negocio (`GET /api/admin/historial-ventas/:admin_id`).
- **Perfil**: datos del negocio (nombre, categoría, dirección, teléfono) y cierre de sesión.

## 4. Backend (Node.js + MySQL)
API REST expuesta bajo `/api`, servida desde el mismo servidor Express que sirve el frontend estático (sin CORS entre frontend/backend):

**Autenticación**
`POST /api/login`, `POST /api/register/send-code`, `POST /api/register/verify-code`, `PUT /api/usuarios/:id/negocio`, `POST /api/forgot-password/send-code`, `POST /api/forgot-password/verify-code`, `POST /api/forgot-password/reset`.

**Notificaciones push**
`GET /api/push/public-key`, `POST /api/push/subscribe`, `POST /api/push/unsubscribe`.

**Catálogo**
`GET /api/samipacks`, `GET /api/samipacks/negocio/:nombreNegocio`, `POST /api/samipacks`, `PUT /api/samipacks/:id`, `DELETE /api/samipacks/:id`.

**Reservas y calificaciones**
`POST /api/reservas`, `POST /api/reservas/:id/cancelar`, `GET /api/reservas/:usuario_id`, `GET /api/historial/:usuario_id`, `GET /api/pendientes-calificar/:usuario_id`, `POST /api/guardar-calificacion`.

**Panel de negocio**
`GET /api/admin/reservas`, `GET /api/admin/reservas/negocio/:negocio`, `POST /api/admin/confirmar-recogida`, `POST /api/admin/confirmar-recogida-codigo`, `GET /api/admin/historial-ventas/:admin_id`.

**Correo transaccional**: todos los códigos de verificación (registro y recuperación de contraseña) se envían vía la API HTTP de Brevo, no SMTP directo (evita fallos intermitentes de red observados en Render con Gmail/SMTP).

## 5. Esquema de base de datos (verificado en producción, 07/07/2026)
- **usuarios**: `id, nombre, correo, contrasena, telefono, rol ('cliente'|'negocio'), negocio, categoria_negocio`.
- **samipacks**: `id, negocio, category, producto, originalPrice, finalPrice, remainingPacks, description, schedule, address, coordinates, image`.
- **reservas**: incluye, entre otras: `estado`, `codigo_alfanumerico`, `qr_data`, `negocio`, `fecha_recogida` (DATETIME, nullable) y `escaneado_por` (INT, nullable, FK a `usuarios.id`). Estas dos últimas registran quién y cuándo confirmó cada recojo desde el panel de negocio; se verificó su presencia real en MySQL tras corregir un desfase entre el código del backend y el esquema de la base de datos (ver `plan.md`, Fase 6).
- **codigos_verificacion**: `id, correo, codigo, tipo ('registro'|'recuperacion'), datos_pendientes, intentos, usado, expira_en` — soporta tanto el registro como la recuperación de contraseña con la misma lógica de expiración/intentos.
- **push_subscriptions**: `usuario_id, negocio, endpoint, p256dh, auth` — una fila por dispositivo/navegador suscrito de cada negocio, con limpieza automática cuando el navegador invalida la suscripción (push 404/410).