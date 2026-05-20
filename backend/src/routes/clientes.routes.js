// backend/src/routes/clientes.routes.js
const Router = require("router");
const router = Router();

// IMPORTA LAS FUNCIONES DEL CONTROLLER
const {
  getAllClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  getRecibosCount,
} = require("../controllers/clientes.controller");

// IMPORTANTE: aquí se pasa la FUNCIÓN, SIN paréntesis

// GET /api/clientes
router.get("/", getAllClientes);

// GET /api/clientes/:id/recibos-count
router.get("/:id/recibos-count", getRecibosCount);

// POST /api/clientes
router.post("/", createCliente);

// PUT /api/clientes/:id
router.put("/:id", updateCliente);

// DELETE /api/clientes/:id
router.delete("/:id", deleteCliente);

module.exports = router;
