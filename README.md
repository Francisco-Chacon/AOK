# Sistema de Gestión Local

Aplicación local para gestión de clientes, rutas, visitas, recibos, estimados, propuestas, facturas y hojas de ruta de servicios.

## Características

- **Dashboard / Inicio**: Vista ejecutiva inicial con KPIs, actividad reciente e ingresos anuales por mes
- **Clientes**: Registro y gestión de clientes con estado (activo/pendiente/inactivo)
- **Rutas**: Organización de rutas por día de la semana
- **Visitas**: Programación de visitas a clientes con fecha, hora y duración
- **Recibos**: Generación y seguimiento de pagos
- **Estimados**: Creación de estimados con estados (borrador/enviado/aceptado/rechazado), vista previa, impresión y exportación PDF
- **Propuestas**: Vista formal imprimible basada en descripción libre y monto manual, con exportación PDF
- **Facturas**: Creación, edición, vista previa, impresión y exportación PDF
- **Hojas de Ruta**: Registro de conductor, camión, clientes, horarios y descripción con impresión/exportación PDF
- **Backups**: Sistema de respaldo y restauración de la base de datos
- **Paginación**: Listas principales muestran 20 registros por página para evitar lentitud con muchos datos
- **Multidioma**: Soporte para Español e Inglés
- **Responsive UI**: Navegación móvil desplegable vertical y formularios adaptables
- **Tema claro/oscuro**: Cambio de tema desde el menú lateral

## Tecnologías

- **Frontend**: React 18 + Vite (puerto 5173, build output a `backend/public/`)
- **Backend**: Express.js + SQLite (better-sqlite3) — puerto 4000
- **Escritorio**: Electron  — ventana 1280×800, lanza backend como proceso hijo
- **Estilos**: CSS personalizado + Tailwind utilities donde aplica
- **Cliente HTTP**: Axios
- **PDF en frontend**: `html2canvas` + `jsPDF` para exportar vistas previas a PDF descargable
- **Guía futura**: Nuevos componentes deben escribirse en TypeScript/TSX; el código JSX existente puede migrarse gradualmente.

## Requisitos

- Node.js 18+
- npm 9+

## Instalación

```bash
# Instalar dependencias
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..
```

## Uso

### Desarrollo (modo concurrently)

```bash
npm run dev
```

Inicia el servidor backend (puerto 4000) y el frontend de desarrollo simultaneamente.

### Producción

```bash
npm run build
```

Compila el frontend y sirve los archivos estáticos desde el backend.

### Iniciar solo el backend

```bash
cd backend
npm run dev
```

## Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor backend | `4000` |
| `NODE_ENV` | Entorno de ejecución (`development`, `production`) | `development` |
| `VITE_API_URL` | URL base de la API (frontend) | `http://localhost:4000/api` |
| `OPENROUTER_API_KEY` | API key para el asistente IA | — |

No se requieren archivos `.env` obligatorios; los valores por defecto funcionan para desarrollo local. Si deseas personalizar, crea un archivo `.env` en la raíz del backend y `.env.local` en `frontend/`.

## Scripts npm

### Raíz (`package.json`)
| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia backend + frontend en concurrently |
| `npm run build` | Compila frontend y sirve desde backend |
| `npm run dev:electron` | Inicia Electron en modo desarrollo |
| `npm run build:electron` | Compila la app de Electron con electron-builder |
| `npm run dist` | Ejecuta `build` + empaqueta Electron (.exe portable) |

### Backend (`cd backend`)
| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia servidor con node plano en puerto 4000 |
| `npm start` | `node src/server.js` |
| `npm run init-db` | Inicializa BD con tablas básicas |
| `npm run migrate:add-fecha-visitas` | Agrega columna `fecha` a tabla `visitas` |

### Frontend (`cd frontend`)
| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo Vite (puerto 5173) |
| `npm run build` | Compila a `../backend/public/` |
| `npm run preview` | Previsualiza build de producción localmente |

## Estructura del Proyecto

