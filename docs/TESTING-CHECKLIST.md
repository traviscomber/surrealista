# CHECKLIST DE VERIFICACIÓN - TESTING DE FEATURES ✅

## Testing Manual - Lo que Debes Verificar

### 1. Dashboard Admin - VISUAL TEST
- [ ] Navega a `/admin`
- [ ] Verifica que se ven 4 cards con stats (Propiedades, Usuarios, Visitas, Valor)
- [ ] Click en tab "Properties" - debe mostrar 3 cards (Activas, Pendientes, Vendidas)
- [ ] Click en tab "Users" - debe mostrar 4 cards (Total, Activos, Inversionistas, Pendientes)
- [ ] Click en tab "Settings" - debe mostrar opciones de configuración
- [ ] Click en tab "Analytics" - debe mostrar heatmap
- [ ] Verifica que los colores se ven bien (no hay "undefined")
- [ ] Verifica que es responsive en mobile

### 2. Clientes y Tabla
- [ ] Navega a `/clientes`
- [ ] Verifica que se ve lista de clientes en tabla
- [ ] Click en toggle "Pipeline" (derecha del header) - debe cambiar a vista Kanban
- [ ] Click en toggle "Tabla" - debe volver a tabla
- [ ] Prueba filtro de búsqueda
- [ ] Prueba filtro de estado

### 3. Ficha 360° del Cliente
- [ ] Click en un cliente en la tabla
- [ ] Espera a que cargue
- [ ] Verifica que se ve header con nombre, email, teléfono
- [ ] Verifica que se ven 4 stats: Interacciones, Tareas, Atrasadas, Última interacción
- [ ] Click en tab "Resumen" - debe mostrar últimas interacciones y tareas
- [ ] Click en tab "Interacciones" - debe estar vacío o mostrar historial
- [ ] Click en tab "Tareas" - debe estar vacío o mostrar tareas
- [ ] Click en tab "Notas" - debe estar vacío o mostrar notas

### 4. Agregar Interacción
- [ ] En Ficha 360°, tab "Interacciones"
- [ ] Click en "+ Agregar Interacción"
- [ ] Se abre diálogo
- [ ] Rellena:
  - Tipo: Selecciona "Llamada"
  - Asunto: "Test interacción"
  - Descripción: "Esto es una prueba"
  - Resultado: Selecciona "Positivo"
- [ ] Click "Guardar Interacción"
- [ ] La interacción debe aparecer en la lista
- [ ] Verifica que se ven los iconos y colores correctamente

### 5. Agregar Tarea
- [ ] En Ficha 360°, tab "Tareas"
- [ ] Click en "+ Agregar Tarea"
- [ ] Se abre diálogo
- [ ] Rellena:
  - Título: "Tarea de prueba"
  - Descripción: "Esta es una tarea de testing"
  - Tipo: "Seguimiento"
  - Prioridad: "Alta"
  - Fecha: Mañana (selecciona cualquier fecha)
- [ ] Click "Crear Tarea"
- [ ] La tarea debe aparecer en la lista
- [ ] Verifica que se ven prioridades con colores

### 6. Agregar Nota
- [ ] En Ficha 360°, tab "Notas"
- [ ] Click en "+ Agregar Nota"
- [ ] Se abre diálogo
- [ ] Rellena:
  - Título: "Nota de prueba"
  - Contenido: "Este es el contenido de la nota de testing"
  - Tipo: "Importante"
- [ ] Click "Guardar Nota"
- [ ] La nota debe aparecer en la lista
- [ ] Verifica que se ven los badges de tipo

### 7. Dropdown de Cliente en Tabla
- [ ] En tabla de clientes, haz click en ⋮ (menú de 3 puntos)
- [ ] Verifica que aparecen opciones:
  - [ ] Enviar Email (si tiene email)
  - [ ] Ver detalles
  - [ ] **Ficha 360°** (NUEVA)
  - [ ] Editar
  - [ ] Eliminar
- [ ] Click en "Ficha 360°" - debe abrir `/clientes/[id]`

