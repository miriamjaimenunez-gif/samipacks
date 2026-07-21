# Implementation Plan

## Phase 1: Arquitectura Base y Rutas ✅
- [x] Configurar el sistema de navegación entre las pantallas siguiendo el flujo oficial (incluye pantalla de selección de Rol añadida antes del login).
- [x] Implementar el estado global de autenticación (Cliente / Negocio), conectado a un backend Node.js real con MySQL en vez de estado simulado. No existe modo invitado.
- [x] Servir frontend y backend desde el mismo proceso Express (`app.use(express.static('public'))`), evitando problemas de CORS entre ambos.

## Phase 2: Componentes de UI Básicos ✅
- [x] Crear componentes reutilizables de tarjetas (Cards) con bordes redondeados y sombras suaves.
- [x] Configurar la paleta de colores oficial en los estilos globales (variables CSS en `public/styles.css`), incluyendo variante de Modo Oscuro persistente en `localStorage`.
- [x] Chips de estado por color para reservas (verde/amarillo/rojo/gris) en vez de iconos de semáforo.

## Phase 3: Cuentas — Registro, Login y Recuperación ✅
- [x] Login con `bcrypt` (`POST /api/login`), incluyendo migración perezosa de contraseñas antiguas en texto plano a hash en el primer login exitoso.
- [x] Registro en dos pasos con verificación de correo: `POST /api/register/send-code` (código de 6 dígitos, 10 min de vigencia, 5 intentos) y `POST /api/register/verify-code` (crea la cuenta recién al validar).
- [x] Recuperación de contraseña en tres pasos: `POST /api/forgot-password/send-code` → `POST /api/forgot-password/verify-code` → `POST /api/forgot-password/reset` (revalida el código antes de guardar la clave nueva).
- [x] Envío de correos vía Brevo (HTTPS API) — se reemplazó un primer intento con Nodemailer/SMTP directo a Gmail porque fallaba de forma intermitente en Render (`ENETUNREACH`/`ETIMEDOUT` según la IP v4/v6 que tocara).
- [x] Botones "Google" / "Facebook" como **simulación de UI** (selector de cuenta / confirmación, con cuentas "recordadas" en `localStorage`), documentado explícitamente como no funcional a nivel de OAuth real — no crear la impresión de que autentican de verdad.

## Phase 4: Integración de Vistas y Flujo Completo (Cliente) ✅
- [x] Diseñar las pantallas desde la Splash Screen hasta la generación de la boleta con código QR (código alfanumérico generado en el cliente + imagen QR obtenida de `api.qrserver.com` con ese código como contenido).
- [x] Conectar Pantalla Principal y Resultados Filtrados al catálogo real de SamiPacks (`GET /api/samipacks`, solo con stock > 0).
- [x] Conectar Detalle → Confirmación → Reserva a la API de reservas (`POST /api/reservas`), con descuento de stock atómico en el servidor (`UPDATE ... WHERE remainingPacks >= ?`) para que dos reservas simultáneas nunca dejen el stock negativo.
- [x] Implementar cancelación de reserva (`POST /api/reservas/:id/cancelar`), devolviendo el stock al SamiPack de origen.
- [x] Implementar Mis Reservas (Activas/Historial) e Historial de compras contra la base de datos.
- [x] Implementar módulo de Calificación de pedidos con estrellas (`/api/pendientes-calificar`, `/api/guardar-calificacion`).
- [x] Implementar pantallas de Ayuda y Configuración (con Modo Oscuro persistente).

## Phase 5: Panel de Administración (Negocio) ✅
- [x] Pantalla de selección de rol (Cliente / Negocio).
- [x] Pestaña "Publicar": alta, edición y eliminación de SamiPacks propios del negocio, con imagen por archivo (comprimida en el cliente) o por URL, y búsqueda de coordenadas por dirección (Nominatim).
- [x] Pestaña "Reservas": listado y confirmación de recojo, ya sea seleccionando de la lista, escaneando el QR con la cámara (`jsQR`) o tecleando el código a mano.
- [x] Pestaña "Historial": historial de ventas del negocio.
- [x] Pestaña "Perfil": datos del negocio, edición de perfil, y cierre de sesión.

## Phase 6: Notificaciones Push ✅
- [x] Backend: `web-push` con claves VAPID, endpoints `GET /api/push/public-key`, `POST /api/push/subscribe`, `POST /api/push/unsubscribe`.
- [x] Service Worker (`public/sw.js`) para recibir y mostrar el push aunque la pestaña esté cerrada.
- [x] Al crear una reserva, se dispara un push al negocio con cantidad, producto y código; el envío nunca bloquea ni condiciona la respuesta de `POST /api/reservas` (si el push falla, la reserva ya quedó creada).
- [x] Panel de negocio: activar/desactivar notificaciones desde la pestaña Perfil.

## Phase 7: Backend e Infraestructura ✅
- [x] Servidor Node.js (`server.js`) con pool de conexiones MySQL (no conexión única, para auto-recuperarse si MySQL cierra por inactividad).
- [x] Configuración vía variables de entorno (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`) para usar XAMPP en local y Aiven (con SSL) en Render, sin tocar código.
- [x] Todos los endpoints de autenticación, catálogo, reservas, calificaciones, panel de negocio y push (ver `spec.md`).

## Phase 8: Pulido y Casos Pendientes (próximos pasos sugeridos)
- [x] Ciclo de bugfix (07/07/2026): confirmación de recogida por código en el panel de negocio fallaba por columnas faltantes (`fecha_recogida`, `escaneado_por`) en la tabla `reservas` de MySQL, agravado porque los errores 500 no exponían el mensaje real al frontend. Corregido en backend (`server.js`), frontend (`app.js`) y esquema de base de datos. Verificado funcionando en producción.
- [ ] El contador "Packs Rescatados" del Perfil está fijo en `12` en el HTML; falta calcularlo dinámicamente a partir del historial real del usuario (reservas en estado `Recogido`/`Calificado`).
- [ ] Validaciones adicionales de formularios (registro, publicación de SamiPacks) en el frontend.
- [ ] Manejo de expiración automática de reservas (estado `Expirado`) en backend/cron — hoy el estado existe pero no se localizó qué proceso lo asigna.
- [ ] Pruebas end-to-end del flujo Cliente ↔ Negocio (reserva → confirmación de recojo → calificación).
- [ ] Revisión de accesibilidad (aria-labels ya presentes) y responsividad en distintos tamaños de pantalla.
- [ ] Documentar y versionar el esquema real de la base de datos (script `CREATE TABLE` o migraciones) para que el código del backend y la estructura de MySQL nunca se desincronicen, incluyendo la tabla de suscripciones push que no se pudo confirmar por nombre en este repo.
- [ ] Decidir si los botones de Google/Facebook se implementan como OAuth real o se retiran, ya que hoy son una simulación de UI que puede confundirse con login funcional.
