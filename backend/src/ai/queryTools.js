const db = require("../db/sqlite");

function formatCurrency(amount, currency = "USD") {
  return `${currency} ${(amount || 0).toFixed(2)}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return startOfDay(d);
}

function startOfMonth(date) {
  const d = new Date(date);
  d.setDate(1);
  return startOfDay(d);
}

function getClientes(query) {
  const q = (query || "").toLowerCase();
  return q
    ? db.prepare("SELECT * FROM clientes WHERE LOWER(nombre) LIKE ? ORDER BY nombre").all(`%${q}%`)
    : db.prepare("SELECT * FROM clientes ORDER BY nombre").all();
}

function getEstimadosByClient(clienteId, fechaDesde, fechaHasta, estado) {
  let sql = "SELECT * FROM estimados WHERE cliente_id = ?";
  const params = [clienteId];
  if (fechaDesde) { sql += " AND fecha >= ?"; params.push(fechaDesde); }
  if (fechaHasta) { sql += " AND fecha <= ?"; params.push(fechaHasta); }
  if (estado) { sql += " AND estado = ?"; params.push(estado); }
  sql += " ORDER BY fecha DESC";
  return db.prepare(sql).all(...params);
}

function getFacturasByClient(clienteId, fechaDesde, fechaHasta, estado) {
  let sql = `
    SELECT f.*, COALESCE(fi.monto_item, 0) as monto
    FROM facturas f
    LEFT JOIN (SELECT factura_id, SUM(cantidad * precio) as monto_item FROM facturas_items GROUP BY factura_id) fi ON fi.factura_id = f.id
    WHERE f.cliente_id = ?
  `;
  const params = [clienteId];
  if (fechaDesde) { sql += " AND f.fecha >= ?"; params.push(fechaDesde); }
  if (fechaHasta) { sql += " AND f.fecha <= ?"; params.push(fechaHasta); }
  if (estado) { sql += " AND f.estado = ?"; params.push(estado); }
  sql += " ORDER BY f.fecha DESC";
  return db.prepare(sql).all(...params);
}

function getContractsByClient(clienteId) {
  return db.prepare("SELECT * FROM contracts WHERE cliente_id = ? ORDER BY fecha_inicio DESC").all(clienteId);
}

function getAllEstimados(fechaDesde, fechaHasta, estado) {
  let sql = `
    SELECT e.*, c.nombre as cliente_nombre
    FROM estimados e
    LEFT JOIN clientes c ON e.cliente_id = c.id
    WHERE 1=1
  `;
  const params = [];
  if (fechaDesde) { sql += " AND e.fecha >= ?"; params.push(fechaDesde); }
  if (fechaHasta) { sql += " AND e.fecha <= ?"; params.push(fechaHasta); }
  if (estado) { sql += " AND e.estado = ?"; params.push(estado); }
  sql += " ORDER BY e.fecha DESC";
  return db.prepare(sql).all(...params);
}

function getAllFacturas(fechaDesde, fechaHasta, estado) {
  let sql = `
    SELECT f.*, c.nombre as cliente_nombre, COALESCE(fi.monto_item, 0) as monto
    FROM facturas f
    LEFT JOIN clientes c ON f.cliente_id = c.id
    LEFT JOIN (SELECT factura_id, SUM(cantidad * precio) as monto_item FROM facturas_items GROUP BY factura_id) fi ON fi.factura_id = f.id
    WHERE 1=1
  `;
  const params = [];
  if (fechaDesde) { sql += " AND f.fecha >= ?"; params.push(fechaDesde); }
  if (fechaHasta) { sql += " AND f.fecha <= ?"; params.push(fechaHasta); }
  if (estado) { sql += " AND f.estado = ?"; params.push(estado); }
  sql += " ORDER BY f.fecha DESC";
  return db.prepare(sql).all(...params);
}

function getAllContracts() {
  return db.prepare(`
    SELECT c.*, cl.nombre as cliente_nombre
    FROM contracts c
    LEFT JOIN clientes cl ON c.cliente_id = cl.id
    ORDER BY c.fecha_inicio DESC
  `).all();
}

function getStats() {
  const totalClientes = db.prepare("SELECT COUNT(*) as c FROM clientes").get().c;
  const activos = db.prepare("SELECT COUNT(*) as c FROM clientes WHERE estado = 'activo'").get().c;
  const totalEstimados = db.prepare("SELECT COUNT(*) as c FROM estimados").get().c;
  const totalFacturas = db.prepare("SELECT COUNT(*) as c FROM facturas").get().c;
  const pendientes = db.prepare("SELECT COUNT(*) as c FROM facturas WHERE estado = 'pendiente'").get().c;
  const totalContratos = db.prepare("SELECT COUNT(*) as c FROM contracts").get().c;

  const estimadosTotal = db.prepare("SELECT COALESCE(SUM(monto), 0) as t FROM estimados").get().t;
  const facturasTotal = db.prepare("SELECT COALESCE(SUM(cantidad * precio), 0) as t FROM facturas_items").get().t;
  const pendientesTotal = db.prepare("SELECT COALESCE(SUM(fi.cantidad * fi.precio), 0) as t FROM facturas_items fi INNER JOIN facturas f ON fi.factura_id = f.id WHERE f.estado = 'pendiente'").get().t;
  const contratosTotal = db.prepare("SELECT COALESCE(SUM(monto), 0) as t FROM contracts").get().t;

  return {
    clientes: { total: totalClientes, activos },
    estimados: { total: totalEstimados, monto_total: estimadosTotal },
    facturas: { total: totalFacturas, pendientes, monto_pendiente: pendientesTotal, monto_total: facturasTotal },
    contratos: { total: totalContratos, monto_total: contratosTotal },
  };
}

function getEstimadosByPeriod(periodo, refDate) {
  const baseDate = refDate ? new Date(refDate) : new Date();
  let desde;
  if (periodo === "day") {
    desde = startOfDay(baseDate);
  } else if (periodo === "week") {
    desde = startOfWeek(baseDate);
  } else if (periodo === "month") {
    desde = startOfMonth(baseDate);
  } else {
    return { error: `Periodo no válido: ${periodo}. Use: day, week, month` };
  }
  const rows = db.prepare(`
    SELECT e.*, c.nombre as cliente_nombre
    FROM estimados e
    LEFT JOIN clientes c ON e.cliente_id = c.id
    WHERE e.fecha >= ? AND e.fecha <= ?
    ORDER BY e.fecha DESC
  `).all(desde, new Date().toISOString().slice(0, 10));

  const count = rows.length;
  const total = rows.reduce((s, r) => s + (r.monto || 0), 0);
  return { periodo, desde, count, total, items: rows };
}

function getRecentActivity(limit = 10) {
  const recentEstimados = db.prepare(`
    SELECT 'estimado' as tipo, id, fecha, monto, estado, created_at FROM estimados ORDER BY created_at DESC LIMIT ?
  `).all(limit);

  const recentFacturas = db.prepare(`
    SELECT 'factura' as tipo, f.id, f.fecha, COALESCE(fi.monto_item, 0) as monto, f.estado, f.created_at
    FROM facturas f
    LEFT JOIN (SELECT factura_id, SUM(cantidad * precio) as monto_item FROM facturas_items GROUP BY factura_id) fi ON fi.factura_id = f.id
    ORDER BY f.created_at DESC LIMIT ?
  `).all(limit);

  const all = [...recentEstimados, ...recentFacturas]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);

  return all;
}

function search(term) {
  const q = `%${(term || "").toLowerCase()}%`;
  const clientes = db.prepare("SELECT id, nombre, telefono, email, estado FROM clientes WHERE LOWER(nombre) LIKE ? OR LOWER(telefono) LIKE ? OR LOWER(email) LIKE ? LIMIT 10").all(q, q, q);
  const estimados = db.prepare(`
    SELECT e.id, e.monto, e.estado, e.fecha, c.nombre as cliente
    FROM estimados e LEFT JOIN clientes c ON e.cliente_id = c.id
    WHERE LOWER(c.nombre) LIKE ? OR LOWER(e.descripcion_trabajo) LIKE ? LIMIT 10
  `).all(q, q);
  const facturas = db.prepare(`
    SELECT f.id, COALESCE(fi.monto_item, 0) as monto, f.estado, f.fecha, c.nombre as cliente
    FROM facturas f
    LEFT JOIN clientes c ON f.cliente_id = c.id
    LEFT JOIN (SELECT factura_id, SUM(cantidad * precio) as monto_item FROM facturas_items GROUP BY factura_id) fi ON fi.factura_id = f.id
    WHERE LOWER(c.nombre) LIKE ? OR LOWER(f.numero) LIKE ? LIMIT 10
  `).all(q, q);
  return { clientes, estimados, facturas };
}

module.exports = {
  getClientes,
  getEstimadosByClient,
  getFacturasByClient,
  getContractsByClient,
  getAllEstimados,
  getAllFacturas,
  getAllContracts,
  getStats,
  getEstimadosByPeriod,
  getRecentActivity,
  search,
};
