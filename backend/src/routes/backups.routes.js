// backend/src/routes/backups.routes.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const router = express.Router();

// Usamos la MISMA instancia de BD que usan tus controladores
const db = require("../db/sqlite");

// better-sqlite3 expone el path completo del archivo en db.name
const MAIN_DB = db.name;                         // p.ej. C:\...\backend\data\gestion_local.db
const DB_DIR = path.dirname(MAIN_DB);            // carpeta "backend/data"
const BACKUP_DIR = path.join(DB_DIR, "backups"); // backend/data/backups

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// Creamos el directorio antes de configurar multer
ensureBackupDir();

// Configuración de multer para guardar el archivo en BACKUP_DIR
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BACKUP_DIR);
  },
  filename: (req, file, cb) => {
    // nombre seguro: sin rutas raras ni caracteres extraños
    let safeName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9_.-]/g, "_");

    // forzar extensión .db si no la trae
    if (!safeName.toLowerCase().endsWith(".db")) {
      safeName = safeName + ".db";
    }

    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.originalname.toLowerCase().endsWith(".db")) {
      return cb(new Error("Solo se permiten archivos .db"));
    }
    cb(null, true);
  },
});

// ================================
// POST /api/backups/create
// ================================
router.post("/create", (req, res) => {
  try {
    ensureBackupDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup_${timestamp}.db`;
    const destPath = path.join(BACKUP_DIR, filename);

    fs.copyFileSync(MAIN_DB, destPath);

    res.json({
      ok: true,
      message: "Backup creado correctamente",
      filename,
    });
  } catch (err) {
    console.error("Error creando backup:", err);
    res
      .status(500)
      .json({ ok: false, message: `Error al crear backup: ${err.message}` });
  }
});

// ================================
// GET /api/backups/list
// ================================
router.get("/list", (req, res) => {
  try {
    ensureBackupDir();
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith(".db"))
      .sort()
      .reverse();

    res.json({ ok: true, files });
  } catch (err) {
    console.error("Error listando backups:", err);
    res.status(500).json({ ok: false, message: "Error al listar backups" });
  }
});

// ================================
// GET /api/backups/download/:filename
// ================================
router.get("/download/:filename", (req, res) => {
  try {
    ensureBackupDir();
    const { filename } = req.params;

    const safeName = path.basename(filename);
    const filePath = path.join(BACKUP_DIR, safeName);

    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ ok: false, message: "Backup no encontrado" });
    }

    res.download(filePath, safeName);
  } catch (err) {
    console.error("Error descargando backup:", err);
    res.status(500).json({ ok: false, message: "Error al descargar backup" });
  }
});

// ================================
// POST /api/backups/upload
// ================================
router.post("/upload", upload.single("backup"), (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ ok: false, message: "No se recibió ningún archivo" });
    }

    return res.json({
      ok: true,
      message: "Backup subido correctamente",
      filename: req.file.filename,
    });
  } catch (err) {
    console.error("Error subiendo backup:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Error al subir backup" });
  }
});

// ================================
// POST /api/backups/restore
// ================================
router.post("/restore", (req, res) => {
  try {
    ensureBackupDir();
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ ok: false, message: "Falta filename" });
    }

    const safeName = path.basename(filename);
    const backupPath = path.join(BACKUP_DIR, safeName);

    if (!fs.existsSync(backupPath)) {
      return res
        .status(404)
        .json({ ok: false, message: "Backup no encontrado" });
    }

    fs.copyFileSync(backupPath, MAIN_DB);

    res.json({
      ok: true,
      message:
        "Backup restaurado correctamente. Es recomendable reiniciar el backend después de esta operación.",
    });
  } catch (err) {
    console.error("Error restaurando backup:", err);
    res.status(500).json({ ok: false, message: "Error al restaurar backup" });
  }
});

// ================================
// DELETE /api/backups/:filename
// ================================
router.delete("/:filename", (req, res) => {
  try {
    ensureBackupDir();
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({ ok: false, message: "Falta filename" });
    }

    const safeName = path.basename(filename);
    const backupPath = path.join(BACKUP_DIR, safeName);

    if (!fs.existsSync(backupPath)) {
      return res
        .status(404)
        .json({ ok: false, message: "Backup no encontrado" });
    }

    fs.unlinkSync(backupPath);

    res.json({
      ok: true,
      message: "Backup eliminado correctamente",
    });
  } catch (err) {
    console.error("Error eliminando backup:", err);
    res.status(500).json({ ok: false, message: "Error al eliminar backup" });
  }
});

module.exports = router;
