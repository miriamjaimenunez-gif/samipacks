# Implementation Plan

## Phase 1: Arquitectura Base y Rutas ✅
- [x] Configurar el sistema de navegación entre las pantallas siguiendo el flujo oficial (incluye pantalla de selección de Rol añadida antes del login).
- [x] Implementar el estado global de autenticación (Invitado / Usuario registrado / Negocio), conectado a un backend Node.js real con MySQL en vez de estado simulado.
- [x] Servir frontend y backend desde el mismo servidor Express (`express.static`) para evitar configuración de CORS entre dominios en producción.

## Phase 2: Componentes de UI Básicos ✅
- [x] Crear componentes reutilizables de tarjetas (Cards) con bordes redondeados y sombras suaves.
- [x] Configurar la paleta de colores oficial en los estilos globales (variables CSS), incluyendo variante de Modo Oscuro persistente en `localStorage`.

## Phase 3: Integración de Vistas y Flujo Completo (Cliente) ✅
- [x] Diseñar las pantallas desde la Splash Screen hasta la generación de la boleta con código QR real (imagen generada vía `api.qrserver.com` a partir del código alfanumérico único).
- [x] Conectar Pantalla Principal y Resultados Filtrados al catálogo real de SamiPacks (`GET /api/samipacks`), con filtro por categoría, distancia (geolocalización) y texto.
- [x] Conectar Detalle → Confirmación → Reserva a la API de reservas (`POST /api/reservas`), con descuento de stock atómico y condicional en el servidor (nunca permite stock negativo).
- [x] Implementar cancelación de reserva (`POST /api/reservas/:id/cancelar`) con devolución automática del stock al SamiPack.
- [x] Implementar Mis Reservas (Activas/Historial) e Historial de compras contra la base de datos.
- [x] Implementar módulo de Calificación de pedidos con estrellas (`/api/pendientes-calificar`, `/api/guardar-calificacion`).
- [x] Implementar pantallas de Ayuda y Configuración (con Modo Oscuro persistente).
- [x] Implementar registro en dos pasos con verificación real de correo (envío de código de 6 dígitos vía Brevo, expiración de 10 min y máximo 5 intentos antes de crear la cuenta).
- [x] Implementar recuperación de contraseña en tres pasos (enviar código → verificar código → definir nueva contraseña), con la misma lógica de expiración/intentos.

## Phase 4: Panel de Administración (Negocio) ✅
- [x] Pantalla de selección de rol (Cliente / Negocio).
- [x] Pestaña "Publicar": alta, edición y eliminación de SamiPacks propios del negocio, con imagen por URL o archivo (comprimida automáticamente antes de enviarse) y autocompletado de coordenadas vía Nominatim/OpenStreetMap.
- [x] Pestaña "Reservas": listado y confirmación de recojo, ya sea escaneando el QR con la cámara (`jsQR`) o ingresando el código alfanumérico manualmente.
- [x] Pestaña "Historial": historial de ventas del negocio.
- [x] Pestaña "Perfil": datos del negocio y cierre de sesión.
- [x] Notificaciones push en tiempo real (Web Push + VAPID) cuando llega una reserva nueva, con Service Worker (`sw.js`) que las muestra incluso con la app cerrada, y limpieza automática de suscripciones inválidas (404/410).

## Phase 5: Backend e Infraestructura ✅
- [x] Servidor Node.js (`server.js`) con **pool** de conexión a MySQL (no conexión única), para auto-repararse si el servidor cierra una conexión inactiva por inactividad.
- [x] Variables de entorno para portabilidad total entre entornos: local tipo XAMPP (`DB_SSL=false`) y producción en Render + Aiven (`DB_SSL=true`).
- [x] Migración perezosa de contraseñas antiguas en texto plano a `bcrypt`, sin forzar re-registro.
- [x] Envío de correo transaccional vía la API HTTP de Brevo (no SMTP/Gmail directo), tras detectar fallos intermitentes de red en Render con conexiones SMTP salientes.
- [x] Endpoints de autenticación, verificación de correo, recuperación de contraseña, catálogo, reservas, calificaciones, push y panel de negocio (ver `spec.md`).

## Phase 6: Pulido y Casos Pendientes (próximos pasos sugeridos)
- [x] Ciclo de bugfix (07/07/2026): confirmación de recogida por código en el panel de negocio fallaba por columnas faltantes (`fecha_recogida`, `escaneado_por`) en la tabla `reservas` de MySQL, agravado porque los errores 500 no exponían el mensaje real al frontend. Corregido en backend (`server.js`), frontend (`app.js`) y esquema de base de datos. Verificado funcionando en producción.
- [x] Filtrar `GET /api/admin/reservas/negocio/:negocio` para traer solo reservas `Pendiente de recoger`, evitando que el frontend etiquetara como confirmables reservas ya recogidas.
- [ ] Validaciones adicionales de formularios (registro, publicación de SamiPacks) del lado del servidor, más allá de las que ya existen en el frontend.
- [ ] Manejo de expiración automática de reservas ("🔴 Expirada") en backend/cron — hoy el estado `Expirado` existe en el modelo pero no hay un job visible que lo dispare automáticamente.
- [ ] Rate limiting en los endpoints de envío de código (`/send-code`) para prevenir abuso del servicio de correo.
- [ ] Unificar la identificación de reserva al descontar/devolver stock para usar siempre `samipack_id` (hoy hay un fallback por `negocio + category` que podría colisionar si dos packs comparten nombre).
- [ ] Extender las notificaciones push al rol Cliente (por ejemplo, avisar cuando su reserva está por vencer).
- [ ] Pruebas end-to-end del flujo Cliente ↔ Negocio (reserva → confirmación de recojo → calificación).
- [ ] Revisión de accesibilidad (aria-labels ya presentes) y responsividad en distintos tamaños de pantalla.
- [ ] Documentar y versionar el esquema real de la base de datos (script `CREATE TABLE` o migraciones) para que el código del backend y la estructura de MySQL nunca se desincronicen.