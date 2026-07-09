require('dotenv').config();
const path = require('path');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const webpush = require('web-push');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dns = require('dns');

// Render no tiene salida a internet por IPv6, pero por defecto Node intenta
// primero la dirección IPv6 que devuelve el DNS (ej. para smtp.gmail.com),
// lo que provocaba "ENETUNREACH". Esto fuerza a que TODO el proceso resuelva
// nombres de dominio priorizando IPv4 primero.
dns.setDefaultResultOrder('ipv4first');

const app = express();
app.use(cors());
// El límite por defecto de Express es 100kb, muy poco para una foto
// convertida a base64 (subida desde "Publicar" con la opción "Subir foto").
// Lo subimos a 10mb para dar margen de sobra sin abrir la puerta a
// peticiones absurdamente grandes.
app.use(express.json({ limit: '10mb' }));

// Sirve el frontend (index.html, styles.css, app.js) directamente desde
// este mismo servidor, así todo queda en una sola URL y no hay problemas
// de CORS entre frontend y backend.
app.use(express.static(path.join(__dirname, 'public')));

// CONFIGURACIÓN DE LA BASE DE DATOS
// Usamos un POOL de conexiones en vez de una sola conexión.
// Con createConnection(), si MySQL cierra la conexión por inactividad
// (algo que pasa solo, después de un rato sin usarla), TODAS las
// consultas empiezan a fallar hasta reiniciar el servidor a mano.
// El pool abre y cierra conexiones automáticamente según se necesiten,
// así que se "auto-repara" solo si una conexión se cae.
//
// Antes esto estaba fijo a tu MySQL local (XAMPP: 127.0.0.1, usuario root,
// sin contraseña). Ahora se lee desde variables de entorno, para que en tu
// PC siga usando XAMPP (con tu archivo .env local) y en Render use Aiven
// (con las Environment Variables que configures ahí), sin tocar el código.
const db = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'samipacks_app_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Aiven exige SSL para conectarse. En tu XAMPP local no hace falta,
    // así que esto solo se activa si pones DB_SSL=true en el .env.
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

// Verificación inicial de que el pool puede conectar (no mantiene la conexión abierta)
db.getConnection((err, connection) => {
    if (err) {
        console.error('Error conectando a MySQL:', err);
        return;
    }
    console.log('¡Conectado exitosamente a la base de datos!');
    connection.release();
});

// ==========================================================================
// 🔔 NOTIFICACIONES PUSH (negocios reciben aviso al llegarles una reserva)
// ==========================================================================
// Usamos Web Push estándar (protocolo VAPID), que no depende de Firebase ni
// de ningún servicio externo de pago: el propio navegador del negocio se
// encarga de recibir el push y mostrarlo aunque la pestaña esté cerrada,
// mientras el navegador siga corriendo en segundo plano en su dispositivo.
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:soporte@samipacks.com',
        vapidPublicKey,
        vapidPrivateKey
    );
} else {
    console.warn('⚠️ Faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY en el .env: las notificaciones push quedarán desactivadas.');
}

// 1. ENTREGAR LA LLAVE PÚBLICA AL FRONTEND (la necesita para suscribirse)
app.get('/api/push/public-key', (req, res) => {
    if (!vapidPublicKey) {
        return res.status(503).json({ success: false, message: 'Notificaciones push no configuradas en el servidor.' });
    }
    res.json({ success: true, publicKey: vapidPublicKey });
});

// 2. GUARDAR UNA SUSCRIPCIÓN (se llama cuando el negocio activa el switch)
app.post('/api/push/subscribe', (req, res) => {
    const { usuario_id, negocio, subscription } = req.body;

    if (!usuario_id || !negocio || !subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ success: false, message: 'Faltan datos de la suscripción.' });
    }

    const query = `
        INSERT INTO push_subscriptions (usuario_id, negocio, endpoint, p256dh, auth)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE usuario_id = VALUES(usuario_id), negocio = VALUES(negocio),
            p256dh = VALUES(p256dh), auth = VALUES(auth)
    `;
    db.query(query, [usuario_id, negocio, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth], (err) => {
        if (err) {
            console.error('Error al guardar suscripción push:', err);
            return res.status(500).json({ success: false, message: 'No se pudo guardar la suscripción.' });
        }
        res.json({ success: true });
    });
});

// 3. BORRAR UNA SUSCRIPCIÓN (se llama cuando el negocio apaga el switch)
app.post('/api/push/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) {
        return res.status(400).json({ success: false, message: 'Falta el endpoint.' });
    }
    db.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [endpoint], (err) => {
        if (err) {
            console.error('Error al borrar suscripción push:', err);
            return res.status(500).json({ success: false, message: 'No se pudo eliminar la suscripción.' });
        }
        res.json({ success: true });
    });
});

// Envía el push a TODOS los dispositivos suscritos de un negocio. Si un envío
// falla porque el navegador ya invalidó esa suscripción (410/404), la
// borramos para no seguir intentando en vano en cada reserva futura.
function notificarNuevaReservaAlNegocio(negocio, payload) {
    if (!vapidPublicKey || !vapidPrivateKey) return; // push no configurado en este servidor

    db.query('SELECT * FROM push_subscriptions WHERE negocio = ?', [negocio], (err, subs) => {
        if (err) {
            console.error('Error al buscar suscripciones push del negocio:', err);
            return;
        }
        subs.forEach((sub) => {
            const subscriptionObj = {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth }
            };
            webpush.sendNotification(subscriptionObj, JSON.stringify(payload)).catch((pushErr) => {
                if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
                    db.query('DELETE FROM push_subscriptions WHERE endpoint = ?', [sub.endpoint]);
                } else {
                    console.error('Error al enviar push:', pushErr.message);
                }
            });
        });
    });
}

