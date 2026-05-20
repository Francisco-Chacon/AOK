// backend/src/controllers/recibos.controller.js
const db = require("../db/sqlite");
const { validateNumber, validateString, validateEnum, validateDate } = require("../utils/validation");
const logger = require("../utils/logger");

// ============================
// Validar ID
// ============================
function validateId(id, res) {
  if (!id || isNaN(Number(id)) || Number(id) <= 0) {
    res.status(400).json({ message: "ID inválido" });
    return null;
  }
  return Number(id);
}

// ============================
// GET /api/recibos
// ============================
function getAllRecibos(req, res) {
  try {
    const stmt = db.prepare(`
      SELECT
        r.id,
        r.cliente_id,
        c.nombre AS cliente_nombre,
        r.fecha,
        r.monto,
        r.estado,
        r.descripcion,     -- 👈 usamos descripcion, NO concepto
        r.codigo,
        r.created_at,
        r.updated_at
      FROM recibos r
      LEFT JOIN clientes c ON c.id = r.cliente_id
      ORDER BY r.fecha DESC, r.id DESC
    `);

    const recibos = stmt.all();
    res.json(recibos);
  } catch (err) {
    logger.error("Error getAllRecibos", { error: err.message });
    res.status(500).json({ message: "Error al obtener recibos" });
  }
}

// ============================
// POST /api/recibos
// ============================
function createRecibo(req, res) {
  try {
    logger.debug("createRecibo requested", { cliente_id, monto });

    const {
      cliente_id,
      fecha,
      monto,
      estado,
      descripcion,
    } = req.body;

    let validClienteId, validMonto;
    try {
      validClienteId = validateNumber(cliente_id, "cliente_id", false);
      validateDate(fecha, "fecha", true);
      validMonto = validateNumber(monto, "monto", false);
      if (estado) validateEnum(estado, "estado", ["pendiente", "pagado", "cancelado"], false);
      validateString(descripcion, "descripcion", 1000, false);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const clienteExists = db.prepare("SELECT id FROM clientes WHERE id = ?").get(validClienteId);
    if (!clienteExists) {
      return res.status(400).json({ message: "El cliente no existe" });
    }

    const now = new Date().toISOString();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const codigoGenerado = `REC-${timestamp}-${random}`;

    const stmt = db.prepare(`
      INSERT INTO recibos (cliente_id, fecha, monto, estado, descripcion, codigo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      validClienteId,
      fecha,
      validMonto,
      estado || "pendiente",
      descripcion || "",
      codigoGenerado,
      now,
      now
    );

    const recibo = db
      .prepare(`
        SELECT
          r.id,
          r.cliente_id,
          c.nombre AS cliente_nombre,
          r.fecha,
          r.monto,
          r.estado,
          r.descripcion,
          r.codigo,
          r.created_at,
          r.updated_at
        FROM recibos r
        LEFT JOIN clientes c ON c.id = r.cliente_id
        WHERE r.id = ?
      `)
      .get(result.lastInsertRowid);

    res.status(201).json(recibo);
  } catch (err) {
    logger.error("Error createRecibo", { error: err.message });
    res.status(500).json({ message: "Error al crear recibo" });
  }
}

// ============================
// PUT /api/recibos/:id
// ============================
function updateRecibo(req, res) {
  try {
    const { id } = req.params;
    const validId = validateId(id, res);
    if (!validId) return;

    const {
      cliente_id,
      fecha,
      monto,
      estado,
      descripcion,
    } = req.body;

    let validClienteId, validMonto;
    try {
      validClienteId = validateNumber(cliente_id, "cliente_id", false);
      validateDate(fecha, "fecha", true);
      validMonto = validateNumber(monto, "monto", false);
      if (estado) validateEnum(estado, "estado", ["pendiente", "pagado", "cancelado"], false);
      validateString(descripcion, "descripcion", 1000, false);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE recibos
      SET
        cliente_id  = ?,
        fecha       = ?,
        monto       = ?,
        estado      = ?,
        descripcion = ?,
        updated_at  = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      validClienteId,
      fecha,
      validMonto,
      estado || "pendiente",
      descripcion || "",
      now,
      validId
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: "Recibo no encontrado" });
    }

    const recibo = db
      .prepare(`
        SELECT
          r.id,
          r.cliente_id,
          c.nombre AS cliente_nombre,
          r.fecha,
          r.monto,
          r.estado,
          r.descripcion,
          r.codigo,
          r.created_at,
          r.updated_at
        FROM recibos r
        LEFT JOIN clientes c ON c.id = r.cliente_id
        WHERE r.id = ?
      `)
      .get(validId);

    res.json(recibo);
  } catch (err) {
    logger.error("Error updateRecibo", { error: err.message });
    res.status(500).json({ message: "Error al actualizar recibo" });
  }
}

// ============================
// DELETE /api/recibos/:id
// ============================
function deleteRecibo(req, res) {
  try {
    const { id } = req.params;
    const validId = validateId(id, res);
    if (!validId) return;

    const stmt = db.prepare("DELETE FROM recibos WHERE id = ?");
    const result = stmt.run(validId);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Recibo no encontrado" });
    }

    res.status(204).send();
  } catch (err) {
    logger.error("Error deleteRecibo", { error: err.message });
    res.status(500).json({ message: "Error al eliminar recibo" });
  }
}

module.exports = {
  getAllRecibos,
  createRecibo,
  updateRecibo,
  deleteRecibo,
};
