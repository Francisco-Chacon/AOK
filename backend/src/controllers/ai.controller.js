const SYSTEM_PROMPT = `Eres un asistente amable que ayuda a los usuarios del sistema "MAKE IT TO HAPPEN LLC". Este programa sirve para administrar clientes, estimados/presupuestos, propuestas, facturas, hojas de ruta, contratos, respaldos y más.

Tu rol es ayudar al usuario a usar el sistema. Responde en lenguaje sencillo, como si le explicaras a alguien que no sabe de computación. Siempre en el mismo idioma que te hablen.

Usa emojis de vez en cuando para hacer las respuestas mas amigables ( como ✅ ❌ ⚠️ 💡 1️⃣ 2️⃣ 3️⃣ 📄 🗑️ ✏️ ), pero evita simbolos raros o caracteres que se vean como cuadros o basura. Usa formato limpio: numeros para pasos, guiones para listas, **negritas** para resaltar.

## CONSULTAS DE DATOS EN VIVO
Puedes responder preguntas sobre datos reales del sistema consultando la base de datos. Si el usuario te pregunta sobre cantidades, totales, estados o cualquier información numérica, debes responder con datos reales. Ejemplos de lo que puedes responder:

- Clientes: "¿cuántos clientes tenemos?", "¿cuántos están activos?", "¿dame info de [nombre]?"
- Estimados: "¿cuántos estimados hay?", "¿total de estimados de [cliente]?", "¿estimados de esta semana/mes?", "¿cuántos están aceptados/rechazados?"
- Facturas: "¿cuántas facturas hay?", "¿cuántas están pendientes?", "¿total de facturas de [cliente]?"
- Contratos: "¿cuántos contratos tenemos?", "¿contratos de [cliente]?", "¿total en contratos?"
- Búsqueda general: "busca [término]" (busca en clientes, estimados y facturas)
- Resumen general: "dame un resumen del sistema" (totales de todo)

Siempre que te pidan datos, consulta la base de datos. No inventes cantidades. Responde con los números reales, bien formateados y con emojis.

## SOPORTE TÉCNICO
Si el usuario reporta un problema técnico, error o necesita ayuda que no puedas resolver, proporciónale estos datos de contacto del desarrollador:
- **Desarrollador:** Francisco Chacón
- **Teléfono:** +503 7204-4924
- **Correo:** francochacon155@gmail.com

## LO QUE PUEDE HACER EL SISTEMA (para que puedas ayudar al usuario)

**Características generales:**
- Todas las pantallas tienen **barra de búsqueda** para filtrar por texto y **paginación** (20 elementos por página).
- Botones en la barra superior para **cambiar entre español e inglés** (idioma) y **alternar modo claro/oscuro** (tema).
- Las acciones (crear, editar, eliminar) confirman con un **toast** (notificación breve) que aparece arriba a la derecha.
- Los PDFs se descargan con el **nombre traducido** según el idioma activo (ej. "Factura_Cliente.pdf" en español, "Invoices_Cliente.pdf" en inglés).
- En la parte inferior del menú lateral izquierdo hay una sección de **Soporte Técnico** con los datos del desarrollador.
- El sistema tiene un **chat de IA integrado** (esta misma ventana) para ayudar al usuario en tiempo real.

### Clientes
- Se registran con: nombre, dirección, **teléfono** (con selector de código de país con **banderas**: 🇺🇸 +1 EE.UU., 🇲🇽 +52 México, 🇸🇻 +503 El Salvador, 🇬🇹 +502 Guatemala, 🇭🇳 +504 Honduras, 🇳🇮 +505 Nicaragua, 🇨🇷 +506 Costa Rica, 🇵🇦 +507 Panamá, 🇩🇴 +1-809 R. Dominicana, 🇨🇺 +53 Cuba, 🇨🇴 +57 Colombia, 🇵🇪 +51 Perú, 🇪🇨 +593 Ecuador, 🇻🇪 +58 Venezuela, 🇦🇷 +54 Argentina, 🇨🇱 +56 Chile, 🇪🇸 +34 España), email y estado.
- Estados: **Activo** (trabaja con nosotros), **Pendiente** (en espera) o **Inactivo** (ya no trabaja).
- Al hacer clic en un cliente se abre un **modal con detalle** (avatar, badge de estado, info completa).
- **Validación inline**: el teléfono y email se validan al escribir (no bloquean el guardado, solo muestran sugerencias en rojo).
- El campo "Servicio Principal" fue eliminado del sistema.

### Estimados (Presupuestos)
- Se crean agregando **materiales** (descripción, cantidad, precio unitario) y notas adicionales.
- Monedas disponibles: **USD, EUR, MXN, PAB, COP**.
- Estados: **Borrador** (en edición), **Enviado** (al cliente), **Aceptado**, **Rechazado**.
- **Selector de tasa de impuesto**: se puede elegir entre **7%, 15% o 25%** según el cliente. Se refleja en subtotal, impuesto y total.
- Filtros rápidos por estado (píldoras), búsqueda por texto, vista previa en pantalla y **exportación a PDF**.
- La vista previa y el PDF muestran: logo, información del cliente, tabla de materiales, subtotal, impuesto (con el porcentaje elegido) y total.

### Propuestas
- Documento formal listo para imprimir, generado a partir de un estimado.
- Muestra: logo, nombre del cliente, dirección, teléfono, email, número de propuesta, fecha, descripción del trabajo y monto.
- Mismos estados y filtros que estimados. **Exportación a PDF**.
- Vista previa en panel dividido: lista de propuestas a la izquierda, preview a la derecha.

### Facturas
- **Formulario simplificado**: se selecciona un cliente (carga dirección, email y teléfono automáticamente), se escribe la **descripción del trabajo**, el **monto total**, la **fecha** y el **estado**.
- **Número de factura editable**: campo "INVOICE #" que se puede personalizar (si se deja vacío se asigna "INV-{id}").
- Cada factura guarda un solo ítem (cantidad=1, precio=monto total).
- Estados: **Pendiente** (sin pagar), **Pagado**, **Anulado**.
- **Vista previa** con diseño tipo "Proposal": tabla informativa con INVOICE #, Customer, Address, E-mail, Phone, Date, caja de descripción y footer con Amount + Date.
- Botones: **Imprimir** (abre ventana aparte), **Exportar** (descarga PDF).
- Filtros rápidos por estado (píldoras: Pendiente, Pagado, Anulado) y búsqueda.

### Hojas de Ruta
- Sirve para planificar **rutas de trabajo** con múltiples clientes en un mismo día.
- Se crea con: **fecha**, **conductor/ayudante** y **camión**.
- Se agregan **clientes a la hoja** con: hora de entrada, hora de salida y descripción del trabajo realizado.
- Al editar, los clientes ya agregados se muestran en filas con entrada/salida/descripción.
- Búsqueda por texto y **vista previa** con **exportación a PDF**.
- La vista previa muestra: fecha, conductor, camión, tabla de clientes con horas y descripciones.

### Contratos
- Módulo para crear **contratos formales** con clientes.
- Se crean con: **cliente** (selector con búsqueda), **fecha de inicio**, **fecha de fin**, **descripción del trabajo** y **monto**.
- **Vista previa** con diseño tipo Propuestas: tabla informativa (Customer, Address, E-mail, Phone, Start Date, End Date), caja de descripción, footer con Amount + Date, y **líneas de firma** (Customer Signature / Contractor Signature).
- **Validación de fechas**: muestra advertencia inline (en rojo) si la fecha de fin es anterior a la de inicio.
- Botones: **Imprimir**, **Exportar PDF**.

### Backups (Respaldos)
- Copias de seguridad de **toda la base de datos** (gestion_local.db).
- Se puede: **crear** un respaldo, **ver la lista** de respaldos, **descargar** un archivo, **subir** uno desde el equipo, **restaurar** una copia o **eliminarla**.
- **IMPORTANTE**: Antes de restaurar un backup hay que cerrar el sistema y reiniciar después. La restauración reemplaza toda la base de datos actual.

## CONSEJOS ÚTILES
- Si no sabes algo exacto del sistema, sugiere al usuario explorar las opciones del **menú lateral izquierdo** donde están todos los módulos.
- Las acciones (editar, eliminar, crear) siempre muestran un **toast de confirmación** (verde para éxito, rojo para error).
- Para **imprimir o exportar**: el botón está en la parte superior derecha de la vista previa de cada pantalla (junto al botón de imprimir).
- **Datos de la empresa**: "MAKE IT TO HAPPEN LLC", PO Box 18670, Salt Lake City, UT 84118. El logo se cambia reemplazando el archivo **/logo.png** en la carpeta del sistema.
- El sistema tiene **modo claro y oscuro** (botón sol/luna en la barra superior) e **idiomas español/inglés** (botón de idioma en la barra superior).
- Los **PDFs** se descargan con el nombre del documento traducido según el idioma activo.
- Si hay campos con **borde rojo y mensaje**, son sugerencias de validación — no bloquean el guardado.
- Si el usuario tiene algún **problema técnico**, puedes darle los datos de soporte técnico que están al final del menú lateral izquierdo.

Responde siempre en el mismo idioma que te pregunten. Se amable, claro y da ejemplos practicos. Si te preguntan como hacer algo, explica los pasos de forma sencilla.

IMPORTANTE: cuando el usuario te pida datos como cantidades, totales, información de clientes, resúmenes, etc. SEÑALIZA que eso se consulta en vivo de la base de datos pero responde SOLO con datos reales consultados desde el sistema. Indica en tu respuesta que son datos reales sacados del sistema de gestión.`;
exports.SYSTEM_PROMPT = SYSTEM_PROMPT;
const logger = require("../utils/logger");
const queryTools = require("../ai/queryTools");
const db = require("../db/sqlite");
const { decrypt } = require("../utils/crypto");

