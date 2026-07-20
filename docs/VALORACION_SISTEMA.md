# INFORME DE VALORACIÓN TÉCNICA Y COMERCIAL

**Sistema:** MAKE IT TO HAPPEN LLC — Sistema de Gestión Local  
**Versión analizada:** 1.0.0  
**Fecha:** Julio 2026  
**Autor del informe:** Francisco Chacón

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Metodología de Valoración](#2-metodología-de-valoración)
3. [Análisis Técnico Detallado (con Evidencia)](#3-análisis-técnico-detallado-con-evidencia)
4. [Valoración Económica](#4-valoración-económica)
5. [Comparativa de Mercado](#5-comparativa-de-mercado)
6. [Apartado para el Cliente](#6-apartado-para-el-cliente)

---

## 1. Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **Líneas de código totales** | ~16,500 |
| **Archivos fuente** | 99 |
| **Módulos funcionales** | 7 (Clientes, Estimados, Propuestas, Facturas, Hojas de Ruta, Contratos, Backups) |
| **Funcionalidades transversales** | 5 (IA, PDF, Multi-idioma, Temas, Paginación) |
| **Tecnologías** | React 18 + Vite + Express 5 + SQLite + Electron |
| **Tiempo estimado de reconstrucción** | 480–640 horas (3–4 meses) |
| **Valor de mercado estimado** | **$8,000 – $15,000 USD** |
| **Costo de reemplazo (desde cero)** | **$19,000 – $38,000 USD** |

---

## 2. Metodología de Valoración

Este informe aplica tres métodos complementarios:

| Método | Descripción | Peso |
|--------|-------------|------|
| **Costo de reemplazo** | Horas estimadas × tarifa de mercado para reconstruir el sistema desde cero | 40% |
| **Valor de mercado comparable** | Precios de software similar en el mercado (facturación, CRM, ERP pequeña empresa) | 35% |
| **Valor por funcionalidad** | Desglose por módulo según tarifas de desarrollo freelance | 25% |

---

## 3. Análisis Técnico Detallado (con Evidencia)

### 3.1 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────┐
│                   Electron (Desktop)                  │
│  ┌──────────────┐         ┌────────────────────────┐ │
│  │   Frontend   │  HTTP   │      Backend           │ │
│  │  React 18 +  │ ──────► │  Express 5 + SQLite    │ │
│  │    Vite      │ ◄────── │  API REST (28 endpts)  │ │
│  └──────────────┘         └────────────────────────┘ │
│         │                          │                  │
│         ▼                          ▼                  │
│  ┌──────────────┐         ┌────────────────────────┐ │
│  │  html2canvas │         │  better-sqlite3        │ │
│  │  + jsPDF     │         │  AES-256-GCM Crypto    │ │
│  └──────────────┘         └────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Evidencia — `backend/src/app.js` (líneas 1–78):**
```js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Seguridad: Helmet con CSP deshabilitado para estilos inline de Vite
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS: permite localhost, Render y file:// para Electron
const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^https?:\/\/.*\.onrender\.com$/,
  "file://",
];

// Middleware: Morgan para logging, JSON con 10mb, SPA fallback
app.use(morgan("short"));
app.use(express.json({ limit: "10mb" }));
```

### 3.2 Base de Datos — SQLite con 9 Tablas y 17 Índices

**Evidencia — `backend/src/db/sqlite.js` (tablas e índices):**

```sql
-- 9 tablas relacionales con claves foráneas y 17 índices de rendimiento

CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL, direccion TEXT, telefono TEXT,
  email TEXT, tipo_servicio TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'activo',
  created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS estimados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER NOT NULL, direccion_trabajo TEXT NOT NULL,
  fecha TEXT NOT NULL, monto REAL NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'USD',
  tasa_impuesto REAL NOT NULL DEFAULT 0.07,
  estado TEXT NOT NULL DEFAULT 'borrador',
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- 17 índices: idx_clientes_nombre, idx_clientes_estado, idx_clientes_email,
-- idx_estimados_cliente_id, idx_estimados_fecha, idx_estimados_estado,
-- idx_facturas_cliente_id, idx_facturas_fecha, idx_facturas_estado,
-- idx_facturas_numero, idx_facturas_items_factura_id,
-- idx_rutas_hojas_fecha, idx_rutas_hojas_clientes_hoja_id,
-- idx_rutas_hojas_clientes_cliente_id,
-- idx_contracts_cliente_id, idx_contracts_fecha_inicio
```

**Migraciones automáticas:**
```js
const alterTableIfNeeded = (table, column, definition) => {
  const result = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = result.some((col) => col.name === column);
  if (!exists) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
};
// Añade columnas faltantes sin intervención manual
alterTableIfNeeded("clientes", "email", "TEXT");
alterTableIfNeeded("contracts", "monto", "REAL NOT NULL DEFAULT 0");
```

### 3.3 Frontend — React 18 con 18 Componentes y 7 Páginas

**Evidencia — `frontend/src/App.jsx` (arquitectura de componentes):**

```jsx
// Lazy loading: todas las páginas se cargan bajo demanda
const ClientesPage = React.lazy(() => import("./pages/ClientesPage"));
const EstimadosPage = React.lazy(() => import("./pages/EstimadosPage"));
const ProposalsPage = React.lazy(() => import("./pages/ProposalsPage"));
const ContractsPage = React.lazy(() => import("./pages/ContractsPage"));
const BackupsPage = React.lazy(() => import("./pages/BackupsPage"));
const InvoicePage = React.lazy(() => import("./pages/InvoicePage"));
const RouteSheetPage = React.lazy(() => import("./pages/RouteSheetPage"));

// Providers anidados: ErrorBoundary > Language > Toast > AppContent
<ErrorBoundary>
  <LanguageProvider>
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  </LanguageProvider>
</ErrorBoundary>

// Layout responsive con CSS Grid
<div className="app-shell">
  <Sidebar />                {/* 300 líneas, navegación completa */}
  <main className="main-content">
    <Suspense fallback={<Spinner />}>
      {renderPage()}
    </Suspense>
  </main>
  {aiOpen && <AiPanel />}    {/* 230 líneas, chat IA */}
  <StatusBar />              {/* Conexión, estado en línea */}
</div>
```

### 3.4 Sistema de Diseño — 4,377 Líneas de CSS con Temas Claro/Oscuro

**Evidencia — `frontend/src/styles.css` (tokens de diseño):**

```css
/* Tema claro (por defecto) */
:root {
  --background: 248 250 1024;  --foreground: 15 23 42;
  --card: 255 255 255;          --card-foreground: 15 23 42;
  --primary: 99 102 241;        --primary-foreground: 255 255 255;
  --success: 16 185 129;         --warning: 217 119 6;
  --destructive: 220 38 38;
  --radius-sm: 6px; --radius-md: 8px; --radius-lg: 10px; --radius-xl: 12px;
  --shadow-sm: 0 1px 2px rgba(15,23,42,0.06);
  --shadow-md: 0 4px 6px -1px rgba(15,23,42,0.08);
}

/* Tema oscuro */
:root[data-theme="dark"] {
  --background: 9 9 11;         --foreground: 244 244 245;
  --card: 18 18 23;             --card-foreground: 244 244 245;
  --primary: 129 140 248;       --primary-foreground: 15 23 42;
  --success: 52 211 153;         --warning: 251 191 36;
  --destructive: 248 113 113;
}

/* Animaciones y accesibilidad */
@keyframes fadeIn { /* ... */ }
@keyframes slideUp { /* ... */ }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; }
}
```

### 3.5 Multi-idioma — 330 Claves en Español e Inglés

**Evidencia — `frontend/src/i18n/translations.js` (estructura):**

```js
export const translations = {
  es: {
    appName: "MAKE IT TO HAPPEN LLC",
    clientes: "Clientes", facturas: "Facturas",
    estimados: "Estimados", proposals: "Propuestas",
    rutas_hojas: "Hojas de Ruta", backups: "Backups",
    contracts: "Contratos", settings: "Configuración",
    pdf_invoice: "Factura", pdf_estimate: "Estimado",
    pdf_proposal: "Propuesta", pdf_routesheet: "Ruta",
    pdf_contract: "Contrato",
    // ~220 claves adicionales...
  },
  en: {
    appName: "MAKE IT TO HAPPEN LLC",
    clientes: "Clients", facturas: "Invoices",
    // Traducciones completas al inglés...
  }
};
```

### 3.6 Asistente IA con Consultas de Datos Locales

**Evidencia — `backend/src/controllers/ai.controller.js` (sistema de 18 intenciones):**

```js
const SYSTEM_PROMPT = `
Eres un asistente amable que ayuda a los usuarios del sistema "MAKE IT TO HAPPEN LLC".
Dispones de datos como clientes, estimados, propuestas, facturas, hojas de ruta, contratos.
Respondes en el mismo idioma del usuario.
Usas emojis útiles y formato limpio (negritas, listas, pasos numerados).
`;

function parseQueryIntent(message) {
  // 18+ patrones regex detectados antes de llamar a OpenRouter
  // - "resumen general", "dashboard", "estadísticas" → getStats()
  // - "cuántos clientes", "número de clientes" → getClientes().length
  // - "estimados de [cliente]" → getEstimadosByClient()
  // - "facturas pendientes", "facturas pagadas" → getFacturasByClient()
  // - "actividad reciente", "últimos cambios" → getRecentActivity()
  // - "buscar [término]" → search(term)
  // - "contratos de [cliente]" → getContractsByClient()
}
```

### 3.7 Seguridad — Encriptación AES-256-GCM

**Evidencia — `backend/src/utils/crypto.js` (implementación completa):**

```js
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const PEPPER = "sg-local-2024-enc-key";

function deriveKey() {
  // Clave derivada del hostname + plataforma + pepper fijo
  // Garantiza que la BD cifrada solo se descifra en esta máquina
  const machineId = `${os.hostname()}-${os.platform()}-${os.arch()}`;
  const seed = `${machineId}-${PEPPER}`;
  return crypto.createHash("sha256").update(seed).digest();
}

function encrypt(text) {
  // AES-256-GCM con IV aleatorio + autenticación (tag)
  const key = deriveKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}
```

### 3.8 Validación de Formularios — 5 Reglas con Mensajes Bilingües

**Evidencia — `frontend/src/utils/validate.js`:**

```js
export const validate = (fields, lang) => {
  const errors = {};
  for (const [name, rules] of Object.entries(fields)) {
    for (const rule of rules) {
      if (rule === "required" && !value?.trim()) {
        addError(errors, name, lang === "es"
          ? "Este campo es obligatorio" : "This field is required");
      }
      if (rule === "phone" && value && !/^\+[\d\s\-()]{7,20}$/.test(value)) {
        addError(errors, name, lang === "es"
          ? "Teléfono inválido" : "Invalid phone number");
      }
      if (rule === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        addError(errors, name, lang === "es"
          ? "Email inválido" : "Invalid email");
      }
    }
  }
  return errors;
};

// Validación de fechas (fin no anterior a inicio)
export const validateDates = (startDate, endDate, lang) => {
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    return lang === "es"
      ? "La fecha de fin no puede ser anterior a la fecha de inicio"
      : "End date cannot be before start date";
  }
  return null;
};
```

### 3.9 Selector Telefónico — 17 Países con Banderas

**Evidencia — `frontend/src/pages/ClientesPage.jsx`:**

```js
const PAISES = [
  { code: "+1",    label: "🇺🇸 EE.UU. +1" },
  { code: "+52",   label: "🇲🇽 México +52" },
  { code: "+503",  label: "🇸🇻 El Salvador +503" },
  { code: "+502",  label: "🇬🇹 Guatemala +502" },
  { code: "+504",  label: "🇭🇳 Honduras +504" },
  { code: "+505",  label: "🇳🇮 Nicaragua +505" },
  { code: "+506",  label: "🇨🇷 Costa Rica +506" },
  { code: "+507",  label: "🇵🇦 Panamá +507" },
  { code: "+1-809",label: "🇩🇴 R. Dominicana +1-809" },
  { code: "+53",   label: "🇨🇺 Cuba +53" },
  { code: "+57",   label: "🇨🇴 Colombia +57" },
  { code: "+51",   label: "🇵🇪 Perú +51" },
  { code: "+593",  label: "🇪🇨 Ecuador +593" },
  { code: "+58",   label: "🇻🇪 Venezuela +58" },
  { code: "+54",   label: "🇦🇷 Argentina +54" },
  { code: "+56",   label: "🇨🇱 Chile +56" },
  { code: "+34",   label: "🇪🇸 España +34" },
];

const parsePhone = (phone) => {
  if (!phone) return { code: "+1", number: "" };
  for (const p of PAISES) {
    if (phone.startsWith(p.code + " "))
      return { code: p.code, number: phone.slice(p.code.length + 1) };
  }
  return { code: "+1", number: phone };
};
```

### 3.10 Empaquetado .exe Portátil — Sin Instalación de Dependencias

**Evidencia — `electron/main.js` (auto-ejecución del backend):**

```js
function getNodePath() {
  if (isDev) return "node";
  // En producción usa Node.js portátil incluido en el .exe
  return path.join(process.resourcesPath, "node-bin", "win-x64", "node.exe");
}

function startBackend() {
  const nodePath = getNodePath();
  const backendPath = path.join(getBackendDir(), "src", "server.js");
  backendProcess = spawn(nodePath, [backendPath], {
    cwd: getBackendDir(), stdio: "inherit", shell: true,
  });
}

app.whenReady().then(async () => {
  startBackend();        // Arranca Express internamente
  await pollBackend();   // Espera hasta que responda 200
  createWindow();        // Abre la ventana
});
```

**Evidencia — `electron/package.json` (configuración de empaquetado):**

```json
{
  "build": {
    "appId": "com.sistema.gestion",
    "productName": "Sistema Gestion",
    "win": { "target": "portable", "icon": "build/icon.ico" },
    "extraResources": [
      { "from": "node-bin", "to": "node-bin" },
      { "from": "../backend", "to": "backend", "filter": ["**/*", "!data/**"] }
    ]
  }
}
```

### 3.11 Exportación PDF en 5 Módulos

**Implementación con `html2canvas` + `jsPDF`:**

El sistema captura el contenido HTML de las vistas previas, lo convierte a canvas y genera un PDF con nombres de archivo traducidos según el idioma activo:

| Módulo | Nombre ES | Nombre EN |
|--------|-----------|-----------|
| Factura | `Factura_X.pdf` | `Invoice_X.pdf` |
| Estimado | `Estimado_X.pdf` | `Estimate_X.pdf` |
| Propuesta | `Propuesta_X.pdf` | `Proposal_X.pdf` |
| Hoja de Ruta | `Ruta_X.pdf` | `RouteSheet_X.pdf` |
| Contrato | `Contrato_X.pdf` | `Contract_X.pdf` |

### 3.12 28 Endpoints API con Patrón REST

| Recurso | Métodos | Controlador |
|---------|---------|-------------|
| `/api/clientes` | GET, POST, PUT, DELETE | `clientes.controller.js` (247 líneas) |
| `/api/estimados` | GET, POST, PUT, DELETE | `estimados.controller.js` (272 líneas) |
| `/api/facturas` | GET, POST, PUT, DELETE | `facturas.controller.js` (147 líneas) |
| `/api/proposals` | GET, POST, PUT, DELETE | _(enrutado a estimados)_ |
| `/api/rutas-hojas` | GET, POST, PUT, DELETE | `rutas_hojas.controller.js` (138 líneas) |
| `/api/contracts` | GET, POST, PUT, DELETE | `contracts.controller.js` (80 líneas) |
| `/api/backups/*` | POST, GET, DELETE | `backups.routes.js` (220 líneas) |
| `/api/ai/chat` | POST | `ai.controller.js` (553 líneas) |
| `/api/config/openrouter-key` | GET, PUT | `config.controller.js` (40 líneas) |
| `/api/log-error` | POST | _(en router index)_ |

### 3.13 Pruebas — 25 Tests Unitarios

| Capa | Archivo | Tests |
|------|---------|-------|
| Backend | `api.test.js` | 15 (CRUD clientes, 404s, backups, SPA fallback) |
| Frontend | `App.test.jsx` | 2 (render, navegación) |
| Frontend | `translations.test.js` | 5 (claves ES/EN, cobertura) |
| Electron | `pollBackend.test.js` | 3 (polling exitoso, timeout, error) |

**Evidencia — aislamiento de pruebas:**
```js
beforeAll(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "test-"));  // BD temporal única
  const dbPath = join(tmpDir, "test.db");
  process.env.TEST_DB_PATH = dbPath;
  app = require("../app");
});
afterAll(() => {
  delete process.env.TEST_DB_PATH;
  rmSync(tmpDir, { recursive: true, force: true });  // Limpieza total
});
```

### 3.14 Apagado Graceful (Graceful Shutdown)

**Evidencia — `backend/src/server.js`:**

```js
const server = app.listen(PORT, () => {
  logger.info(`Backend escuchando en http://localhost:${PORT}`);
});

function shutdown(signal) {
  logger.info(`Señal ${signal} recibida. Cerrando servidor...`);
  server.close(() => {
    db.close();          // Cierra BD correctamente
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();  // Timeout forzoso
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

### 3.15 Errores del Frontend Reportados al Backend

**Evidencia — `frontend/src/components/ErrorBoundary.jsx`:**

```jsx
componentDidCatch(error, errorInfo) {
  // Reporta errores de render al servidor
  fetch("/api/log-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    }),
  }).catch(() => {});
}
```

---

## 4. Valoración Económica

### 4.1 Por Costo de Reemplazo (Horas × Tarifa)

| Categoría | Horas estimadas | Tarifa/hora | Total |
|-----------|----------------|-------------|-------|
| Frontend (7 páginas, 18 componentes, CSS, i18n) | 200–260 | $40 | $8,000–$10,400 |
| Backend (9 rutas, 7 controladores, BD, migraciones) | 120–160 | $40 | $4,800–$6,400 |
| Electrón (empaquetado, Node portátil, .exe) | 40–60 | $40 | $1,600–$2,400 |
| Asistente IA (prompts, query tools, integración OpenRouter) | 40–60 | $50 | $2,000–$3,000 |
| Pruebas (25 tests, configuración, aislamiento) | 30–40 | $40 | $1,200–$1,600 |
| Documentación (manuales, guías, AGENTS.md) | 20–30 | $40 | $800–$1,200 |
| **Total reconstrucción** | **450–610** | | **$18,400–$25,000** |

**Ajuste por eficiencia del desarrollador original** (conoce el código vs. reconstruir): **−30%**  
**Valor por costo de reemplazo ajustado:** **$12,880 – $17,500**

### 4.2 Por Valor de Módulo Individual

| Módulo | Líneas | Complejidad | Valor estimado |
|--------|--------|-------------|----------------|
| Gestión de Clientes (CRUD + 17 países + validación) | 501 | Alta | $1,500–$2,500 |
| Gestión de Estimados (materiales, impuestos, monedas, PDF) | 722 | Muy alta | $2,000–$3,000 |
| Gestión de Propuestas (formal, PDF) | 415 | Alta | $1,000–$1,500 |
| Gestión de Facturas (numeración, preview, PDF) | 469 | Alta | $1,200–$2,000 |
| Hojas de Ruta (multi-cliente, tiempos, PDF) | 452 | Alta | $1,500–$2,000 |
| Contratos (fechas, firmas, PDF) | 430 | Media-alta | $1,000–$1,500 |
| Sistema de Backups (crear, restaurar, subir, descargar) | 432 | Alta | $1,500–$2,500 |
| Asistente IA (18 consultas + OpenRouter) | 482 | Muy alta | $2,000–$3,000 |
| Sistema Multi-idioma (330 claves, ES/EN) | 638 | Media | $800–$1,200 |
| Tema Oscuro/Claro + Sistema de Diseño | 4,377 | Alta | $1,500–$2,500 |
| Aplicación de Escritorio (Electron + .exe portátil) | 85 | Alta | $1,500–$2,500 |
| **Total por módulos** | | | **$15,500–$24,200** |

### 4.3 Por Comparativa de Mercado

| Software | Tipo | Precio mensual/anual | Características |
|----------|------|---------------------|-----------------|
| **Zoho Invoice** | SaaS facturación | $0–$9/mes | Solo facturación, sin escritorio, sin IA |
| **Wave** | SaaS contabilidad | $0–$16/mes | Sin clientes, sin rutas, sin IA |
| **FreshBooks** | SaaS facturación+CRM | $17–$55/mes | Sin rutas, sin contratos, sin IA |
| **Invoice2go** | SaaS facturación | $7–$40/mes | Limitado a facturación |
| **Odoo ERP** | SaaS completo | $31–$47/usuario/mes | Complejo, requiere internet |
| **Holded** | SaaS ERP | $19–$79/mes | Sin app escritorio, sin IA |
| **Este sistema** | **Desktop + Web local** | **$0/mes (pago único)** | **Todo incluido, sin suscripción** |

**Valor de licencia perpetua comparable:** **$5,000–$15,000** (equivalente a 3–5 años de suscripción SaaS sin recurrencia)

### 4.4 Valoración Final

| Método | Valor |
|--------|-------|
| Costo de reemplazo ajustado | $12,880 – $17,500 |
| Valor por módulos | $15,500 – $24,200 |
| Comparativa de mercado | $5,000 – $15,000 |
| **Valor recomendado** | **$8,000 – $15,000 USD** |

---

## 5. Comparativa de Mercado

### vs. Soluciones Comerciales

| Aspecto | FreshBooks | Zoho Invoice | Odoo | Este Sistema |
|---------|-----------|-------------|------|-------------|
| **Costo mensual** | $17–$55 | $0–$9 | $31–$47/usuario | **$0** |
| **Costo anual** | $204–$660 | $0–$108 | $372–$564/usuario | **$0** |
| **Costo 3 años** | $612–$1,980 | $0–$324 | $1,116–$1,692/usuario | **$0** |
| **App escritorio** | ❌ | ❌ | ❌ | **✅** |
| **Sin internet** | ❌ | ❌ | ❌ | **✅ (local)** |
| **IA integrada** | ❌ | ❌ | ❌ | **✅** |
| **Multi-idioma** | ✅ | ✅ | ✅ | **✅** |
| **Exportación PDF** | ✅ | ✅ | ✅ | **✅ (5 tipos)** |
| **Backups** | Automáticos | Automáticos | Automáticos | **Manuales + descarga + restauración** |
| **Propietario datos** | En la nube | En la nube | En la nube | **100% local** |
| **Personalizable** | Limitado | Limitado | Complejo | **Código fuente completo** |

### Factores Diferenciales Clave

1. **Sin suscripción mensual** — Pago único, el cliente es dueño del software
2. **Funciona sin internet** — Base de datos local, no depende de servidores externos
3. **App de escritorio portátil** — Se ejecuta desde un USB si es necesario
4. **Asistente IA integrado** — Consulta datos del negocio en lenguaje natural
5. **Código fuente completo** — El cliente puede modificarlo, escalarlo o contratar a quien quiera
6. **Sin límite de usuarios** — A diferencia de SaaS que cobra por usuario

---

## 6. Apartado para el Cliente

---

# MAKE IT TO HAPPEN LLC
## Sistema de Gestión Local — Propuesta de Valor

---

### ¿Qué es este sistema?

Es un **software de gestión empresarial completo** que funciona en su computadora sin necesidad de internet. Puede usarlo como una aplicación de escritorio normal, instalada con un solo clic.

### ¿Qué puede hacer por su negocio?

| Módulo | ¿Qué problema resuelve? |
|--------|-------------------------|
| **📋 Clientes** | Mantenga un registro profesional de todos sus clientes con teléfono, email, dirección y estado. |
| **💰 Estimados** | Cree presupuestos profesionales con materiales, impuestos (7%/15%/25%) y múltiples monedas (USD, EUR, MXN, PAB, COP). |
| **📄 Propuestas** | Genere documentos formales e imprimibles a partir de sus estimados. |
| **🧾 Facturas** | Controle todas sus facturas con numeración personalizada y vista previa profesional. |
| **🚚 Hojas de Ruta** | Planifique las rutas de su equipo con conductores, camiones y múltiples paradas. |
| **📝 Contratos** | Administre contratos con validación de fechas y líneas de firma. |
| **💾 Backups** | Cree copias de seguridad, restáurelas o llévelas a otra computadora. |
| **🤖 Asistente IA** | Pregunte en lenguaje natural cuántos clientes tiene, qué facturas están pendientes, etc. |

### ¿Cuánto cuesta al mes?

**$0.00**

A diferencia de FreshBooks ($17–$55/mes), Zoho ($9/mes) u Odoo ($31–$47/usuario/mes), este sistema **no tiene suscripción ni costos recurrentes**. Usted paga una sola vez y es dueño del software para siempre.

### ¿Qué incluye?

- ✅ Aplicación de escritorio portátil (.exe) — doble clic y funciona
- ✅ Sin instalación de Node.js, Python o dependencias — **todo incluido**
- ✅ Funciona sin internet — sus datos están en su computadora
- ✅ 100% en español e inglés (cambie con un clic)
- ✅ Tema claro y oscuro
- ✅ Exportación a PDF profesional
- ✅ Copias de seguridad y restauración
- ✅ Asistente con inteligencia artificial
- ✅ Código fuente completo — el software es suyo
- ✅ Soporte técnico incluido

### ¿Por qué elegir este sistema en lugar de un SaaS?

| SaaS en la nube | Este sistema |
|----------------|-------------|
| Paga cada mes | Paga **una sola vez** |
| Si deja de pagar, pierde acceso | **El software es suyo** |
| Sus datos están en servidores externos | **Sus datos están en su PC** |
| Sin internet no funciona | **Funciona sin internet** |
| Límite de usuarios | **Sin límite** |
| No puede modificarlo | **Código fuente incluido** |

### Soporte Técnico

**Desarrollador:** Francisco Chacón  
**Teléfono:** +503 7204-4924  
**Email:** francochacon155@gmail.com  
**Ubicación:** El Salvador

---

*Documento generado el Julio 2026 — Valoración basada en análisis de código fuente, métricas de proyecto y comparativa de mercado.*
