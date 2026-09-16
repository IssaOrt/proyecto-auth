// controllers/authController.js
const authService = require("../services/authService");
const { throttlerLogin } = require("../middleware/limitarPorIp");

async function postRegister(req, res) {
    const { username, password, rol } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({ error: "username y password son obligatorios." });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
    }

    try {
        await authService.registrarUsuario({ username, password, rolNombre: rol });
        return res.status(201).json({ mensaje: "Usuario creado correctamente.", username });
    } catch (err) {
        if (String(err.message).includes("Duplicate entry")) {
            return res.status(409).json({ error: "Ese nombre de usuario ya existe." });
        }
        console.error(err);
        return res.status(500).json({ error: "Error interno al crear el usuario." });
    }
}

async function postLogin(req, res) {
    const { username, password } = req.body || {};

    if (!username || !password) {
        throttlerLogin.registrarFallo(req.ipCliente);
        return res.status(400).json({ error: "username y password son obligatorios." });
    }

    try {
        const usuario = await authService.autenticar({ username, password });
        throttlerLogin.limpiar(req.ipCliente);
        return res.status(200).json({ mensaje: "Inicio de sesión exitoso.", usuario });
    } catch (err) {
        throttlerLogin.registrarFallo(req.ipCliente);

        if (err instanceof authService.CuentaBloqueadaError) {
            return res.status(429).json({ error: err.message });
        }
        if (err instanceof authService.CredencialesInvalidasError) {
            return res.status(401).json({ error: err.message });
        }
        console.error(err);
        return res.status(500).json({ error: "Error interno del servidor." });
    }
}

module.exports = { postRegister, postLogin };
