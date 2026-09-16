// server.js
require("dotenv").config();
const path = require("path");
const express = require("express");

const authRoutes = require("./routes/authRoutes");
const { verificarConexion } = require("./config/database");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", true);
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/", authRoutes);
app.get("/health", (req, res) => res.json({ ok: true }));

verificarConexion()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor de autenticación escuchando en http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("No se pudo conectar a la base de datos MySQL:", err.message);
        console.error("Revisa las variables DB_HOST / DB_USER / DB_PASSWORD / DB_NAME en tu archivo .env");
        process.exit(1);
    });

