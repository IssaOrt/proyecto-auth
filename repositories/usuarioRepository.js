// repositories/usuarioRepository.js
//
// Encapsula TODAS las consultas SQL relacionadas con la tabla `usuarios`.
// Nada fuera de este archivo escribe una sentencia SQL directamente sobre
// esa tabla; controllers/services solo llaman a estos métodos.

const { pool } = require("../config/database");

class UsuarioRepository {
    async buscarPorUsername(username) {
        const [filas] = await pool.query(
            "SELECT * FROM usuarios WHERE username = ? LIMIT 1",
            [username]
        );
        return filas[0] || null;
    }

    async obtenerRolPorId(rolId) {
        const [filas] = await pool.query(
            "SELECT id, nombre FROM roles WHERE id = ? LIMIT 1",
            [rolId]
        );
        return filas[0] || null;
    }

    async obtenerRolPorNombre(nombre) {
        const [filas] = await pool.query(
            "SELECT id, nombre FROM roles WHERE nombre = ? LIMIT 1",
            [nombre]
        );
        return filas[0] || null;
    }

    async crear({ username, passwordHash, rolId }) {
        const [resultado] = await pool.query(
            `INSERT INTO usuarios (username, password_hash, rol_id, intentos_fallidos, bloqueado_hasta)
             VALUES (?, ?, ?, 0, NULL)`,
            [username, passwordHash, rolId]
        );
        return resultado.insertId;
    }

    async registrarIntentoFallido(id, nuevoConteo, bloqueadoHastaISO) {
        await pool.query(
            "UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?",
            [nuevoConteo, bloqueadoHastaISO, id]
        );
    }

    async limpiarIntentosFallidos(id) {
        await pool.query(
            "UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?",
            [id]
        );
    }
}

module.exports = new UsuarioRepository();
