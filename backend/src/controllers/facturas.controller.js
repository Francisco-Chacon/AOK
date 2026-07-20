// backend/src/controllers/facturas.controller.js
const db = require("../db/sqlite");
const logger = require("../utils/logger");

exports.getAll = (req, res) => {
  try {
    const facturas = db.prepare(`
      SELECT f.*, c.nombre as cliente_nombre, c.direccion as cliente_direccion,
             c.email as cliente_email, c.telefono as cliente_telefono
      FROM facturas f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      ORDER BY f.fecha DESC, f.id DESC
    `).all();

    const items = db.prepare(`
      SELECT fi.*, fi.id as item_id
      FROM facturas_items fi
      ORDER BY fi.id ASC
    `).all();

    const result = facturas.map(f => ({
      ...f,
      items: items.filter(i => i.factura_id === f.id)
    }));

    res.json(result);
  } catch (err) {
    logger.error("Error get facturas", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getOne = (req, res) => {
  try {
    const factura = db.prepare(`
      SELECT f.*, c.nombre as cliente_nombre, c.direccion as cliente_direccion,
             c.email as cliente_email, c.telefono as cliente_telefono
      FROM facturas f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      WHERE f.id = ?
    `).get(req.params.id);

    if (!factura) return res.status(404).json({ message: "Factura no encontrada" });

    const items = db.prepare(`
      SELECT * FROM facturas_items WHERE factura_id = ? ORDER BY id ASC
    `).all(req.params.id);

    res.json({ ...factura, items });
  } catch (err) {
    logger.error("Error get factura", err);
    res.status(500).json({ message: err.message });
  }
};

exports.create = (req, res) => {
  try {
    const { cliente_id, fecha, estado, nota, numero, items } = req.body;
    const now = new Date().toISOString();

    const createTx = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO facturas (cliente_id, fecha, estado, nota, numero, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(cliente_id ?? null, fecha || now.slice(0,10), estado || "pendiente", nota || "", numero || null, now, now);

      const factura_id = result.lastInsertRowid;

      if (Array.isArray(items)) {
        const insertItem = db.prepare(`
          INSERT INTO facturas_items (factura_id, fecha, descripcion, cantidad, precio, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        for (const item of items) {
          insertItem.run(
            factura_id,
            item.fecha || fecha || now.slice(0,10),
            item.descripcion || "",
            item.cantidad || 1,
            item.precio || 0,
            now,
            now
          );
        }
      }

      return factura_id;
    });

    const factura_id = createTx();
    const factura = db.prepare("SELECT * FROM facturas WHERE id = ?").get(factura_id);
    res.status(201).json(factura);
  } catch (err) {
    logger.error("Error create factura", err);
    res.status(500).json({ message: err.message });
  }
};

exports.update = (req, res) => {
  try {
    const { cliente_id, fecha, estado, nota, numero, items } = req.body;
    const now = new Date().toISOString();
    if (!fecha) return res.status(400).json({ message: "La fecha es requerida" });

    db.transaction(() => {
      db.prepare(`
        UPDATE facturas SET cliente_id = ?, fecha = ?, estado = ?, nota = ?, numero = ?, updated_at = ?
        WHERE id = ?
      `).run(cliente_id ?? null, fecha, estado || "pendiente", nota || "", numero ?? null, now, req.params.id);

      db.prepare("DELETE FROM facturas_items WHERE factura_id = ?").run(req.params.id);

      if (Array.isArray(items)) {
        const insertItem = db.prepare(`
          INSERT INTO facturas_items (factura_id, fecha, descripcion, cantidad, precio, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        for (const item of items) {
          insertItem.run(
            req.params.id,
            item.fecha || "",
            item.descripcion || "",
            item.cantidad || 1,
            item.precio || 0,
            now,
            now
          );
        }
      }
    })();

    res.json({ id: Number(req.params.id) });
  } catch (err) {
    logger.error("Error update factura", err);
    res.status(500).json({ message: err.message });
  }
};

exports.delete = (req, res) => {
  try {
    db.prepare("DELETE FROM facturas WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    logger.error("Error delete factura", err);
    res.status(500).json({ message: err.message });
  }
};