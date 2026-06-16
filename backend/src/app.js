// src/app.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");

const app = express();

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

// Archivos estáticos generados por `npm run build` (index.html, assets, etc.)
app.use(express.static(publicPath));

// Fallback para cualquier ruta NO /api → sirve index.html
// (sin usar "*", así evitamos el error de path-to-regexp)
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }
  res.sendFile(path.join(publicPath, "index.html"));
});

module.exports = app;
