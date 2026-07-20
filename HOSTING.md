# Opciones de Hosting Gratuito para el Sistema

Stack actual: **Express + better-sqlite3 + React (build estático)**

---

## 1. Oracle Cloud Free Tier (Recomendado)

| Aspecto | Detalle |
|---------|---------|
| **CPU** | 4 núcleos ARM |
| **RAM** | 24 GB |
| **Disco** | 200 GB persistente |
| **Precio** | $0 (para siempre) |
| **SQLite** | ✅ Funciona sin cambios |
| **Persistencia BD** | ✅ Sí (disco persistente) |

**Flujo de cambios:**
```bash
git pull
npm run build
pm2 restart server
```
Los cambios se reflejan instantáneamente.

**Registro:** Piden tarjeta de crédito para verificar identidad, pero no realizan cargos.

---

## 2. Fly.io

| Aspecto | Detalle |
|---------|---------|
| **CPU/RAM** | VM compartida |
| **Disco** | 3 GB persistente (volumen) |
| **Precio** | Gratis (límite de horas/mes) |
| **SQLite** | ✅ Funciona (montando volumen) |
| **Deploy** | `fly deploy` — cambios rápidos |

**Contra:** Si la app escala en uso, toca migrar a plan pago.

---

## 3. Render + PostgreSQL (Migración requerida)

| Aspecto | Detalle |
|---------|---------|
| **Web Service** | Gratis (spin-down a los 15 min) |
| **Base de datos** | Supabase o Neon.tech (PostgreSQL gratis) |
| **SQLite** | ❌ No funciona (sin disco persistente) |
| **Persistencia BD** | ✅ PostgreSQL se mantiene |

**Requiere:** Migrar de `better-sqlite3` a `pg`. Reescribir queries y controladores.

---

## 4. VPS Barato (~$3-5/mes)

| Opción | Precio |
|--------|--------|
| Hetzner CX22 | ~€4/mes |
| RackNerd (ofertas) | ~$3/año |
| **SQLite** | ✅ Funciona sin cambios |

Control total, sin límites de horas.

---

## Resumen

| Opción | Gratis | Persistente | Sin cambios | Larga duración |
|--------|:------:|:-----------:|:-----------:|:--------------:|
| **Oracle Cloud** | ✅ | ✅ | ✅ | ✅ |
| Fly.io | ✅ | ✅ | ✅ | ⚠️ límite horas |
| Render + PG | ✅ | ✅ | ❌ migrar | ✅ |
| VPS barato | ❌ | ✅ | ✅ | ✅ |

**Elegir:**

- **Sin cambiar nada, gratis y eterno** → Oracle Cloud Free Tier
- **Sin cambiar nada, gratis con límite** → Fly.io
- **Sin pagar, dispuesto a migrar a PostgreSQL** → Render + Supabase
- **Sin complicaciones, pagando poco** → VPS en Hetzner o RackNerd
