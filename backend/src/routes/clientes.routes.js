// backend/src/routes/clientes.routes.js
const Router = require("router");
const router = Router();

// IMPORTA LAS FUNCIONES DEL CONTROLLER
const {
  getAllClientes,
  createCliente,
  updateCliente,
  deleteCliente,
} = require("../controllers/clientes.controller");

// IMPORTANTE: aquí se pasa la FUNCIÓN, SIN paréntesis

// GET /api/clientes
router.get("/", getAllClientes);

// POST /api/clientes
router.post("/", createCliente);

// PUT /api/clientes/:id
router.put("/:id", updateCliente);

// DELETE /api/clientes/:id
router.delete("/:id", deleteCliente);

module.exports = router;
