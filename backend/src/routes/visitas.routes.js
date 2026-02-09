// backend/src/routes/visitas.routes.js
const Router = require("router");
const router = Router();

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
