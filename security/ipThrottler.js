// security/ipThrottler.js
//
// Defensa perimetral por dirección IP. Es un contenedor de estado en
// memoria (independiente de la base de datos) que cualquier ruta sensible
// puede consultar antes de procesar la solicitud. Implementado como clase
// para poder instanciar throttlers distintos con límites distintos si en
// el futuro se necesita (por ejemplo, uno para /login y otro para /register
// con umbrales diferentes).

class IpThrottler {
    constructor({ maxIntentos = 5, ventanaMs = 15 * 60 * 1000 } = {}) {
        this.maxIntentos = maxIntentos;
        this.ventanaMs = ventanaMs;
        this.registros = new Map(); // ip -> { fallos, inicioVentana, bloqueadaHasta }
    }

    _obtenerOCrear(ip) {
        if (!this.registros.has(ip)) {
            this.registros.set(ip, { fallos: 0, inicioVentana: Date.now(), bloqueadaHasta: 0 });
        }
        return this.registros.get(ip);
    }

    estaBloqueada(ip) {
        const r = this._obtenerOCrear(ip);
        const ahora = Date.now();

        // Ventana expirada -> se reinicia el contador antes de decidir
        if (ahora - r.inicioVentana > this.ventanaMs) {
            r.fallos = 0;
            r.inicioVentana = ahora;
        }

        if (r.bloqueadaHasta > ahora) {
            return { bloqueada: true, segundosRestantes: Math.ceil((r.bloqueadaHasta - ahora) / 1000) };
        }
        return { bloqueada: false };
    }

    registrarFallo(ip) {
        const r = this._obtenerOCrear(ip);
        r.fallos += 1;
        if (r.fallos >= this.maxIntentos) {
            r.bloqueadaHasta = Date.now() + this.ventanaMs;
        }
    }

    limpiar(ip) {
        this.registros.delete(ip);
    }
}

module.exports = IpThrottler;
