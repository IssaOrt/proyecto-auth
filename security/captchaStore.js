// security/captchaStore.js
//
// CAPTCHA propio, generado y validado ÍNTEGRAMENTE en el servidor.
//
// Cómo funciona:
//  1. El cliente pide un desafío a GET /captcha.
//  2. El servidor genera una operación aritmética simple, guarda la RESPUESTA
//     en memoria asociada a un id aleatorio, y devuelve al cliente únicamente
//     el id + una imagen SVG con la pregunta dibujada (nunca la respuesta).
//  3. Al hacer login, el cliente manda captchaId + captchaRespuesta.
//  4. El servidor compara contra lo que guardó y descarta el desafío (un solo uso).
//
// Puntos de seguridad importantes:
//  - La respuesta correcta NUNCA viaja al navegador, así que no se puede leer
//    con "Ver código fuente" ni con las herramientas de desarrollo.
//  - Cada desafío es de un solo uso: no se puede reutilizar el mismo par
//    (id, respuesta) para automatizar muchos intentos.
//  - Los desafíos expiran a los 5 minutos.
//  - La respuesta se dibuja como SVG con ruido visual para dificultar su
//    lectura automática por un script.

const crypto = require("crypto");

const VIGENCIA_MS = 5 * 60 * 1000; // 5 minutos de validez por desafío

class CaptchaStore {
    constructor() {
        this.desafios = new Map(); // id -> { respuesta, expiraEn }
        // Limpieza periódica de desafíos vencidos para no acumular memoria.
        this.temporizador = setInterval(() => this.limpiarVencidos(), 60 * 1000);
        if (this.temporizador.unref) this.temporizador.unref();
    }

    limpiarVencidos() {
        const ahora = Date.now();
        for (const [id, datos] of this.desafios.entries()) {
            if (datos.expiraEn < ahora) this.desafios.delete(id);
        }
    }

    generar() {
        const a = crypto.randomInt(1, 10);
        const b = crypto.randomInt(1, 10);
        const operaciones = ["+", "-", "x"];
        const op = operaciones[crypto.randomInt(0, operaciones.length)];

        let respuesta;
        let mayor = a, menor = b;
        if (op === "-" && b > a) { mayor = b; menor = a; } // evita resultados negativos

        if (op === "+") respuesta = a + b;
        else if (op === "-") respuesta = mayor - menor;
        else respuesta = a * b;

        const textoPregunta =
            op === "-" ? `${mayor} - ${menor} = ?` : `${a} ${op} ${b} = ?`;

        const id = crypto.randomBytes(16).toString("hex");
        this.desafios.set(id, {
            respuesta: String(respuesta),
            expiraEn: Date.now() + VIGENCIA_MS
        });

        return { id, svg: this.dibujarSvg(textoPregunta) };
    }

    // Dibuja la pregunta como SVG con distorsión y ruido, para que no sea
    // simplemente texto plano legible por un scraper.
    dibujarSvg(texto) {
        const ancho = 220;
        const alto = 70;

        let ruido = "";
        for (let i = 0; i < 7; i++) {
            const x1 = crypto.randomInt(0, ancho);
            const y1 = crypto.randomInt(0, alto);
            const x2 = crypto.randomInt(0, ancho);
            const y2 = crypto.randomInt(0, alto);
            ruido += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#b9aecb" stroke-width="1"/>`;
        }
        for (let i = 0; i < 30; i++) {
            const cx = crypto.randomInt(0, ancho);
            const cy = crypto.randomInt(0, alto);
            ruido += `<circle cx="${cx}" cy="${cy}" r="1" fill="#c9bfd8"/>`;
        }

        let letras = "";
        let x = 22;
        for (const caracter of texto) {
            const y = 45 + crypto.randomInt(-6, 7);
            const rot = crypto.randomInt(-18, 19);
            letras += `<text x="${x}" y="${y}" font-family="Georgia, serif" font-size="27" font-weight="bold" fill="#463a58" transform="rotate(${rot} ${x} ${y})">${caracter}</text>`;
            x += caracter === " " ? 8 : 19;
        }

        return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}"><rect width="${ancho}" height="${alto}" fill="#f4f0fa" rx="8"/>${ruido}${letras}</svg>`;
    }

    // Valida y CONSUME el desafío (un solo uso).
    validar(id, respuestaUsuario) {
        if (!id || respuestaUsuario === undefined || respuestaUsuario === null) {
            return { valido: false, motivo: "Falta resolver la verificación anti-robot." };
        }

        const datos = this.desafios.get(id);
        if (!datos) {
            return { valido: false, motivo: "La verificación expiró o ya fue utilizada. Intente de nuevo." };
        }

        // Se elimina siempre, haya acertado o no: un desafío nunca se reintenta.
        this.desafios.delete(id);

        if (datos.expiraEn < Date.now()) {
            return { valido: false, motivo: "La verificación expiró. Intente de nuevo." };
        }

        const normalizada = String(respuestaUsuario).trim();
        if (normalizada !== datos.respuesta) {
            return { valido: false, motivo: "La verificación anti-robot es incorrecta." };
        }

        return { valido: true };
    }
}

module.exports = new CaptchaStore();