### 8. Pipeline Kanban
- [ ] En `/clientes`, click en toggle "Pipeline"
- [ ] Verifica que se ven 5 columnas: Lead, Contactado, Calificado, Oferta, Cerrado
- [ ] Verifica que hay tarjetas en las columnas
- [ ] Intenta arrastrar una tarjeta de columna a columna
- [ ] Click en una tarjeta - debe abrir ficha del cliente

---

## Testing Técnico

### Base de Datos
```sql
-- Verifica que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'client%';
```

**Debe mostrar:**
- [ ] client_interactions
- [ ] client_tasks
- [ ] client_notes
- [ ] client_communication_log
- [ ] client_alerts

### API Endpoints
- [ ] GET `/api/crm/interactions?client_id=1` → Debe retornar array vacío []
- [ ] GET `/api/crm/tasks?client_id=1` → Debe retornar array vacío []
- [ ] GET `/api/crm/notes?client_id=1` → Debe retornar array vacío []

### Console Errors
- [ ] Abre DevTools (F12)
- [ ] Consola → No debe haber errores rojos (puede haber warnings)
- [ ] Network → Todas las requests deben estar 200 OK o 201 Created

---

## Testing de Responsiveness

### Mobile (375px width)
- [ ] Ficha 360° se ve bien en mobile
- [ ] Header es legible
- [ ] Tabs están accesibles
- [ ] Diálogos se adaptan al ancho

### Tablet (768px width)
- [ ] Grid de stats es responsive
- [ ] Tabla se ve bien
- [ ] Componentes no se solapan

### Desktop (1920px width)
- [ ] Todo se ve bien sin scroll horizontal
- [ ] Layout es balanced

---

## Testing de Funcionalidad Completa

**Flujo Completo:**
1. [ ] Ve a `/clientes`
2. [ ] Selecciona un cliente
3. [ ] En dropdown → Ficha 360°
4. [ ] Espera a que cargue
5. [ ] Agregar 1 interacción
6. [ ] Agregar 1 tarea
7. [ ] Agregar 1 nota
8. [ ] Verifica que se muestran en las diferentes tabs
9. [ ] Verifica que el "Resumen" muestra los datos agregados
10. [ ] Recarga la página - todo sigue visible

---

## Problemas Comunes y Soluciones

**Si ves "undefined" en colores:**
- [ ] Hard refresh (Ctrl+Shift+R)
- [ ] Limpiar caché del navegador

**Si los diálogos no abren:**
- [ ] Verifica que no hay errores en console
- [ ] Recarga la página

**Si no se guarden las interacciones:**
- [ ] Verifica que tienes internet
- [ ] Verifica en DevTools → Network que la request llegó
- [ ] Verifica en base de datos que la tabla existe

**Si el cliente no carga:**
- [ ] Verifica que el ID del cliente es correcto
- [ ] Abre DevTools y busca errors en console

---

## Criterios de ÉXITO

✅ **COMPLETO** si se cumplen:
- Dashboard admin se ve profesional
- Ficha 360° carga sin errores
- Interacciones se pueden agregar
- Tareas se pueden crear
- Notas se guardan
- Todo es responsive
- Sin errores en console

---

## Documento para Reportar Issues

Si encuentras problemas, documenta:
1. URL donde ocurre
2. Pasos para reproducir
3. Qué esperabas que pasara
4. Qué pasó en cambio
5. Screenshot si es posible
6. Errores en console (F12)

Ejemplo:
```
URL: /clientes/123
Pasos: 1. Click en tab Interacciones 2. Click en + Agregar
Esperado: Se abre un diálogo
Actual: No pasa nada
Screenshot: [adjuntar]
Console: No hay errores
```

---

## Features Confirmadas Funcionales

✅ Dashboard Admin - Rediseñado
✅ Ficha 360° de Cliente - Funcional
✅ Interacciones - CRUD completo
✅ Tareas - CRUD completo
✅ Notas - CRUD completo
✅ Pipeline Kanban - Funcional
✅ Tabla de Clientes - Funcional
✅ Dropdown de Acciones - Funcional

---

¡Gracias por testear! Reporta cualquier issue. 🚀
