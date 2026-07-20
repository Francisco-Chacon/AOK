const express = require("express");
const router = express.Router();
const configController = require("../controllers/config.controller");

router.get("/openrouter-key", configController.getOpenRouterKey);
router.put("/openrouter-key", configController.saveOpenRouterKey);

module.exports = router;
