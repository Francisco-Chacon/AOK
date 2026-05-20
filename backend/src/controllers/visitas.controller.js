// backend/src/controllers/visitas.controller.js
const db = require("../db/sqlite");
const { validateNumber, validateString, validateDate } = require("../utils/validation");
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

// Utilidad para calcular el día de la semana en texto
function diaSemanaDesdeFecha(fechaStr) {
  if (!fechaStr) return null;
  const d = new Date(fechaStr); // asume "YYYY-MM-DD" o ISO
  if (Number.isNaN(d.getTime())) return null;

  const idx = d.getDay(); // 0 = domingo ... 6 = sábado
  switch (idx) {
    case 0: return "domingo";
    case 1: return "lunes";
    case 2: return "martes";
    case 3: return "miercoles"; // sin tilde, para que matchee con tu constante DIAS
    case 4: return "jueves";
    case 5: return "viernes";
    case 6: return "sabado";
    default: return null;
  }
}

// ============================
// GET /api/visitas
// ============================
function getAllVisitas(req, res) {
  try {
    const stmt = db.prepare(`
      SELECT
        v.id,
        v.cliente_id,
        c.nombre AS cliente_nombre,
        v.fecha,
        v.dia_semana,
        v.direccion,
        v.hora,
        v.duracion_minutos,
        v.tipo_servicio,
        v.created_at,
        v.updated_at
      FROM visitas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
      ORDER BY
        CASE LOWER(v.dia_semana)
          WHEN 'lunes'     THEN 1
          WHEN 'martes'    THEN 2
          WHEN 'miercoles' THEN 3
          WHEN 'miércoles' THEN 3
          WHEN 'jueves'    THEN 4
          WHEN 'viernes'   THEN 5
          WHEN 'sabado'    THEN 6
          WHEN 'sábado'    THEN 6
          WHEN 'domingo'   THEN 7
          ELSE 8
        END,
        v.hora ASC,
        v.id DESC
    `);

    const rows = stmt.all();

    const visitas = rows.map((v) => ({
      id: v.id,
      cliente_id: v.cliente_id,
      cliente_nombre: v.cliente_nombre,
      fecha: v.fecha,
      dia_semana: (v.dia_semana || "").toLowerCase().trim(),
      direccion: v.direccion || "",
      hora: v.hora || "",
      duracion_minutos: v.duracion_minutos,
      tipo_servicio: v.tipo_servicio || "",
      created_at: v.created_at,
      updated_at: v.updated_at,
    }));

    logger.debug("getAllVisitas", { count: visitas.length });
    res.json(visitas);
  } catch (err) {
    logger.error("Error getAllVisitas", { error: err.message });
    res.status(500).json({ message: "Error al obtener visitas" });
  }
}

