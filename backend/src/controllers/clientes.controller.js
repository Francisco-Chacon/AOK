// backend/src/controllers/clientes.controller.js
const db = require("../db/sqlite");
const { validateString, validateEnum } = require("../utils/validation");
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
        email,
        tipo_servicio AS servicio,
        estado,
        created_at,
        updated_at
      FROM clientes
      ORDER BY created_at DESC
    `);

    const clientes = stmt.all();
    res.json(clientes);
  } catch (err) {
    logger.error("Error getAllClientes", { error: err.message });
    res.status(500).json({ message: "Error al obtener clientes" });
  }
}

// ============================
// POST /api/clientes
// ============================
function createCliente(req, res) {
  try {
    logger.info("createCliente requested", { cliente_nombre: nombre });

    const {
      nombre,
      direccion,
      telefono,
      email,
      servicio,
      servicio_principal,
      tipo_servicio: bodyTipoServicio,
      estado,
    } = req.body;

    let tipoServicioFinal;
    try {
      validateString(nombre, "nombre", 200, true);
      tipoServicioFinal =
        validateString(servicio ?? servicio_principal ?? bodyTipoServicio, "servicio", 100, true);
      validateEnum(estado, "estado", ["activo", "pendiente", "inactivo"], true);
      validateString(direccion, "direccion", 300, false);
      validateString(telefono, "telefono", 20, false);
      validateString(email, "email", 150, false);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO clientes (nombre, direccion, telefono, email, tipo_servicio, estado, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      nombre,
      direccion ?? "",
      telefono ?? "",
      email ?? "",
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
    logger.error("Error createCliente", { error: err.message });
    res.status(500).json({ message: "Error al crear cliente" });
  }
}

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
// PUT /api/clientes/:id
// ============================
function updateCliente(req, res) {
  try {
    const { id } = req.params;
    const validId = validateId(id, res);
    if (!validId) return;

    const {
      nombre,
      direccion,
      telefono,
      email,
      servicio,
      servicio_principal,
      tipo_servicio: bodyTipoServicio,
      estado,
    } = req.body;

    let tipoServicioFinal;
    try {
      validateString(nombre, "nombre", 200, true);
      tipoServicioFinal =
        validateString(servicio ?? servicio_principal ?? bodyTipoServicio, "servicio", 100, true);
      validateEnum(estado, "estado", ["activo", "pendiente", "inactivo"], true);
      validateString(direccion, "direccion", 300, false);
      validateString(telefono, "telefono", 20, false);
      validateString(email, "email", 150, false);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE clientes
      SET
        nombre        = ?,
        direccion     = ?,
        telefono      = ?,
        email         = ?,
        tipo_servicio = ?,
        estado        = ?,
        updated_at    = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      nombre,
      direccion ?? "",
      telefono ?? "",
      email ?? "",
      tipoServicioFinal,
      estado,
      now,
      validId
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
      .get(validId);

    res.json(cliente);
  } catch (err) {
    logger.error("Error updateCliente", { error: err.message });
    res.status(500).json({ message: "Error al actualizar cliente" });
  }
}

// ============================
// DELETE /api/clientes/:id
// ============================
function deleteCliente(req, res) {
  try {
    const { id } = req.params;
    const validId = validateId(id, res);
    if (!validId) return;

    const stmt = db.prepare("DELETE FROM clientes WHERE id = ?");
    const result = stmt.run(validId);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    res.status(204).send();
  } catch (err) {
    logger.error("Error deleteCliente", { error: err.message });
    res.status(500).json({ message: "Error al eliminar cliente" });
  }
}

// ============================
// GET /api/clientes/:id/recibos-count
// ============================
function getRecibosCount(req, res) {
  try {
    const { id } = req.params;
    const validId = validateId(id, res);
    if (!validId) return;

    const stmt = db.prepare("SELECT COUNT(*) as count FROM recibos WHERE cliente_id = ?");
    const result = stmt.get(validId);

    res.json({ count: result.count });
  } catch (err) {
    logger.error("Error getRecibosCount", { error: err.message });
    res.status(500).json({ message: "Error al verificar recibos" });
  }
}

module.exports = {
  getAllClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  getRecibosCount,
};
