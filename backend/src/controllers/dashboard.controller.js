const db = require("../db/sqlite");

function getDashboard(req, res) {
  try {
    const clientesActivos = db.prepare("SELECT COUNT(*) as count FROM clientes WHERE estado = 'activo'").get();
    const clientesInactivos = db.prepare("SELECT COUNT(*) as count FROM clientes WHERE estado = 'inactivo'").get();
    const totalClientes = db.prepare("SELECT COUNT(*) as count FROM clientes").get();

    const now = new Date();
    const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const recibosMes = db.prepare(`
      SELECT COUNT(*) as cantidad, COALESCE(SUM(monto), 0) as total
      FROM recibos
      WHERE strftime('%Y-%m', fecha) = ? AND estado = 'pagado'
    `).get(mesActual);

    const facturasPendientes = db.prepare(`
      SELECT COUNT(DISTINCT f.id) as cantidad, COALESCE(SUM(fi.precio * fi.cantidad), 0) as total
      FROM facturas f
      LEFT JOIN facturas_items fi ON fi.factura_id = f.id
      WHERE f.estado = 'pendiente'
    `).get();

    const estimados = db.prepare(`
      SELECT COUNT(*) as cantidad, COALESCE(SUM(monto), 0) as total
      FROM estimados
    `).get();

    const availableYearsRows = db.prepare(`
      SELECT DISTINCT strftime('%Y', fecha) as year
      FROM recibos
      WHERE fecha IS NOT NULL AND fecha != ''
      ORDER BY year DESC
    `).all();
    const availableYears = availableYearsRows.map((row) => row.year).filter(Boolean);
    const currentYear = String(now.getFullYear());
    if (!availableYears.includes(currentYear)) availableYears.unshift(currentYear);

    const requestedYear = Number(req.query.year);
    const year = Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100
      ? String(requestedYear)
      : (availableYears[0] || String(now.getFullYear()));

    if (!availableYears.includes(year)) availableYears.unshift(year);
    const ingresosRows = db.prepare(`
      SELECT strftime('%m', fecha) as mes, COALESCE(SUM(monto), 0) as total
      FROM recibos
      WHERE estado = 'pagado' AND strftime('%Y', fecha) = ?
      GROUP BY mes
      ORDER BY mes ASC
    `).all(year);

    const ingresosPorMes = new Map(ingresosRows.map((row) => [row.mes, row.total]));
    const ingresosMensuales = Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, "0");
      return {
        mes: `${year}-${month}`,
        total: ingresosPorMes.get(month) || 0,
      };
    });

    const actividadReciente = db.prepare(`
      SELECT r.id, r.fecha, r.monto, r.codigo, c.nombre as cliente_nombre
      FROM recibos r
      LEFT JOIN clientes c ON c.id = r.cliente_id
      ORDER BY r.created_at DESC
      LIMIT 5
    `).all();

    res.json({
      clientes: {
        activos: clientesActivos.count,
        inactivos: clientesInactivos.count,
        total: totalClientes.count,
      },
      recibos_mes: {
        cantidad: recibosMes.cantidad,
        total: recibosMes.total,
      },
      facturas_pendientes: {
        cantidad: facturasPendientes.cantidad,
        total: facturasPendientes.total,
      },
      estimados: {
        cantidad: estimados.cantidad,
        total: estimados.total,
      },
      ingresos_mensuales: ingresosMensuales,
      ingresos_year: year,
      ingresos_years: availableYears,
      actividad_reciente: actividadReciente,
    });
  } catch (err) {
    console.error("Error getDashboard", err);
    res.status(500).json({ message: "Error al obtener datos del dashboard" });
  }
}

module.exports = { getDashboard };