// ==========================================================================
// 📧 ENVÍO DE CORREOS (Gmail con contraseña de aplicación)
// ==========================================================================
// Se usa para dos cosas: confirmar que el correo del registro existe/
// funciona, y para el código de recuperación de contraseña.
//
// GMAIL_USER es la cuenta de Gmail que envía los correos (ej. tuapp@gmail.com)
// GMAIL_APP_PASSWORD es una "contraseña de aplicación" de 16 caracteres que
// se genera en https://myaccount.google.com/apppasswords (requiere tener la
// verificación en 2 pasos activada en esa cuenta de Gmail). NO es la
// contraseña normal de la cuenta de Gmail.
const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

let mailTransporter = null;
if (gmailUser && gmailAppPassword) {
    // Antes usábamos { service: 'gmail' }, que internamente conecta por el
    // puerto 465 (SSL). En Render eso daba "Connection timeout" (ETIMEDOUT).
    // Forzamos aquí el puerto 587 con STARTTLS, que en muchos hosts cloud
    // tiene mejor suerte saliendo hacia smtp.gmail.com.
    mailTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // STARTTLS: la conexión empieza sin cifrar y luego se actualiza a TLS
        auth: { user: gmailUser, pass: gmailAppPassword },
        connectionTimeout: 10000, // falla rápido (10s) en vez de colgarse mucho tiempo
        family: 4, // fuerza IPv4: Render no tiene salida por IPv6 y Node probaba esa ruta primero (ENETUNREACH)
        lookup: (hostname, options, callback) => dns.lookup(hostname, { family: 4 }, callback) // respaldo explícito, por si "family" no bastaba
    });
} else {
    console.warn('⚠️ Faltan GMAIL_USER / GMAIL_APP_PASSWORD en el .env: no se podrán enviar correos de verificación (registro y recuperar contraseña quedarán desactivados).');
}

