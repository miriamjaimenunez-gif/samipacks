# Product Specification: SamiPacks Mobile App

> **Nota de actualización:** este documento fue revisado línea por línea contra el código real ya desarrollado (`app.js`, `index.html`, `styles.css`, `server.js`, `sw.js`, `vendor/jsQR.js`). Es una app **dual-rol** (Cliente / Negocio), con backend propio en Node.js + MySQL, sin build step en el frontend.

## 1. Selección de Rol (pantalla previa al login)
Tras el Splash Screen, el usuario elige cómo desea ingresar:
- **Ingresar como Cliente** → lleva al flujo de Login/Registro de usuario final.
- **Ingresar como Negocio** → lleva al flujo de Login de negocio y al Panel de Administración.

> **Corrección vs. versión anterior de este documento:** no existe un botón
> "Continuar como invitado". Todo flujo pasa por login o registro real
> contra MySQL.

## 2. Flujo de Cliente (basado en MOCKUPS.docx, verificado en código)

- **1. Splash Screen**: Logo central (hoja verde), eslogan "Salva comida, ahorra dinero." e indicador de carga de 3 puntos.
- **2. Inicio de Sesión**: Campos de correo, contraseña, botón "Iniciar sesión", enlace "¿La olvidaste?" (recuperar contraseña) y enlace a "Registrarse". Conectado a `POST /api/login`.
  - Botones "Google" y "Facebook" **simulados en el frontend** (selector de cuenta estilo Google / confirmación estilo Facebook, cuentas "recordadas" en `localStorage`): no hay backend de OAuth real detrás; sirven como maqueta de la experiencia, no como inicio de sesión funcional.
- **2b. Registro**: formulario propio (antes era solo un enlace decorativo). El registro es de **dos pasos** contra el backend:
  1. `POST /api/register/send-code` — envía un código de verificación de 6 dígitos al correo (vía Brevo), válido 10 minutos, máximo 5 intentos fallidos antes de invalidarse.
  2. `POST /api/register/verify-code` — valida el código y recién ahí crea la cuenta (`rol: 'cliente' | 'negocio'` según lo elegido en la pantalla de rol).
- **2c. ¿Olvidaste tu contraseña?**: flujo de 3 pasos, todos contra el backend: `POST /api/forgot-password/send-code` → `POST /api/forgot-password/verify-code` → `POST /api/forgot-password/reset` (este último vuelve a validar el código antes de guardar la contraseña nueva, no confía solo en el paso anterior).
- **3. Pantalla Principal (Inicio)**: Buscador, ubicación actual, carrusel de categorías (Comidas, Cafés, Bebidas, Panadería, Postres, Todos) y lista de tarjetas de SamiPacks con foto, precio original, precio con descuento, distancia/tiempo y botón "Ver detalles". Los packs se cargan dinámicamente desde `GET /api/samipacks` (solo packs con stock > 0).
- **4. Resultados Filtrados**: Muestra tarjetas filtradas con botón superior para "Limpiar filtros".
- **5. Detalle del SamiPack**: Foto grande, descripción, stock disponible, horario de recojo, dirección, coordenadas y botón "Reservar SamiPack", con selector de cantidad.
- **6. Confirmación de Reserva**: Resumen del pedido, desglose de precios, checkbox de términos y botón "Confirmar reserva". Antes de crear la reserva, el backend descuenta el stock de forma atómica (`UPDATE samipacks SET remainingPacks = remainingPacks - ? WHERE ... AND remainingPacks >= ?`); si no alcanza el stock, la reserva se rechaza con `409` y no se crea. Luego crea la reserva vía `POST /api/reservas`.
- **7. Reserva Realizada**: Boleta digital con código alfanumérico generado en el cliente (formato `SP-XXXXXX`, ej. `SP-84A9QX`) y su imagen QR, obtenida de una API externa (`https://api.qrserver.com/v1/create-qr-code/...`) con ese código como contenido. Estado inicial "Pendiente de recoger".
- **8. Mis Reservas**: Pestañas Activas/Historial. Los estados se muestran como **chips de color** (no emojis): verde = Recogido/Disponible, amarillo = Pendiente, rojo = Cancelado, gris = Expirado. Datos desde `GET /api/reservas/:usuario_id` (activas) y `GET /api/historial/:usuario_id` (Recogido/Cancelado/Expirado).
  - El cliente puede cancelar una reserva activa (`POST /api/reservas/:id/cancelar`), lo que devuelve el stock al SamiPack.
- **9. Perfil de Usuario**: Foto, nombre, chip "💚 N Packs Rescatados" y menú (Mis reservas, Historial, Calificar pedidos, Ayuda, Configuración, Cerrar sesión).
  - ⚠️ **El número de "Packs Rescatados" está fijo en el HTML (`12`) y no se calcula dinámicamente** a partir del historial real del usuario. Queda como pendiente en `tasks.md`.
- **10. Historial**: Lista de compras anteriores (reservas en estado Recogido/Cancelado/Expirado/Calificado) con negocio, fecha, monto y estado.

### Pantallas adicionales del Perfil
- **Calificar Pedidos**: lista de packs retirados pendientes de calificar (`GET /api/pendientes-calificar/:usuario_id`), con selector de estrellas y envío a `POST /api/guardar-calificacion` (pasa el estado de la reserva a `Calificado`).
- **Ayuda**: Centro de Ayuda con preguntas frecuentes/soporte.
- **Configuración**: incluye interruptor de **Modo Oscuro** persistente (`localStorage`).

