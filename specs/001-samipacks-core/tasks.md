# Task List for IA Agent

## Cliente
- [x] Task 1: Crear e inicializar la interfaz visual de la Splash Screen.
- [x] Task 2: Configurar la pantalla de Login con validación de campos, conectada a `POST /api/login`. (No existe ingreso como invitado.)
- [x] Task 2b: Implementar registro en dos pasos con verificación de correo: `POST /api/register/send-code` (código de 6 dígitos, 10 min, 5 intentos) y `POST /api/register/verify-code` (crea la cuenta).
- [x] Task 2c: Implementar recuperación de contraseña en tres pasos: `POST /api/forgot-password/send-code` → `.../verify-code` → `.../reset`.
- [x] Task 2d: Botones "Google"/"Facebook" como simulación de UI (selector de cuenta / confirmación, cuentas recordadas en `localStorage`), sin backend de OAuth real.
- [x] Task 3: Desarrollar la Pantalla Principal con el carrusel de categorías y las tarjetas de SamiPacks, cargadas dinámicamente desde MySQL (`GET /api/samipacks`, solo con stock > 0).
- [x] Task 4: Implementar la lógica de filtros y resultados filtrados en la Pantalla Principal.
- [x] Task 5: Desarrollar la vista de detalle del SamiPack con información completa, selector de cantidad y botón de reserva.
- [x] Task 6: Desarrollar la pantalla de confirmación de reserva con revisión y confirmación de términos, creando la reserva en base de datos (`POST /api/reservas`) con descuento atómico de stock en el servidor.
- [x] Task 6b: Implementar cancelación de reserva activa (`POST /api/reservas/:id/cancelar`) con devolución de stock al SamiPack.
- [x] Task 7: Generar la boleta digital con código alfanumérico (`SP-XXXXXX`, generado en el cliente) y su imagen QR (obtenida de `api.qrserver.com`), con botones de Guardar/Compartir.
- [x] Task 8: Implementar "Mis Reservas" con pestañas Activas/Historial y chips de estado por color (verde/amarillo/rojo/gris).
- [x] Task 9: Implementar pantalla de Perfil de Usuario con chip "Packs Rescatados" y menú de navegación. **(Ver Task 24b: el número está hardcodeado en `12`, no es dinámico.)**
- [x] Task 10: Implementar Historial de compras (negocio, fecha, monto, calificación, estado).
- [x] Task 11: Implementar módulo "Calificar pedidos" con selector de estrellas interactivo y guardado en base de datos.
- [x] Task 12: Implementar pantalla de Ayuda (Centro de Ayuda / FAQ).
- [x] Task 13: Implementar pantalla de Configuración con Modo Oscuro persistente (`localStorage`).

## Negocio (Panel de Administración)
- [x] Task 14: Crear pantalla de selección de Rol (Cliente / Negocio) previa al login.
- [x] Task 15: Desarrollar pestaña "Publicar" del panel de negocio: alta, edición y eliminación de SamiPacks propios, imagen por archivo comprimido o URL, búsqueda de coordenadas por dirección (Nominatim).
- [x] Task 16: Desarrollar pestaña "Reservas" del panel de negocio: listado de reservas entrantes (`estado = 'Pendiente de recoger'`) y confirmación de recojo por selección, escaneo QR (`jsQR`) o código tecleado. **Verificado en producción el 07/07/2026** tras corregir el bug de la Task 27.
- [x] Task 17: Desarrollar pestaña "Historial" del panel de negocio: historial de ventas.
- [x] Task 18: Desarrollar pestaña "Perfil" del panel de negocio, con edición de datos y cierre de sesión.
- [x] Task 18b: Implementar activación/desactivación de notificaciones push desde el Perfil del negocio.

## Backend
- [x] Task 19: Configurar servidor Node.js con pool de conexiones MySQL (auto-recuperación ante cierre por inactividad), variables de entorno para XAMPP (local) y Aiven+SSL (Render).
- [x] Task 20: Implementar endpoints de autenticación (login, registro por código, recuperación por código) y gestión de usuarios/negocios.
- [x] Task 21: Implementar endpoints CRUD de SamiPacks.
- [x] Task 22: Implementar endpoints de reservas (crear con descuento atómico de stock, cancelar con devolución de stock), historial y calificaciones.
- [x] Task 23: Implementar endpoints del panel de administración (reservas por negocio, confirmación de recojo por id o por código, historial de ventas).
- [x] Task 23b: Implementar notificaciones push (VAPID + `web-push`): claves públicas, suscripción/desuscripción, y aviso al negocio al crearse una reserva (no bloqueante).
- [x] Task 23c: Migrar envío de correos de Nodemailer/SMTP directo a Brevo (HTTPS API) por fallos intermitentes de red en Render.

## Bugs corregidos
- [x] Task 27: **Confirmación de recogida por código fallaba con "No se pudo confirmar la recogida."** Causa raíz: la tabla `reservas` en MySQL no tenía las columnas `fecha_recogida` y `escaneado_por` que el backend ya usaba (`Unknown column 'fecha_recogida' in 'field list'`). Se agregaron ambas columnas (`fecha_recogida DATETIME NULL`, `escaneado_por INT NULL` con FK a `usuarios(id)`) y se validó el flujo completo end-to-end. Verificado y funcionando el 07/07/2026.
- [x] Task 28: `GET /api/admin/reservas/negocio/:negocio` traía todas las reservas del negocio sin filtrar por estado, y el frontend etiquetaba "Pendiente" a todas por igual. Ahora el endpoint filtra `estado = 'Pendiente de recoger'`, así la lista "Pendientes de recoger" solo muestra lo que realmente puede confirmarse.
- [x] Task 29: Los errores 500 de los endpoints de confirmación solo devolvían la clave `error`, que el frontend no leía, ocultando la causa real detrás de un mensaje genérico. Ahora todas las respuestas de error incluyen `message` con el detalle, y el frontend hace `console.error` del payload completo para facilitar el debug futuro.

## Pendientes / Próximos pasos
- [ ] Task 24: Agregar validaciones adicionales en formularios de registro y publicación de SamiPacks.
- [ ] Task 24b: Calcular dinámicamente el contador "Packs Rescatados" del Perfil (hoy fijo en `12` en el HTML) a partir de las reservas reales del usuario.
- [ ] Task 25: Automatizar el cambio de estado de reservas a "Expirado" cuando se cumpla la fecha/hora límite (no se encontró cron ni disparador en el código actual).
- [ ] Task 26: Escribir pruebas end-to-end del flujo completo Cliente ↔ Negocio, incluyendo notificaciones push.
- [ ] Task 30: Documentar y versionar el esquema real de la base de datos (`CREATE TABLE` / migraciones) para evitar que el código y la BD se desincronicen como ocurrió en la Task 27, incluyendo la tabla de suscripciones push (no localizada por nombre en este repo).
- [ ] Task 31: Decidir el destino de los botones "Google"/"Facebook" (implementar OAuth real o retirarlos), ya que hoy son una simulación de UI sin autenticación real detrás.
