// backend/src/routes/estimados.routes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/estimados.controller");

router.get("/", ctrl.getAllEstimados);
router.post("/", ctrl.createEstimado);
router.put("/:id", ctrl.updateEstimado);
router.delete("/:id", ctrl.deleteEstimado);

module.exports = router;
