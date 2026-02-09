// src/app.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json());

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