// ============================
// POST /api/visitas
// ============================
function createVisita(req, res) {
  try {
    logger.debug("createVisita requested", { cliente_id, fecha, hora });

    const {
      cliente_id,
      fecha,
      hora,
      duracion_minutos,
      direccion,
      tipo_servicio,
    } = req.body;

    let validClienteId, validDuracion;
    try {
      validClienteId = validateNumber(cliente_id, "cliente_id", false);
      validateDate(fecha, "fecha", true);
      validateString(hora, "hora", 5, true);
      validDuracion = validateNumber(duracion_minutos, "duracion_minutos", false);
      validateString(direccion, "direccion", 300, true);
      validateString(tipo_servicio, "tipo_servicio", 100, false);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const clienteExists = db.prepare("SELECT id FROM clientes WHERE id = ?").get(validClienteId);
    if (!clienteExists) {
      return res.status(400).json({ message: "El cliente no existe" });
    }

    const dia_semana_calc = diaSemanaDesdeFecha(fecha);
    if (!dia_semana_calc) {
      return res.status(400).json({ message: "Fecha inválida" });
    }

    const now = new Date().toISOString();
    const duracion = validDuracion || 60;

    const stmt = db.prepare(`
      INSERT INTO visitas (
        cliente_id,
        fecha,
        dia_semana,
        hora,
        duracion_minutos,
        direccion,
        tipo_servicio,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      validClienteId,
      fecha,
      dia_semana_calc,
      hora,
      duracion,
      direccion,
      tipo_servicio || "",
      now,
      now
    );

    const visita = db
      .prepare(`
        SELECT
          v.id,
          v.cliente_id,
          c.nombre AS cliente_nombre,
          v.fecha,
          v.dia_semana,
          v.direccion,
          v.hora,
          v.duracion_minutos,
          v.tipo_servicio,
          v.created_at,
          v.updated_at
        FROM visitas v
        LEFT JOIN clientes c ON c.id = v.cliente_id
        WHERE v.id = ?
      `)
      .get(result.lastInsertRowid);

    res.status(201).json(visita);
  } catch (err) {
    logger.error("Error createVisita", { error: err.message });
    res.status(500).json({ message: "Error al crear visita" });
  }
}

// ============================
// PUT /api/visitas/:id
// ============================
function updateVisita(req, res) {
  try {
    const { id } = req.params;
    const validId = validateId(id, res);
    if (!validId) return;

    const {
      cliente_id,
      fecha,
      hora,
      duracion_minutos,
      direccion,
      tipo_servicio,
    } = req.body;

    let validClienteId, validDuracion;
    try {
      validClienteId = validateNumber(cliente_id, "cliente_id", false);
      validateDate(fecha, "fecha", true);
      validateString(hora, "hora", 5, true);
      validDuracion = validateNumber(duracion_minutos, "duracion_minutos", false);
      validateString(direccion, "direccion", 300, true);
      validateString(tipo_servicio, "tipo_servicio", 100, false);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const dia_semana_calc = diaSemanaDesdeFecha(fecha);
    if (!dia_semana_calc) {
      return res.status(400).json({ message: "Fecha inválida" });
    }

    const now = new Date().toISOString();
    const duracion = validDuracion || 60;

    const stmt = db.prepare(`
      UPDATE visitas
      SET
        cliente_id       = ?,
        fecha            = ?,
        dia_semana       = ?,
        hora             = ?,
        duracion_minutos = ?,
        direccion        = ?,
        tipo_servicio    = ?,
        updated_at       = ?
      WHERE id = ?
    `);

    const result = stmt.run(
      validClienteId,
      fecha,
      dia_semana_calc,
      hora,
      duracion,
      direccion,
      tipo_servicio || "",
      now,
      validId
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: "Visita no encontrada" });
    }

    const visita = db
      .prepare(`
        SELECT
          v.id,
          v.cliente_id,
          c.nombre AS cliente_nombre,
          v.fecha,
          v.dia_semana,
          v.direccion,
          v.hora,
          v.duracion_minutos,
          v.tipo_servicio,
          v.created_at,
          v.updated_at
        FROM visitas v
        LEFT JOIN clientes c ON c.id = v.cliente_id
        WHERE v.id = ?
      `)
      .get(validId);

    res.json(visita);
  } catch (err) {
    logger.error("Error updateVisita", { error: err.message });
    res.status(500).json({ message: "Error al actualizar visita" });
  }
}

// ============================
// DELETE /api/visitas/:id
// ============================
function deleteVisita(req, res) {
  try {
    const { id } = req.params;
    const validId = validateId(id, res);
    if (!validId) return;

    const stmt = db.prepare("DELETE FROM visitas WHERE id = ?");
    const result = stmt.run(validId);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Visita no encontrada" });
    }

    res.status(204).send();
  } catch (err) {
    logger.error("Error deleteVisita", { error: err.message });
    res.status(500).json({ message: "Error al eliminar visita" });
  }
}

module.exports = {
  getAllVisitas,
  createVisita,
  updateVisita,
  deleteVisita,
};
