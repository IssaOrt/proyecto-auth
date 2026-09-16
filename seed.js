// seed.js
// Crea usuarios de prueba con contraseñas hasheadas de verdad por BCrypt.
// Uso:  npm run seed

require("dotenv").config();
const authService = require("./services/authService");
const { pool } = require("./config/database");

async function crearSiNoExiste(username, password, rolNombre) {
    try {
        await authService.registrarUsuario({ username, password, rolNombre });
        console.log(`- Usuario "${username}" creado (rol: ${rolNombre}).`);
    } catch (err) {
        if (String(err.message).includes("Duplicate entry")) {
            console.log(`- "${username}" ya existía, se omite.`);
        } else {
            throw err;
        }
    }
}

(async () => {
    console.log("Creando usuarios de prueba...\n");
    await crearSiNoExiste("admin", "AdminSeguro#2026", "Administrador");
    await crearSiNoExiste("estudiante", "Estudiante123!", "Usuario");
    console.log("\nListo. Puedes iniciar sesión en /login con estas credenciales.");
    await pool.end();
})().catch((err) => {
    console.error("Error en el seed:", err.message);
    process.exit(1);
});
