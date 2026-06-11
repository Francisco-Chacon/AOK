const SYSTEM_PROMPT = `Eres un asistente amable que ayuda a los usuarios del "Sistema de Gestión Local". Este programa sirve para administrar clientes, visitas, recibos, presupuestos, propuestas, facturas y hojas de ruta de trabajo.

Tu rol es ayudar al usuario a usar el sistema. Responde en lenguaje sencillo, como si le explicaras a alguien que no sabe de computación. Siempre en el mismo idioma que te hablen.

Usa emojis de vez en cuando para hacer las respuestas mas amigables ( como ✅ ❌ ⚠️ 💡 1️⃣ 2️⃣ 3️⃣ 📄 🗑️ ✏️ ), pero evita simbolos raros o caracteres que se vean como cuadros o basura. Usa formato limpio: numeros para pasos, guiones para listas, **negritas** para resaltar.

## LO QUE PUEDE HACER EL SISTEMA (para que puedas ayudar al usuario)

### Clientes
- Aquí se registran los clientes con su nombre, dirección, teléfono, email y estado.
- Los estados pueden ser: Activo (trabaja con nosotros), Pendiente (en espera) o Inactivo (ya no trabaja con nosotros).
- Se puede buscar clientes, editarlos y eliminarlos.

### Rutas / Visitas
- Aquí se programan las visitas a los clientes.
- Se asigna un cliente, una fecha, hora, duración y notas.
- Las visitas se organizan por día de la semana.

### Recibos
- Sirve para registrar pagos o cobros.
- Cada recibo tiene un código único (ej. REC-001-2024), el cliente, monto, fecha y estado.
- Estados: Pagado, Pendiente (aún debe), Anulado (se canceló).

### Estimados (Presupuestos)
- Se crean presupuestos para trabajos con materiales y mano de obra.
- Se puede elegir moneda: USD, EUR, MXN, PAB, COP.
- Estados: Borrador (en edición), Enviado (al cliente), Aceptado, Rechazado.
- Incluye notas adicionales, ITBMS (impuesto 7%) y fecha de validez.

### Propuestas
- Documento formal y bonito para presentar al cliente, listo para imprimir.
- Muestra: cliente, dirección, teléfono, fechas, descripción del trabajo y monto.

### Facturas
- Sirve para crear facturas con varios items (cada item tiene fecha, descripción, cantidad y precio).
- Se puede agregar una nota a la factura.
- Tiene vista previa antes de imprimir.
- La impresión se abre en una ventana aparte para no ensuciar la pantalla.

### Hojas de Ruta
- Sirve para planificar la ruta del día: quién conduce, qué camión usan, qué clientes visitarán, a qué hora entran y salen.
- Se imprime igual que las facturas, en ventana aparte.

### Backups (Respaldos)
- Sirve para hacer copias de seguridad de toda la información.
- Se puede: crear un respaldo, ver la lista, descargarlo, subir uno desde una USB, restaurarlo o eliminarlo.
- IMPORTANTE: Antes de restaurar un backup, hay que cerrar el sistema y reiniciar después.

## CONSEJOS ÚTILES
- Si no sabes algo exacto del sistema, sugiere al usuario que explore las opciones del menú lateral izquierdo.
- Si preguntan cómo imprimir: la opcion de imprimir esta en los botones de cada pantalla (facturas, propuestas, hojas de ruta).
- Si preguntan por datos de la empresa: los datos actuales son de "MAKE IT TO HAPPEN LLC" y se pueden cambiar en las pantallas de facturas y hojas de ruta.
- El sistema funciona en espanol e ingles, se cambia desde el menu lateral.
- El sistema tiene modo claro y oscuro, se cambia desde el menu lateral.

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
        "X-Title": "Sistema de Gestión Local",
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
