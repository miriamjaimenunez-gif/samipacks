# Pruebas de SamiPacks (API + cobertura)

## Qué es esto, en criollo

- **Postman/Newman** = prueba tu API "desde afuera": manda un `POST
  /api/reservas` real y revisa que la respuesta sea la esperada. Esto es
  **prueba de API / integración**, no prueba unitaria.
- **nyc (Istanbul)** = mientras Newman dispara esos requests contra tu
  servidor corriendo, nyc va anotando qué líneas de `server.js` se
  ejecutaron. Al final te da el % de cobertura real de tu código,
  producido por pruebas de API en vez de pruebas unitarias.

Esta combinación es una forma válida y muy usada de tener "cobertura"
cuando no se escribieron pruebas unitarias clásicas (Jest/Mocha) — muchos
cursos y hasta empresas la aceptan como evidencia de testing automatizado.

## 1. Instalar dependencias de testing

```bash
npm install --save-dev newman newman-reporter-htmlextra nyc
```

## 2. Tener el servidor apuntando a una base de datos de prueba

**Importante:** la colección de Postman crea y confirma reservas reales.
No la corras contra tu base de datos de producción. Usa tu `.env` local
(XAMPP) con datos de prueba, o una base de datos separada solo para tests.

Antes de correr las pruebas, asegúrate de tener:
- Un usuario `cliente` real en tu tabla `usuarios` (anota su `id` y
  `correo`).
- Un negocio `Panadería Don José` (o cambia el nombre en la colección por
  uno que sí exista) con al menos un SamiPack publicado con stock.

Edita `tests/postman/SamiPacks.postman_environment.json` y pon el `id`
real de ese usuario en `clienteId`.

## 3. Correr solo las pruebas de API (sin cobertura)

Con el servidor ya corriendo en otra terminal (`npm start`):

```bash
npm run test:api
```

Esto genera un reporte HTML en `tests/reports/newman-report.html` con
cuántos `pm.test()` pasaron/fallaron — esa captura de pantalla es lo que
puedes poner en tu documento de Word como evidencia de "pruebas".

## 4. Correr las pruebas Y sacar cobertura de código

**No** tengas el servidor corriendo aparte para este paso — el script
lo levanta él mismo, instrumentado con nyc:

```bash
npm run test:coverage
```

Esto genera `tests/reports/coverage/index.html`. Ábrelo en el navegador:
te muestra, línea por línea de `server.js`, cuáles se ejecutaron durante
las pruebas y cuáles no, más un porcentaje global de cobertura (statements,
branches, functions, lines). **Esa página es la evidencia de "cobertura"**
que pide tu documentación.

> Si estás en Windows con PowerShell (no bash), el script `test:coverage`
> con `&`/`kill %1` no funciona igual. Alternativa simple: abre dos
> terminales.
> - Terminal 1: `npx nyc --reporter=html --reporter=text --report-dir=tests/reports/coverage node server.js`
> - Terminal 2, cuando el server ya esté arriba: `npm run test:api`
> - Vuelve a la Terminal 1 y detén el servidor con `Ctrl+C` — ahí nyc
>   escribe el reporte final a disco.

## 5. Qué endpoints cubre la colección

Ver `tests/postman/SamiPacks.postman_collection.json`. Cubre, con
asserts reales (no solo "status 200"):

- `GET /api/samipacks` — feed público, valida que todo lo listado tenga stock > 0.
- `POST /api/reservas` — caso éxito (descuenta stock) y caso rechazo por
  stock insuficiente (409).
- `GET /api/reservas/:usuario_id` — valida que la reserva recién creada
  aparezca como `Pendiente de recoger`.
- `POST /api/admin/confirmar-recogida-codigo` — caso éxito y caso de
  doble confirmación (debe rechazar con 409, ver `constitution.md`
  principio IV: transiciones de estado con guarda).
- `POST /api/login` — credenciales inválidas (401) y que la respuesta
  **nunca** filtre la contraseña (`constitution.md` principio II).
- `POST /api/register/send-code` — envío de código de verificación.

Puedes seguir agregando requests a la colección para cubrir más
endpoints (`GET /api/historial/:usuario_id`,
`POST /api/guardar-calificacion`, endpoints de push, etc.) siguiendo el
mismo patrón: un request + un bloque `pm.test()` en la pestaña "Tests".

## 6. Cómo conecta esto con tu documentación SDD

Si quieres que quede prolijo con el resto del proyecto (`specs/`), agrega
en `specs/001-samipacks-core/tasks.md` una tarea nueva, por ejemplo:

```
- [x] Task 32: Agregar colección de Postman + Newman con pruebas de API
      para los endpoints críticos (reservas, confirmación de recojo,
      login), y medir cobertura de `server.js` con nyc.
```

Así tu profesor ve que el testing también pasó por el flujo spec → plan →
tasks, no que apareció suelto.
