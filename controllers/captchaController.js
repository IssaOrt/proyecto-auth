// controllers/captchaController.js
const captchaStore = require("../security/captchaStore");

function getCaptcha(req, res) {
    const { id, svg } = captchaStore.generar();
    // Se devuelve el id y la imagen. La respuesta correcta se queda en el servidor.
    res.status(200).json({ captchaId: id, imagenSvg: svg });
}

module.exports = { getCaptcha };
