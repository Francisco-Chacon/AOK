# AGENTS.md — Sistema de Gestión Local

## Stack & Límites

- **Monorepo** con 3 workspaces: `frontend/` (React 18 + Vite), `backend/` (Express 5 + better-sqlite3), `electron/`
- El `package.json` raíz orquesta con `concurrently`. `npm run dev` inicia frontend + backend.
- **División de módulos**: backend usa CommonJS (`require`), frontend usa ESM (`import`/`export`).
- **Router**: Todo el backend usa `express.Router()` (el paquete `router` fue eliminado).
- **Dirección futura**: componentes nuevos en TypeScript/TSX; JSX existente se puede migrar gradualmente.
- **Dashboard**: no implementado (eliminado). La app abre por defecto en `InvoicePage.jsx`.
- **PDF**: exportación en frontend con `html2canvas` + `jsPDF`. Los nombres de archivo se traducen según el idioma activo.

## Comandos (ejecutar desde la raíz)

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Frontend (Vite :5173) + Backend (Express :4000) vía concurrently |
| `npm run build` | Compila frontend a `backend/public/` (se sirve como estático en producción) |
| `npm run dev:electron` | Abre ventana Electron, lanza backend como proceso hijo |
| `npm run dist` | `npm run build` + empaqueta Electron .exe portátil |
| `cd backend && npm run init-db` | Crea tablas si faltan (se ejecuta automáticamente al iniciar backend) |
| `npm run dist:full` | Instala deps backend + build frontend + empaqueta .exe |

## Detalles del Servidor de Desarrollo

- El script `"dev"` del backend ejecuta **node plano** (`node src/server.js`), sin nodemon ni recarga en caliente.
- El dev server de Vite **proxy `/api` → `http://localhost:4000`** (ver `frontend/vite.config.js`), así que en desarrollo las peticiones pasan por el proxy de Vite.
- `npm run dev` (raíz) = concurrently ejecuta ambos. `npm run dev:front` / `npm run dev:back` para un solo servicio.
- CORS del backend permite cualquier origen `localhost:*`, `127.0.0.1:*`, y `file://` (para modo producción de Electron).

## Funcionalidades

### Clientes
- Página: `frontend/src/pages/ClientesPage.jsx`
- Endpoint: `GET/POST/PUT/DELETE /api/clientes`
- Controller: `backend/src/controllers/clientes.controller.js`
- **Teléfono con selector de código de país**: 17 países con banderas emoji (US +1, MX +52, SV +503, GT +502, HN +504, NI +505, CR +506, PA +507, DO +1-809, CU +53, CO +57, PE +51, EC +593, VE +58, AR +54, CL +56, ES +34).
- `pais_code` se concatena con el número al guardar (ej: "+1 801 555-1234") y se parsea al editar.
- **Validación inline**: teléfono y email se validan en blur (no bloquean guardado). Errores en `.field-error` (rojo).
- **Servicio Principal eliminado**: no está en formulario, cards, detalle ni búsqueda.
- Estados: Activo, Pendiente, Inactivo. Modal detalle con avatar SVG y badge.
- Email incluido en SELECT de create/update (se había omitido antes).

### Estimados (Presupuestos)
- Página: `frontend/src/pages/EstimadosPage.jsx`
- Endpoint: `GET/POST/PUT/DELETE /api/estimados`
- Controller: `backend/src/controllers/estimados.controller.js`
- Tabla de materiales: descripción, cantidad, precio unitario.
- **Selector de tasa de impuesto**: 7%, 15%, 25% — se almacena como `tasa_impuesto` REAL (default 0.07).
- Subtítulo, impuesto y total se calculan dinámicamente con la tasa seleccionada.
- Monedas: USD, EUR, MXN, PAB, COP.
- Estados: Borrador, Enviado, Aceptado, Rechazado.
- Vista previa split-panel, exportación PDF con traducción de nombre.

### Propuestas
- Página: `frontend/src/pages/ProposalsPage/ProposalPreview.jsx`
- Endpoint: `GET/POST/PUT/DELETE /api/proposals`
- Documento formal imprimible basado en estimado.
- Exportación PDF.

