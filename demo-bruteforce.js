// demo-bruteforce.js
//
// Prueba demostrativa: hace 6 intentos de login fallidos seguidos contra
// el mismo servidor y muestra cómo, a partir del 6to intento, el servidor
// responde 429 (bloqueado) en vez de 401 (credenciales incorrectas).
//
// Uso: con el servidor corriendo (npm start), en otra terminal:
//      npm run demo:bruteforce

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function intento(n) {
    const resp = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", password: "clave-incorrecta-" + n })
    });
    const data = await resp.json();
    console.log(`Intento ${n}: HTTP ${resp.status} -> ${data.error || data.mensaje}`);
    return resp.status;
}

(async () => {
    console.log(`Atacando ${BASE_URL}/login con 6 intentos fallidos consecutivos...\n`);
    for (let i = 1; i <= 6; i++) {
        await intento(i);
    }
    console.log("\nSi el intento 6 dio HTTP 429, el middleware de fuerza bruta funciona correctamente.");
})();
