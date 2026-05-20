// backend/src/controllers/rutas_hojas.controller.js
const db = require("../db/sqlite");

exports.getAll = (req, res) => {
  try {
    const hojas = db.prepare(`
      SELECT rh.*,
        (SELECT COUNT(*) FROM rutas_hojas_clientes WHERE hoja_id = rh.id) as clientes_count
      FROM rutas_hojas rh
      ORDER BY rh.fecha DESC, rh.id DESC
    `).all();

    res.json(hojas);
  } catch (err) {
    console.error("Error get hojas", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = (req, res) => {
  try {
    const hoja = db.prepare("SELECT * FROM rutas_hojas WHERE id = ?").get(req.params.id);
    if (!hoja) return res.status(404).json({ error: "No encontrada" });

    const clientes = db.prepare(`
      SELECT rhc.*, c.direccion as cliente_direccion
      FROM rutas_hojas_clientes rhc
      LEFT JOIN clientes c ON rhc.cliente_id = c.id
      WHERE rhc.hoja_id = ?
      ORDER BY rhc.id ASC
    `).all(req.params.id);

    res.json({ ...hoja, clientes });
  } catch (err) {
    console.error("Error get hoja", err);
    res.status(500).json({ error: err.message });
  }
};

exports.create = (req, res) => {
  try {
    const { fecha, conductor, camion, clientes } = req.body;
    const now = new Date().toISOString();

    const result = db.prepare(`
      INSERT INTO rutas_hojas (fecha, conductor, camion, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(fecha || now.slice(0,10), conductor || "", camion || "", now, now);

    const hoja_id = result.lastInsertRowid;

    if (Array.isArray(clientes)) {
      const insertCliente = db.prepare(`
        INSERT INTO rutas_hojas_clientes
          (hoja_id, cliente_id, cliente_nombre, cliente_direccion, hora_entrada, hora_salida, descripcion, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of clientes) {
        insertCliente.run(
          hoja_id,
          c.cliente_id || null,
          c.cliente_nombre || "",
          c.cliente_direccion || "",
          c.hora_entrada || "",
          c.hora_salida || "",
          c.descripcion || "",
          now,
          now
        );
      }
    }

    const hoja = db.prepare("SELECT * FROM rutas_hojas WHERE id = ?").get(hoja_id);
    res.status(201).json(hoja);
  } catch (err) {
    console.error("Error create hoja", err);
    res.status(500).json({ error: err.message });
  }
};

exports.update = (req, res) => {
  try {
    const { fecha, conductor, camion, clientes } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE rutas_hojas SET fecha = ?, conductor = ?, camion = ?, updated_at = ?
      WHERE id = ?
    `).run(fecha || "", conductor || "", camion || "", now, req.params.id);

    db.prepare("DELETE FROM rutas_hojas_clientes WHERE hoja_id = ?").run(req.params.id);

    if (Array.isArray(clientes)) {
      const insertCliente = db.prepare(`
        INSERT INTO rutas_hojas_clientes
          (hoja_id, cliente_id, cliente_nombre, cliente_direccion, hora_entrada, hora_salida, descripcion, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of clientes) {
        insertCliente.run(
          req.params.id,
          c.cliente_id || null,
          c.cliente_nombre || "",
          c.cliente_direccion || "",
          c.hora_entrada || "",
          c.hora_salida || "",
          c.descripcion || "",
          now,
          now
        );
      }
    }

    res.json({ id: Number(req.params.id) });
  } catch (err) {
    console.error("Error update hoja", err);
    res.status(500).json({ error: err.message });
  }
};

exports.delete = (req, res) => {
  try {
    db.prepare("DELETE FROM rutas_hojas WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error delete hoja", err);
    res.status(500).json({ error: err.message });
  }
};