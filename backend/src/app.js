// src/app.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4000",
  "file://",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || origin.startsWith("file://")) {
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