```
sistema_local/
├── backend/
│   ├── src/
│   │   ├── app.js          # Configuración Express (CORS, static, SPA fallback)
│   │   ├── controllers/    # Lógica de negocio (incluye dashboard.controller.js)
│   │   ├── db/
│   │   │   ├── sqlite.js   # Inicialización BD
│   │   │   └── backups/    # Archivos de respaldo
│   │   ├── routes/         # Rutas API (incluye dashboard.routes.js)
│   │   ├── utils/          # Utilidades (validation, logger, init-db)
│   │   └── server.js       # Punto de entrada
│   ├── public/             # Build de React (generado por Vite)
│   └── data/               # Base de datos SQLite
├── frontend/
│   ├── src/
│   │   ├── api/            # Cliente Axios
│   │   ├── components/     # Componentes React (Sidebar, Modal, Spinner, etc.)
│   │   ├── hooks/          # Custom hooks (useDebounce)
│   │   ├── i18n/           # Traducciones ES/EN
│   │   ├── pages/          # Vistas: Dashboard, Clientes, Visitas, Recibos,
│   │   │                   #   Estimados, Propuestas, Facturas, Hojas de Ruta, Backups
│   │   ├── utils/          # Utilidades (sanitize)
│   │   └── styles.css      # Estilos globales
│   ├── public/             # Archivos estáticos (favicon, logo)
│   └── vite.config.js      # Puerto 5173, build output -> backend/public
├── electron/
│   ├── main.js             # Proceso principal (spawn backend, BrowserWindow)
│   ├── preload.js          # API expuesta al renderer
│   └── package.json        # Config electron-builder (target portable)
├── AGENTS.md               # Contexto para asistentes de IA
├── .gitignore              # Ignora node_modules, backend/data/, backend/public/, dist/
└── package.json
```

## API Endpoints

| Recurso | Métodos | Notas |
|---------|---------|-------|
| `/api/dashboard` | GET | KPIs, actividad reciente e ingresos anuales. Acepta `?year=YYYY` para filtrar gráfico anual |
| `/api/clientes` | GET, POST, PUT, DELETE | |
| `/api/clientes/:id/recibos-count` | GET | Cantidad de recibos de un cliente |
| `/api/visitas` | GET, POST, PUT, DELETE | |
| `/api/recibos` | GET, POST, PUT, DELETE | |
| `/api/estimados` | GET, POST, PUT, DELETE | |
| `/api/facturas` | GET, POST, PUT, DELETE | |
| `/api/facturas/:id` | GET | Factura individual con sus items |
| `/api/rutas` | GET, POST, PUT, DELETE | Gestión de rutas |
| `/api/rutas-hojas` | GET, POST, PUT, DELETE | |
| `/api/rutas-hojas/:id` | GET | Hoja de ruta individual con sus clientes |
| `/api/backups/create` | POST | |
| `/api/backups/list` | GET | |
| `/api/backups/download/:filename` | GET | |
| `/api/backups/upload` | POST | Sube archivo .db (multer, límite 50MB) |
| `/api/backups/restore` | POST | |
| `/api/backups/:filename` | DELETE | |
| `/api/ai/chat` | POST | Chat con asistente IA (requiere `OPENROUTER_API_KEY`) |

### Dashboard API

`GET /api/dashboard` devuelve:

- `clientes`: total, activos e inactivos
- `recibos_mes`: cantidad y total pagado del mes actual
- `facturas_pendientes`: cantidad y total pendiente
- `estimados`: cantidad y total acumulado
- `ingresos_mensuales`: arreglo de 12 meses del año seleccionado, incluyendo meses en cero
- `ingresos_year`: año utilizado para el gráfico
- `ingresos_years`: años disponibles para el filtro, incluyendo siempre el año actual
- `actividad_reciente`: últimos recibos creados

Ejemplo:

```http
GET /api/dashboard?year=2025
```

## Base de Datos

La base de datos SQLite se encuentra en:
`backend/data/gestion_local.db`

### Tablas

