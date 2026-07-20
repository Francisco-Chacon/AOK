# Sistema de Gestión Local

Aplicación local para gestión de clientes, estimados, propuestas, facturas, hojas de ruta, contratos y respaldos.

## Características


- **Clientes**: Registro con nombre, dirección, teléfono (selector de código de país con banderas), email y estado (activo/pendiente/inactivo). Validación inline (no bloqueante) de teléfono y email.
- **Estimados**: Materiales (descripción, cantidad, precio unitario), selector de tasa de impuesto (7%, 15%, 25%), monedas (USD/EUR/MXN/PAB/COP), estados (borrador/enviado/aceptado/rechazado), vista previa y PDF
- **Propuestas**: Documento formal imprimible generado a partir de un estimado, con exportación PDF
- **Facturas**: Formulario simplificado con un solo ítem, número de factura editable, vista previa tipo "Proposal", estados (pendiente/pagado/anulado), impresión y PDF
- **Hojas de Ruta**: Planificación con conductor, camión, fecha y múltiples clientes con horarios. Vista previa y PDF
- **Contratos**: Módulo completo con cliente, fechas de inicio/fin, descripción, monto, vista previa con firmas y exportación PDF
- **Backups**: Crear, listar, descargar, subir, restaurar y eliminar respaldos de la base de datos
- **Asistente IA**: Chat integrado con IA para ayudar al usuario a usar el sistema
- **Soporte Técnico**: Botón en la sidebar que abre un modal tipo tarjeta de presentación con datos del desarrollador
- **Paginación**: Listas con 20 registros por página
- **Multidioma**: Español e Inglés
- **Tema claro/oscuro**: Alternable desde la barra superior
- **Toasts**: Notificaciones de éxito/error en acciones CRUD

## Tecnologías

- **Frontend**: React 18 + Vite (puerto 5173, build a `backend/public/`)
- **Backend**: Express.js + SQLite (better-sqlite3) — puerto 4000
- **Escritorio**: Electron — ventana 1280×800, lanza backend como proceso hijo
- **Estilos**: CSS personalizado + Tailwind utilities
- **Cliente HTTP**: Axios
- **PDF**: `html2canvas` + `jsPDF` (generado en frontend)
- **Guía futura**: Nuevos componentes en TypeScript/TSX; JSX existente migrable gradualmente.

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..
```

## Uso

### Desarrollo

```bash
npm run dev
```

Inicia backend (puerto 4000) y frontend (Vite :5173) simultáneamente. Las peticiones a `/api` se proxyan al backend.

### Producción

```bash
npm run build
```

Compila frontend a `backend/public/` y se sirve como estático.

### Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto del backend | `4000` |
| `NODE_ENV` | Entorno (`development`, `production`) | `development` |
| `VITE_API_URL` | URL base API (frontend) | `http://localhost:4000/api` |

## Scripts

### Raíz

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Backend + frontend en concurrently |
| `npm run build` | Compila frontend |
| `npm run dev:electron` | Electron modo desarrollo |
| `npm run dist` | `build` + empaqueta .exe portable |
| `npm run dist:full` | Instala deps backend + build frontend + empaqueta .exe |

### Backend (`cd backend`)

| Script | Descripción |
|--------|-------------|
| `npm run dev` | `node src/server.js` (puerto 4000) |
| `npm start` | `node src/server.js` |
| `npm run init-db` | Inicializa BD |

### Frontend (`cd frontend`)

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor Vite (:5173) |
| `npm run build` | Compila a `../backend/public/` |
| `npm run preview` | Vista previa del build |

## Estructura del Proyecto

```
sistema_local/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express (helmet, morgan, CORS, SPA fallback, error handler)
│   │   ├── controllers/        # clientes, facturas, estimados, contratos, etc.
│   │   ├── db/
│   │   │   ├── sqlite.js       # Init BD + migraciones automáticas
│   │   │   └── backups/        # Archivos de respaldo
│   │   ├── routes/             # Express Router (clientes, facturas, etc.)
│   │   ├── ai/                 # queryTools.js (consultas offline SQLite)
│   │   ├── utils/              # validation, logger, init-db, crypto (AES-256-GCM)
│   │   └── server.js           # Entry point
│   ├── public/                 # Build de React (generado)
│   └── data/                   # SQLite DB
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios client
│   │   ├── components/         # Sidebar, Modal, Pagination, Spinner, etc.
│   │   ├── hooks/              # useDebounce
│   │   ├── i18n/               # Traducciones ES/EN
│   │   ├── pages/              # Clientes, Estimados, Propuestas,
│   │   │                       # Facturas, Hojas de Ruta, Contratos, Backups
│   │   ├── utils/              # sanitize, validate
│   │   └── styles.css          # Estilos globales
│   └── public/                 # favicon, logo
├── electron/
│   ├── main.js                 # Proceso principal (spawn backend, BrowserWindow)
│   ├── preload.js              # API expuesta al renderer
│   └── package.json            # electron-builder config
├── AGENTS.md                   # Contexto para asistentes de IA
├── .gitignore
└── package.json
```

## API Endpoints

| Recurso | Métodos | Notas |
|---------|---------|-------|
| `/api/clientes` | GET, POST, PUT, DELETE | |
| `/api/estimados` | GET, POST, PUT, DELETE | Incluye `tasa_impuesto` |
| `/api/proposals` | GET, POST, PUT, DELETE | |
| `/api/facturas` | GET, POST, PUT, DELETE | |
| `/api/facturas/:id` | GET | Con sus items |
| `/api/rutas-hojas` | GET, POST, PUT, DELETE | |
| `/api/rutas-hojas/:id` | GET | Con clientes |
| `/api/contracts` | GET, POST, PUT, DELETE | |
| `/api/backups/create` | POST | |
| `/api/backups/list` | GET | |
| `/api/backups/download/:filename` | GET | |
| `/api/backups/upload` | POST | Multer, límite 50MB |
| `/api/backups/restore` | POST | |
| `/api/backups/:filename` | DELETE | |
| `/api/ai/chat` | POST | Chat asistente IA |
| `/api/config/openrouter-key` | GET, PUT | Configurar API key (cifrada) |
| `/api/log-error` | POST | Reporte de errores del frontend |

