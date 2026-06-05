# MAPA DE NAVEGACIÓN - NUEVAS FEATURES 🗺️

## Dashboard Admin Mejorado
**URL:** `/admin` o `/admin/dashboard`

**Qué ves:**
- Overview con actividad reciente
- Stats de propiedades, usuarios, ventas
- Acceso rápido a funciones
- Heatmap de ventas
- Estado del sistema

**Cómo llegar:**
1. Menú principal → Admin Dashboard
2. O directamente a `/admin`

---

## Clientes + Ficha 360°
**URL Base:** `/clientes`

### Listar Clientes
**URL:** `/clientes` (dirigido desde dashboard)

**Qué ves:**
- Tabla de todos los clientes
- Toggle Tabla/Pipeline Kanban
- Filtros por estado, industria, búsqueda
- Acciones en dropdown (⋮)

**Cómo acceder:**
1. Dashboard → Clientes
2. O `/clients` desde menu

### Ver Ficha 360° del Cliente
**URL:** `/clientes/[id]`

**Qué ves:**
- Header con info personal
- 4 stats principales
- 4 Tabs:
  1. **Resumen** - Dashboard rápido
  2. **Interacciones** - Historial de contactos
  3. **Tareas** - Recordatorios pendientes
  4. **Notas** - Comentarios internos

**Cómo acceder:**
1. Ve a `/clientes`
2. Click en cliente deseado
3. En dropdown (⋮) → **Ficha 360°**

O directamente:
```
/clientes/123456
```

---

## Interacciones del Cliente

### Dentro de Ficha 360° → Tab "Interacciones"

**Qué ves:**
- Historial de todas las interacciones
- Botón "+ Agregar Interacción"

**Tipos de Interacción:**
- 📞 Llamada
- 📧 Email
- 💬 WhatsApp
- 📅 Reunión
- 🚗 Visita
- 📝 Nota

**Cómo agregar:**
1. Tab Interacciones
2. "+ Agregar Interacción"
3. Rellenar formulario
4. Guardar

---

## Tareas y Recordatorios

### Dentro de Ficha 360° → Tab "Tareas"

**Qué ves:**
- Lista de tareas pendientes
- Botón "+ Agregar Tarea"
- Prioridades visuales

**Tipos de Tarea:**
- Seguimiento
- Llamada
- Email
- Propuesta
- Reunión
- Visita
- Otro

**Prioridades:**
- 🔴 Urgente (rojo)
- 🟠 Alta (naranja)
- 🔵 Media (azul)
- ⚪ Baja (gris)

**Cómo crear:**
1. Tab Tareas
2. "+ Agregar Tarea"
3. Rellenar (título, descripción, tipo, prioridad, vencimiento)
4. Crear Tarea

---

## Notas y Comentarios

### Dentro de Ficha 360° → Tab "Notas"

**Qué ves:**
- Notas registradas del cliente
- Botón "+ Agregar Nota"

**Tipos de Nota:**
- 👤 Personal (solo para ti)
- 🏢 Interna (para el equipo)
- ⭐ Importante (destacada)

**Cómo agregar:**
1. Tab Notas
2. "+ Agregar Nota"
3. Título + Contenido + Tipo
4. Guardar Nota

---

## Pipeline Kanban

**URL:** `/clientes` → Toggle "Pipeline"

**Qué ves:**
- 5 Columnas: Lead → Contactado → Calificado → Oferta → Cerrado
- Tarjetas movibles con clientes
- Progreso visual de ventas
- Montos en juego

**Cómo usar:**
1. Ve a `/clientes`
2. Click en toggle "Pipeline" (derecha del header)
3. Arrastra tarjetas entre columnas
4. Click en tarjeta para ver más detalles

---

## Presentaciones Comparativas (PREPARADA)

**Status:** ✅ Funcional, esperando integración

**Ubicación en código:** `/components/features/comparative-presentation/`

**Qué hace:**
- Compara hasta 5 propiedades
- Análisis precio/hectárea
- Exporta como documento profesional

**Para integrar:** (Espera instrucciones)

---

## WhatsApp Business (PREPARADA)

**Status:** ⏳ Listo para integrar, espera credenciales Meta

**Ubicación en código:** `/components/features/whatsapp-integration/`

**Qué hará cuando se integre:**
- Enviar fichas por WhatsApp
- Chats dentro de la plataforma
- Templates pre-aprobados
- Estadísticas de mensajes

**Para integrar:** (Espera instrucciones)

---

## Firma Digital (PREPARADA)

**Status:** ⏳ Listo para integrar, espera credenciales DocuSign

**Ubicación en código:** `/components/features/digital-signature/`

**Qué hará cuando se integre:**
- Crear mandatos digitales
- Firmar documentos online
- Tracking de firmas
- Historial de documentos

**Para integrar:** (Espera instrucciones)

---

## Heatmap de Ventas

**URL:** `/admin` → Tab "Analytics"

**Qué ves:**
- Mapa de calor por zona geográfica
- Intensidad de ventas
- Regiones más activas

---

## Generador de Posts RRSS

**Status:** ✅ Disponible

**Ubicación en código:** `/components/features/social-media-generator/`

**Qué hace:**
- Genera posts para Instagram/LinkedIn
- Descarga como PNG
- Copia caption automático

---

## Estadísticas Admin

**URL:** `/admin` → Tab "Overview"

**Qué ves:**
- 4 Stats principales (propiedades, usuarios, visitas, valor promedio)
- Últimas actividades
- Propiedades, usuarios, configuración

---

## Búsqueda Avanzada de Campos

**URL:** `/campos`

**Panel:** "Búsqueda Geográfica Avanzada"

**Puedes buscar:**
- Por coordenadas
- Por radio de distancia
- Por características (agua, acceso, etc)
- Por vecinos
- Por ROL

---

## Documentación

**Todos los docs están en:** `/docs/`

**Principales:**
- `RESUMEN-SESION-COMPLETA.md` - Overview completo
- `CRM-FASE1-IMPLEMENTACION.md` - CRM details
- `3-FEATURES-LISTAS-PARA-INTEGRAR.md` - Features pending
- `OPTIMIZACION-DASHBOARD-COMPLETADA.md` - Dashboard improvements

---

## Quick Links

| Función | URL |
|---------|-----|
| Dashboard Admin | `/admin` |
| Clientes | `/clientes` |
| Ficha de Cliente | `/clientes/[id]` |
| Campos | `/campos` |
| Admin Dashboard | `/admin/dashboard` |
| Asistente IA | `/asistente-ia` |

---

## Atajos Útiles

**Para acceder rápido a ficha 360° de cliente:**
```
https://sur-realista.vercel.app/clientes/123456
```

Reemplaza `123456` con el ID del cliente.

---

## Tips & Tricks

✅ El toggle Tabla/Pipeline está en el header de Clientes
✅ Los dropdowns (⋮) tienen las acciones principales
✅ Usa las búsquedas para filtrar rápidamente
✅ Las prioridades se marcan por color
✅ Las fechas se muestran en español
✅ Puedes agregar múltiples interacciones por cliente
✅ Las tareas atrasadas se marcan en rojo

---

## Próximas Mejoras

- Sistema de alertas automáticas
- Notificaciones en tiempo real
- Integración WhatsApp Business
- Firma digital DocuSign
- Dashboard ejecutivo mejorado
