// middleware/limitarPorIp.js
const IpThrottler = require("../security/ipThrottler");

const throttlerLogin = new IpThrottler({ maxIntentos: 5, ventanaMs: 15 * 60 * 1000 });

function limitarPorIp(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress || "desconocida";
    const estado = throttlerLogin.estaBloqueada(ip);

    if (estado.bloqueada) {
        return res.status(429).json({
            error: `Demasiados intentos fallidos desde su dirección IP. Intente de nuevo en ${estado.segundosRestantes} segundos.`
        });
    }

    req.ipCliente = ip;
    next();
}

module.exports = { limitarPorIp, throttlerLogin };