// Código numérico de 6 dígitos (con ceros a la izquierda si hace falta, ej. "004821")
function generarCodigoVerificacion() {
    return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

function enviarCorreoConCodigo({ destinatario, asunto, tituloHtml, textoHtml, codigo }) {
    if (!mailTransporter) {
        return Promise.reject(new Error('El servidor de correo no está configurado (faltan GMAIL_USER / GMAIL_APP_PASSWORD).'));
    }
    return mailTransporter.sendMail({
        from: `"SamiPacks" <${gmailUser}>`,
        to: destinatario,
        subject: asunto,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 420px; margin: 0 auto; padding: 24px; color: #2b2b2b;">
                <h2 style="color: #4caf50; margin-bottom: 4px;">SamiPacks</h2>
                <h3 style="margin-top: 0;">${tituloHtml}</h3>
                <p>${textoHtml}</p>
                <div style="background: #f2f7f2; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2e7d32;">${codigo}</span>
                </div>
                <p style="font-size: 13px; color: #777;">Este código vence en 10 minutos. Si tú no solicitaste esto, puedes ignorar este correo.</p>
            </div>
        `
    });
}

// Limpia códigos previos no usados del mismo correo+tipo (evita que queden
// códigos viejos "vivos" a la vez que uno nuevo).
function invalidarCodigosPrevios(correo, tipo, callback) {
    db.query(
        'UPDATE codigos_verificacion SET usado = 1 WHERE correo = ? AND tipo = ? AND usado = 0',
        [correo, tipo],
        callback
    );
}

// ==========================================================================
// 🔐 AUTENTICACIÓN (LOGIN CON ROLES)
// ==========================================================================
// NOTA IMPORTANTE SOBRE SEGURIDAD (2026-07-07):
// Las cuentas creadas ANTES de este cambio tienen su contraseña guardada
// en texto plano. Las cuentas creadas DESPUÉS se guardan hasheadas con
// bcrypt. Para no romper el login de las cuentas viejas ni forzar a nadie
// a "re-registrarse", hacemos una MIGRACIÓN PEREZOSA: buscamos al usuario
// solo por correo, y luego:
//   - Si la contraseña guardada YA es un hash de bcrypt (empieza con "$2"),
//     comparamos con bcrypt.compare().
//   - Si NO es un hash (es texto plano, cuenta vieja), comparamos texto
//     plano directo. Si coincide, la re-guardamos ya hasheada en ese mismo
//     momento, para que la próxima vez ya esté migrada.
app.post('/api/login', (req, res) => {
    const { correo, contrasena } = req.body;

    if (!correo || !contrasena) {
        return res.status(400).json({ success: false, message: 'Faltan correo o contraseña.' });
    }

    const query = 'SELECT id, nombre, correo, contrasena, telefono, rol, negocio, categoria_negocio FROM usuarios WHERE correo = ?';

    db.query(query, [correo], (err, results) => {
        if (err) {
            console.error('❌ Error real en /api/login:', err);
            return res.status(500).json({ error: 'Error en el servidor' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
        }

        const usuario = results[0];
        const hashGuardado = usuario.contrasena || '';
        const esHashBcrypt = hashGuardado.startsWith('$2');

        const responderExito = () => {
            // Nunca devolvemos el hash/contraseña al frontend
            const { contrasena, ...usuarioSinClave } = usuario;
            res.json({ success: true, user: usuarioSinClave });
        };

        if (esHashBcrypt) {
            // Cuenta ya migrada: comparación segura normal
            bcrypt.compare(contrasena, hashGuardado, (compareErr, coincide) => {
                if (compareErr) {
                    console.error('❌ Error comparando contraseña:', compareErr);
                    return res.status(500).json({ error: 'Error en el servidor' });
                }
                if (!coincide) {
                    return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
                }
                responderExito();
            });
        } else {
            // Cuenta vieja con texto plano: comparamos directo
            if (contrasena !== hashGuardado) {
                return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
            }

            // Migración perezosa: la hasheamos y guardamos ahora que sabemos
            // que la contraseña es correcta.
            bcrypt.hash(contrasena, 10, (hashErr, nuevoHash) => {
                if (hashErr) {
                    console.error('❌ Error migrando contraseña a hash:', hashErr);
                    // No bloqueamos el login por esto, solo no migramos todavía.
                    return responderExito();
                }
                db.query('UPDATE usuarios SET contrasena = ? WHERE id = ?', [nuevoHash, usuario.id], (updErr) => {
                    if (updErr) console.error('❌ Error guardando contraseña migrada:', updErr);
                    responderExito();
                });
            });
        }
    });
});

// 1D. RECUPERAR CONTRASEÑA — Paso 1: enviar código de verificación al correo
app.post('/api/forgot-password/send-code', (req, res) => {
    const correo = (req.body.correo || '').trim().toLowerCase();

    if (!correo) {
        return res.status(400).json({ success: false, message: 'Ingresa tu correo.' });
    }

    db.query('SELECT id FROM usuarios WHERE correo = ?', [correo], (err, results) => {
        if (err) {
            console.error('❌ Error en /api/forgot-password/send-code (búsqueda):', err);
            return res.status(500).json({ success: false, message: 'Error en el servidor' });
        }
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'No existe ninguna cuenta con ese correo.' });
        }

        const codigo = generarCodigoVerificacion();
        const expiraEn = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

        invalidarCodigosPrevios(correo, 'recuperacion', (invalidarErr) => {
            if (invalidarErr) {
                console.error('❌ Error invalidando códigos previos:', invalidarErr);
                return res.status(500).json({ success: false, message: 'Error en el servidor' });
            }

            db.query(
                'INSERT INTO codigos_verificacion (correo, codigo, tipo, expira_en) VALUES (?, ?, ?, ?)',
                [correo, codigo, 'recuperacion', expiraEn],
                (insertErr) => {
                    if (insertErr) {
                        console.error('❌ Error guardando código de recuperación:', insertErr);
                        return res.status(500).json({ success: false, message: 'Error en el servidor' });
                    }

                    enviarCorreoConCodigo({
                        destinatario: correo,
                        asunto: 'Tu código para recuperar tu contraseña — SamiPacks',
                        tituloHtml: 'Recupera tu contraseña',
                        textoHtml: 'Usa este código para verificar tu identidad y crear una contraseña nueva.',
                        codigo
                    })
                        .then(() => res.json({ success: true, message: 'Te enviamos un código a tu correo.' }))
                        .catch((mailErr) => {
                            console.error('❌ Error enviando correo de recuperación:', mailErr);
                            res.status(500).json({ success: false, message: 'No se pudo enviar el correo. Intenta de nuevo en unos minutos.' });
                        });
                }
            );
        });
    });
});

// 1D-bis. RECUPERAR CONTRASEÑA — Paso 2: verificar el código (antes de dejar
// escribir la contraseña nueva, así el usuario sabe si se equivocó de código
// antes de llegar al último paso).
app.post('/api/forgot-password/verify-code', (req, res) => {
    const correo = (req.body.correo || '').trim().toLowerCase();
    const codigo = (req.body.codigo || '').trim();

    if (!correo || !codigo) {
        return res.status(400).json({ success: false, message: 'Ingresa el código que te enviamos.' });
    }

    db.query(
        'SELECT id, codigo, intentos FROM codigos_verificacion WHERE correo = ? AND tipo = ? AND usado = 0 AND expira_en > NOW() ORDER BY id DESC LIMIT 1',
        [correo, 'recuperacion'],
        (err, results) => {
            if (err) {
                console.error('❌ Error en /api/forgot-password/verify-code:', err);
                return res.status(500).json({ success: false, message: 'Error en el servidor' });
            }
            if (results.length === 0) {
                return res.status(400).json({ success: false, message: 'El código expiró o no es válido. Solicita uno nuevo.' });
            }

            const fila = results[0];
            if (fila.codigo !== codigo) {
                const intentosNuevos = fila.intentos + 1;
                const seVence = intentosNuevos >= 5;
                db.query(
                    'UPDATE codigos_verificacion SET intentos = ?, usado = ? WHERE id = ?',
                    [intentosNuevos, seVence ? 1 : 0, fila.id],
                    () => {
                        res.status(400).json({
                            success: false,
                            message: seVence
                                ? 'Demasiados intentos incorrectos. Solicita un código nuevo.'
                                : 'Código incorrecto. Inténtalo de nuevo.'
                        });
                    }
                );
                return;
            }

            res.json({ success: true });
        }
    );
});

// 1E. RECUPERAR CONTRASEÑA — Paso 3: guardar la contraseña nueva (se vuelve
// a validar el código aquí, no confiamos solo en el paso anterior, para que
// nadie pueda llamar este endpoint directamente sin haber verificado nada).
app.post('/api/forgot-password/reset', (req, res) => {
    const correo = (req.body.correo || '').trim().toLowerCase();
    const codigo = (req.body.codigo || '').trim();
    const nueva_contrasena = req.body.nueva_contrasena;

    if (!correo || !codigo || !nueva_contrasena) {
        return res.status(400).json({ success: false, message: 'Faltan datos.' });
    }
    if (nueva_contrasena.length < 6) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    db.query(
        'SELECT id FROM codigos_verificacion WHERE correo = ? AND tipo = ? AND codigo = ? AND usado = 0 AND expira_en > NOW() ORDER BY id DESC LIMIT 1',
        [correo, 'recuperacion', codigo],
        (err, codigoResults) => {
            if (err) {
                console.error('❌ Error en /api/forgot-password/reset (código):', err);
                return res.status(500).json({ success: false, message: 'Error en el servidor' });
            }
            if (codigoResults.length === 0) {
                return res.status(400).json({ success: false, message: 'El código expiró o no es válido. Solicita uno nuevo.' });
            }

            db.query('SELECT id FROM usuarios WHERE correo = ?', [correo], (userErr, userResults) => {
                if (userErr) {
                    console.error('❌ Error en /api/forgot-password/reset (usuario):', userErr);
                    return res.status(500).json({ success: false, message: 'Error en el servidor' });
                }
                if (userResults.length === 0) {
                    return res.status(404).json({ success: false, message: 'No existe ninguna cuenta con ese correo.' });
                }

                bcrypt.hash(nueva_contrasena, 10, (hashErr, nuevoHash) => {
                    if (hashErr) {
                        console.error('❌ Error hasheando contraseña nueva:', hashErr);
                        return res.status(500).json({ success: false, message: 'No se pudo actualizar la contraseña.' });
                    }
                    db.query('UPDATE usuarios SET contrasena = ? WHERE id = ?', [nuevoHash, userResults[0].id], (updErr) => {
                        if (updErr) {
                            console.error('❌ Error guardando contraseña nueva:', updErr);
                            return res.status(500).json({ success: false, message: 'No se pudo actualizar la contraseña.' });
                        }
                        db.query('UPDATE codigos_verificacion SET usado = 1 WHERE id = ?', [codigoResults[0].id]);
                        res.json({ success: true, message: 'Contraseña actualizada correctamente.' });
                    });
                });
            });
        }
    );
});

// 1B. CREAR CUENTA NUEVA — Paso 1: validar datos y enviar código al correo
// (la cuenta NO se crea todavía; se guarda "pendiente" hasta que el código
// se confirme en el paso 2, así nadie queda registrado con un correo que
// nunca pudo confirmar que es suyo).
app.post('/api/register/send-code', (req, res) => {
    const nombre = (req.body.nombre || '').trim();
    const correo = (req.body.correo || '').trim().toLowerCase();
    const contrasena = req.body.contrasena;
    const rol = req.body.rol === 'negocio' ? 'negocio' : 'cliente';

    if (!nombre || !correo || !contrasena) {
        return res.status(400).json({ success: false, message: 'Faltan datos obligatorios.' });
    }
    if (contrasena.length < 6) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres.' });
    }
    // Validación de formato de correo (básica pero real; la confirmación
    // de que el correo EXISTE de verdad la hace el propio código que le
    // llega por email en el paso 2).
    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
    if (!correoValido) {
        return res.status(400).json({ success: false, message: 'Ingresa un correo válido.' });
    }

    db.query('SELECT id FROM usuarios WHERE correo = ?', [correo], (checkErr, checkResults) => {
        if (checkErr) return res.status(500).json({ success: false, message: 'Error en el servidor' });
        if (checkResults.length > 0) {
            return res.status(409).json({ success: false, message: 'Ya existe una cuenta registrada con ese correo.' });
        }

        bcrypt.hash(contrasena, 10, (hashErr, contrasenaHasheada) => {
            if (hashErr) {
                console.error('❌ Error hasheando contraseña:', hashErr);
                return res.status(500).json({ success: false, message: 'No se pudo procesar el registro.' });
            }

            const codigo = generarCodigoVerificacion();
            const expiraEn = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
            const datosPendientes = JSON.stringify({ nombre, contrasenaHasheada, rol });

            invalidarCodigosPrevios(correo, 'registro', (invalidarErr) => {
                if (invalidarErr) {
                    console.error('❌ Error invalidando códigos previos de registro:', invalidarErr);
                    return res.status(500).json({ success: false, message: 'Error en el servidor' });
                }

                db.query(
                    'INSERT INTO codigos_verificacion (correo, codigo, tipo, datos_pendientes, expira_en) VALUES (?, ?, ?, ?, ?)',
                    [correo, codigo, 'registro', datosPendientes, expiraEn],
                    (insertErr) => {
                        if (insertErr) {
                            console.error('❌ Error guardando código de registro:', insertErr);
                            return res.status(500).json({ success: false, message: 'Error en el servidor' });
                        }

                        enviarCorreoConCodigo({
                            destinatario: correo,
                            asunto: 'Confirma tu correo — SamiPacks',
                            tituloHtml: '¡Bienvenido a SamiPacks!',
                            textoHtml: 'Usa este código para confirmar tu correo y activar tu cuenta.',
                            codigo
                        })
                            .then(() => res.json({ success: true, message: 'Te enviamos un código a tu correo.' }))
                            .catch((mailErr) => {
                                console.error('❌ Error enviando correo de registro:', mailErr);
                                res.status(500).json({ success: false, message: 'No se pudo enviar el correo. Intenta de nuevo en unos minutos.' });
                            });
                    }
                );
            });
        });
    });
});

// 1B-bis. CREAR CUENTA NUEVA — Paso 2: verificar el código y crear la cuenta
app.post('/api/register/verify-code', (req, res) => {
    const correo = (req.body.correo || '').trim().toLowerCase();
    const codigo = (req.body.codigo || '').trim();

    if (!correo || !codigo) {
        return res.status(400).json({ success: false, message: 'Ingresa el código que te enviamos.' });
    }

    db.query(
        'SELECT id, codigo, intentos, datos_pendientes FROM codigos_verificacion WHERE correo = ? AND tipo = ? AND usado = 0 AND expira_en > NOW() ORDER BY id DESC LIMIT 1',
        [correo, 'registro'],
        (err, results) => {
            if (err) {
                console.error('❌ Error en /api/register/verify-code:', err);
                return res.status(500).json({ success: false, message: 'Error en el servidor' });
            }
            if (results.length === 0) {
                return res.status(400).json({ success: false, message: 'El código expiró o no es válido. Vuelve a intentarlo.' });
            }

            const fila = results[0];
            if (fila.codigo !== codigo) {
                const intentosNuevos = fila.intentos + 1;
                const seVence = intentosNuevos >= 5;
                db.query(
                    'UPDATE codigos_verificacion SET intentos = ?, usado = ? WHERE id = ?',
                    [intentosNuevos, seVence ? 1 : 0, fila.id],
                    () => {
                        res.status(400).json({
                            success: false,
                            message: seVence
                                ? 'Demasiados intentos incorrectos. Solicita un código nuevo.'
                                : 'Código incorrecto. Inténtalo de nuevo.'
                        });
                    }
                );
                return;
            }

            let datos;
            try {
                datos = JSON.parse(fila.datos_pendientes);
            } catch (parseErr) {
                console.error('❌ Error leyendo datos pendientes del registro:', parseErr);
                return res.status(500).json({ success: false, message: 'Error en el servidor' });
            }

            // Por si en los 10 minutos de espera alguien más alcanzó a
            // registrar ese mismo correo.
            db.query('SELECT id FROM usuarios WHERE correo = ?', [correo], (checkErr, checkResults) => {
                if (checkErr) return res.status(500).json({ success: false, message: 'Error en el servidor' });
                if (checkResults.length > 0) {
                    return res.status(409).json({ success: false, message: 'Ya existe una cuenta registrada con ese correo.' });
                }

                const insertQuery = 'INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, ?)';
                db.query(insertQuery, [datos.nombre, correo, datos.contrasenaHasheada, datos.rol], (insertErr, result) => {
                    if (insertErr) {
                        console.error('Error al registrar usuario:', insertErr);
                        return res.status(500).json({ success: false, message: 'No se pudo crear la cuenta.' });
                    }

                    db.query('UPDATE codigos_verificacion SET usado = 1 WHERE id = ?', [fila.id]);

                    const nuevoUsuario = {
                        id: result.insertId,
                        nombre: datos.nombre,
                        correo,
                        telefono: null,
                        rol: datos.rol,
                        negocio: null,
                        categoria_negocio: null
                    };
                    res.json({ success: true, user: nuevoUsuario });
                });
            });
        }
    );
});

// 1C. COMPLETAR / ACTUALIZAR DATOS DEL NEGOCIO (segundo paso del registro de negocio)
app.put('/api/usuarios/:id/negocio', (req, res) => {
    const id = req.params.id;
    const { nombre, negocio, categoria_negocio, telefono } = req.body;

    if (!negocio || !categoria_negocio || !telefono || !nombre) {
        return res.status(400).json({ success: false, message: 'Faltan datos del negocio.' });
    }

    const query = 'UPDATE usuarios SET nombre = ?, negocio = ?, categoria_negocio = ?, telefono = ? WHERE id = ?';
    db.query(query, [nombre, negocio, categoria_negocio, telefono, id], (err, result) => {
        if (err) {
            console.error('Error al guardar datos del negocio:', err);
            return res.status(500).json({ success: false, message: 'No se pudieron guardar los datos del negocio.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
        }

        const selectQuery = 'SELECT id, nombre, correo, telefono, rol, negocio, categoria_negocio FROM usuarios WHERE id = ?';
        db.query(selectQuery, [id], (selErr, results) => {
            if (selErr || results.length === 0) {
                return res.status(500).json({ success: false, message: 'Datos guardados, pero no se pudo recargar el usuario.' });
            }
            res.json({ success: true, user: results[0] });
        });
    });
});

// ==========================================================================
// 📦 CRUD DE SAMIPACKS
// ==========================================================================

// 1. OBTENER TODOS LOS PACKS (Home del Cliente)
app.get('/api/samipacks', (req, res) => {
    const query = 'SELECT * FROM samipacks WHERE remainingPacks > 0 ORDER BY id DESC';
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, packs: results });
    });
});

// 2. OBTENER PACKS DE UN NEGOCIO ESPECÍFICO (Home del Admin)
app.get('/api/samipacks/negocio/:nombreNegocio', (req, res) => {
    const nombreNegocio = req.params.nombreNegocio;
    const query = 'SELECT * FROM samipacks WHERE negocio = ? ORDER BY id DESC';
    db.query(query, [nombreNegocio], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, packs: results });
    });
});

// 3. CREAR UN NUEVO SAMIPACK
app.post('/api/samipacks', (req, res) => {
    const { business, category, producto, originalPrice, finalPrice, remainingPacks, description, schedule, address, coordinates, image } = req.body;
    const query = `INSERT INTO samipacks (negocio, category, producto, originalPrice, finalPrice, remainingPacks, description, schedule, address, coordinates, image) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(query, [business, category, producto, originalPrice, finalPrice, remainingPacks, description, schedule, address, coordinates, image], (err, result) => {
        if (err) {
            console.error('Error al crear SamiPack:', err);
            return res.status(500).json({ error: 'Error al publicar el producto' });
        }
        res.json({ success: true, insertId: result.insertId });
    });
});

// 4. ACTUALIZAR UN SAMIPACK
app.put('/api/samipacks/:id', (req, res) => {
    const id = req.params.id;
    const { business, category, producto, originalPrice, finalPrice, remainingPacks, description, schedule, address, coordinates, image } = req.body;

    const query = `UPDATE samipacks SET 
        negocio = ?, category = ?, producto = ?, originalPrice = ?, finalPrice = ?, 
        remainingPacks = ?, description = ?, schedule = ?, address = ?, coordinates = ?, image = ?
        WHERE id = ?`;

    db.query(query, [business, category, producto, originalPrice, finalPrice, remainingPacks, description, schedule, address, coordinates, image, id], (err, result) => {
        if (err) {
            console.error('Error al actualizar SamiPack:', err);
            return res.status(500).json({ error: 'Error al actualizar el producto' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'SamiPack no encontrado' });
        }
        res.json({ success: true, message: 'SamiPack actualizado exitosamente' });
    });
});

// 5. ELIMINAR UN SAMIPACK
app.delete('/api/samipacks/:id', (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM samipacks WHERE id = ?';

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar SamiPack:', err);
            return res.status(500).json({ error: 'Error al eliminar el producto' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'SamiPack no encontrado' });
        }
        res.json({ success: true, message: 'SamiPack eliminado exitosamente' });
    });
});

