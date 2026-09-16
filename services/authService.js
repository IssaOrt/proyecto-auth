// services/authService.js
//
// Lógica de negocio de autenticación: nada de Express aquí (ni req/res),
// para que sea reutilizable y fácil de probar por separado del transporte HTTP.

const bcrypt = require("bcrypt");
const usuarioRepository = require("../repositories/usuarioRepository");

const RONDAS_SALT = 10;
const MAX_INTENTOS_CUENTA = 5;
const DURACION_BLOQUEO_MS = 15 * 60 * 1000;

class CredencialesInvalidasError extends Error {}
class CuentaBloqueadaError extends Error {
    constructor(mensaje) {
        super(mensaje);
        this.status = 429;
    }
}

async function registrarUsuario({ username, password, rolNombre = "Usuario" }) {
    const rol = await usuarioRepository.obtenerRolPorNombre(rolNombre);
    if (!rol) throw new Error(`El rol "${rolNombre}" no existe.`);

    // BCrypt genera un salt aleatorio distinto en cada llamada y lo embebe
    // dentro de la propia cadena resultante ($2b$10$salt+hash).
    const passwordHash = await bcrypt.hash(password, RONDAS_SALT);

    return usuarioRepository.crear({ username, passwordHash, rolId: rol.id });
}

async function autenticar({ username, password }) {
    const usuario = await usuarioRepository.buscarPorUsername(username);

    // Mismo mensaje de error exista o no el usuario, para no filtrar
    // información sobre qué cuentas están registradas.
    if (!usuario) {
        throw new CredencialesInvalidasError("Usuario o contraseña incorrectos.");
    }

    if (usuario.bloqueado_hasta && new Date(usuario.bloqueado_hasta) > new Date()) {
        throw new CuentaBloqueadaError(
            "Esta cuenta está bloqueada temporalmente por demasiados intentos fallidos."
        );
    }

    // bcrypt.compare lee el salt y el factor de costo directamente del hash
    // almacenado y hace la comparación en tiempo constante.
    const coincide = await bcrypt.compare(password, usuario.password_hash);

    if (!coincide) {
        const fallosAcumulados = (usuario.intentos_fallidos || 0) + 1;
        const seBloquea = fallosAcumulados >= MAX_INTENTOS_CUENTA;
        const bloqueadoHasta = seBloquea
            ? new Date(Date.now() + DURACION_BLOQUEO_MS).toISOString().slice(0, 19).replace("T", " ")
            : null;

        await usuarioRepository.registrarIntentoFallido(usuario.id, fallosAcumulados, bloqueadoHasta);
        throw new CredencialesInvalidasError("Usuario o contraseña incorrectos.");
    }

    await usuarioRepository.limpiarIntentosFallidos(usuario.id);
    const rol = await usuarioRepository.obtenerRolPorId(usuario.rol_id);

    return { id: usuario.id, username: usuario.username, rol: rol.nombre };
}

module.exports = {
    registrarUsuario,
    autenticar,
    CredencialesInvalidasError,
    CuentaBloqueadaError
};
