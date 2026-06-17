# AGENTS.md — Sistema de Gestión Local

## Stack & Límites

- **Monorepo** con 3 workspaces: `frontend/` (React 18 + Vite), `backend/` (Express 5 + better-sqlite3), `electron/`
- El `package.json` raíz orquesta con `concurrently`. `npm run dev` inicia frontend + backend.
- **División de módulos**: backend usa CommonJS (`require`), frontend usa ESM (`import`/`export`).
- **Router**: Todo el backend usa `express.Router()` (el paquete `router` fue eliminado).
- **Dirección futura**: componentes nuevos en TypeScript/TSX; JSX existente se puede migrar gradualmente.
- **Dashboard**: la app abre por defecto en `DashboardPage.jsx`; datos desde `GET /api/dashboard`.
- **PDF**: exportación en frontend con `html2canvas` + `jsPDF`.

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

## Funcionalidades Recientes

- **Dashboard / Inicio**
  - Página: `frontend/src/pages/DashboardPage.jsx`
  - Endpoint: `GET /api/dashboard`
  - Controller: `backend/src/controllers/dashboard.controller.js`
  - Route: `backend/src/routes/dashboard.routes.js`
  - Muestra KPIs, actividad reciente y gráfico anual de ingresos.
  - El gráfico usa `?year=YYYY` y devuelve siempre 12 meses (`$0` en meses sin ingresos).
  - El backend devuelve `ingresos_years`; debe incluir siempre el año actual aunque no tenga datos.

- **Paginación**
  - Componente: `frontend/src/components/Pagination.jsx`
  - Tamaño actual: 20 elementos por página.
  - Integrado en Clientes, Recibos, Rutas/Visitas, Facturas, Estimados y Hojas de Ruta.
  - La paginación es frontend-only: filtra primero y luego hace `slice`.

- **Exportar PDF**
  - Dependencias frontend: `html2canvas`, `jspdf`.
  - Implementado en Facturas, Estimados, Hojas de Ruta y Propuestas.
  - Archivos principales: `InvoicePage.jsx`, `EstimadosPage.jsx`, `RouteSheetPage.jsx`, `ProposalsPage/ProposalPreview.jsx`.
  - Los botones de toolbar de documentos (`.proposal-toolbar .btn-ghost`) tienen estilos específicos para verse correctamente en modo oscuro sobre documento blanco.

## Base de Datos

- **SQLite** en `backend/data/gestion_local.db` (se auto-crea al hacer `require` de `backend/src/db/sqlite.js`).
- Tablas: `clientes`, `rutas`, `visitas`, `recibos`, `estimados`, `facturas`, `facturas_items`, `rutas_hojas`, `rutas_hojas_clientes`.
- La BD se inicializa automáticamente al arrancar el backend — no necesita migraciones manuales. Esquema definido en `backend/src/db/sqlite.js`.

- Los backups se guardan en `backend/data/backups/`.
- El archivo de BD está en `.gitignore` — no versionado.


## Problemas Conocidos

- **No hay tests ni CI** en el repositorio.
- **Datos de empresa hardcodeados**: facturas y hojas de ruta usan "MAKE IT TO HAPPEN LLC" (PO Box 18670, SLC, UT 84118). Las claves `empresa_*` en i18n están vacías (se usan valores fallback).
- Salida de build: `backend/public/` (config `outDir` de Vite). Está en `.gitignore`.
- El lint global puede fallar por deuda existente en páginas antiguas (`react/no-unescaped-entities`, `react-hooks/purity`, `react-hooks/set-state-in-effect`). El build actual pasa.

## Historial de Cambios Recientes

| Commit | Descripción |
|--------|-------------|
| `local` | Dashboard inicial, gráfico anual con filtro por año, paginación en listas y exportación PDF en documentos |
| `c64615e` | Refactor InvoicePage, RouteSheetPage y EstimadosPage a layout split-panel (sidebar + preview) |
| `eed8fde` | Mejora de estilos de select |
| `57e58cd` | Modal detalle cliente con avatar, badge y SVGs |
| `02de592` | Modal crear/editar cliente con SVGs, avatar y layout limpio |
| `283a4f3` | Traducción faltante `facturas_page_subtitle` |
| `bebf0cc` | SearchBar, bordes de estado, toasts success en CRUD, modales delete con SVGs |
| `e79f8c3` | Sistema de toasts, reemplazo de alerts, skeletons, EmptyState, ErrorBoundary |
| `5b1ddec` | Google Fonts, design tokens, animaciones, dark mode |
| `8ec08c3` | Migración completa de emojis a SVGs |
| `70b56ce` | Componente SearchBar + migración en todos los módulos |

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