### Facturas
- Página: `frontend/src/pages/InvoicePage.jsx`
- Endpoint: `GET/POST/PUT/DELETE /api/facturas`
- Controller: `backend/src/controllers/facturas.controller.js`
- **Número de factura editable**: campo "INVOICE #" personalizable (default "INV-{id}").
- Selección de cliente carga dirección, email y teléfono automáticamente.
- Un solo ítem (cantidad=1, precio=monto).
- Vista previa con tabla informativa (INVOICE #, Customer, Address, Email, Phone, Date, descripción, Amount).
- Estados: Pendiente, Pagado, Anulado.
- Exportación PDF con nombre traducido.

### Hojas de Ruta
- Página: `frontend/src/pages/RouteSheetPage.jsx`
- Endpoint: `GET/POST/PUT/DELETE /api/rutas-hojas`
- Planificación con fecha, conductor/ayudante, camión.
- Múltiples clientes con hora entrada/salida y descripción.
- Vista previa y exportación PDF.

### Contratos
- Página: `frontend/src/pages/ContractsPage.jsx`
- Endpoint: `GET/POST/PUT/DELETE /api/contracts`
- Controller: `backend/src/controllers/contracts.controller.js`
- Route: `backend/src/routes/contracts.routes.js`
- Campos: cliente, fecha_inicio, fecha_fin, descripcion, monto.
- **Validación de fechas**: fin no puede ser anterior a inicio (muestra `.field-error`).
- **Vista previa**: tabla informativa con Customer, Address, Email, Phone, Start Date, End Date, caja de descripción, Amount, y líneas de firma (Customer Signature / Contractor Signature).
- Botones Imprimir y Exportar PDF con nombre traducido.
- Tabla en BD: `contracts` con columna `monto`.

### Backups
- Página: `frontend/src/pages/BackupsPage.jsx`
- Endpoint: varios `/api/backups/*`
- Crear, listar, descargar, subir, restaurar, eliminar.
- IMPORTANTE: restaurar requiere reiniciar el sistema.

### Configuración (Settings)
- Componente: `frontend/src/components/SettingsModal.jsx`
- Endpoint: `GET/PUT /api/config/openrouter-key`
- Controller: `backend/src/controllers/config.controller.js`
- Almacena API key de OpenRouter cifrada con AES-256-GCM (derivación de clave desde hostname + pepper fijo).
- No revela la key guardada: muestra checkmark verde si está configurada, campo type=password siempre vacío.
- Botón "Remove" para eliminar la key.

### Asistente IA
- Componente: `frontend/src/components/AIAssistant.jsx`
- Endpoint: `POST /api/ai/chat`
- Controller: `backend/src/controllers/ai.controller.js`
- FAB flotante en la esquina inferior derecha.
- Usa OpenRouter API (requiere API key configurada desde la UI en Settings) **pero las consultas de datos funcionan sin API key**.
- Responde en el idioma del usuario sobre funcionalidades del sistema.
- Si no hay API key configurada, muestra mensaje amigable listando consultas de datos disponibles y apuntando al icono de engranaje.

### AI Query Tools (Consultas de Datos)
- Archivo: `backend/src/ai/queryTools.js`
- Se integra en `ai.controller.js` antes del llamado a OpenRouter — si el mensaje del usuario coincide con un patrón de consulta de datos, se ejecuta localmente contra SQLite.
- Funciones disponibles: `getClientes`, `getEstimadosByClient`, `getFacturasByClient`, `getContractsByClient`, `getAllEstimados`, `getAllFacturas`, `getAllContracts`, `getStats`, `getEstimadosByPeriod`, `getRecentActivity`, `search`.
- Patrones detectados: resumen general, conteos (clientes/estimados/facturas/contratos), listados por estado (activos/pendientes/aceptados/rechazados), consultas por cliente, búsqueda por término, actividad reciente.
- Si el patrón no coincide, falla al LLM de OpenRouter como antes.
- No requiere `stream` para consultas de datos — siempre responde JSON con `{ reply: "..." }`.

### Soporte Técnico
- Botón en sidebar footer (estilo nav-item con icono + chevron).
- Al hacer clic, abre modal con tarjeta de presentación: avatar gradiente, nombre, rol "Desarrollador", línea decorativa, contactos (teléfono, email, ubicación) con hover, y tagline.
- Datos: Francisco Chacón, +503 7204-4924, francochacon155@gmail.com, El Salvador.

### Paginación
- Componente: `frontend/src/components/Pagination.jsx`
- 20 elementos por página, frontend-only (`slice`).
- Integrado en Clientes, Facturas, Estimados, Hojas de Ruta, Contratos.

### Exportar PDF
- Dependencias: `html2canvas`, `jspdf`.
- Implementado en: Facturas, Estimados, Hojas de Ruta, Propuestas, Contratos.
- Los nombres de archivo se traducen: ej. `Factura_X.pdf` / `Invoice_X.pdf`.
- Los botones de toolbar (`.proposal-toolbar .btn-ghost`) tienen estilos específicos para modo oscuro.

### Validación (validate.js)
- Archivo: `frontend/src/utils/validate.js`
- Funciones: `required`, `validatePhone`, `validateEmail`, `validateAmount`, `validateDates`.
- Se usa en ClientesPage (phone, email, name) y ContractsPage (fechas).
- Validación inline no bloqueante: muestra `.field-error` sin impedir guardado.

## Backend (Middleware y Seguridad)

- `app.js` usa **helmet** (cabeceras de seguridad), **morgan** (logging de requests), y un **global error handler**.
- `server.js` tiene **graceful shutdown**: captura SIGTERM/SIGINT → cierra servidor → cierra BD → exit.
- **Sin dotenv**: no se usa `.env`. Las únicas variables de entorno son `PORT` y `NODE_ENV`.
- **Crypto**: `backend/src/utils/crypto.js` — AES-256-GCM con clave derivada del hostname + pepper fijo.

## Frontend (Optimizaciones)

- **Lazy loading**: todas las páginas usan `React.lazy()` + `<Suspense>` — cada página es un chunk separado.
- **ErrorBoundary**: captura errores de render, muestra fallback con botón "Go Home", reporta errores vía `POST /api/log-error`.

## Base de Datos

- **SQLite** en `backend/data/gestion_local.db` (se auto-crea al hacer `require` de `backend/src/db/sqlite.js`).
- Tablas: `clientes`, `estimados`, `propuestas`, `facturas`, `facturas_items`, `rutas_hojas`, `rutas_hojas_clientes`, `contracts`, `config`.
- Migraciones automáticas en `sqlite.js`: `alterTableIfNeeded()` agrega columnas faltantes (email, numero, tasa_impuesto, monto).
- **17 índices**: en clientes (nombre, estado, email), estimados (cliente_id, fecha, estado), facturas (cliente_id, fecha, estado, numero), facturas_items (factura_id), rutas_hojas (fecha), rutas_hojas_clientes (hoja_id, cliente_id), contracts (cliente_id, fecha_inicio).
- La BD se inicializa al arrancar — no necesita migraciones manuales.
- Backups en `backend/data/backups/`.
- BD en `.gitignore` — no versionada.

## Problemas Conocidos

- **Tests**: 15 backend (vitest) + 9 frontend (vitest). No CI (app 100% local).
- **No hay CI** en el repositorio (app 100% local).
- **Datos de empresa hardcodeados**: facturas, hojas de ruta y contratos usan "MAKE IT TO HAPPEN LLC" (PO Box 18670, SLC, UT 84118). Las claves `empresa_*` en i18n están vacías (se usan valores fallback).
- Salida de build: `backend/public/` (config `outDir` de Vite). Está en `.gitignore`.
- El lint global puede fallar por deuda existente en páginas antiguas (`react/no-unescaped-entities`, `react-hooks/purity`, `react-hooks/set-state-in-effect`). El build actual pasa.

## Build del .exe portátil (para distribuir al cliente)

El .exe incluye el backend completo, Node.js portátil y el frontend compilado. **El cliente no necesita instalar nada**.

```bash
# 1. Asegurar dependencias del backend
cd backend && npm install && cd ..

# 2. Build + empaquetado
npm run dist
```

El .exe se genera en `electron/dist/SistemaGestion*.exe`.

### Cómo funciona en producción
- El .exe incluye un `node.exe` portátil (v24.11.0) en `resources/node-bin/win-x64/`
- El backend completo se copia a `resources/backend/`
- Electron ejecuta el backend con su propio `node.exe` incluido, sin depender del sistema
- La base de datos SQLite se crea automáticamente al primer inicio en `resources/backend/data/`
- Los backups se guardan en `resources/backend/data/backups/`

## Verificación

```bash
# Lint + compilación del frontend
cd frontend && npm run lint && npm run build
```
