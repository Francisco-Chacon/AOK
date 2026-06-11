# Sistema de Gestión Local

Aplicación local para gestión de clientes, rutas, visitas, recibos, estimados, propuestas, facturas y hojas de ruta de servicios.

## Características

- **Clientes**: Registro y gestión de clientes con estado (activo/pendiente/inactivo)
- **Rutas**: Organización de rutas por día de la semana
- **Visitas**: Programación de visitas a clientes con fecha, hora y duración
- **Recibos**: Generación y seguimiento de pagos
- **Estimados**: Creación de estimados con estados (borrador/enviado/aceptado/rechazado)
- **Propuestas**: Vista formal imprimible basada en descripción libre y monto manual
- **Facturas**: Creación, edición, vista previa e impresión de facturas
- **Hojas de Ruta**: Registro de conductor, camión, clientes, horarios y descripción con impresión
- **Backups**: Sistema de respaldo y restauración de la base de datos
- **Multidioma**: Soporte para Español e Inglés
- **Responsive UI**: Navegación móvil desplegable vertical y formularios adaptables
- **Tema claro/oscuro**: Cambio de tema desde el menú lateral

## Tecnologías

- **Frontend**: React 18 + Vite (puerto 5173, build output a `backend/public/`)
- **Backend**: Express.js + SQLite (better-sqlite3) — puerto 4000
- **Escritorio**: Electron  — ventana 1280×800, lanza backend como proceso hijo
- **Estilos**: CSS personalizado
- **Cliente HTTP**: Axios (excepto BackupsPage que usa `fetch()` nativo)
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
| `npm run dev` | Inicia servidor con nodemon en puerto 4000 |
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
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── db/
│   │   │   ├── sqlite.js   # Inicialización BD
│   │   │   └── backups/    # Archivos de respaldo
│   │   ├── routes/         # Rutas API
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
│   │   ├── pages/          # Vistas: Clientes, Visitas, Recibos, Estimados,
│   │   │                   #   Propuestas, Facturas, Hojas de Ruta, Backups
│   │   ├── utils/          # Utilidades (sanitize)
│   │   └── styles.css      # Estilos globales
│   ├── public/             # Archivos estáticos (favicon, logo)
│   └── vite.config.js      # Puerto 5173, build output -> backend/public
├── electron/
│   ├── main.js             # Proceso principal (spawn backend, BrowserWindow)
│   ├── preload.js          # API expuesta al renderer
│   └── package.json        # Config electron-builder (target portable)
├── AGENT.md                # Contexto para asistentes de IA
├── .gitignore              # Ignora node_modules, backend/data/, backend/public/, dist/
└── package.json
```

## API Endpoints

| Recurso | Métodos | Notas |
|---------|---------|-------|
| `/api/clientes` | GET, POST, PUT, DELETE | |
| `/api/clientes/:id/recibos-count` | GET | Cantidad de recibos de un cliente |
| `/api/visitas` | GET, POST, PUT, DELETE | |
| `/api/recibos` | GET, POST, PUT, DELETE | |
| `/api/estimados` | GET, POST, PUT, DELETE | |
| `/api/facturas` | GET, POST, PUT, DELETE | |
| `/api/facturas/:id` | GET | Factura individual con sus items |
| `/api/rutas-hojas` | GET, POST, PUT, DELETE | |
| `/api/rutas-hojas/:id` | GET | Hoja de ruta individual con sus clientes |
| `/api/backups/create` | POST | |
| `/api/backups/list` | GET | |
| `/api/backups/download/:filename` | GET | |
| `/api/backups/upload` | POST | Sube archivo .db (multer, límite 50MB) |
| `/api/backups/restore` | POST | |
| `/api/backups/:filename` | DELETE | |

> **Nota:** Actualmente **no existe** un endpoint `/api/rutas`. La tabla `rutas` en la BD solo se usa internamente y no tiene API expuesta. Las rutas del sidebar gestionan en realidad las **visitas**.

> **Inconsistencia técnica:** Los endpoints de clientes, visitas y recibos usan el paquete independiente `router`, mientras que estimados, facturas, rutas-hojas y backups usan `express.Router()` estándar.

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
- `logo.jpg` — Logo de la empresa/sistema

No existe una carpeta `assets/` separada; se utiliza `public/` de Vite para servir archivos estáticos.

## Documentación Adicional

- **AGENT.md** — Guía de contexto para asistentes de IA (OpenCode)
- **API Docs** — Pendiente de generar. Los endpoints actuales están listados en la sección [API Endpoints](#api-endpoints) de este documento. Se recomienda crear `docs/api.md` con ejemplos de peticiones/respuestas.

## Componentes Principales (Frontend)

| Componente | Archivo | Función |
|------------|---------|---------|
| **Sidebar** | `src/components/Sidebar.jsx` | Navegación con iconos SVG, menú móvil desplegable, toggle tema, selector de idioma |
| **Modal** | `src/components/Modal.jsx` | Modal reutilizable con variantes wide y fullscreen |
| **Spinner / LoadingOverlay** | `src/components/Spinner.jsx` | Indicador de carga (small/medium/large) con overlay |
| **SearchableSelect** | `src/components/SearchableSelect.jsx` | Select con búsqueda y debounce |
| **ErrorBoundary** | `src/components/ErrorBoundary.jsx` | Captura errores de React con pantalla de fallback y botón de recarga |
| **useDebounce** | `src/hooks/useDebounce.js` | Hook genérico `useDebounce(value, delay)` |

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
- Los documentos imprimibles de propuestas, facturas y hojas de ruta mantienen fondo blanco y estilos propios para no heredar el tema oscuro.
- Las propuestas muestran cliente, dirección, teléfono, email, fechas, descripción libre y monto.
- Facturas y hojas de ruta imprimen en una ventana/documento aislado para evitar imprimir el modal o la app completa.

## Verificación Recomendada

Antes de entregar cambios visuales o funcionales:

```bash
cd frontend
npm run build
```

También se recomienda revisar en navegador:

- Clientes, rutas, recibos, estimados, propuestas, facturas y hojas de ruta.
- Formularios de crear/editar/eliminar.
- Vistas previas e impresión.
- Modo móvil y escritorio.

## Notas

- La aplicación está diseñada para uso local (no requiere servidor público)
- Los respaldos se almacenan en `backend/data/backups/`
- El puerto por defecto del backend es 4000
- **Sin tests**: No hay pruebas automatizadas en todo el proyecto
- **BD en .gitignore**: El archivo `backend/data/gestion_local.db` está excluido del repositorio (`.gitignore`). La BD no se versiona.
- **Datos de empresa hardcodeados**: Facturas y hojas de ruta usan "MAKE IT TO HAPPEN LLC" (tel: 385-601-8129, email: makeittohappen@gmail.com, dirección: PO BOX 18670 Salt Lake City, UT 84118). Las claves de traducción `empresa_*` existen pero están vacías.
- **Traducciones corruptas**: Algunas claves en i18n contienen texto en chino (`选择性`) en lugar del español correcto (`direccion`, etc.). Se recomienda revisar `frontend/src/i18n/translations.js`.
- **Inconsistencia de routers**: Clientes, visitas y recibos usan el paquete `router`; el resto usa `express.Router()`.
- **BackupsPage** usa `fetch()` nativo en lugar de Axios como el resto de la app.
- **Archivo `.env` vacío** existe en `backend/src/.env` (no se usa actualmente).

## Licencia

ISC
