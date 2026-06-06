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

- **Frontend**: React 18 + Vite
- **Backend**: Express.js + SQLite (better-sqlite3)
- **Escritorio**: Electron (en desarrollo)
- **Estilos**: CSS personalizado
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

## Estructura del Proyecto

```
sistema_local/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Lógica de negocio
│   │   ├── db/           # Configuración de SQLite
│   │   ├── routes/       # Rutas API
│   │   └── server.js    # Punto de entrada
│   └── data/            # Base de datos SQLite
├── frontend/
│   ├── src/
│   │   ├── api/         # Cliente Axios
│   │   ├── components/  # Componentes React
│   │   ├── i18n/        # Traducciones
│   │   ├── pages/       # Vistas de la app
│   │   └── styles.css   # Estilos globales
│   └── vite.config.js
├── electron/            # Configuración Electron (en desarrollo)
└── package.json
```

## API Endpoints

| Recurso | Métodos |
|---------|---------|
| `/api/clientes` | GET, POST, PUT, DELETE |
| `/api/rutas` | GET, POST, PUT, DELETE |
| `/api/visitas` | GET, POST, PUT, DELETE |
| `/api/recibos` | GET, POST, PUT, DELETE |
| `/api/estimados` | GET, POST, PUT, DELETE |
| `/api/facturas` | GET, POST, PUT, DELETE |
| `/api/rutas-hojas` | GET, POST, PUT, DELETE |
| `/api/backups/create` | POST |
| `/api/backups/list` | GET |
| `/api/backups/download/:filename` | GET |
| `/api/backups/restore` | POST |
| `/api/backups/:filename` | DELETE |

## Base de Datos

La base de datos SQLite se encuentra en:
`backend/data/gestion_local.db`

### Tablas

- `clientes`: Información de clientes
- `rutas`: Rutas organizadas por día
- `visitas`: Citas programadas
- `recibos`: Pagos y cobros
- `estimados`: Presupuestos
- `facturas`: Encabezados de facturas
- `facturas_items`: Items de facturas
- `rutas_hojas`: Encabezados de hojas de ruta
- `rutas_hojas_clientes`: Clientes, horarios y descripciones de hojas de ruta

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

## Licencia

ISC
