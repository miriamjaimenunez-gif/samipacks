# Project Constitution: SamiPacks

## Core Principles
1. **Sostenibilidad y Confianza**: Reducir el desperdicio conectando negocios locales con usuarios de forma transparente.
2. **Estilo Visual**: Interfaz minimalista, moderna, tarjetas con bordes redondeados, sombras suaves y espaciado amplio tipo Uber Eats/Rappi.
3. **Paleta de Colores**: Verde (`#4CAF50`), Naranja (`#FF9800`), Blanco (`#FFFFFF`) y Gris claro (`#F5F5F5`), con texto en `#2f2f2f` y bordes en `#e9e9e9`. Implementada como variables CSS (`--green`, `--orange`, `--white`, `--light-gray`, `--text`, `--border`) en `public/styles.css` para mantener consistencia en toda la app, incluida una variante de **Modo Oscuro** (`body.dark-theme`) que respeta la misma identidad visual y se recuerda entre sesiones vía `localStorage`.
4. **Iconografía**: Uso exclusivo de Material Icons (Google Material Design).
5. **Doble Rol**: La app sirve tanto a Clientes (que buscan y reservan SamiPacks) como a Negocios (que publican excedentes y gestionan reservas), cada uno con su propio flujo de acceso desde la pantalla de selección de rol (`rolSeleccionado: 'cliente' | 'negocio'`).
6. **Persistencia Real**: Toda la información (usuarios, SamiPacks, reservas, calificaciones, códigos de verificación) se respalda en una base de datos MySQL a través de un backend Node.js/Express (`server.js`), en lugar de datos mock estáticos.
7. **Cuentas verificadas por correo**: Tanto el registro como la recuperación de contraseña exigen un código de un solo uso enviado al correo (vía Brevo, HTTPS) antes de crear la cuenta o cambiar la clave — nunca se confía únicamente en el formulario del cliente.
8. **El servidor es la única fuente de verdad del stock y del estado de una reserva**: ninguna pantalla decide localmente si "ya no hay stock" o si "ya se recogió"; siempre se confirma contra MySQL con una operación atómica (`UPDATE ... WHERE`), para que dos personas no puedan reservar o confirmar lo mismo dos veces.
9. **Notificaciones no invasivas**: Los negocios pueden activar notificaciones push (Web Push / VAPID) para enterarse de una reserva nueva sin tener la app abierta, pero el flujo principal (crear la reserva) nunca depende de que el push se entregue con éxito.
