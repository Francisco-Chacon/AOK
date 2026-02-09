// backend/src/db/sqlite.js
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Ruta al archivo de la base
const dbPath = path.join(__dirname, "../../data/gestion_local.db");

// Asegurarse de que exista la carpeta /data
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// Abrir / crear la BD
const db = new Database(dbPath);

// Activar claves foráneas
db.pragma("foreign_keys = ON");

// Crear tablas si no existen
db.exec(`
  -- =========================
  -- CLIENTES
  -- =========================
  CREATE TABLE IF NOT EXISTS clientes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre        TEXT NOT NULL,
    direccion     TEXT,
    telefono      TEXT,
    tipo_servicio TEXT NOT NULL,
    estado        TEXT NOT NULL DEFAULT 'activo',
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );

-- =========================
-- RUTAS
-- =========================
CREATE TABLE IF NOT EXISTS rutas (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT NOT NULL,
  dia           TEXT NOT NULL,      -- lunes, martes, ..., domingo
  tipo_servicio TEXT,               -- plomería, electricidad, etc.
  descripcion   TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- =========================
-- VISITAS
-- =========================
CREATE TABLE IF NOT EXISTS visitas (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id       INTEGER NOT NULL,
  fecha            TEXT    NOT NULL,   -- 👈 NUEVO: fecha completa YYYY-MM-DD
  dia_semana       TEXT    NOT NULL,   -- lunes, martes, ...
  direccion        TEXT    NOT NULL,
  hora             TEXT    NOT NULL,
  duracion_minutos INTEGER NOT NULL DEFAULT 60,
  tipo_servicio    TEXT    DEFAULT '',
  created_at       TEXT    NOT NULL,
  updated_at       TEXT    NOT NULL,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

  -- =========================
  -- RECIBOS
  -- =========================
  CREATE TABLE IF NOT EXISTS recibos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id  INTEGER NOT NULL,
    fecha       TEXT NOT NULL,
    monto       REAL NOT NULL DEFAULT 0,
    estado      TEXT NOT NULL DEFAULT 'pendiente',
    descripcion TEXT,
    codigo      TEXT UNIQUE,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
  );

  -- =========================
  -- ESTIMADOS
  -- =========================
  CREATE TABLE IF NOT EXISTS estimados (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id          INTEGER NOT NULL,
    direccion_trabajo   TEXT    NOT NULL,
    fecha               TEXT    NOT NULL,        -- ISO: "2025-11-26"
    monto               REAL    NOT NULL,        -- 35950.00
    moneda              TEXT    NOT NULL DEFAULT 'USD',
    descripcion_trabajo TEXT,                    -- texto largo: pavers, pvc, gas line, etc.
    estado              TEXT    NOT NULL DEFAULT 'borrador', 
    -- 'borrador' | 'enviado' | 'aceptado' | 'rechazado'
    created_at          TEXT    NOT NULL,
    updated_at          TEXT    NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  );
`);

module.exports = db;
