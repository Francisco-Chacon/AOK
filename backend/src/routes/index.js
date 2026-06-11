// src/routes/index.js
const express = require("express");
const router = express.Router();

const clientesRoutes = require("./clientes.routes");
const visitasRoutes = require("./visitas.routes");
const recibosRoutes = require("./recibos.routes");
const estimadosRoutes = require("./estimados.routes");
const facturasRoutes = require("./facturas.routes");
const rutasHojasRoutes = require("./rutas_hojas.routes");
const backupsRoutes = require("./backups.routes");
const aiRoutes = require("./ai.routes");

router.use("/clientes", clientesRoutes);
router.use("/visitas", visitasRoutes);
router.use("/recibos", recibosRoutes);
router.use("/estimados", estimadosRoutes);
router.use("/facturas", facturasRoutes);
router.use("/rutas-hojas", rutasHojasRoutes);
router.use("/backups", backupsRoutes);
router.use("/ai", aiRoutes);

module.exports = router;
