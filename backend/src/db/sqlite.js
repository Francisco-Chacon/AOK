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

  CREATE TABLE IF NOT EXISTS estimados (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id          INTEGER NOT NULL,
    direccion_trabajo   TEXT    NOT NULL,
    fecha               TEXT    NOT NULL,
    monto               REAL    NOT NULL,
    moneda              TEXT    NOT NULL DEFAULT 'USD',
    tasa_impuesto       REAL    NOT NULL DEFAULT 0.07,
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
    numero      TEXT,
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

// Índices para performance con conjuntos grandes de datos
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
  CREATE INDEX IF NOT EXISTS idx_clientes_estado ON clientes(estado);
  CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);

  CREATE INDEX IF NOT EXISTS idx_estimados_cliente_id ON estimados(cliente_id);
  CREATE INDEX IF NOT EXISTS idx_estimados_fecha ON estimados(fecha);
  CREATE INDEX IF NOT EXISTS idx_estimados_estado ON estimados(estado);

  CREATE INDEX IF NOT EXISTS idx_facturas_cliente_id ON facturas(cliente_id);
  CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON facturas(fecha);
  CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);
  CREATE INDEX IF NOT EXISTS idx_facturas_numero ON facturas(numero);
  CREATE INDEX IF NOT EXISTS idx_facturas_items_factura_id ON facturas_items(factura_id);

  CREATE INDEX IF NOT EXISTS idx_rutas_hojas_fecha ON rutas_hojas(fecha);
  CREATE INDEX IF NOT EXISTS idx_rutas_hojas_clientes_hoja_id ON rutas_hojas_clientes(hoja_id);
  CREATE INDEX IF NOT EXISTS idx_rutas_hojas_clientes_cliente_id ON rutas_hojas_clientes(cliente_id);
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
alterTableIfNeeded("facturas", "numero", "TEXT");
alterTableIfNeeded("estimados", "tasa_impuesto", "REAL NOT NULL DEFAULT 0.07");

db.exec(`
  CREATE TABLE IF NOT EXISTS contracts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id  INTEGER NOT NULL,
    fecha_inicio TEXT NOT NULL,
    fecha_fin   TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    monto       REAL NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  );
`);

alterTableIfNeeded("contracts", "monto", "REAL NOT NULL DEFAULT 0");

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_contracts_cliente_id ON contracts(cliente_id);
  CREATE INDEX IF NOT EXISTS idx_contracts_fecha_inicio ON contracts(fecha_inicio);

  CREATE TABLE IF NOT EXISTS config (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
`);

module.exports = db;