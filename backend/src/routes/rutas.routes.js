const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/rutas.controller");

router.get("/", ctrl.getAllRutas);
router.post("/", ctrl.createRuta);
router.put("/:id", ctrl.updateRuta);
router.delete("/:id", ctrl.deleteRuta);

module.exports = router;
