// backend/src/utils/addFechaToVisitas.js
const db = require("../db/sqlite");

try {
  // Agregamos la columna fecha si no existe
  db.prepare("ALTER TABLE visitas ADD COLUMN fecha TEXT").run();
  console.log("✅ Columna 'fecha' agregada a la tabla 'visitas'.");

  // Opcional: poner una fecha por defecto a las visitas ya existentes
  // Aquí las dejo con la fecha de hoy, puedes cambiarlo si querés.
  db.prepare(`
    UPDATE visitas
    SET fecha = date('now')
    WHERE fecha IS NULL OR fecha = ''
  `).run();
  console.log("✅ Column 'fecha' inicializada para registros existentes.");

} catch (err) {
  console.error("❌ Error al agregar columna 'fecha':", err);
}
