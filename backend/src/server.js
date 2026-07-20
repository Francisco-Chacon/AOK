// src/server.js
const app = require("./app");
const logger = require("./utils/logger");
const db = require("./db/sqlite");

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  logger.info(`Backend escuchando en http://localhost:${PORT}`);
});

function shutdown(signal) {
  logger.info(`Señal ${signal} recibida. Cerrando servidor...`);
  server.close(() => {
    db.close();
    logger.info("Servidor cerrado correctamente.");
    process.exit(0);
  });
  setTimeout(() => {
    logger.error("Forzando cierre del servidor.");
    process.exit(1);
  }, 5000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
