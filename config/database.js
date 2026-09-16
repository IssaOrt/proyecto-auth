// config/database.js
//
// Pool de conexiones a MySQL. Cada consulta toma una conexión prestada del
// pool y la devuelve al terminar, en vez de abrir/cerrar una conexión por
// petición (más eficiente bajo carga concurrente).

const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "auth_lab_user",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "auth_lab",
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true
});

async function verificarConexion() {
    const conexion = await pool.getConnection();
    await conexion.ping();
    conexion.release();
}

module.exports = { pool, verificarConexion };