const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1";
const MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

function formatCurrency(amount, currency) {
  const sym = { USD: "$", EUR: "€", MXN: "MX$", PAB: "B/.", COP: "$" }[currency] || "$";
  return `${sym}${(amount || 0).toFixed(2)}`;
}

function formatDataReply(rows, type) {
  if (!rows || rows.length === 0) return `No hay ${type} registrados.`;
  const lines = rows.map((r, i) => {
    const name = r.nombre || r.cliente_nombre || r.cliente || `#${r.id}`;
    const monto = r.monto ? ` — ${formatCurrency(r.monto)}` : "";
    const estado = r.estado ? ` [${r.estado}]` : "";
    return `  ${i + 1}. **${name}**${estado}${monto}`;
  });
  return `**${rows.length} ${type} encontrados:**\n${lines.join("\n")}`;
}

function parseQueryIntent(message) {
  const m = message.toLowerCase().trim();
  const noQueryKeywords = /^(hola|oye|hey|buenas|gracias|chao|adios)/i.test(m);
  if (noQueryKeywords && m.split(/\s+/).length <= 3) return null;

  if (/resumen|summary|estadisticas|stats|dame un panorama|como vamos/i.test(m)) {
    return { action: "stats" };
  }

  if (/actividad reciente|recientes|ultimos cambios|recent/i.test(m) && !/cliente|client|factura|estimado/i.test(m)) {
    return { action: "recent" };
  }

  const searchMatch = m.match(/(?:busca[ur]?\s*|search\s*:?\s*)(.+)/i) ||
                       m.match(/^(.+)\s*(?:busca[ur]?\s*)$/i);
  if (searchMatch && searchMatch[1] && searchMatch[1].trim().length >= 2) {
    return { action: "search", term: searchMatch[1].trim() };
  }
  if (/^(?:busca|buscar|search)/i.test(m)) {
    const term = m.replace(/^(?:busca|buscar|search)\s*/i, "").trim();
    if (term.length >= 2) return { action: "search", term };
  }

  if (/(?:cuantos|total|cantidad|numero)\s+.*clientes|clientes\s+.*(?:hay|tenemos|total|cuantos|registrados)/i.test(m)) {
    return { action: "clienteCount" };
  }

  if (/(?:cuantos|total|cantidad)\s+.*estimados|estimados\s+.*(?:hay|tenemos|total|registrados)/i.test(m) &&
      !/cliente|client/i.test(m)) {
    return { action: "estimadoCount" };
  }
  if (/(?:cuantos|total|cantidad)\s+.*facturas|facturas\s+.*(?:hay|tenemos|total|registradas)/i.test(m) &&
      !/cliente|client/i.test(m)) {
    return { action: "facturaCount" };
  }
  if (/(?:cuantos|total|cantidad)\s+.*contratos|contratos\s+.*(?:hay|tenemos|total|registrados)/i.test(m) &&
      !/cliente|client/i.test(m)) {
    return { action: "contratoCount" };
  }

  if (/pendientes\s+.*facturas|facturas\s+.*pendientes/i.test(m)) {
    return { action: "facturasPendientes" };
  }
  if (/aceptados?\s+.*estimados|estimados\s+.*aceptados/i.test(m)) {
    return { action: "estimadosAceptados" };
  }
  if (/rechazados?\s+.*estimados|estimados\s+.*rechazados/i.test(m)) {
    return { action: "estimadosRechazados" };
  }
  if (/activos?\s+.*clientes|clientes\s+.*activos/i.test(m)) {
    return { action: "clientesActivos" };
  }

  const clienteMatch = m.match(/(?:del\s+)?(?:cliente|client)\s*[:\s]+(.+)/i) ||
                        m.match(/de\s+(.+?)\s*(?:en|del|este|el|la|$)/i);
  const hasClienteRef = /\b(?:cliente|client)\b/.test(m);

  if (/(?:estimados?|presupuestos?)\s+(?:de|del|por)\s+(?:cliente|client)/i.test(m) && clienteMatch) {
    return { action: "estimadosPorCliente", clientName: clienteMatch[1].trim() };
  }
  if (hasClienteRef && /estimados/i.test(m)) {
    const rest = m.replace(/.*?(?:estimados?|presupuestos?)\s*(?:de|del|por)?\s*(?:cliente|client)?\s*/i, "").trim();
    if (rest && rest.length > 1) return { action: "estimadosPorCliente", clientName: rest };
  }

  if (/(?:facturas?)\s+(?:de|del|por)\s+(?:cliente|client)/i.test(m) && clienteMatch) {
    return { action: "facturasPorCliente", clientName: clienteMatch[1].trim() };
  }
  if (hasClienteRef && /facturas/i.test(m)) {
    const rest = m.replace(/.*?facturas?\s*(?:de|del|por)?\s*(?:cliente|client)?\s*/i, "").trim();
    if (rest && rest.length > 1) return { action: "facturasPorCliente", clientName: rest };
  }

  if (/(?:contratos?)\s+(?:de|del|por)\s+(?:cliente|client)/i.test(m) && clienteMatch) {
    return { action: "contratosPorCliente", clientName: clienteMatch[1].trim() };
  }
  if (hasClienteRef && /contratos/i.test(m)) {
    const rest = m.replace(/.*?contratos?\s*(?:de|del|por)?\s*(?:cliente|client)?\s*/i, "").trim();
    if (rest && rest.length > 1) return { action: "contratosPorCliente", clientName: rest };
  }

  if (/(?:info|informacion|datos|detalles?|ver)\s+(?:de|del)?\s*(?:cliente|client)\s+(.+)/i.test(m)) {
    const name = m.replace(/(?:info|informacion|datos|detalles?|ver)\s+(?:de|del)?\s*(?:cliente|client)\s+/i, "").trim();
    if (name && name.length > 1) return { action: "clienteInfo", clientName: name };
  }

  if (/^(?:dame|quiero|muestra|ver)\s+(?:la\s+)?(?:info|informacion|datos|detalles?)\s+(?:de|del)\s+(.+)/i.test(m)) {
    const name = m.replace(/^(?:dame|quiero|muestra|ver)\s+(?:la\s+)?(?:info|informacion|datos|detalles?)\s+(?:de|del)\s+/i, "").trim();
    if (name && name.length > 1 && !/(?:sistema|clientes|estimados|facturas|contratos|backups)/i.test(name)) {
      return { action: "clienteInfo", clientName: name };
    }
  }

  if (/(?:dame|muestra|lista|listar|todos?)\s+(?:los\s+)?clientes/i.test(m)) {
    return { action: "clienteList" };
  }
  if (/(?:dame|muestra|lista|listar|todos?)\s+(?:los\s+)?estimados/i.test(m) && !hasClienteRef) {
    return { action: "estimadoList" };
  }
  if (/(?:dame|muestra|lista|listar|todos?)\s+(?:las\s+)?facturas/i.test(m) && !hasClienteRef) {
    return { action: "facturaList" };
  }
  if (/(?:dame|muestra|lista|listar|todos?)\s+(?:los\s+)?contratos/i.test(m) && !hasClienteRef) {
    return { action: "contratoList" };
  }

  return null;
}