| Tabla | Columnas clave | Notas |
|-------|----------------|-------|
| `clientes` | id, nombre, dirección, teléfono, email, estado (activo/pendiente/inactivo), fecha_creación | |
| `rutas` | id, nombre, día_semana | Sin endpoint API |
| `visitas` | id, id_cliente, fecha, hora, duración, notas | Columna `fecha` agregada por migración |
| `recibos` | id, id_cliente, monto, fecha, estado, codigo (único, ej. `REC-XXX-XXXX`) | |
| `estimados` | id, id_cliente, monto, moneda (USD/EUR/MXN/PAB/COP), estado (borrador/enviado/aceptado/rechazado), notas_adicionales | |
| `facturas` | id, id_cliente, monto, nota, fecha, fecha_vencimiento, estado | |
| `facturas_items` | id_factura, fecha, descripción, cantidad, precio | Items línea de cada factura |
| `rutas_hojas` | id, conductor, camión, fecha | |
| `rutas_hojas_clientes` | id_hoja, id_cliente, cliente_dirección, hora_entrada, hora_salida, descripción | |

### Configuración

La base de datos se inicializa automáticamente al iniciar el backend mediante `backend/src/db/sqlite.js`. No requiere migraciones manuales. Los backups se almacenan en `backend/data/backups/`.

> **Nota:** Actualmente no hay archivos de esquema (`schema.sql`) ni sistema de migraciones formales. Existen scripts de utilidad en `backend/src/utils/` para tareas puntuales (`initDb.js`, `addFechaToVisitas.js`).

> ⚠️ **BD duplicada:** Existe una copia de la base de datos en `backend/src/data/gestion_local.db` que parece ser un residuo. La BD principal es `backend/data/gestion_local.db`.

## Assets y Recursos Multimedia

Los recursos estáticos (imágenes, iconos, favicon) se encuentran en `frontend/public/`:

- `favicon.ico` — Icono de la aplicación
- `logo.png` — Logo de la empresa/sistema

No existe una carpeta `assets/` separada; se utiliza `public/` de Vite para servir archivos estáticos.

## Documentación Adicional

