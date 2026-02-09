const db = require("../db/sqlite");

// GET /api/estimados
function getAllEstimados(req, res) {
  try {
    const stmt = db.prepare(`
      SELECT
        e.id,
        e.cliente_id,
        c.nombre AS cliente_nombre,
        e.direccion_trabajo,
        e.fecha,
        e.monto,
        e.moneda,
        e.descripcion_trabajo,
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
    console.error("Error getAllEstimados", err);
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
      descripcion_trabajo,
      estado,
    } = req.body;

    if (!cliente_id || !direccion_trabajo || !fecha || !monto) {
      return res
        .status(400)
        .json({ message: "Faltan campos obligatorios." });
    }

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO estimados (
        cliente_id,
        direccion_trabajo,
        fecha,
        monto,
        moneda,
        descripcion_trabajo,
        estado,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      cliente_id,
      direccion_trabajo,
      fecha,
      Number(monto),
      moneda || "USD",
      descripcion_trabajo || "",
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
          e.direccion_trabajo,
          e.fecha,
          e.monto,
          e.moneda,
          e.descripcion_trabajo,
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
    console.error("Error createEstimado", err);
    res.status(500).json({ message: "Error al crear estimado" });
  }
}

// PUT /api/estimados/:id
function updateEstimado(req, res) {
  try {
    const { id } = req.params;
    const {
      cliente_id,
      direccion_trabajo,
      fecha,
      monto,
      moneda,
      descripcion_trabajo,
      estado,
    } = req.body;

    if (!cliente_id || !direccion_trabajo || !fecha || !monto) {
      return res
        .status(400)
        .json({ message: "Faltan campos obligatorios." });
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
        descripcion_trabajo= ?,
        estado             = ?,
        updated_at         = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      cliente_id,
      direccion_trabajo,
      fecha,
      Number(monto),
      moneda || "USD",
      descripcion_trabajo || "",
      estado || "borrador",
      now,
      id
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
          e.direccion_trabajo,
          e.fecha,
          e.monto,
          e.moneda,
          e.descripcion_trabajo,
          e.estado,
          e.created_at,
          e.updated_at
        FROM estimados e
        LEFT JOIN clientes c ON c.id = e.cliente_id
        WHERE e.id = ?
      `)
      .get(id);

    res.json(estimado);
  } catch (err) {
    console.error("Error updateEstimado", err);
    res.status(500).json({ message: "Error al actualizar estimado" });
  }
}

// DELETE /api/estimados/:id
function deleteEstimado(req, res) {
  try {
    const { id } = req.params;
    const stmt = db.prepare("DELETE FROM estimados WHERE id = ?");
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Estimado no encontrado" });
    }

    res.status(204).send();
  } catch (err) {
    console.error("Error deleteEstimado", err);
    res.status(500).json({ message: "Error al eliminar estimado" });
  }
}

module.exports = {
  getAllEstimados,
  createEstimado,
  updateEstimado,
  deleteEstimado,
};
