// backend/src/routes/rutas_hojas.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/rutas_hojas.controller");

router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getOne);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.delete);

module.exports = router;