- **AGENTS.md** — Guía de contexto para asistentes de IA (OpenCode)
- **API Docs** — Pendiente de generar. Los endpoints actuales están listados en la sección [API Endpoints](#api-endpoints) de este documento. Se recomienda crear `docs/api.md` con ejemplos de peticiones/respuestas.

## Componentes Principales (Frontend)

| Componente | Archivo | Función |
|------------|---------|---------|
| **Sidebar** | `src/components/Sidebar.jsx` | Navegación con iconos SVG, menú móvil desplegable, toggle tema, selector de idioma |
| **Modal** | `src/components/Modal.jsx` | Modal reutilizable con variantes wide y fullscreen |
| **Spinner / LoadingOverlay** | `src/components/Spinner.jsx` | Indicador de carga (small/medium/large) con overlay |
| **SearchableSelect** | `src/components/SearchableSelect.jsx` | Select con búsqueda y debounce |
| **Pagination** | `src/components/Pagination.jsx` | Paginación reutilizable para listas, 20 registros por página por defecto |
| **ErrorBoundary** | `src/components/ErrorBoundary.jsx` | Captura errores de React con pantalla de fallback y botón de recarga |
| **useDebounce** | `src/hooks/useDebounce.js` | Hook genérico `useDebounce(value, delay)` |

## Dashboard

El sistema abre por defecto en `DashboardPage.jsx`.

### Qué muestra

- Resumen del mes: recibos pagados del mes actual y cantidad de facturas pendientes
- KPIs: recibos del mes, clientes activos, facturas pendientes y total de estimados
- Gráfico anual de ingresos: 12 barras de enero a diciembre, con `$0` en meses sin pagos
- Filtro por año: dropdown custom que usa `ingresos_years` del backend y conserva el año actual aunque no tenga ingresos
- Actividad reciente: últimos recibos creados, cliente, código, fecha relativa y monto

### Comportamiento importante

- Si no se envía `year`, el backend usa el último año con recibos registrados; si no hay datos, usa el año actual.
- El selector permite cambiar el año sin recargar toda la app.
- El dashboard fuerza el scroll del contenedor principal al inicio al montarse para evitar que abra cortado si el usuario venía de otra página con scroll.

## Paginación

Las páginas principales paginan en frontend para mejorar rendimiento visual con listas grandes.

- Tamaño por página: `20`
- Componente: `frontend/src/components/Pagination.jsx`
- Integrado en: Clientes, Recibos, Rutas/Visitas, Facturas, Estimados y Hojas de Ruta
- La página vuelve a `1` al cambiar búsqueda o filtros

## Exportación PDF

La exportación PDF se genera en el frontend con `html2canvas` + `jsPDF`.

### Documentos con PDF

- Facturas: `InvoicePage.jsx`
- Estimados: `EstimadosPage.jsx`
- Hojas de Ruta: `RouteSheetPage.jsx`
- Propuestas: `ProposalsPage/ProposalPreview.jsx`

### Notas de diseño

- Los documentos de vista previa usan fondo blanco fijo para mantener apariencia profesional en modo claro/oscuro.
- Los botones dentro de `.proposal-toolbar` tienen estilos específicos para evitar texto blanco sobre fondo claro en modo oscuro.
- La impresión del navegador se mantiene disponible junto al botón `Exportar`.

## Electron

Electron está funcional (no solo "en desarrollo"). Flujo de inicio:

1. `electron/main.js` lanza el backend como proceso hijo: `spawn("node", ["src/server.js"])`
2. Espera 1.5 segundos a que el backend inicie
3. Crea una ventana `BrowserWindow` de 1280×800 (mínimo 1024×700)
4. Carga `http://localhost:5173` (desarrollo) o `file://backend/public/index.html` (producción)
5. `electron/preload.js` expone `window.electronAPI` con `platform`, `isElectron`, `getAppPath`
6. Al cerrar la ventana, mata el proceso backend

Para empaquetar: `npm run build:electron` → genera un `.exe` portable.

## Diseño y UX

- La navegación de escritorio usa sidebar fijo.
- En móvil, el menú se convierte en un desplegable vertical para evitar scroll horizontal.
- Las tarjetas, modales, inputs y botones usan estilos responsive con tema claro/oscuro.
- El dashboard usa clases CSS específicas (`dash-*`) para mantener layout estable dentro del shell con sidebar/topbar/statusbar.
- El gráfico del dashboard debe revisarse en navegador; los datos llegan desde `/api/dashboard` y se renderizan como barras HTML/CSS.
- Los documentos imprimibles de propuestas, facturas y hojas de ruta mantienen fondo blanco y estilos propios para no heredar el tema oscuro.
- Las propuestas muestran cliente, dirección, teléfono, email, fechas, descripción libre y monto.
- Facturas y hojas de ruta imprimen en una ventana/documento aislado para evitar imprimir el modal o la app completa.
- Facturas, estimados, hojas de ruta y propuestas tienen botón `Exportar` para descargar PDF.

## Verificación Recomendada

Antes de entregar cambios visuales o funcionales:

```bash
cd frontend
npm run build
```

También se recomienda revisar en navegador:

- Dashboard: gráfico anual, selector de año, KPIs y actividad reciente.
- Clientes, rutas, recibos, estimados, propuestas, facturas y hojas de ruta.
- Formularios de crear/editar/eliminar.
- Paginación en listas con más de 20 elementos.
- Botones `Imprimir` y `Exportar` en documentos.
- Vistas previas e impresión.
- Modo móvil y escritorio.

> **Nota:** `npm run build` es la verificación principal. El lint global puede reportar advertencias/errores heredados en páginas antiguas (por ejemplo `react-hooks/set-state-in-effect`, `react/no-unescaped-entities` y `react-hooks/purity`) que no impiden el build actual.

## Notas

- La aplicación está diseñada para uso local (no requiere servidor público)
- Los respaldos se almacenan en `backend/data/backups/`
- El puerto por defecto del backend es 4000
- **Sin tests**: No hay pruebas automatizadas en todo el proyecto
- **BD en .gitignore**: El archivo `backend/data/gestion_local.db` está excluido del repositorio (`.gitignore`). La BD no se versiona.
- **Datos de empresa hardcodeados**: Facturas y hojas de ruta usan "MAKE IT TO HAPPEN LLC" (tel: 385-601-8129, email: makeittohappen@gmail.com, dirección: PO BOX 18670 Salt Lake City, UT 84118). Las claves de traducción `empresa_*` existen pero están vacías.


## Licencia

ISC
