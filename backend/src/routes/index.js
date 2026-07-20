// src/routes/index.js
const express = require("express");
const router = express.Router();
const logger = require("../utils/logger");

const clientesRoutes = require("./clientes.routes");
const estimadosRoutes = require("./estimados.routes");
const facturasRoutes = require("./facturas.routes");
const rutasHojasRoutes = require("./rutas_hojas.routes");
const contractsRoutes = require("./contracts.routes");
const backupsRoutes = require("./backups.routes");
const aiRoutes = require("./ai.routes");
const configRoutes = require("./config.routes");

router.use("/clientes", clientesRoutes);
router.use("/estimados", estimadosRoutes);
router.use("/facturas", facturasRoutes);
router.use("/rutas-hojas", rutasHojasRoutes);
router.use("/contracts", contractsRoutes);
router.use("/backups", backupsRoutes);
router.use("/ai", aiRoutes);
router.use("/config", configRoutes);

// Reporte de errores del frontend
router.post("/log-error", (req, res) => {
  const { message, stack, url, userAgent, componentStack } = req.body || {};
  logger.error(`[Frontend Error] ${message}`, {
    url,
    userAgent,
    componentStack,
    stack: stack ? stack.split("\n").slice(0, 5).join(" | ") : undefined,
  });
  res.status(200).json({ ok: true });
});

module.exports = router;
