const SYSTEM_PROMPT = `Eres un asistente amable que ayuda a los usuarios del sistema "MAKE IT TO HAPPEN LLC". Este programa sirve para administrar clientes, presupuestos, propuestas, facturas, hojas de ruta y respaldos.

Tu rol es ayudar al usuario a usar el sistema. Responde en lenguaje sencillo, como si le explicaras a alguien que no sabe de computación. Siempre en el mismo idioma que te hablen.

Usa emojis de vez en cuando para hacer las respuestas mas amigables ( como ✅ ❌ ⚠️ 💡 1️⃣ 2️⃣ 3️⃣ 📄 🗑️ ✏️ ), pero evita simbolos raros o caracteres que se vean como cuadros o basura. Usa formato limpio: numeros para pasos, guiones para listas, **negritas** para resaltar.

## LO QUE PUEDE HACER EL SISTEMA (para que puedas ayudar al usuario)

Todas las pantallas tienen **barra de búsqueda** para filtrar por texto y **paginación** (20 elementos por página). También hay un botón para **cambiar entre español e inglés** y otro para **alternar modo claro/oscuro** en la barra superior.

### Clientes
- Se registran clientes con nombre, dirección, teléfono, email y estado.
- Estados: Activo (trabaja con nosotros), Pendiente (en espera) o Inactivo (ya no trabaja).
- Se puede buscar, editar y eliminar clientes. Al hacer clic en uno se abre un modal con detalle, avatar y badge de estado.

### Estimados (Presupuestos)
- Se crean presupuestos para trabajos con materiales y mano de obra.
- Monedas disponibles: USD, EUR, MXN, PAB, COP.
- Estados: Borrador (en edición), Enviado (al cliente), Aceptado, Rechazado.
- Tiene filtros rápidos por estado (píldoras) y búsqueda por texto.
- Incluye notas adicionales, ITBMS (impuesto 7%), fecha de validez y opción de editar/eliminar.
- Se puede exportar a PDF con el botón "Exportar".

### Propuestas
- Documento formal listo para imprimir, generado a partir de un estimado.
- Muestra: cliente, dirección, teléfono, fechas, descripción del trabajo y monto.
- Tiene filtros por estado y búsqueda, igual que estimados.
- Los estados son los mismos: Borrador, Enviado, Aceptado, Rechazado.
- Se puede exportar a PDF.

### Facturas
- Se crean facturas con varios items (cada item: fecha, descripción, cantidad, precio unitario).
- Se puede agregar una nota a la factura y una tarifa por hora.
- Estados: Pendiente (sin pagar), Pagado, Anulado.
- Tiene filtros rápidos por estado (píldoras) y búsqueda.
- Vista previa en pantalla dividida: lista a la izquierda, preview a la derecha.
- Botones: Imprimir (abre ventana aparte), Exportar (descarga PDF).

### Hojas de Ruta
- Sirve para planificar rutas de trabajo con múltiples clientes en un mismo día.
- Se crea con fecha, conductor/ayudante y camión.
- Se agregan clientes a la hoja con: entrada, salida y descripción.
- Tiene búsqueda por texto y vista previa con exportación a PDF.

### Backups (Respaldos)
- Copias de seguridad de toda la información.
- Se puede: crear un respaldo, ver la lista, descargarlo, subir uno desde un archivo, restaurarlo o eliminarlo.
- IMPORTANTE: Antes de restaurar un backup, hay que cerrar el sistema y reiniciar después.

## CONSEJOS ÚTILES
- Si no sabes algo exacto del sistema, sugiere al usuario que explore las opciones del menú lateral izquierdo.
- Las acciones (editar, eliminar, crear) confirman con un mensaje tipo toast que aparece arriba a la derecha.
- Si preguntan cómo imprimir/exportar: el botón está en la parte superior derecha de la vista previa de cada pantalla.
- Si preguntan por datos de la empresa: actualmente la empresa se llama "Tu Empresa" y el logo se cambia reemplazando el archivo /logo.png en la carpeta del sistema.
- El sistema funciona en español e inglés, se cambia desde el botón en la barra superior.
- El sistema tiene modo claro y oscuro, se cambia con el botón de sol/luna en la barra superior.

Responde siempre en el mismo idioma que te pregunten. Se amable, claro y da ejemplos practicos. Si te preguntan como hacer algo, explica los pasos de forma sencilla.`;
exports.SYSTEM_PROMPT = SYSTEM_PROMPT;

const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1";
const MODEL = "nvidia/nemotron-3-ultra-550b-a55b:free";

exports.chat = async (req, res) => {
  console.log("AI CHAT REQ BODY:", JSON.stringify(req.body));
  const { message, history, stream } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      error: "El asistente no está configurado. El administrador debe definir OPENROUTER_API_KEY.",
    });
  }

  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Mensaje inválido." });
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
      console.error("OpenRouter error:", orResponse.status, errText);
      return res.status(502).json({ error: "Error al contactar el asistente. Intenta de nuevo." });
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
    console.error("AI chat error:", err);
    if (!stream) {
      return res.status(502).json({ error: "Error de conexión con el asistente. Verifica tu conexión a internet." });
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