// ==========================================================================
// 🎫 GESTIÓN DE RESERVAS
// ==========================================================================

// 1. CREAR RESERVA
app.post('/api/reservas', (req, res) => {
    const { usuario_id, negocio, samipack_id, samipack_nombre, categoria, cantidad, precio_total, codigo_alfanumerico, qr_data, image, direccion_negocio, horario_negocio, coordenadas_negocio } = req.body;

    const crearReserva = () => {
        const query = 'INSERT INTO reservas (usuario_id, negocio, samipack_nombre, categoria, cantidad, precio_total, codigo_alfanumerico, qr_data, image, direccion_negocio, horario_negocio, coordenadas_negocio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

        db.query(query, [usuario_id, negocio, samipack_nombre, categoria, cantidad, precio_total, codigo_alfanumerico, qr_data, image, direccion_negocio || null, horario_negocio || null, coordenadas_negocio || null], (err, result) => {
            if (err) {
                console.error('Error al registrar reserva:', err);
                return res.status(500).json({ error: 'Error al registrar la reserva' });
            }

            // Avisamos al negocio por push (no bloquea la respuesta al cliente que reservó)
            notificarNuevaReservaAlNegocio(negocio, {
                title: '🎉 ¡Nueva reserva!',
                body: `Reservaron ${cantidad}x ${samipack_nombre || 'pack'}. Código: ${codigo_alfanumerico}`,
                tag: 'nueva-reserva',
                url: '/'
            });

            // Buscamos el teléfono y la categoría oficial del negocio para devolverlos
            // ya mismo al cliente y que su boleta muestre los datos completos sin
            // esperar a una recarga de la lista de reservas.
            db.query("SELECT telefono, categoria_negocio FROM usuarios WHERE negocio = ? AND rol = 'negocio' LIMIT 1", [negocio], (infoErr, infoResults) => {
                const infoNegocio = (!infoErr && infoResults.length > 0) ? infoResults[0] : { telefono: null, categoria_negocio: null };
                res.json({
                    success: true,
                    insertId: result.insertId,
                    telefono_negocio: infoNegocio.telefono,
                    categoria_negocio: infoNegocio.categoria_negocio
                });
            });
        });
    };

    // Primero descontamos el stock de forma segura: el UPDATE solo afecta una fila
    // si hay stock suficiente (remainingPacks >= cantidad). Si affectedRows es 0,
    // significa que no había stock suficiente y NO se crea la reserva, evitando
    // así que el stock quede en negativo.
    // Preferimos descontar por ID exacto del SamiPack (más confiable). Si el
    // cliente no envía el ID (compatibilidad con versiones anteriores), recurrimos
    // al método anterior por negocio + categoría.
    if (samipack_id) {
        const updateQuery = 'UPDATE samipacks SET remainingPacks = remainingPacks - ? WHERE id = ? AND remainingPacks >= ?';
        db.query(updateQuery, [cantidad, samipack_id, cantidad], (updateErr, updateResult) => {
            if (updateErr) {
                console.error('Error al actualizar stock:', updateErr);
                return res.status(500).json({ error: 'Error al actualizar el stock' });
            }
            if (updateResult.affectedRows === 0) {
                return res.status(409).json({ success: false, message: 'Ya no hay stock suficiente para esa cantidad. Actualiza la página e intenta de nuevo.' });
            }
            crearReserva();
        });
    } else if (samipack_nombre && negocio) {
        const updateQuery = 'UPDATE samipacks SET remainingPacks = remainingPacks - ? WHERE negocio = ? AND category = ? AND remainingPacks >= ?';
        db.query(updateQuery, [cantidad, negocio, samipack_nombre, cantidad], (updateErr, updateResult) => {
            if (updateErr) {
                console.error('Error al actualizar stock:', updateErr);
                return res.status(500).json({ error: 'Error al actualizar el stock' });
            }
            if (updateResult.affectedRows === 0) {
                return res.status(409).json({ success: false, message: 'Ya no hay stock suficiente para esa cantidad. Actualiza la página e intenta de nuevo.' });
            }
            crearReserva();
        });
    } else {
        // Sin samipack_id ni samipack_nombre no podemos validar stock; se crea igual
        // por compatibilidad, pero esto no debería pasar en el flujo normal del frontend.
        crearReserva();
    }
});

