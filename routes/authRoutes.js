// routes/authRoutes.js
const express = require("express");
const { postRegister, postLogin } = require("../controllers/authController");
const { getCaptcha } = require("../controllers/captchaController");
const { limitarPorIp } = require("../middleware/limitarPorIp");
const { verificarCaptcha } = require("../middleware/verificarCaptcha");

const router = express.Router();

// Entrega un nuevo desafío anti-robot (la respuesta correcta no sale del servidor).
router.get("/captcha", getCaptcha);

// Orden de las defensas en /login:
//   1. limitarPorIp     -> ¿esta IP está bloqueada por exceso de intentos?
//   2. verificarCaptcha -> ¿quien pide es humano?
//   3. postLogin        -> recién aquí se comparan las credenciales con BCrypt
router.post("/login", limitarPorIp, verificarCaptcha, postLogin);

router.post("/register", limitarPorIp, postRegister);

module.exports = router;