## Base de Datos

`backend/data/gestion_local.db` (SQLite, se auto-crea al iniciar el backend).

### Tablas

| Tabla | Columnas clave |
|-------|----------------|
| `clientes` | id, nombre, dirección, teléfono, email, estado, fecha_creación |
| `estimados` | id, id_cliente, materiales, moneda, estado, notas_adicionales, tasa_impuesto |
| `propuestas` | id, id_estimado, monto_total, moneda, estado, notas |
| `facturas` | id, id_cliente, monto, descripcion, fecha, estado, numero |
| `facturas_items` | id_factura, descripción, cantidad, precio |
| `rutas_hojas` | id, conductor, camión, fecha |
| `rutas_hojas_clientes` | id_hoja, id_cliente, hora_entrada, hora_salida, descripción |
| `contracts` | id, cliente_id, fecha_inicio, fecha_fin, descripcion, monto |
| `config` | key, value | Almacena API key cifrada |

## Componentes Principales

| Componente | Archivo | Función |
|------------|---------|---------|
| Sidebar | `Sidebar.jsx` | Navegación con iconos SVG, botón soporte técnico con modal |
| Modal | `Modal.jsx` | Modal reutilizable (wide, fullscreen, header opcional) |
| Spinner | `Spinner.jsx` | Indicador de carga (small/medium/large) |
| SearchableSelect | `SearchableSelect.jsx` | Select con búsqueda |
| Pagination | `Pagination.jsx` | Paginación, 20 por página |
| ErrorBoundary | `ErrorBoundary.jsx` | Captura errores con fallback |
| SearchBar | `SearchBar.jsx` | Barra de búsqueda con icono |
| EmptyState | `EmptyState.jsx` | Estado vacío para listas |

## Funcionalidades Detalladas

### Clientes
- Teléfono con selector de código de país (17 países con banderas: US, MX, SV, GT, HN, NI, CR, PA, DO, CU, CO, PE, EC, VE, AR, CL, ES)
- Validación inline de email y teléfono (no bloquea guardado, muestra sugerencia en rojo)
- Modal detalle con avatar y badge de estado
- "Servicio Principal" fue eliminado del sistema

### Estimados
- Tabla de materiales con descripción, cantidad, precio unitario
- **Selector de tasa de impuesto**: 7%, 15% o 25% — se refleja en subtotal, impuesto (con etiqueta del %) y total
- Monedas: USD, EUR, MXN, PAB, COP
- Vista previa con split-panel y exportación PDF

### Facturas
- Número de factura editable (campo "INVOICE #")
- Selección de cliente carga dirección, email y teléfono automáticamente
- Un solo ítem por factura (cantidad=1, precio=monto)
- Vista previa con diseño profesional

### Contratos
- Cliente, fechas inicio/fin, descripción, monto
- Validación de fechas (fin no puede ser anterior a inicio)
- Vista previa con tabla informativa y líneas de firma (Customer / Contractor)
- Botones Imprimir y Exportar PDF

### PDF Export
Los PDFs se generan en frontend con `html2canvas` + `jsPDF`. Los nombres de archivo se traducen según el idioma activo (ej: `Factura_X.pdf` / `Invoice_X.pdf`).

Documentos con PDF: Facturas, Estimados, Propuestas, Hojas de Ruta, Contratos.

### Soporte Técnico
Botón "Soporte Técnico" en el footer de la sidebar (estilo nav-item con chevron). Al hacer clic, abre un modal con tarjeta de presentación: avatar con gradiente, nombre, rol "Desarrollador", línea divisoria decorativa, tres contactos (teléfono, email, ubicación) con hover animado, y tagline al pie.

### Configuración (API Key)
La API key de OpenRouter se configura desde la UI (icono de engranaje en la barra superior). Se almacena cifrada con AES-256-GCM en la base de datos. Nunca se revela en la interfaz.

### Asistente IA
Chat integrado accesible desde un FAB (botón flotante). Usa OpenRouter API (requiere API key configurada en Settings). **Las consultas de datos funcionan sin API key** — puedes preguntar por resúmenes, conteos, clientes, estimados, facturas, contratos y actividad reciente. Si no hay key configurada, el chat muestra un mensaje amigable listando las consultas disponibles.

## Diseño y UX

- Sidebar fija en escritorio, menú desplegable en móvil
- Tema claro/oscuro con design tokens CSS (`--primary`, `--bg-card`, `--text-main`, etc.)
- Documentos imprimibles con fondo blanco fijo
- Toasts de confirmación para acciones CRUD
- Validación inline no bloqueante (borde rojo + texto de sugerencia)
- Los PDFs se nombran según el idioma activo

## Verificación

```bash
cd frontend && npm run build
cd ../backend && npm test
cd ../frontend && npm test
```

## Notas

- La app es 100% local (sin servidor público)
- BD en `.gitignore` — no versionada
- **Tests**: 15 backend (vitest) + 9 frontend (vitest). Ejecutar con `npm test` en cada workspace.
- Datos de empresa hardcodeados: "MAKE IT TO HAPPEN LLC" (PO Box 18670, SLC, UT 84118)
- El logo se cambia reemplazando `/logo.png` en `frontend/public/`

## Licencia

ISC
