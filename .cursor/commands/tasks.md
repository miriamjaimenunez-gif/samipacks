# Task List for IA Agent

## Cliente
- [x] Task 1: Crear e inicializar la interfaz visual de la Splash Screen.
- [x] Task 2: Configurar la pantalla de Login con validación de campos, conectada a `POST /api/login`.
- [x] Task 3: Implementar registro en dos pasos con verificación real de correo: `POST /api/register/send-code` (genera y envía código de 6 dígitos vía Brevo) y `POST /api/register/verify-code` (valida el código y recién ahí crea la cuenta), con reenvío de código y temporizador de espera.
- [x] Task 4: Implementar recuperación de contraseña en tres pasos: `POST /api/forgot-password/send-code`, `POST /api/forgot-password/verify-code` y `POST /api/forgot-password/reset`.
- [x] Task 5: Desarrollar la Pantalla Principal con el carrusel de categorías y las tarjetas de SamiPacks, cargadas dinámicamente desde MySQL (`GET /api/samipacks`).
- [x] Task 6: Implementar la lógica de filtros (categoría, distancia, texto) y resultados filtrados en la Pantalla Principal.
- [x] Task 7: Desarrollar la vista de detalle del SamiPack con información completa, selector de cantidad y botón de reserva.
- [x] Task 8: Desarrollar la pantalla de confirmación de reserva, creando la reserva en base de datos (`POST /api/reservas`) con descuento de stock atómico y condicional (nunca deja el stock en negativo).
- [x] Task 9: Generar la boleta digital con código QR real (imagen vía `api.qrserver.com`) y código alfanumérico único (tipo `SP-XXXXXX`), con botones de Guardar/Compartir.
- [x] Task 10: Implementar cancelación de reserva (`POST /api/reservas/:id/cancelar`) desde la boleta, con devolución automática del stock al SamiPack.
- [x] Task 11: Implementar "Mis Reservas" con pestañas Activas/Historial y estados por color.
- [x] Task 12: Implementar pantalla de Perfil de Usuario con menú de navegación.
- [x] Task 13: Implementar Historial de compras (negocio, fecha, monto, calificación, estado).
- [x] Task 14: Implementar módulo "Calificar pedidos" con selector de estrellas interactivo y guardado en base de datos.
- [x] Task 15: Implementar pantalla de Ayuda.
- [x] Task 16: Implementar pantalla de Configuración con Modo Oscuro persistente (`localStorage`).

## Negocio (Panel de Administración)
- [x] Task 17: Crear pantalla de selección de Rol (Cliente / Negocio) previa al login.
- [x] Task 18: Desarrollar pestaña "Publicar" del panel de negocio: alta, edición y eliminación de SamiPacks propios, con imagen por URL o archivo (comprimida automáticamente) y autocompletado de coordenadas vía Nominatim/OpenStreetMap.
- [x] Task 19: Desarrollar pestaña "Reservas" del panel de negocio: listado de reservas entrantes y confirmación de recojo, ya sea escaneando el QR con la cámara (`jsQR`) o por código alfanumérico manual. **Verificado en producción el 07/07/2026** tras corregir el bug de la Task 30.
- [x] Task 20: Desarrollar pestaña "Historial" del panel de negocio: historial de ventas.
- [x] Task 21: Desarrollar pestaña "Perfil" del panel de negocio.
- [x] Task 22: Implementar notificaciones push (Web Push + VAPID) para avisar al negocio en tiempo real de nuevas reservas, con switch de activar/desactivar, Service Worker (`sw.js`) y limpieza automática de suscripciones inválidas.

## Backend
- [x] Task 23: Configurar servidor Node.js con **pool** de conexión a MySQL, soportando tanto entorno local (XAMPP) como producción (Render + Aiven) vía variables de entorno.
- [x] Task 24: Implementar endpoints de autenticación (`login`), registro en dos pasos con código de verificación, y completar datos de negocio (`PUT /api/usuarios/:id/negocio`).
- [x] Task 25: Implementar endpoints de recuperación de contraseña en tres pasos.
- [x] Task 26: Implementar migración perezosa de contraseñas antiguas en texto plano a `bcrypt` en el login.
- [x] Task 27: Integrar envío de correo transaccional vía la API HTTP de Brevo (reemplazando SMTP/Gmail directo, que fallaba de forma intermitente en Render).
- [x] Task 28: Implementar endpoints CRUD de SamiPacks.
- [x] Task 29: Implementar endpoints de reservas (crear con descuento atómico de stock, cancelar con devolución de stock), historial y calificaciones.
- [x] Task 30: Implementar endpoints del panel de administración (reservas por negocio, confirmación de recojo por ID o por código, historial de ventas) y endpoints de push (`public-key`, `subscribe`, `unsubscribe`).

## Bugs corregidos
- [x] Task 31: **Confirmación de recogida por código fallaba con "No se pudo confirmar la recogida."** Causa raíz: la tabla `reservas` en MySQL no tenía las columnas `fecha_recogida` y `escaneado_por` que el backend ya usaba (`Unknown column 'fecha_recogida' in 'field list'`). Se agregaron ambas columnas (`fecha_recogida DATETIME NULL`, `escaneado_por INT NULL` con FK a `usuarios(id)`) y se validó el flujo completo end-to-end. Verificado y funcionando el 07/07/2026.
- [x] Task 32: `GET /api/admin/reservas/negocio/:negocio` traía todas las reservas del negocio sin filtrar por estado, y el frontend etiquetaba "Pendiente" a todas por igual. Ahora el endpoint filtra `estado = 'Pendiente de recoger'`, así la lista "Pendientes de recoger" solo muestra lo que realmente puede confirmarse.
- [x] Task 33: Los errores 500 de los endpoints de confirmación solo devolvían la clave `error`, que el frontend no leía, ocultando la causa real detrás de un mensaje genérico. Ahora todas las respuestas de error incluyen `message` con el detalle, y el frontend hace `console.error` del payload completo para facilitar el debug futuro.
- [x] Task 34: El límite por defecto de Express (100kb) rechazaba las fotos convertidas a base64 desde "Publicar" con la opción "Subir foto". Se subió el límite de `express.json` a 10mb.

## Pendientes / Próximos pasos
- [ ] Task 35: Agregar validaciones adicionales del lado del servidor en formularios de registro y publicación de SamiPacks (hoy dependen sobre todo de la validación del frontend).
- [ ] Task 36: Automatizar el cambio de estado de reservas a "Expirada" cuando se cumpla la fecha/hora límite (el estado existe en el modelo, falta el disparador automático).
- [ ] Task 37: Agregar rate limiting a los endpoints `/send-code` (registro y recuperación) para prevenir abuso del servicio de correo transaccional.
- [ ] Task 38: Unificar el descuento/devolución de stock para usar siempre `samipack_id` en vez del fallback por `negocio + category`, evitando colisiones si dos packs comparten nombre.
- [ ] Task 39: Extender las notificaciones push al rol Cliente (por ejemplo, avisar cuando una reserva está por vencer).
- [ ] Task 40: Escribir pruebas end-to-end del flujo completo Cliente ↔ Negocio (reserva → confirmación de recojo → calificación).
- [ ] Task 41: Documentar y versionar el esquema real de la base de datos (`CREATE TABLE` / migraciones) para evitar que el código y la BD se desincronicen como ocurrió en la Task 31.