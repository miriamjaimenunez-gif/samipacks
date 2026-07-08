require('dotenv').config();
const path = require('path');
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

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

// 1B. CREAR CUENTA NUEVA (cliente o negocio)
app.post('/api/register', (req, res) => {
    const { nombre, correo, contrasena, rol } = req.body;

    if (!nombre || !correo || !contrasena) {
        return res.status(400).json({ success: false, message: 'Faltan datos obligatorios.' });
    }

    const rolFinal = rol === 'negocio' ? 'negocio' : 'cliente';

    const checkQuery = 'SELECT id FROM usuarios WHERE correo = ?';
    db.query(checkQuery, [correo], (checkErr, checkResults) => {
        if (checkErr) return res.status(500).json({ success: false, message: 'Error en el servidor' });
        if (checkResults.length > 0) {
            return res.status(409).json({ success: false, message: 'Ya existe una cuenta registrada con ese correo.' });
        }

        // Las cuentas nuevas se guardan SIEMPRE con la contraseña hasheada.
        bcrypt.hash(contrasena, 10, (hashErr, contrasenaHasheada) => {
            if (hashErr) {
                console.error('❌ Error hasheando contraseña:', hashErr);
                return res.status(500).json({ success: false, message: 'No se pudo crear la cuenta.' });
            }

            const insertQuery = 'INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, ?)';
            db.query(insertQuery, [nombre, correo, contrasenaHasheada, rolFinal], (insertErr, result) => {
                if (insertErr) {
                    console.error('Error al registrar usuario:', insertErr);
                    return res.status(500).json({ success: false, message: 'No se pudo crear la cuenta.' });
                }

                const nuevoUsuario = {
                    id: result.insertId,
                    nombre,
                    correo,
                    telefono: null,
                    rol: rolFinal,
                    negocio: null,
                    categoria_negocio: null
                };
                res.json({ success: true, user: nuevoUsuario });
            });
        });
    });
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
    const { usuario_id, negocio, samipack_id, samipack_nombre, categoria, cantidad, precio_total, codigo_alfanumerico, qr_data, image } = req.body;

    const query = 'INSERT INTO reservas (usuario_id, negocio, samipack_nombre, categoria, cantidad, precio_total, codigo_alfanumerico, qr_data, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';

    db.query(query, [usuario_id, negocio, samipack_nombre, categoria, cantidad, precio_total, codigo_alfanumerico, qr_data, image], (err, result) => {
        if (err) {
            console.error('Error al registrar reserva:', err);
            return res.status(500).json({ error: 'Error al registrar la reserva' });
        }

        // Actualizar stock: preferimos descontar por ID exacto del SamiPack (más confiable).
        // Si el cliente no envía el ID (compatibilidad con versiones anteriores), recurrimos
        // al método anterior por negocio + categoría, aunque puede afectar el pack equivocado
        // si el negocio tiene varias ofertas activas con la misma categoría.
        if (samipack_id) {
            const updateQuery = 'UPDATE samipacks SET remainingPacks = remainingPacks - ? WHERE id = ? AND remainingPacks > 0';
            db.query(updateQuery, [cantidad, samipack_id], (updateErr) => {
                if (updateErr) console.error('Error al actualizar stock:', updateErr);
            });
        } else if (samipack_nombre && negocio) {
            const updateQuery = 'UPDATE samipacks SET remainingPacks = remainingPacks - ? WHERE negocio = ? AND category = ? AND remainingPacks > 0';
            db.query(updateQuery, [cantidad, negocio, samipack_nombre], (updateErr) => {
                if (updateErr) console.error('Error al actualizar stock:', updateErr);
            });
        }

        res.json({ success: true, insertId: result.insertId });
    });
});

// 2. OBTENER RESERVAS DE UN USUARIO (Pendientes)
app.get('/api/reservas/:usuario_id', (req, res) => {
    const usuario_id = req.params.usuario_id;
    const query = "SELECT * FROM reservas WHERE usuario_id = ? AND estado = 'Pendiente de recoger' ORDER BY id DESC";
    db.query(query, [usuario_id], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, reservas: results });
    });
});

// 3. OBTENER HISTORIAL DE UN USUARIO
app.get('/api/historial/:usuario_id', (req, res) => {
    const usuario_id = req.params.usuario_id;
    const query = "SELECT * FROM reservas WHERE usuario_id = ? AND estado IN ('Recogido', 'Cancelado', 'Expirado') ORDER BY id DESC";
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