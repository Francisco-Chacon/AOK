// backend/src/controllers/clientes.controller.js
const db = require("../db/sqlite");

// ============================
// GET /api/clientes
// ============================
function getAllClientes(req, res) {
  try {
    const stmt = db.prepare(`
      SELECT
        id,
        nombre,
        direccion,
        telefono,
        tipo_servicio AS servicio,  -- alias para el frontend
        estado,
        created_at,
        updated_at
      FROM clientes
      ORDER BY created_at DESC
    `);

    const clientes = stmt.all();
    res.json(clientes);
  } catch (err) {
    console.error("Error getAllClientes", err);
    res.status(500).json({ message: "Error al obtener clientes" });
  }
}

// ============================
// POST /api/clientes
// ============================
function createCliente(req, res) {
  try {
    console.log("Body recibido en createCliente:", req.body);

    const {
      nombre,
      direccion,
      telefono,
      servicio,
      servicio_principal,
      tipo_servicio: bodyTipoServicio,
      estado, // activo | pendiente | inactivo
    } = req.body;

    // Resolver el servicio venga como venga
    const tipoServicioFinal =
      servicio ?? servicio_principal ?? bodyTipoServicio ?? null;

    if (!nombre || !tipoServicioFinal || !estado) {
      return res.status(400).json({
        message:
          "Faltan campos obligatorios (nombre, servicio, estado)",
      });
    }

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO clientes (nombre, direccion, telefono, tipo_servicio, estado, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      nombre,
      direccion ?? "",
      telefono ?? "",
      tipoServicioFinal,
      estado,
      now,
      now
    );

    const cliente = db
      .prepare(`
        SELECT
          id,
          nombre,
          direccion,
          telefono,
          tipo_servicio AS servicio,
          estado,
          created_at,
          updated_at
        FROM clientes
        WHERE id = ?
      `)
      .get(result.lastInsertRowid);

    res.status(201).json(cliente);
  } catch (err) {
    console.error("Error createCliente", err);
    res.status(500).json({ message: "Error al crear cliente" });
  }
}

// ============================
// PUT /api/clientes/:id
// ============================
function updateCliente(req, res) {
  try {
    const { id } = req.params;

    const {
      nombre,
      direccion,
      telefono,
      servicio,
      servicio_principal,
      tipo_servicio: bodyTipoServicio,
      estado,
    } = req.body;

    const tipoServicioFinal =
      servicio ?? servicio_principal ?? bodyTipoServicio ?? null;

    if (!nombre || !tipoServicioFinal || !estado) {
      return res.status(400).json({
        message:
          "Faltan campos obligatorios (nombre, servicio, estado)",
      });
    }

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE clientes
      SET
        nombre        = ?,
        direccion     = ?,
        telefono      = ?,
        tipo_servicio = ?,
        estado        = ?,
        updated_at    = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      nombre,
      direccion ?? "",
      telefono ?? "",
      tipoServicioFinal,
      estado,
      now,
      id
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    const cliente = db
      .prepare(`
        SELECT
          id,
          nombre,
          direccion,
          telefono,
          tipo_servicio AS servicio,
          estado,
          created_at,
          updated_at
        FROM clientes
        WHERE id = ?
      `)
      .get(id);

    res.json(cliente);
  } catch (err) {
    console.error("Error updateCliente", err);
    res.status(500).json({ message: "Error al actualizar cliente" });
  }
}

// ============================
// DELETE /api/clientes/:id
// ============================
function deleteCliente(req, res) {
  try {
    const { id } = req.params;

    const stmt = db.prepare("DELETE FROM clientes WHERE id = ?");
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.status(204).send();
  } catch (err) {
    console.error("Error deleteCliente", err);
    res.status(500).json({ message: "Error al eliminar cliente" });
  }
}

module.exports = {
  getAllClientes,
  createCliente,
  updateCliente,
  deleteCliente,
};
