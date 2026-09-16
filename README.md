# Laboratorio: Seguridad en Autenticación Web

Universidad El Bosque · Seguridad de la Información · 2026-II

Implementa autenticación con **BCrypt** (hashing + salt automático) sobre **MySQL real**, y
un **middleware de protección contra fuerza bruta** (bloqueo por IP y por cuenta), cumpliendo
la "Nota Arquitectónica Obligatoria" de la guía: toda la lógica de autenticación corre en el
servidor (Node.js/Express), nunca en el navegador.

## Estructura del proyecto (arquitectura por capas)

```
auth-lab/
├── server.js                        # Arranca Express y verifica conexión a MySQL
├── config/database.js               # Pool de conexiones mysql2
├── repositories/usuarioRepository.js  # Toda la SQL de la tabla usuarios vive aquí
├── services/authService.js          # Lógica de negocio: hashing, verificación, bloqueo por cuenta
├── security/ipThrottler.js          # Clase que lleva el conteo de fallos por IP
├── middleware/limitarPorIp.js       # Middleware Express que usa el IpThrottler
├── controllers/authController.js    # Traduce HTTP <-> servicio
├── routes/authRoutes.js             # POST /register y POST /login
├── seed.js                          # Crea usuarios de prueba con hash real de BCrypt
├── demo-bruteforce.js               # Prueba automática: 6 intentos fallidos seguidos
├── public/login.html                # Formulario HTML5 (Sección 1.2 de la guía)
├── sql/schema.sql                   # Script SQL pedido (MySQL) — se ejecuta TAL CUAL
└── CONCLUSIONES.md                  # Documento de conclusiones (entregable)
```

La separación en capas (rutas → controlador → servicio → repositorio → base de datos) es
intencional: mantiene la lógica de negocio (`authService.js`) sin ninguna dependencia de
Express, y toda la SQL centralizada en un solo archivo (`usuarioRepository.js`).

## Requisitos

- Node.js 18+
- Un servidor MySQL o MariaDB accesible (local o remoto)

## Cómo correrlo

1. Crea la base de datos y un usuario para la aplicación:

   ```sql
   CREATE DATABASE auth_lab CHARACTER SET utf8mb4;
   CREATE USER 'auth_lab_user'@'localhost' IDENTIFIED BY 'tu-clave-aqui';
   GRANT ALL PRIVILEGES ON auth_lab.* TO 'auth_lab_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. Ejecuta el script de la guía para crear las tablas:

   ```bash
   mysql -u auth_lab_user -p auth_lab < sql/schema.sql
   ```

3. Copia `.env.example` a `.env` y ajusta las credenciales:

   ```bash
   cp .env.example .env
   ```

4. Instala dependencias, crea los usuarios de prueba y arranca el servidor:

   ```bash
   npm install
   npm run seed
   npm start
   ```

Usuarios de prueba creados por `npm run seed`:

| Usuario      | Contraseña          | Rol            |
|--------------|----------------------|----------------|
| `admin`      | `AdminSeguro#2026`   | Administrador  |
| `estudiante` | `Estudiante123!`     | Usuario        |

Abre `http://localhost:3000/login.html`, o prueba con `curl`:

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"AdminSeguro#2026"}'
```

## Prueba real del bloqueo por fuerza bruta (ejecutada contra MySQL)

```bash
npm run demo:bruteforce
```

**Salida real obtenida corriendo este proyecto contra una base de datos MySQL/MariaDB real:**

```
Atacando http://localhost:3000/login con 6 intentos fallidos consecutivos...

Intento 1: HTTP 401 -> Usuario o contraseña incorrectos.
Intento 2: HTTP 401 -> Usuario o contraseña incorrectos.
Intento 3: HTTP 401 -> Usuario o contraseña incorrectos.
Intento 4: HTTP 401 -> Usuario o contraseña incorrectos.
Intento 5: HTTP 401 -> Usuario o contraseña incorrectos.
Intento 6: HTTP 429 -> Demasiados intentos fallidos desde su dirección IP. Intente de nuevo en 900 segundos.
```

Estado verificado directamente con una consulta SQL sobre la tabla `usuarios` tras el ataque:

```
username | intentos_fallidos | bloqueado_hasta
admin    | 5                 | 2026-09-15 22:21:48
```

Y el hash guardado en la base es un BCrypt real (visible con `SELECT password_hash FROM usuarios`):

```
$2b$10$KoMGRsT/3aVdZiDcCEzioe...
```

## Dos capas de defensa implementadas

1. **Por IP** (`security/ipThrottler.js` + `middleware/limitarPorIp.js`): máximo 5 intentos
   cada 15 minutos desde una misma dirección IP hacia `/login` o `/register`. Responde
   `429 Too Many Requests`.
2. **Por cuenta** (`services/authService.js`, usando las columnas `intentos_fallidos` y
   `bloqueado_hasta` del esquema): si una cuenta específica acumula 5 fallos, se bloquea
   durante 15 minutos aunque el atacante cambie de IP.

## Entregables cubiertos

- [x] Script SQL completo (`sql/schema.sql`), ejecutado tal cual contra MySQL real.
- [x] Backend en Node.js/Express con BCrypt (`services/authService.js`), toda la lógica en el servidor.
- [x] Middleware funcional de protección contra fuerza bruta, con prueba demostrativa real
      contra MySQL (`demo-bruteforce.js`, salida arriba).
- [x] Documento de conclusiones (`CONCLUSIONES.md`).

