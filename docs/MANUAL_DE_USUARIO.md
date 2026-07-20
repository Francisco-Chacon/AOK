# Manual de Usuario — Sistema de Gestión Local

**MAKE IT TO HAPPEN LLC**  
PO Box 18670, Salt Lake City, UT 84118

---

## Índice

1. [Introducción](#1-introducción)
2. [Inicio del Sistema](#2-inicio-del-sistema)
3. [Interfaz Principal](#3-interfaz-principal)
4. [Clientes](#4-clientes)
5. [Facturas](#5-facturas)
6. [Hojas de Ruta](#6-hojas-de-ruta)
7. [Estimados (Presupuestos)](#7-estimados-presupuestos)
8. [Propuestas](#8-propuestas)
9. [Contratos](#9-contratos)
10. [Backups (Respaldos)](#10-backups-respaldos)
11. [Asistente IA](#11-asistente-ia)
12. [Configuración (API Key)](#12-configuración-api-key)
13. [Exportar PDF](#13-exportar-pdf)
14. [Soporte Técnico](#14-soporte-técnico)
15. [Solución de Problemas](#15-solución-de-problemas)

---

## 1. Introducción

El Sistema de Gestión Local es una aplicación de escritorio diseñada para administrar clientes, facturas, estimados, propuestas, hojas de ruta, contratos y respaldos. Funciona completamente **sin conexión a internet** (excepto el Asistente IA, que requiere conexión si se usa).

Todos los datos se almacenan de forma local en el equipo, sin necesidad de servidores externos ni suscripciones.

---

## 2. Inicio del Sistema

### Requisitos
- Windows 10 o superior
- No requiere instalación de Node.js ni ningún otro programa

### Cómo abrir el sistema
1. Localice el archivo `SistemaGestion*.exe` (entregado por el desarrollador).
2. Haga doble clic para ejecutarlo.
3. Espere unos segundos mientras se inicia el sistema (verá la ventana principal aparecer automáticamente).
4. El sistema está listo para usar.

> **Nota**: La primera vez que se ejecuta, el sistema crea automáticamente la base de datos y las tablas necesarias. No requiere ninguna configuración inicial.

### Cómo cerrar el sistema
- Cierre la ventana normalmente, o presione `Alt + F4`.
- El sistema guarda todo automáticamente antes de cerrarse.

---

## 3. Interfaz Principal

La ventana principal se divide en tres áreas:

- **Barra lateral izquierda (Sidebar)**: Navegación entre módulos.
- **Barra superior (Topbar)**: Botones para cambiar idioma, tema (claro/oscuro) y configuración.
- **Área central**: Contenido del módulo seleccionado.

### Barra lateral
Los módulos disponibles son:
1. **Clientes** — Gestión de contactos
2. **Facturas** — Emisión de facturas
3. **Hojas de Ruta** — Planificación de visitas
4. **Estimados** — Presupuestos y cotizaciones
5. **Propuestas** — Documentos formales imprimibles
6. **Contratos** — Gestión de contratos
7. **Backups** — Respaldos de seguridad

Al pie de la barra lateral se encuentra el botón **Soporte Técnico** con los datos del desarrollador.

### Barra superior
- **Icono de idioma** 🌐: Alterna entre Español e Inglés.
- **Icono de sol/luna** ☀️/🌙: Alterna entre tema claro y oscuro.
- **Icono de engranaje** ⚙️: Abre la configuración de la API key del Asistente IA.

---

## 4. Clientes

### Lista de clientes
Al entrar en Clientes, se muestra una lista con todos los clientes registrados. Puede buscar por nombre usando la barra de búsqueda.

### Crear un cliente
1. Haga clic en **"Nuevo Cliente"**.
2. Complete los campos:
   - **Nombre**: Nombre del cliente (obligatorio).
   - **Dirección**: Dirección física.
   - **Teléfono**: Seleccione el código de país y escriba el número.
   - **Email**: Correo electrónico.
   - **Estado**: Activo, Pendiente o Inactivo.
3. Haga clic en **"Guardar"**.

> Los campos de teléfono y email tienen validación inline: si el formato no es correcto, se mostrará un mensaje en rojo, pero no impide guardar.

### Editar un cliente
1. Haga clic en el botón **editar** (icono de lápiz) en la tarjeta del cliente.
2. Modifique los campos necesarios.
3. Haga clic en **"Guardar"**.

### Eliminar un cliente
1. Haga clic en el botón **eliminar** (icono de papelera).
2. Confirme la eliminación en el modal que aparece.

### Ver detalle
Haga clic en la tarjeta del cliente para ver un modal con la información completa, incluyendo un avatar y el badge de estado.

---

## 5. Facturas

### Lista de facturas
Muestra todas las facturas creadas. Puede filtrar por estado (Pendiente, Pagado, Anulado) y buscar por cliente.

### Crear una factura
1. Haga clic en **"Nueva Factura"**.
2. Complete los campos:
   - **INVOICE #**: Número de factura (personalizable, por defecto "INV-{id}").
   - **Cliente**: Seleccione de la lista desplegable. Al seleccionar, se cargan automáticamente dirección, email y teléfono.
   - **Descripción**: Detalle del servicio o producto.
   - **Monto**: Valor de la factura.
   - **Fecha**: Fecha de emisión.
   - **Estado**: Pendiente, Pagado o Anulado.
3. Haga clic en **"Guardar"**.

### Editar / Eliminar
Use los botones de acción en cada fila de la tabla.

### Vista previa e impresión
- Haga clic en **"Vista Previa"** para ver el diseño de la factura.
- Desde la vista previa puede **Imprimir** o **Exportar PDF**.

---

## 6. Hojas de Ruta

### Lista de hojas de ruta
Muestra todas las hojas de ruta registradas. Puede buscar por fecha.

### Crear una hoja de ruta
1. Haga clic en **"Nueva Hoja de Ruta"**.
2. Complete los datos generales:
   - **Fecha**: Día de la ruta.
   - **Conductor**: Nombre del conductor.
   - **Camión**: Identificación del vehículo.
3. Agregue clientes a la ruta:
   - Seleccione un cliente de la lista.
   - Ingrese **hora de entrada** y **hora de salida**.
   - Agregue una **descripción** de la visita.
   - Haga clic en **"Agregar"**.
4. Puede agregar múltiples clientes a una misma ruta.
5. Haga clic en **"Guardar"**.

### Editar / Eliminar
Use los botones de acción en cada fila de la tabla.

### Vista previa e impresión
Desde la vista previa puede Imprimir o Exportar PDF.

---

## 7. Estimados (Presupuestos)

### Lista de estimados
Muestra todos los presupuestos. Puede filtrar por estado (Borrador, Enviado, Aceptado, Rechazado) y buscar por cliente.

### Crear un estimado
1. Haga clic en **"Nuevo Estimado"**.
2. Complete los datos generales:
   - **Cliente**: Seleccione de la lista.
   - **Dirección de trabajo**: Dirección del proyecto.
   - **Fecha**: Fecha del presupuesto.
   - **Moneda**: USD, EUR, MXN, PAB o COP.
   - **Tasa de impuesto**: 7%, 15% o 25%.
   - **Estado**: Borrador, Enviado, Aceptado o Rechazado.
3. Agregue materiales o servicios:
   - **Descripción**: Detalle del ítem.
   - **Cantidad**: Número de unidades.
   - **Precio unitario**: Valor por unidad.
   - Haga clic en **"Agregar"** para incluir el ítem en la tabla.
4. El sistema calcula automáticamente el subtotal, impuesto y total.
5. Haga clic en **"Guardar"**.

### Editar / Eliminar
Use los botones de acción en cada fila.

### Vista previa e impresión
La vista previa se muestra en un panel dividido. Puede Imprimir o Exportar PDF.

---

## 8. Propuestas

### Lista de propuestas
Muestra todos los estimados que pueden convertirse en propuestas formales. Puede filtrar por estado y buscar.

### Crear una propuesta
1. Haga clic en **"Nueva Propuesta"**.
2. Complete los campos (cliente, dirección, fecha, moneda, descripción, monto, estado).
3. Haga clic en **"Guardar"**.
4. Al guardar, la propuesta se muestra automáticamente en el panel de vista previa del lado derecho.

### Vista previa
La propuesta se renderiza como un documento formal imprimible con:
- Logo de la empresa
- Datos del cliente (nombre, dirección, email, teléfono)
- Descripción detallada del trabajo
- Monto y moneda
- Diseño profesional listo para imprimir

### Exportar PDF
Desde la vista previa, haga clic en **"Exportar PDF"**.

---

## 9. Contratos

### Lista de contratos
Muestra todos los contratos registrados. Puede buscar por cliente.

### Crear un contrato
1. Haga clic en **"Nuevo Contrato"**.
2. Complete los campos:
   - **Cliente**: Seleccione de la lista.
   - **Fecha de inicio**: Inicio del contrato.
   - **Fecha de fin**: Finalización del contrato (no puede ser anterior a la fecha de inicio).
   - **Descripción**: Detalle del contrato.
   - **Monto**: Valor del contrato.
3. Haga clic en **"Guardar"**.

> **Validación**: Si la fecha de fin es anterior a la fecha de inicio, se muestra un error en rojo.

### Vista previa
La vista previa muestra:
- Tabla con datos del cliente y fechas
- Descripción del contrato
- Monto
- Líneas de firma (Cliente / Contratista)

### Imprimir / Exportar PDF
Use los botones correspondientes desde la vista previa.

---

## 10. Backups (Respaldos)

### ¿Por qué hacer backups?
Los backups son copias de seguridad de toda la base de datos. Sirven para recuperar la información en caso de que algo salga mal o si se cambia de computadora.

### Crear un backup
1. Vaya a la sección **Backups**.
2. Haga clic en **"Crear backup"**.
3. Confirme la operación.
4. El backup aparecerá en la lista con la fecha y hora de creación.

### Descargar un backup
Haga clic en **"Descargar"** junto al backup que desea guardar.

### Subir un backup
1. Use la sección **"Subir backup desde archivo"**.
2. Seleccione un archivo `.db` desde su computadora.
3. Haga clic en **"Subir backup"**.

### Restaurar un backup
1. Haga clic en **"Restaurar"** junto al backup deseado.
2. Confirme la operación.
3. **Importante**: La restauración reemplaza todos los datos actuales. El sistema se reiniciará automáticamente.

### Eliminar un backup
1. Haga clic en el botón de eliminar (icono de papelera).
2. Confirme la eliminación.

---

## 11. Asistente IA

El Asistente IA es un chat integrado que puede ayudar a usar el sistema.

### Cómo abrirlo
Haga clic en el **botón flotante** (icono de robot) en la esquina inferior derecha de la pantalla.

### Consultas de datos (sin necesidad de internet)
El asistente puede responder preguntas sobre los datos del sistema **sin conexión a internet**:
- "¿Cuántos clientes tengo?"
- "Resumen general del sistema"
- "¿Qué facturas están pendientes?"
- "Mostrar contratos activos"
- "Actividad reciente"
- "Buscar [término]"

### Conversación con IA (requiere internet + API key)
Para hacer preguntas como "¿Cómo creo una factura?" o "¿Qué es una hoja de ruta?", se necesita:
1. Tener conexión a internet.
2. Configurar una API key de OpenRouter (ver sección [Configuración](#12-configuración-api-key)).

Si no hay API key configurada, el asistente mostrará un mensaje indicando qué consultas de datos están disponibles.

---

## 12. Configuración (API Key)

La API key permite que el Asistente IA responda preguntas sobre el uso del sistema.

### Cómo configurarla
1. Haga clic en el **icono de engranaje** ⚙️ en la barra superior.
2. En el modal de configuración, escriba su API key de OpenRouter.
3. Haga clic en **"Guardar"**.
4. Verá un checkmark verde indicando que la key está configurada.

> **Seguridad**: La API key se almacena cifrada en la base de datos local. Nunca se muestra en la interfaz. Si ya hay una key configurada, el campo aparece vacío por seguridad.

### Cómo eliminar la API key
1. Abra la configuración (icono de engranaje).
2. Haga clic en **"Eliminar"**.
3. La key se borrará permanentemente.

---

## 13. Exportar PDF

Los siguientes documentos se pueden exportar a PDF:

| Módulo | Botón |
|--------|-------|
| Facturas | "Exportar PDF" en vista previa |
| Estimados | "Exportar PDF" en vista previa |
| Propuestas | "Exportar PDF" en vista previa |
| Hojas de Ruta | "Exportar PDF" en vista previa |
| Contratos | "Exportar PDF" en vista previa |

Los nombres de los archivos se generan automáticamente según el idioma activo:
- Español: `Factura_X.pdf`, `Estimado_X.pdf`, `Contrato_X.pdf`
- English: `Invoice_X.pdf`, `Estimate_X.pdf`, `Contract_X.pdf`

---

## 14. Soporte Técnico

Para contactar al desarrollador:

1. Haga clic en **"Soporte Técnico"** al pie de la barra lateral izquierda.
2. Se abrirá un modal con los datos de contacto:
   - **Desarrollador**: Francisco Chacón
   - **Teléfono**: +503 7204-4924
   - **Email**: francochacon155@gmail.com
   - **Ubicación**: El Salvador

---

## 15. Solución de Problemas

### El sistema no se abre
- Asegúrese de tener Windows 10 o superior.
- Ejecute el `.exe` como Administrador (clic derecho → "Ejecutar como administrador").
- Revise que su antivirus no haya bloqueado el programa.

### No aparecen los datos después de restaurar un backup
- Reinicie el sistema después de restaurar.
- Si el problema persiste, contacte a Soporte Técnico.

### El Asistente IA no responde
- Si no hay conexión a internet, use solo consultas de datos (pregunte por clientes, facturas, etc.).
- Si hay internet pero no responde, verifique que la API key esté configurada en **Configuración** (icono de engranaje).

### Error al exportar PDF
- Cierre la ventana de vista previa y vuelva a abrirla.
- Si el error persiste, reinicie el sistema.

### Los textos aparecen en otro idioma
- Use el botón de idioma 🌐 en la barra superior para alternar entre Español e Inglés.

---

© 2026 MAKE IT TO HAPPEN LLC. Todos los derechos reservados.
