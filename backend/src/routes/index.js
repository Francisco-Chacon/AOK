// src/routes/index.js
const express = require("express");
const router = express.Router();

const clientesRoutes = require("./clientes.routes");
const visitasRoutes = require("./visitas.routes");
const recibosRoutes = require("./recibos.routes");
// 👇 agrega esta línea
const backupsRoutes = require("./backups.routes"); // 👈 NUEVO

const estimadosRoutes = require("./estimados.routes");

router.use("/clientes", clientesRoutes);
router.use("/visitas", visitasRoutes);
router.use("/recibos", recibosRoutes);
// 👇 nueva ruta
router.use("/estimados", estimadosRoutes);
router.use("/backups", backupsRoutes); // 👈 NUEVO


module.exports = router;
