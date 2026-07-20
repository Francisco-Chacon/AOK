// src/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const routes = require("./routes");
const logger = require("./utils/logger");

const app = express();

// Seguridad: headers HTTP
app.use(
  helmet({
    contentSecurityPolicy: false, // deshabilitado porque el frontend usa estilos/scripts inline de Vite
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Logging de requests
app.use(
  morgan("short", {
    stream: { write: (msg) => logger.info(msg.trim()) },
  })
);

const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  "file://",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const allowed = allowedOrigins.some((e) => {
        if (typeof e === "string") return origin === e || origin.startsWith(e);
        return e.test(origin);
      });
      if (allowed) {
        callback(null, true);
      } else {
        callback(new Error("Origen no permitido por CORS"));
      }
    },
  })
);

app.use(express.json({ limit: "10mb" }));

// ===== API =====
app.use("/api", routes);

// ===== FRONTEND (React build) =====
const publicPath = path.join(__dirname, "../public");

app.use(express.static(publicPath));

// Fallback SPA para rutas NO /api
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(publicPath, "index.html"));
});

// Manejador global de errores (evita que se filtren stack traces)
app.use((err, req, res, _next) => {
  logger.error("Error no capturado:", err);
  if (res.headersSent) return;
  res.status(err.status || 500).json({
    message: err.expose ? err.message : "Error interno del servidor.",
  });
});

module.exports = app;