## 3. Flujo de Negocio (Panel de Administración)
4 pestañas:
- **Publicar**: listado de "Mis SamiPacks publicados" (`GET /api/samipacks/negocio/:nombreNegocio`) + formulario para publicar excedente (producto, categoría, descripción, imagen —subida como archivo comprimido o por URL—, precio original/final, stock, horario, dirección con búsqueda de coordenadas vía Nominatim). Crea/edita/elimina vía `POST /api/samipacks`, `PUT /api/samipacks/:id`, `DELETE /api/samipacks/:id`.
- **Reservas**: reservas entrantes filtradas por `estado = 'Pendiente de recoger'` (`GET /api/admin/reservas/negocio/:negocio`), con confirmación de recojo por selección en lista (`POST /api/admin/confirmar-recogida`, por `reserva_id`) o por código escaneado con la cámara (lector `jsQR`) o tecleado a mano (`POST /api/admin/confirmar-recogida-codigo`, por `codigo` + `negocio`). Ambos endpoints rechazan la confirmación si la reserva ya no está `Pendiente de recoger`.
- **Historial**: historial de ventas (recojos) confirmados por el negocio (`GET /api/admin/historial-ventas/:admin_id`).
- **Perfil**: datos del negocio (editable: nombre de negocio, categoría, responsable, teléfono), activar/desactivar notificaciones push, y cierre de sesión.

### Notificaciones push al negocio
Al crearse una reserva nueva, el backend intenta avisar por Web Push al
negocio correspondiente (título, cantidad, producto y código), usando
`web-push` con claves VAPID y el Service Worker (`public/sw.js`). Endpoints:
`GET /api/push/public-key`, `POST /api/push/subscribe`,
`POST /api/push/unsubscribe`. Si el push falla, la reserva ya se creó
igual — el push nunca es condición para que la reserva se registre.

## 4. Backend (Node.js + Express + MySQL)
API REST bajo `/api`, servida por el mismo proceso que sirve `public/`
(una sola URL, sin CORS entre frontend y backend).

- **Autenticación y cuenta**: `POST /api/login`, `POST /api/register/send-code`, `POST /api/register/verify-code`, `POST /api/forgot-password/send-code`, `POST /api/forgot-password/verify-code`, `POST /api/forgot-password/reset`, `PUT /api/usuarios/:id/negocio`.
- **Catálogo**: `GET /api/samipacks`, `GET /api/samipacks/negocio/:nombreNegocio`, `POST /api/samipacks`, `PUT /api/samipacks/:id`, `DELETE /api/samipacks/:id`.
- **Reservas y calificaciones**: `POST /api/reservas`, `POST /api/reservas/:id/cancelar`, `GET /api/reservas/:usuario_id`, `GET /api/historial/:usuario_id`, `GET /api/pendientes-calificar/:usuario_id`, `POST /api/guardar-calificacion`.
- **Panel de negocio**: `GET /api/admin/reservas`, `GET /api/admin/reservas/negocio/:negocio`, `POST /api/admin/confirmar-recogida`, `POST /api/admin/confirmar-recogida-codigo`, `GET /api/admin/historial-ventas/:admin_id`.
- **Notificaciones push**: `GET /api/push/public-key`, `POST /api/push/subscribe`, `POST /api/push/unsubscribe`.

En producción corre en Render, con MySQL gestionado en Aiven (`DB_SSL=true`); en desarrollo local usa XAMPP (`DB_SSL=false`). Configuración vía `.env` (ver `.env.example`).

## 5. Esquema de base de datos (verificado en producción, 07/07/2026)
La tabla `reservas` incluye, entre otras: `usuario_id`, `negocio`,
`samipack_nombre`, `categoria`, `cantidad`, `precio_total`,
`codigo_alfanumerico`, `qr_data`, `image`, `direccion_negocio`,
`horario_negocio`, `coordenadas_negocio`, `estado`, `fecha_recogida`
(DATETIME, nullable) y `escaneado_por` (INT, nullable, FK a
`usuarios.id`). Estas dos últimas registran quién y cuándo confirmó cada
recojo desde el panel de negocio; se verificó su presencia real en MySQL
tras corregir un desfase entre el código del backend y el esquema de la
base de datos (ver `plan.md`, Fase 6).

La tabla `usuarios` incluye `rol` (`'cliente'` | `'negocio'`) y, solo para
negocios, `negocio` y `categoria_negocio`. Las contraseñas se guardan con
`bcrypt`; cuentas antiguas en texto plano se migran a hash de forma
automática en su primer login exitoso.

La tabla `codigos_verificacion` guarda los códigos de un solo uso de
registro y recuperación de contraseña (`correo`, `codigo`, `tipo`,
`expira_en`, `usado`, `intentos`).

## 6. Preguntas abiertas / no confirmadas en el código revisado
- Nombre exacto de la tabla donde se guardan las suscripciones push
  (`endpoint` + claves) — existe el flujo (`/api/push/*`) pero no se
  localizó el `CREATE TABLE` correspondiente en este repo.
- Qué proceso mueve una reserva a `Expirado` (no se encontró un cron ni
  disparador automático en `server.js`; ver `tasks.md`, Task 25).
