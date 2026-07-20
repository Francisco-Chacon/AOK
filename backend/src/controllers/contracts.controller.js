const db = require("../db/sqlite");
const logger = require("../utils/logger");

exports.getAll = (req, res) => {
  try {
    const contracts = db.prepare(`
      SELECT c.*, cl.nombre as cliente_nombre, cl.direccion as cliente_direccion,
             cl.email as cliente_email, cl.telefono as cliente_telefono
      FROM contracts c
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      ORDER BY c.fecha_inicio DESC, c.id DESC
    `).all();
    res.json(contracts);
  } catch (err) {
    logger.error("Error get contracts", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = (req, res) => {
  try {
    const contract = db.prepare(`
      SELECT c.*, cl.nombre as cliente_nombre, cl.direccion as cliente_direccion,
             cl.email as cliente_email, cl.telefono as cliente_telefono
      FROM contracts c
      LEFT JOIN clientes cl ON c.cliente_id = cl.id
      WHERE c.id = ?
    `).get(req.params.id);
    if (!contract) return res.status(404).json({ message: "Contrato no encontrado" });
    res.json(contract);
  } catch (err) {
    logger.error("Error get contract", err);
    res.status(500).json({ message: err.message });
  }
};

exports.create = (req, res) => {
  try {
    const { cliente_id, fecha_inicio, fecha_fin, descripcion, monto } = req.body;
    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO contracts (cliente_id, fecha_inicio, fecha_fin, descripcion, monto, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(cliente_id || null, fecha_inicio || "", fecha_fin || "", descripcion || "", Number(monto) || 0, now, now);

    const contract = db.prepare("SELECT * FROM contracts WHERE id = ?").get(result.lastInsertRowid);
    res.status(201).json(contract);
  } catch (err) {
    logger.error("Error create contract", err);
    res.status(500).json({ message: err.message });
  }
};

exports.update = (req, res) => {
  try {
    const { cliente_id, fecha_inicio, fecha_fin, descripcion, monto } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE contracts SET cliente_id = ?, fecha_inicio = ?, fecha_fin = ?, descripcion = ?, monto = ?, updated_at = ?
      WHERE id = ?
    `).run(cliente_id || null, fecha_inicio || "", fecha_fin || "", descripcion || "", Number(monto) || 0, now, req.params.id);

    res.json({ id: Number(req.params.id) });
  } catch (err) {
    logger.error("Error update contract", err);
    res.status(500).json({ message: err.message });
  }
};

exports.delete = (req, res) => {
  try {
    db.prepare("DELETE FROM contracts WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    logger.error("Error delete contract", err);
    res.status(500).json({ message: err.message });
  }
};
