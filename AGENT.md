# AGENT.md

## Descripción del Proyecto

Sistema de gestión local para pequeña empresa (gestión de clientes, rutas, visitas, recibos y presupuestos).

**Stack:**
- Frontend: React 18 + Vite
- Backend: Express 5 + better-sqlite3
- Escritorio: Electron

## Ejecución

**Carpeta:** raíz del proyecto (`C:\Users\Fran\Desktop\sistema_local`)

```bash
# Desarrollo (todo: frontend + backend)
npm run dev

# Solo frontend
npm run dev:front

# Solo backend
npm run dev:back

# Solo Electron
npm run dev:electron
```

## Puertos

- Frontend: 5173 (Vite)
- Backend: 4000 (Express)

## Base de Datos

**Ubicación:** `backend/data/gestion_local.db`

**Tablas:**
- `clientes` - id, nombre, direccion, telefono, tipo_servicio, estado, created_at, updated_at
- `rutas` - id, nombre, dia, tipo_servicio, descripcion, created_at, updated_at
- `visitas` - id, cliente_id, fecha, dia_semana, direccion, hora, duracion_minutos, tipo_servicio
- `recibos` - id, cliente_id, fecha, monto, estado, descripcion, codigo
- `estimados` - id, cliente_id, direccion_trabajo, fecha, monto, moneda, descripcion_trabajo, estado

## Estados

- **recibos**: `pendiente` | `pagado` | `cancelado`
- **estimados**: `borrador` | `enviado` | `aceptado` | `rechazado`
- **clientes**: `activo` | `inactivo`

## Rutas API (existentes)

| Recurso   | GET         | POST        | PUT           | DELETE        |
|----------|-------------|------------|---------------|---------------|
| /clientes| /clientes   | /clientes  | /clientes/:id | /clientes/:id|
| /visitas | /visitas    | /visitas   | /visitas/:id   | /visitas/:id  |
| /recibos | /recibos    | /recibos   | /recibos/:id   | /recibos/:id  |
| /estimados| /estimados | /estimados | /estimados:id | /estimados:id |
| /backups | /backups    | /backups   | -             | -             |

**NOTA:** La tabla `rutas` existe en DB pero `/api/rutas` NO está implementado (falta crear routes/rutas.routes.js y agregarlo en routes/index.js).

## Imágenes

**Carpeta:** `frontend/public/`

Contiene recursos estáticos (logo, fotos de trabajos, etc.).

```
frontend/
├── src/
│   ├── pages/          # ClientesPage, RecibosPage, RutasPage, EstimadosPage, BackupsPage
│   ├── components/      # Sidebar, Modal
│   └── api/            # apiClient.js
backend/
├── src/
│   ├── routes/         # *.routes.js
│   ├── controllers/   # *.controller.js
│   ├── db/             # sqlite.js
│   ├── utils/          # initDb.js, addFechaToVisitas.js
│   └── app.js
electron/
├── main.js
├── preload.js
```

## Convenciones

- Backend usa CommonJS (`require`)
- Frontend usa ESM (`import`)
- Rutas API: `/api/{recurso}`
- Puerto backend hardcoded: 4000
- DB: SQLite en `backend/data/gestion_local.db`
- Inicializar DB: `npm run init-db` (desde backend/)

## Comandos Útiles

```bash
# Inicializar base de datos
cd backend && npm run init-db

# Agregar campo fecha a visitas (migración)
cd backend && npm run migrate:add-fecha-visitas
```