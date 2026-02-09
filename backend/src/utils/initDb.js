// src/utils/initDb.js
const db = require("../db/sqlite");

db.exec(`
  -- ====== TABLA CLIENTES ======
  CREATE TABLE IF NOT EXISTS clientes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre       TEXT    NOT NULL,
    direccion    TEXT    NOT NULL,
    telefono     TEXT    NOT NULL,
    tipo_servicio TEXT   NOT NULL,
    estado       TEXT    NOT NULL DEFAULT 'activo',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  -- ====== TABLA RECIBOS ======
  CREATE TABLE IF NOT EXISTS recibos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id   INTEGER NOT NULL,
    monto        REAL    NOT NULL,
    concepto     TEXT    NOT NULL,
    fecha        TEXT    NOT NULL,
    estado       TEXT    NOT NULL DEFAULT 'pendiente',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
  );

  -- ====== TABLA VISITAS ======
  CREATE TABLE IF NOT EXISTS visitas (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id   INTEGER NOT NULL,
    dia          TEXT    NOT NULL,      -- lunes, martes, etc.
    hora         TEXT    NOT NULL,      -- "08:00"
    direccion    TEXT    NOT NULL,
    tipo_servicio TEXT   NOT NULL,
    duracion_min INTEGER NOT NULL,
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
  );
`);

console.log("✅ Base de datos inicializada");
process.exit(0);