// 1B. CANCELAR RESERVA (desde el cliente, botón "❌ Cancelar" en la boleta)
// Solo se puede cancelar una reserva que sigue 'Pendiente de recoger'. Al
// cancelar devolvemos el stock al SamiPack correspondiente, igual que se
// descontó al crear la reserva (por negocio + nombre del pack, ya que la
// tabla reservas no guarda samipack_id).
app.post('/api/reservas/:id/cancelar', (req, res) => {
    const { id } = req.params;

    const buscarQuery = "SELECT * FROM reservas WHERE id = ?";
    db.query(buscarQuery, [id], (err, results) => {
        if (err) {
            console.error('Error al buscar reserva para cancelar:', err);
            return res.status(500).json({ success: false, message: 'Error de servidor al buscar la reserva.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Esa reserva no existe.' });
        }

        const reserva = results[0];
        if (reserva.estado !== 'Pendiente de recoger') {
            return res.status(409).json({ success: false, message: `Esa reserva ya está marcada como "${reserva.estado}" y no se puede cancelar.` });
        }

        const actualizarQuery = "UPDATE reservas SET estado = 'Cancelado' WHERE id = ? AND estado = 'Pendiente de recoger'";
        db.query(actualizarQuery, [id], (updErr, result) => {
            if (updErr) {
                console.error('Error al cancelar reserva:', updErr);
                return res.status(500).json({ success: false, message: 'Error de servidor al cancelar la reserva.' });
            }

            if (result.affectedRows === 0) {
                return res.status(409).json({ success: false, message: 'Esa reserva ya fue actualizada por otro proceso.' });
            }

            // Devolver el stock al SamiPack correspondiente
            const devolverStockQuery = 'UPDATE samipacks SET remainingPacks = remainingPacks + ? WHERE negocio = ? AND category = ?';
            db.query(devolverStockQuery, [reserva.cantidad, reserva.negocio, reserva.samipack_nombre], (stockErr) => {
                if (stockErr) console.error('Error al devolver stock tras cancelación:', stockErr);
            });

            res.json({ success: true, message: 'Reserva cancelada exitosamente.' });
        });
    });
});

