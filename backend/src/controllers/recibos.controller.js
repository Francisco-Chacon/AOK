// backend/src/controllers/recibos.controller.js
const db = require("../db/sqlite");

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
    console.error("Error getAllRecibos", err);
    res.status(500).json({ message: "Error al obtener recibos" });
  }
}

// ============================
// POST /api/recibos
// ============================
function createRecibo(req, res) {
  try {
    console.log("Body recibido en createRecibo:", req.body);

    const {
      cliente_id,
      fecha,
      monto,
      estado,        // pendiente | pagado | cancelado
      descripcion,   // 👈 texto libre del recibo
    } = req.body;

    if (!cliente_id || !fecha || monto == null) {
      return res.status(400).json({
        message: "Faltan campos obligatorios (cliente_id, fecha, monto)",
      });
    }

    const now = new Date().toISOString();
    const codigoGenerado =
      "REC-" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const stmt = db.prepare(`
      INSERT INTO recibos (cliente_id, fecha, monto, estado, descripcion, codigo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      cliente_id,
      fecha,
      Number(monto) || 0,
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
    console.error("Error createRecibo", err);
    res.status(500).json({ message: "Error al crear recibo" });
  }
}

// ============================
// PUT /api/recibos/:id
// ============================
function updateRecibo(req, res) {
  try {
    const { id } = req.params;
    const {
      cliente_id,
      fecha,
      monto,
      estado,
      descripcion,
    } = req.body;

    if (!cliente_id || !fecha || monto == null) {
      return res.status(400).json({
        message: "Faltan campos obligatorios (cliente_id, fecha, monto)",
      });
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
      cliente_id,
      fecha,
      Number(monto) || 0,
      estado || "pendiente",
      descripcion || "",
      now,
      id
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
      .get(id);

    res.json(recibo);
  } catch (err) {
    console.error("Error updateRecibo", err);
    res.status(500).json({ message: "Error al actualizar recibo" });
  }
}

// ============================
// DELETE /api/recibos/:id
// ============================
function deleteRecibo(req, res) {
  try {
    const { id } = req.params;

    const stmt = db.prepare("DELETE FROM recibos WHERE id = ?");
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Recibo no encontrado" });
    }

    res.status(204).send();
  } catch (err) {
    console.error("Error deleteRecibo", err);
    res.status(500).json({ message: "Error al eliminar recibo" });
  }
}

module.exports = {
  getAllRecibos,
  createRecibo,
  updateRecibo,
  deleteRecibo,
};
