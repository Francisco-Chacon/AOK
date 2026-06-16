// backend/src/routes/visitas.routes.js
const express = require("express");
const router = express.Router();

const {
  getAllVisitas,
  createVisita,
  updateVisita,
  deleteVisita,
} = require("../controllers/visitas.controller");

router.get("/", getAllVisitas);
router.post("/", createVisita);
router.put("/:id", updateVisita);
router.delete("/:id", deleteVisita);

module.exports = router;
