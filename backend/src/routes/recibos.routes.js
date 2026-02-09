// backend/src/routes/recibos.routes.js
const Router = require("router");
const router = Router();

const {
  getAllRecibos,
  createRecibo,
  updateRecibo,
  deleteRecibo,
} = require("../controllers/recibos.controller");

router.get("/", getAllRecibos);
router.post("/", createRecibo);
router.put("/:id", updateRecibo);
router.delete("/:id", deleteRecibo);

module.exports = router;
