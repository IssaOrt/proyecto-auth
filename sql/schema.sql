-- =============================================================
-- Seguridad de la Información - Universidad El Bosque - 2026-II
-- Guía: Seguridad en Autenticación Web
-- Script SQL: creación de tablas e inserción de datos iniciales
-- Motor objetivo: MySQL / MariaDB
-- =============================================================

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol_id INT NOT NULL,
    intentos_fallidos INT DEFAULT 0,
    bloqueado_hasta DATETIME NULL,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- Roles base del sistema (control de acceso por roles - RBAC)
INSERT INTO roles (nombre) VALUES ('Administrador'), ('Usuario');

-- NOTA IMPORTANTE:
-- No se insertan usuarios de prueba directamente aquí con INSERT INTO,
-- porque password_hash debe ser generado por BCrypt (un hash real, con
-- salt aleatorio, calculado por el backend) y no puede escribirse a mano
-- en un script SQL. Los usuarios de prueba se crean ejecutando:
--
--      npm run seed
--
-- (ver seed.js), que llama a bcrypt.hash() y luego sí hace el INSERT
-- con el hash verdadero. Esto es intencional: es exactamente el motivo
-- por el que un atacante no puede "adivinar" ni fabricar un hash válido
-- sin pasar por el algoritmo.