// 2. OBTENER RESERVAS DE UN USUARIO (Pendientes)
app.get('/api/reservas/:usuario_id', (req, res) => {
    const usuario_id = req.params.usuario_id;
    // LEFT JOIN con usuarios: trae el teléfono y la categoría oficial del negocio
    // en vivo (por si cambiaron desde que se hizo la reserva), sin duplicar esos
    // datos en cada fila de "reservas".
    const query = `
        SELECT r.*, u.telefono AS telefono_negocio, u.categoria_negocio AS categoria_negocio
        FROM reservas r
        LEFT JOIN usuarios u ON u.negocio = r.negocio AND u.rol = 'negocio'
        WHERE r.usuario_id = ? AND r.estado = 'Pendiente de recoger'
        ORDER BY r.id DESC
    `;
    db.query(query, [usuario_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, reservas: results });
    });
});

// 3. OBTENER HISTORIAL DE UN USUARIO
app.get('/api/historial/:usuario_id', (req, res) => {
    const usuario_id = req.params.usuario_id;
    const query = `
        SELECT r.*, u.telefono AS telefono_negocio, u.categoria_negocio AS categoria_negocio
        FROM reservas r
        LEFT JOIN usuarios u ON u.negocio = r.negocio AND u.rol = 'negocio'
        WHERE r.usuario_id = ? AND r.estado IN ('Recogido', 'Cancelado', 'Expirado')
        ORDER BY r.id DESC
    `;
    db.query(query, [usuario_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, historial: results });
    });
});

