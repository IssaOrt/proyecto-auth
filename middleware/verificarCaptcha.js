// middleware/verificarCaptcha.js
//
// Tercera capa de defensa: comprueba que quien envía la solicitud resolvió
// un desafío que solo un humano debería poder leer. Se ejecuta ANTES del
// controlador de login, así que un bot que dispare peticiones automáticas
// es rechazado sin que el servidor gaste tiempo comparando hashes BCrypt.
//
// Modo configurable por la variable de entorno CAPTCHA_MODO:
//   "siempre"       -> exige captcha en todos los intentos de login (por defecto)
//   "tras_fallos"   -> exige captcha solo después de FALLOS_PARA_CAPTCHA fallos desde esa IP

const captchaStore = require("../security/captchaStore");
const { throttlerLogin } = require("./limitarPorIp");

const MODO = process.env.CAPTCHA_MODO || "siempre";
const FALLOS_PARA_CAPTCHA = Number(process.env.FALLOS_PARA_CAPTCHA || 2);

function seRequiereCaptcha(ip) {
    if (MODO === "tras_fallos") {
        const registro = throttlerLogin.registros.get(ip);
        return Boolean(registro && registro.fallos >= FALLOS_PARA_CAPTCHA);
    }
    return true; // modo "siempre"
}

function verificarCaptcha(req, res, next) {
    const ip = req.ipCliente || req.ip;

    if (!seRequiereCaptcha(ip)) {
        return next();
    }

    const { captchaId, captchaRespuesta } = req.body || {};
    const resultado = captchaStore.validar(captchaId, captchaRespuesta);

    if (!resultado.valido) {
        // Un captcha fallido cuenta como intento fallido: evita que un bot
        // use captchas incorrectos para sondear usuarios sin penalización.
        throttlerLogin.registrarFallo(ip);
        return res.status(400).json({ error: resultado.motivo, requiereCaptcha: true });
    }

    next();
}

module.exports = { verificarCaptcha, seRequiereCaptcha, MODO, FALLOS_PARA_CAPTCHA };
