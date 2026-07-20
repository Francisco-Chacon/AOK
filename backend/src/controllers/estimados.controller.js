const db = require("../db/sqlite");
const { validateNumber, validateString, validateDate, validateEnum } = require("../utils/validation");
const logger = require("../utils/logger");

const TEXT_MAX_LENGTH = 10000;

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

// GET /api/estimados
function getAllEstimados(req, res) {
  try {
    const stmt = db.prepare(`
      SELECT
        e.id,
        e.cliente_id,
        c.nombre AS cliente_nombre,
        c.telefono AS cliente_telefono,
        c.email AS cliente_email,
        e.direccion_trabajo,
        e.fecha,
        e.monto,
        e.moneda,
        e.tasa_impuesto,
        e.descripcion_trabajo,
        e.notas_adicionales,
        e.estado,
        e.created_at,
        e.updated_at
      FROM estimados e
      LEFT JOIN clientes c ON c.id = e.cliente_id
      ORDER BY e.created_at DESC, e.id DESC
    `);

    const rows = stmt.all();
    res.json(rows);
  } catch (err) {
    logger.error("Error getAllEstimados", { error: err.message });
    res.status(500).json({ message: "Error al obtener estimados" });
  }
}

// POST /api/estimados
function createEstimado(req, res) {
  try {
    const {
      cliente_id,
      direccion_trabajo,
      fecha,
      monto,
      moneda,
      tasa_impuesto,
      descripcion_trabajo,
      notas_adicionales,
      estado,
    } = req.body;

    let validClienteId, validMonto;
    try {
      validClienteId = validateNumber(cliente_id, "cliente_id", false);
      validateString(direccion_trabajo, "direccion_trabajo", 300, true);
      validateDate(fecha, "fecha", true);
      validMonto = validateNumber(monto, "monto", false);
      if (moneda) validateEnum(moneda, "moneda", ["USD", "EUR", "MXN", "PAB", "COP"], false);
      if (estado) validateEnum(estado, "estado", ["borrador", "enviado", "aceptado", "rechazado"], false);
      validateString(descripcion_trabajo, "descripcion_trabajo", TEXT_MAX_LENGTH, false);
      validateString(notas_adicionales, "notas_adicionales", TEXT_MAX_LENGTH, false);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const clienteExists = db.prepare("SELECT id FROM clientes WHERE id = ?").get(validClienteId);
    if (!clienteExists) {
      return res.status(400).json({ message: "El cliente no existe" });
    }

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO estimados (
        cliente_id,
        direccion_trabajo,
        fecha,
        monto,
        moneda,
        tasa_impuesto,
        descripcion_trabajo,
        notas_adicionales,
        estado,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      validClienteId,
      direccion_trabajo,
      fecha,
      validMonto,
      moneda || "USD",
      Number(tasa_impuesto) || 0.07,
      descripcion_trabajo || "",
      notas_adicionales || "",
      estado || "borrador",
      now,
      now
    );

    const estimado = db
      .prepare(`
        SELECT
          e.id,
          e.cliente_id,
          c.nombre AS cliente_nombre,
          c.telefono AS cliente_telefono,
          c.email AS cliente_email,
          e.direccion_trabajo,
          e.fecha,
          e.monto,
          e.moneda,
          e.tasa_impuesto,
          e.descripcion_trabajo,
          e.notas_adicionales,
          e.estado,
          e.created_at,
          e.updated_at
        FROM estimados e
        LEFT JOIN clientes c ON c.id = e.cliente_id
        WHERE e.id = ?
      `)
      .get(result.lastInsertRowid);

    res.status(201).json(estimado);
} catch (err) {
    logger.error("Error createEstimado", { error: err.message });
    res.status(500).json({ message: "Error al crear estimado" });
  }
}

// PUT /api/estimados/:id
function updateEstimado(req, res) {
  try {
    const { id } = req.params;
    const validId = validateId(id, res);
    if (!validId) return;

    const {
      cliente_id,
      direccion_trabajo,
      fecha,
      monto,
      moneda,
      tasa_impuesto,
      descripcion_trabajo,
      notas_adicionales,
      estado,
    } = req.body;

    let validClienteId, validMonto;
    try {
      validClienteId = validateNumber(cliente_id, "cliente_id", false);
      validateString(direccion_trabajo, "direccion_trabajo", 300, true);
      validateDate(fecha, "fecha", true);
      validMonto = validateNumber(monto, "monto", false);
      if (moneda) validateEnum(moneda, "moneda", ["USD", "EUR", "MXN", "PAB", "COP"], false);
      if (estado) validateEnum(estado, "estado", ["borrador", "enviado", "aceptado", "rechazado"], false);
      validateString(descripcion_trabajo, "descripcion_trabajo", TEXT_MAX_LENGTH, false);
      validateString(notas_adicionales, "notas_adicionales", TEXT_MAX_LENGTH, false);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE estimados
      SET
        cliente_id         = ?,
        direccion_trabajo  = ?,
        fecha              = ?,
        monto              = ?,
        moneda             = ?,
        tasa_impuesto      = ?,
        descripcion_trabajo= ?,
        notas_adicionales = ?,
        estado             = ?,
        updated_at         = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      validClienteId,
      direccion_trabajo,
      fecha,
      validMonto,
      moneda || "USD",
      Number(tasa_impuesto) || 0.07,
      descripcion_trabajo || "",
      notas_adicionales || "",
      estado || "borrador",
      now,
      validId
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: "Estimado no encontrado" });
    }

    const estimado = db
      .prepare(`
        SELECT
          e.id,
          e.cliente_id,
          c.nombre AS cliente_nombre,
          c.telefono AS cliente_telefono,
          c.email AS cliente_email,
          e.direccion_trabajo,
          e.fecha,
          e.monto,
          e.moneda,
          e.tasa_impuesto,
          e.descripcion_trabajo,
          e.notas_adicionales,
          e.estado,
          e.created_at,
          e.updated_at
        FROM estimados e
        LEFT JOIN clientes c ON c.id = e.cliente_id
        WHERE e.id = ?
      `)
      .get(validId);

    res.json(estimado);
  } catch (err) {
    logger.error("Error updateEstimado", { error: err.message });
    res.status(500).json({ message: "Error al actualizar estimado" });
  }
}

// DELETE /api/estimados/:id
function deleteEstimado(req, res) {
  try {
    const { id } = req.params;
    const validId = validateId(id, res);
    if (!validId) return;

    const stmt = db.prepare("DELETE FROM estimados WHERE id = ?");
    const result = stmt.run(validId);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Estimado no encontrado" });
    }

    res.status(204).send();
  } catch (err) {
    logger.error("Error deleteEstimado", { error: err.message });
    res.status(500).json({ message: "Error al eliminar estimado" });
  }
}

module.exports = {
  getAllEstimados,
  createEstimado,
  updateEstimado,
  deleteEstimado,
};