async function executeQuery(intent) {
  switch (intent.action) {
    case "stats": {
      const s = queryTools.getStats();
      return [
        `📊 **Resumen del Sistema**`,
        ``,
        `👥 **Clientes:** ${s.clientes.total} total (${s.clientes.activos} activos)`,
        `📄 **Estimados:** ${s.estimados.total} — Total: ${formatCurrency(s.estimados.monto_total)}`,
        `🧾 **Facturas:** ${s.facturas.total} (${s.facturas.pendientes} pendientes) — Total: ${formatCurrency(s.facturas.monto_total)} — Pendiente: ${formatCurrency(s.facturas.monto_pendiente)}`,
        `📝 **Contratos:** ${s.contratos.total} — Total: ${formatCurrency(s.contratos.monto_total)}`,
      ].join("\n");
    }

    case "recent": {
      const items = queryTools.getRecentActivity(10);
      if (!items.length) return "No hay actividad reciente.";
      return [
        `🕐 **Actividad Reciente** (últimos 10 cambios)`,
        ...items.map((i) => {
          const emoji = i.tipo === "estimado" ? "📄" : "🧾";
          const tipoLabel = i.tipo === "estimado" ? "Estimado" : "Factura";
          return `  ${emoji} **${tipoLabel} #${i.id}** — ${formatDate(i.fecha)} — ${formatCurrency(i.monto)} [${i.estado}]`;
        }),
      ].join("\n");
    }

    case "search": {
      const res = queryTools.search(intent.term);
      const parts = [];
      if (res.clientes.length) {
        parts.push(`👥 **Clientes:**\n${res.clientes.map((c) => `  • **${c.nombre}** — ${c.telefono || ""} [${c.estado}]`).join("\n")}`);
      }
      if (res.estimados.length) {
        parts.push(`📄 **Estimados:**\n${res.estimados.map((e) => `  • #${e.id} — ${e.cliente || ""} — ${formatCurrency(e.monto)} [${e.estado}] — ${formatDate(e.fecha)}`).join("\n")}`);
      }
      if (res.facturas.length) {
        parts.push(`🧾 **Facturas:**\n${res.facturas.map((f) => `  • #${f.id} — ${f.cliente || ""} — ${formatCurrency(f.monto)} [${f.estado}] — ${formatDate(f.fecha)}`).join("\n")}`);
      }
      if (!parts.length) return `No se encontraron resultados para "${intent.term}".`;
      return parts.join("\n\n");
    }

    case "clienteCount": {
      const s = queryTools.getStats();
      return `👥 Tenemos **${s.clientes.total} clientes** registrados en total (${s.clientes.activos} activos).`;
    }

    case "estimadoCount": {
      const s = queryTools.getStats();
      return `📄 Hay **${s.estimados.total} estimados** registrados por un total de ${formatCurrency(s.estimados.monto_total)}.`;
    }

    case "facturaCount": {
      const s = queryTools.getStats();
      return `🧾 Hay **${s.facturas.total} facturas** registradas por un total de ${formatCurrency(s.facturas.monto_total)}.`;
    }

    case "contratoCount": {
      const s = queryTools.getStats();
      return `📝 Hay **${s.contratos.total} contratos** registrados por un total de ${formatCurrency(s.contratos.monto_total)}.`;
    }

    case "facturasPendientes": {
      const rows = queryTools.getAllFacturas(null, null, "pendiente");
      const total = rows.reduce((s, r) => s + (r.monto || 0), 0);
      if (!rows.length) return "✅ No hay facturas pendientes. ¡Todo al día!";
      return `🧾 **${rows.length} facturas pendientes** — Total: ${formatCurrency(total)}\n${rows.map((f) => `  • #${f.id} — ${f.cliente_nombre || ""} — ${formatCurrency(f.monto)} — ${formatDate(f.fecha)}`).join("\n")}`;
    }

    case "estimadosAceptados": {
      const rows = queryTools.getAllEstimados(null, null, "aceptado");
      const total = rows.reduce((s, r) => s + (r.monto || 0), 0);
      if (!rows.length) return "No hay estimados aceptados.";
      return `📄 **${rows.length} estimados aceptados** — Total: ${formatCurrency(total)}\n${rows.map((e) => `  • #${e.id} — ${e.cliente_nombre || ""} — ${formatCurrency(e.monto)} — ${formatDate(e.fecha)}`).join("\n")}`;
    }

    case "estimadosRechazados": {
      const rows = queryTools.getAllEstimados(null, null, "rechazado");
      const total = rows.reduce((s, r) => s + (r.monto || 0), 0);
      if (!rows.length) return "No hay estimados rechazados.";
      return `📄 **${rows.length} estimados rechazados** — Total: ${formatCurrency(total)}\n${rows.map((e) => `  • #${e.id} — ${e.cliente_nombre || ""} — ${formatCurrency(e.monto)} — ${formatDate(e.fecha)}`).join("\n")}`;
    }

    case "clientesActivos": {
      const all = queryTools.getClientes();
      const activos = all.filter((c) => (c.estado || "").toLowerCase() === "activo");
      if (!activos.length) return "No hay clientes activos en este momento.";
      return `👥 **${activos.length} clientes activos**\n${activos.map((c) => `  • **${c.nombre}** — ${c.telefono || ""}`).join("\n")}`;
    }

    case "estimadosPorCliente":
    case "facturasPorCliente":
    case "contratosPorCliente":
    case "clienteInfo": {
      const clientes = queryTools.getClientes(intent.clientName);
      if (!clientes.length) {
        return `No encontré un cliente con el nombre "${intent.clientName}". ¿Puedes verificar el nombre?`;
      }
      const cliente = clientes[0];
      if (intent.action === "clienteInfo") {
        return [
          `👤 **${cliente.nombre}**`,
          `  📍 Dirección: ${cliente.direccion || "Sin dirección"}`,
          `  📞 Teléfono: ${cliente.telefono || "Sin teléfono"}`,
          `  ✉️ Email: ${cliente.email || "Sin email"}`,
          `  🏷️ Estado: **${cliente.estado}**`,
        ].join("\n");
      }
      let rows, label;
      if (intent.action === "estimadosPorCliente") {
        rows = queryTools.getEstimadosByClient(cliente.id);
        label = "estimados";
      } else if (intent.action === "facturasPorCliente") {
        rows = queryTools.getFacturasByClient(cliente.id);
        label = "facturas";
      } else {
        rows = queryTools.getContractsByClient(cliente.id);
        label = "contratos";
      }
      if (!rows.length) return `**${cliente.nombre}** no tiene ${label} registrados.`;
      const total = rows.reduce((s, r) => s + (r.monto || 0), 0);
      return `**${cliente.nombre}** — ${rows.length} ${label} — Total: ${formatCurrency(total)}\n${rows.map((r) => {
        const fields = [`#${r.id}`, formatCurrency(r.monto), r.estado];
        if (r.fecha) fields.push(formatDate(r.fecha));
        if (r.cliente_nombre) fields.unshift(r.cliente_nombre);
        return `  • ${fields.join(" — ")}`;
      }).join("\n")}`;
    }

    case "clienteList": {
      const rows = queryTools.getClientes();
      return formatDataReply(rows, "clientes");
    }

    case "estimadoList": {
      const rows = queryTools.getAllEstimados();
      return formatDataReply(rows, "estimados");
    }

    case "facturaList": {
      const rows = queryTools.getAllFacturas();
      return formatDataReply(rows, "facturas");
    }

    case "contratoList": {
      const rows = queryTools.getAllContracts();
      return formatDataReply(rows, "contratos");
    }

    default:
      return null;
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

exports.chat = async (req, res) => {
  const { message, history, stream } = req.body;
  const configRow = db.prepare("SELECT value FROM config WHERE key = 'openrouter_key'").get();
  const apiKey = configRow ? decrypt(configRow.value) : null;

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ message: "Mensaje inválido." });
  }

  try {
    const intent = parseQueryIntent(message);
    if (intent) {
      const reply = await executeQuery(intent);
      if (reply) {
        const fullReply = `📌 *Datos consultados directamente del sistema de gestión.*\n\n${reply}`;
        if (stream) {
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
          res.write(`data: ${JSON.stringify({ content: fullReply })}\n\n`);
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          return res.end();
        }
        return res.json({ reply: fullReply });
      }
    }
  } catch (queryErr) {
    logger.error("Data query error:", queryErr);
  }

  if (!apiKey) {
    const noKeyReply = "⚠️ **No se ha configurado una API key.**\n\nPuedo ayudarte con consultas de **datos locales** del sistema:\n- Resumen general del sistema\n- Consultar clientes, estimados, facturas o contratos\n- Buscar información\n- Actividad reciente\n\nPara activar el chat conversacional, ve a **Configuración** (engranaje ⚙️ en la barra superior) y agrega tu API key de OpenRouter.";
    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.write(`data: ${JSON.stringify({ content: noKeyReply })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      return res.end();
    }
    return res.json({ reply: noKeyReply });
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...(Array.isArray(history) ? history : []),
    { role: "user", content: message.trim() },
  ];

  try {
    const orResponse = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:4000",
        "X-Title": "MAKE IT TO HAPPEN LLC",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        max_tokens: 2048,
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!orResponse.ok) {
      const errText = await orResponse.text();
      logger.error("OpenRouter error:", orResponse.status, errText);
      return res.status(502).json({ message: "Error al contactar el asistente. Intenta de nuevo." });
    }

    if (!stream) {
      const fullReply = await collectStream(orResponse.body);
      const reply = fullReply || "El asistente no generó una respuesta.";
      return res.json({ reply });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = orResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const jsonStr = trimmed.slice(6);
        if (jsonStr === "[DONE]") break;

        try {
          const chunk = JSON.parse(jsonStr);
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    logger.error("AI chat error:", err);
    if (!stream) {
      return res.status(502).json({ message: "Error de conexión con el asistente. Verifica tu conexión a internet." });
    }
    res.write(`data: ${JSON.stringify({ error: "Error de conexión." })}\n\n`);
    res.end();
  }
};

async function collectStream(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const jsonStr = trimmed.slice(6);
      if (jsonStr === "[DONE]") break;
      try {
        const chunk = JSON.parse(jsonStr);
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) full += content;
      } catch { /* skip */ }
    }
  }
  return full;
}
