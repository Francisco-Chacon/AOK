// src/utils/initDb.js
const db = require("../db/sqlite");

db.exec(`
  -- ====== TABLA CLIENTES ======
  CREATE TABLE IF NOT EXISTS clientes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre       TEXT    NOT NULL,
    direccion    TEXT    NOT NULL,
    telefono     TEXT    NOT NULL,
    email        TEXT    NOT NULL,
    tipo_servicio TEXT   NOT NULL,
    estado       TEXT    NOT NULL DEFAULT 'activo',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
  );


`);

console.log("✅ Base de datos inicializada");
process.exit(0);