// 4. OBTENER PENDIENTES DE CALIFICAR
app.get('/api/pendientes-calificar/:usuario_id', (req, res) => {
    const usuario_id = req.params.usuario_id;
    const query = "SELECT * FROM reservas WHERE usuario_id = ? AND estado = 'Recogido' ORDER BY id DESC";
    db.query(query, [usuario_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, packs: results });
    });
});

// 5. GUARDAR CALIFICACIÓN
app.post('/api/guardar-calificacion', (req, res) => {
    const { reserva_id } = req.body;
    const query = "UPDATE reservas SET estado = 'Calificado' WHERE id = ?";
    db.query(query, [reserva_id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, message: "¡Calificación guardada!" });
    });
});

// ==========================================================================
// 👑 ADMIN - NUEVOS ENDPOINTS
// ==========================================================================

// 1. OBTENER TODAS LAS RESERVAS (admin)
app.get('/api/admin/reservas', (req, res) => {
    const query = `
        SELECT r.*, u.nombre as usuario_nombre, u.correo as usuario_correo 
        FROM reservas r 
        JOIN usuarios u ON r.usuario_id = u.id 
        ORDER BY r.id DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, reservas: results });
    });
});

// 2. OBTENER RESERVAS DE UN NEGOCIO ESPECÍFICO (para escanear QR)
app.get('/api/admin/reservas/negocio/:negocio', (req, res) => {
    const negocio = req.params.negocio;
    // Solo traemos las que están pendientes de recoger: esta lista alimenta
    // la pantalla "Pendientes de recoger", así que no debe incluir reservas
    // ya marcadas como 'Recogido' (antes se traían todas y el frontend les
    // pintaba la etiqueta "Pendiente" a todas por igual, sin mirar el estado
    // real, lo que hacía parecer confirmable algo que ya no lo era).
    const query = `
        SELECT r.*, u.nombre as usuario_nombre, u.correo as usuario_correo 
        FROM reservas r 
        JOIN usuarios u ON r.usuario_id = u.id 
        WHERE r.negocio = ? AND r.estado = 'Pendiente de recoger'
        ORDER BY r.id DESC
    `;
    db.query(query, [negocio], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error al cargar reservas.', error: err.message });
        res.json({ success: true, reservas: results });
    });
});

// 3. MARCAR RESERVA COMO RECOGIDA (ESCANEO QR)
app.post('/api/admin/confirmar-recogida', (req, res) => {
    const { reserva_id, admin_id } = req.body;

    const query = `
        UPDATE reservas 
        SET estado = 'Recogido', 
            fecha_recogida = NOW(), 
            escaneado_por = ? 
        WHERE id = ? AND estado = 'Pendiente de recoger'
    `;

    db.query(query, [admin_id, reserva_id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Reserva no encontrada o ya fue recogida'
            });
        }

        res.json({
            success: true,
            message: '¡Reserva marcada como recogida exitosamente!'
        });
    });
});

// 3B. MARCAR RESERVA COMO RECOGIDA BUSCANDO POR CÓDIGO (input manual o texto leído del QR)
// Búsqueda atómica en el servidor: evita depender de una lista cacheada en el navegador,
// que puede quedar desactualizada y causar falsos "no se pudo confirmar".
app.post('/api/admin/confirmar-recogida-codigo', (req, res) => {
    const { codigo, negocio, admin_id } = req.body;

    if (!codigo || !negocio) {
        return res.status(400).json({ success: false, message: 'Falta el código o el negocio.' });
    }

    const codigoLimpio = codigo.trim().toUpperCase();

    const buscarQuery = 'SELECT id, estado FROM reservas WHERE UPPER(codigo_alfanumerico) = ? AND negocio = ?';
    db.query(buscarQuery, [codigoLimpio, negocio], (err, results) => {
        // IMPORTANTE: siempre incluimos 'message' (además de 'error') porque el
        // frontend solo lee data.message; si un error real de SQL solo traía
        // 'error', el usuario veía siempre el mensaje genérico "No se pudo
        // confirmar la recogida." sin ninguna pista de la causa real.
        if (err) {
            console.error('❌ Error SQL en confirmar-recogida-codigo (búsqueda):', err);
            return res.status(500).json({ success: false, message: `Error de servidor al buscar el código: ${err.message}`, error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: 'Ese código no corresponde a ninguna reserva de tu negocio.' });
        }

        const reserva = results[0];
        if (reserva.estado !== 'Pendiente de recoger') {
            return res.status(409).json({ success: false, message: `Esa reserva ya está marcada como "${reserva.estado}".` });
        }

        const actualizarQuery = `
            UPDATE reservas
            SET estado = 'Recogido',
                fecha_recogida = NOW(),
                escaneado_por = ?
            WHERE id = ? AND estado = 'Pendiente de recoger'
        `;
        db.query(actualizarQuery, [admin_id, reserva.id], (updErr, result) => {
            if (updErr) {
                console.error('❌ Error SQL en confirmar-recogida-codigo (actualización):', updErr);
                return res.status(500).json({ success: false, message: `Error de servidor al actualizar: ${updErr.message}`, error: updErr.message });
            }

            if (result.affectedRows === 0) {
                return res.status(409).json({ success: false, message: 'Esa reserva acaba de ser recogida por otra persona.' });
            }

            res.json({ success: true, message: '¡Reserva marcada como recogida exitosamente!' });
        });
    });
});

// 4. OBTENER HISTORIAL DE VENTAS DEL ADMIN (escaneos realizados)
app.get('/api/admin/historial-ventas/:admin_id', (req, res) => {
    const admin_id = req.params.admin_id;
    const query = `
        SELECT r.*, u.nombre as usuario_nombre, u.correo as usuario_correo 
        FROM reservas r 
        JOIN usuarios u ON r.usuario_id = u.id 
        WHERE r.escaneado_por = ? AND r.estado = 'Recogido'
        ORDER BY r.fecha_recogida DESC
    `;
    db.query(query, [admin_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, ventas: results });
    });
});

// ==========================================================================
// 🚀 INICIAR SERVIDOR
// ==========================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});