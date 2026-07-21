# Project Constitution: SamiPacks

## Core Principles
1. **Sostenibilidad y Confianza**: Reducir el desperdicio conectando negocios locales con usuarios de forma transparente.
2. **Estilo Visual**: Interfaz minimalista, moderna, tarjetas con bordes redondeados, sombras suaves y espaciado amplio tipo Uber Eats/Rappi.
3. **Paleta de Colores**: Verde (#4CAF50), Naranja (#FF9800), Blanco (#FFFFFF) y Gris claro (#F5F5F5). Implementada como variables CSS (`--green`, `--orange`, `--white`, `--light-gray`, `--text`, `--border`) para mantener consistencia en toda la app, incluida una variante de **Modo Oscuro** (`body.dark-theme`) que respeta la misma identidad visual.
4. **Iconografía**: Uso exclusivo de Material Design Icons.
5. **Doble Rol**: La app sirve tanto a Clientes (que buscan y reservan SamiPacks) como a Negocios (que publican excedentes y gestionan reservas), cada uno con su propio flujo de acceso desde la pantalla de selección de rol.
6. **Persistencia Real**: Toda la información (usuarios, SamiPacks, reservas, calificaciones, suscripciones push) se respalda en una base de datos MySQL a través de un backend Node.js, en lugar de datos mock estáticos.
7. **Nadie entra sin confirmar su correo**: Registro y recuperación de contraseña exigen un código de 6 dígitos enviado al correo real del usuario (vía Brevo), con expiración de 10 minutos y máximo 5 intentos. Ninguna cuenta se crea ni se modifica una contraseña sin ese paso.
8. **Las contraseñas nunca se guardan en texto plano**: Se usa `bcrypt` para todo registro nuevo. Las cuentas antiguas en texto plano se migran solas (de forma silenciosa) la primera vez que el usuario vuelve a iniciar sesión correctamente, sin obligarlo a re-registrarse.
9. **El stock nunca miente**: La cantidad disponible de un SamiPack (`remainingPacks`) no puede quedar en negativo. Toda reserva descuenta stock de forma atómica y condicional; si no alcanza, la reserva completa se rechaza en vez de crearse a medias.
10. **Portabilidad de entorno**: El mismo código corre en local (XAMPP) y en producción (Render + Aiven) solo cambiando variables de entorno (`DB_HOST`, `DB_SSL`, `VAPID_*`, `BREVO_*`), nunca credenciales hardcodeadas.
11. **Aviso en tiempo real al negocio**: Cuando llega una reserva nueva, el negocio lo sabe al instante mediante notificaciones push (Web Push estándar, protocolo VAPID) aunque tenga la pestaña cerrada, sin depender de un proveedor propietario tipo Firebase.