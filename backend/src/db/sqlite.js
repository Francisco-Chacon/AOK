// backend/src/db/sqlite.js
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = process.env.TEST_DB_PATH || path.join(__dirname, "../../data/gestion_local.db");

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS clientes (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre        TEXT NOT NULL,
    direccion     TEXT,
    telefono      TEXT,
    email         TEXT,
    tipo_servicio TEXT NOT NULL,
    estado        TEXT NOT NULL DEFAULT 'activo',
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rutas (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre        TEXT NOT NULL,
    dia           TEXT NOT NULL,
    tipo_servicio TEXT,
    descripcion   TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS visitas (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id       INTEGER NOT NULL,
    fecha            TEXT    NOT NULL,
    dia_semana       TEXT    NOT NULL,
    direccion        TEXT    NOT NULL,
    hora             TEXT    NOT NULL,
    duracion_minutos INTEGER NOT NULL DEFAULT 60,
    tipo_servicio    TEXT    DEFAULT '',
    created_at       TEXT    NOT NULL,
    updated_at       TEXT    NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  );

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

  CREATE TABLE IF NOT EXISTS estimados (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id          INTEGER NOT NULL,
    direccion_trabajo   TEXT    NOT NULL,
    fecha               TEXT    NOT NULL,
    monto               REAL    NOT NULL,
    moneda              TEXT    NOT NULL DEFAULT 'USD',
    descripcion_trabajo TEXT,
    notas_adicionales   TEXT,
    estado              TEXT    NOT NULL DEFAULT 'borrador',
    created_at          TEXT    NOT NULL,
    updated_at          TEXT    NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  );

  CREATE TABLE IF NOT EXISTS facturas (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id  INTEGER NOT NULL,
    fecha       TEXT NOT NULL,
    estado      TEXT NOT NULL DEFAULT 'pendiente',
    nota        TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  );

  CREATE TABLE IF NOT EXISTS facturas_items (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    factura_id  INTEGER NOT NULL,
    fecha       TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    cantidad    INTEGER NOT NULL DEFAULT 1,
    precio      REAL NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS rutas_hojas (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha        TEXT NOT NULL,
    conductor    TEXT,
    camion       TEXT,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rutas_hojas_clientes (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    hoja_id            INTEGER NOT NULL,
    cliente_id         INTEGER,
    cliente_nombre     TEXT,
    cliente_direccion  TEXT,
    hora_entrada       TEXT,
    hora_salida        TEXT,
    descripcion        TEXT,
    created_at         TEXT NOT NULL,
    updated_at         TEXT NOT NULL,
    FOREIGN KEY (hoja_id) REFERENCES rutas_hojas(id) ON DELETE CASCADE
  );
`);

const alterTableIfNeeded = (table, column, definition) => {
  try {
    const result = db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = result.some((col) => col.name === column);
    if (!exists) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  } catch (e) {
    // ignore
  }
};

alterTableIfNeeded("clientes", "email", "TEXT");

module.exports = db;