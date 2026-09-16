// routes/authRoutes.js
const express = require("express");
const { postRegister, postLogin } = require("../controllers/authController");
const { limitarPorIp } = require("../middleware/limitarPorIp");

const router = express.Router();

router.post("/register", limitarPorIp, postRegister);
router.post("/login", limitarPorIp, postLogin);

module.exports = router;
