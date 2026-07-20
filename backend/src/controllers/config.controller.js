const db = require("../db/sqlite");
const logger = require("../utils/logger");
const { encrypt, decrypt } = require("../utils/crypto");

const getConfig = (key) => {
  const row = db.prepare("SELECT value FROM config WHERE key = ?").get(key);
  return row ? row.value : null;
};

const setConfig = (key, value) => {
  db.prepare(
    "INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(key, value);
};

exports.getOpenRouterKey = (req, res) => {
  try {
    const encrypted = getConfig("openrouter_key");
    res.json({ hasKey: !!encrypted });
  } catch (err) {
    logger.error("Error al leer key:", err);
    res.status(500).json({ message: "Error al leer la configuración" });
  }
};

exports.saveOpenRouterKey = (req, res) => {
  try {
    const { key } = req.body;
    if (key && typeof key !== "string") {
      return res.status(400).json({ message: "Key inválida" });
    }
    const encrypted = encrypt(key);
    setConfig("openrouter_key", encrypted || "");
    logger.info("API key de OpenRouter actualizada");
    res.json({ ok: true });
  } catch (err) {
    logger.error("Error al guardar key:", err);
    res.status(500).json({ message: "Error al guardar la configuración" });
  }
};
