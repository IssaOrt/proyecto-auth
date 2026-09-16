# Documento de Conclusiones
## ¿Por qué las validaciones de seguridad no deben realizarse en el navegador (cliente HTML/JS)?

**Seguridad de la Información — Universidad El Bosque — 2026-II**

---

### 1. El cliente está bajo control total del atacante

Cualquier código que se ejecuta en el navegador (HTML, CSS, JavaScript) corre dentro de una
máquina que el usuario controla por completo. Un atacante puede:

- Abrir las herramientas de desarrollo (F12) y **leer, modificar o eliminar** cualquier
  validación de JavaScript antes de que se ejecute.
- **Deshabilitar JavaScript** por completo y seguir enviando el formulario.
- **Ignorar el navegador entero** y enviar la petición HTTP directamente con `curl`, Postman,
  o un script propio, exactamente como se hizo en `demo-bruteforce.js` de este laboratorio.

En la práctica, esto significa que si la lógica de "la contraseña debe tener mínimo 8
caracteres" o "máximo 5 intentos fallidos" viviera solo en JavaScript del navegador, un
atacante la saltaría con un solo clic derecho o con una petición POST directa al endpoint.
El servidor **nunca puede confiar en nada que llegue del cliente** sin volver a validarlo.

### 2. El hashing de contraseñas requiere secretos que el cliente no puede guardar

BCrypt necesita generar un *salt* aleatorio y aplicar el algoritmo `EksBlowfishSetup` con un
factor de costo determinado. Si esto se hiciera en el navegador:

- El **factor de costo y el algoritmo quedarían expuestos** y serían editables por el atacante
  (por ejemplo, bajándolo a 1 ronda para acelerar un ataque de diccionario).
- El **hash viajaría por la red en vez de la contraseña**, pero seguiría siendo un secreto
  reutilizable: si un atacante intercepta o roba ese hash, podría enviarlo directamente al
  servidor sin necesitar la contraseña real ("pass-the-hash").
- No habría forma de garantizar que **todos** los clientes usan la misma implementación,
  versión de librería o factor de costo — la base de datos terminaría con hashes
  inconsistentes.

Por eso `bcrypt.hash()` y `bcrypt.compare()` (o `password_hash()`/`password_verify()` en PHP)
se ejecutan exclusivamente en `routes/auth.js`, del lado del servidor.

### 3. El control de intentos fallidos es un dato de estado que debe ser confiable

El middleware `bruteForceProtection.js` y las columnas `intentos_fallidos` /
`bloqueado_hasta` de la tabla `usuarios` son la fuente de verdad sobre cuántas veces ha
fallado un inicio de sesión. Si este conteo se llevara en el navegador (por ejemplo, en una
variable de JavaScript o en `localStorage`):

- El atacante podría **reiniciarlo a cero** simplemente recargando la página, abriendo una
  pestaña de incógnito, borrando el almacenamiento local, o modificando la variable desde la
  consola.
- Un script automatizado (fuera del navegador) **nunca ejecutaría ese JavaScript**, por lo que
  el contador jamás se incrementaría.

En este laboratorio se demostró justamente lo contrario: usando `demo-bruteforce.js` —que no
usa navegador en absoluto, solo peticiones HTTP crudas— el servidor bloqueó la IP en el sexto
intento y la cuenta en el quinto, porque el conteo vive en el servidor (en memoria para la IP,
y en la base de datos para la cuenta), fuera del alcance del atacante.

### 4. Principio general: "Nunca confíes en el cliente" (*Never trust the client*)

El navegador es una herramienta para **mejorar la experiencia del usuario** (validar que un
campo no esté vacío antes de gastar una petición de red, dar retroalimentación inmediata,
etc.), pero nunca es una herramienta de **control de seguridad**. Toda regla que decida
"esto está permitido" o "esto está bloqueado" debe evaluarse en un entorno que el atacante no
pueda leer ni modificar: el servidor.

En resumen: las validaciones del lado del cliente son una **cortesía para el usuario
legítimo**; las validaciones del lado del servidor son la **única defensa real** contra un
atacante.
