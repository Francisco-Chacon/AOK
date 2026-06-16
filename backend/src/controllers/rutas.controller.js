const db = require("../db/sqlite");
const { validateString, validateEnum } = require("../utils/validation");
const logger = require("../utils/logger");

function validateId(id, res) {
  if (!id || isNaN(Number(id)) || Number(id) <= 0) {
    res.status(400).json({ message: "ID inválido" });
    return null;
  }
  return Number(id);
}

function getAllRutas(req, res) {
  try {
    const rutas = db.prepare("SELECT * FROM rutas ORDER BY dia, nombre").all();
    res.json(rutas);
  } catch (err) {
    logger.error("Error getAllRutas", { error: err.message });
    res.status(500).json({ message: "Error al obtener rutas" });
  }
}

function createRuta(req, res) {
  try {
    const { nombre, dia, tipo_servicio, descripcion } = req.body;

    try {
      validateString(nombre, "nombre", 200, true);
      validateEnum(dia, "día", ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"], true);
      validateString(tipo_servicio, "tipo_servicio", 100, false);
      validateString(descripcion, "descripcion", 500, false);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const now = new Date().toISOString();
    const result = db.prepare(
      "INSERT INTO rutas (nombre, dia, tipo_servicio, descripcion, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(nombre, dia, tipo_servicio ?? null, descripcion ?? null, now, now);

    const ruta = db.prepare("SELECT * FROM rutas WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(ruta);
  } catch (err) {
    logger.error("Error createRuta", { error: err.message });
    res.status(500).json({ message: "Error al crear ruta" });
  }
}

function updateRuta(req, res) {
  try {
    const { id } = req.params;
    const validId = validateId(id, res);
    if (!validId) return;

    const { nombre, dia, tipo_servicio, descripcion } = req.body;

    try {
      validateString(nombre, "nombre", 200, true);
      validateEnum(dia, "día", ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"], true);
      validateString(tipo_servicio, "tipo_servicio", 100, false);
      validateString(descripcion, "descripcion", 500, false);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }

    const now = new Date().toISOString();
    const result = db.prepare(
      "UPDATE rutas SET nombre = ?, dia = ?, tipo_servicio = ?, descripcion = ?, updated_at = ? WHERE id = ?"
    ).run(nombre, dia, tipo_servicio ?? null, descripcion ?? null, now, validId);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Ruta no encontrada" });
    }

    const ruta = db.prepare("SELECT * FROM rutas WHERE id = ?").get(validId);
    res.json(ruta);
  } catch (err) {
    logger.error("Error updateRuta", { error: err.message });
    res.status(500).json({ message: "Error al actualizar ruta" });
  }
}

function deleteRuta(req, res) {
  try {
    const { id } = req.params;
    const validId = validateId(id, res);
    if (!validId) return;

    const result = db.prepare("DELETE FROM rutas WHERE id = ?").run(validId);

    if (result.changes === 0) {
      return res.status(404).json({ message: "Ruta no encontrada" });
    }

    res.status(204).send();
  } catch (err) {
    logger.error("Error deleteRuta", { error: err.message });
    res.status(500).json({ message: "Error al eliminar ruta" });
  }
}

module.exports = { getAllRutas, createRuta, updateRuta, deleteRuta };
