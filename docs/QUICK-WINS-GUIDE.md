# 3 QUICK WINS - GUÍA DE IMPLEMENTACIÓN

## Resumen

He implementado 3 funcionalidades de alto impacto y bajo riesgo en Sur Realista:

1. **Formulario Rápido de Oportunidades** - Capturar leads express
2. **Checklist de Documentación Legal** - Tracking de documentos requeridos
3. **Gestor de Ofertas** - Timeline de ofertas y contraofertas

---

## 1. FORMULARIO RÁPIDO DE OPORTUNIDADES

### Ubicación
- **Componente:** `/components/quick-wins/quick-opportunity-form.tsx`
- **API:** `/app/api/quick-wins/opportunities/route.ts`
- **BD:** Tabla `quick_opportunities` (ya existe)

### Qué hace
Formulario express para capturar rápidamente:
- Nombre del contacto
- Teléfono
- Ubicación (región, ciudad)
- Hectáreas
- Tipo de propiedad (terreno, fundo, casa, campo)
- Precio solicitado
- Notas adicionales

### Cómo usarlo
1. Ve a `/quick-wins` (nueva página)
2. En la columna izquierda, rellena el formulario
3. Click "Guardar Oportunidad"
4. Se guarda automáticamente en la BD

### Campos guardados
- contact_name
- phone_number
- location
- hectares (decimal)
- property_type
- asking_price
- notes
- status (siempre 'new')
- created_at

---

## 2. CHECKLIST DE DOCUMENTACIÓN LEGAL

### Ubicación
- **Componente:** `/components/quick-wins/document-checklist.tsx`
- **Sin API** - Todo es local en memoria (cliente-side)

### Qué hace
Checklist visual con documentos legales preconfigurados:

**Documentos por defecto:**
- Título de Propiedad (legal)
- Certificado de Avalúo (legal)
- Certificado de No Afectación (legal)
- Fojas de Dominio (legal)
- Escritura Pública (legal)
- Permiso Municipal (municipal)
- Certificado AFICO (tax)
- Certificado del SII (tax)

### Funcionalidades
✅ Checkbox para marcar completados
✅ Categorías con color (legal/municipal/tax)
✅ Agregar documentos personalizados
✅ Eliminar documentos
✅ Barra de progreso visual
✅ Contador de completados/pendientes

### Cómo usarlo
1. Ve a `/quick-wins` → columna central
2. Marca los documentos conforme los obtengas ✓
3. Click "+ Agregar Documento Personalizado" si necesitas otros
4. La barra de progreso se actualiza automáticamente

---

## 3. GESTOR DE OFERTAS

### Ubicación
- **Componente:** `/components/quick-wins/offer-manager.tsx`
- **Sin API** - Todo es local en memoria (cliente-side)

### Qué hace
Timeline de ofertas y contraofertas con:
- Monto de la oferta
- Fecha registrada
- Estado (Pendiente/Aceptada/Rechazada/Contrapropuesta)
- Notas de negociación

### Estados de Oferta
- **Pendiente** ⏳ (gris) - En espera de respuesta
- **Aceptada** ✅ (verde) - Deal cerrado
- **Rechazada** ❌ (rojo) - Cliente/Broker rechazó
- **Contrapropuesta** ↻ (azul) - Nuevo monto propuesto

### Funcionalidades
✅ Seguimiento de precio base vs. oferta actual
✅ Cálculo automático de diferencia y porcentaje
✅ Timeline visual de ofertas
✅ Cambio de estado de ofertas
✅ Notas por cada oferta

### Cómo usarlo
1. Ve a `/quick-wins` → columna derecha
2. Click "+ Nueva Oferta"
3. Ingresa:
   - Monto en UF
   - Si es del cliente o de ustedes
   - Notas
4. La oferta aparece en el timeline
5. Click en botones para cambiar estado: Aceptar/Rechazar/Contrapropuesta

---

## DÓNDE ENCONTRAR LOS 3 QUICK WINS

### Opción 1: Página Dedicada
📍 **URL:** `/quick-wins`
- Los 3 componentes lado a lado en una página
- Perfecta para dashboard o inicio rápido

### Opción 2: En la Ficha 360° de Cliente
📍 **Ubicación:** `/clientes/[id]` → 3 tabs nuevos
- Tab 4: **Oportunidad** - Formulario de captura
- Tab 5: **Documentos** - Checklist de documentos
- Tab 6: **Ofertas** - Gestor de ofertas

---

## ARQUITECTURA

### Base de Datos
```sql
-- Tabla quick_opportunities (ya existe)
- id (UUID)
- contact_name (text)
- phone_number (text)
- location (text)
- hectares (decimal)
- property_type (text)
- asking_price (decimal)
- notes (text)
- status (text) - 'new', 'contacted', 'qualified'
- created_at (timestamp)
- user_id (UUID) - para RLS
```

### Componentes
- ✅ `quick-opportunity-form.tsx` - Formulario react con validación
- ✅ `document-checklist.tsx` - Checklist con estado local
- ✅ `offer-manager.tsx` - Timeline de ofertas

### APIs
- ✅ `POST /api/quick-wins/opportunities` - Crear oportunidad
- ✅ `GET /api/quick-wins/opportunities` - Listar oportunidades

---

## INTEGRACIÓN CON CÓDIGO EXISTENTE

### No rompe nada
✅ Tabla `quick_opportunities` es nueva (no afecta clientes)
✅ Componentes son independientes (no modifican nada)
✅ APIs son nuevas (no compiten con existentes)
✅ Ficha 360° solo agrega tabs (no modifica tabs existentes)

### Complementa el flujo existente
- Cliente entra en `/clientes` → ve lista
- Hace click en cliente → abre Ficha 360°
- Puede registrar oportunidad rápida en tab "Oportunidad"
- Puede trackear documentos en tab "Documentos"
- Puede gestionar ofertas en tab "Ofertas"

---

## PRÓXIMOS PASOS (Futuro)

### Conectar con BD (guardar estado)
Actualmente Checklist y OfferManager guardan solo en memoria (client-side).
Para persistencia:
1. Crear tabla `client_documents` y `client_offers`
2. Agregar API endpoints
3. Modificar componentes para hacer fetch/save

### Agregar más campos
- Documento de identidad del contacto
- Fotos de la propiedad
- Historial de precio (gráfico)
- Automáticos de cierre

### Integrar con Pipeline Kanban
- Crear tarjeta automática en Kanban cuando se agrega oportunidad
- Mover tarjeta por estado de oferta

---

## TESTING CHECKLIST

- [ ] Ir a `/quick-wins` y ver los 3 componentes
- [ ] Llenar formulario de oportunidad y guardar
- [ ] Ver que se muestra "Oportunidad guardada exitosamente"
- [ ] Ir a `/clientes/[cualquier-id]` y ver 6 tabs
- [ ] Clic en tab "Oportunidad" - debe mostrar formulario
- [ ] Clic en tab "Documentos" - debe mostrar checklist
- [ ] Clic en tab "Ofertas" - debe mostrar gestor
- [ ] Marcar documentos en checklist - debe actualizar progreso
- [ ] Agregar oferta - debe aparecer en timeline
- [ ] Cambiar estado de oferta - debe cambiar color/icono

---

## NOTAS TÉCNICAS

- Todos los componentes usan Shadcn/UI components existentes
- Responden bien en mobile (grid-cols-3 en desktop, stack en mobile)
- Los formularios tienen validación básica
- Manejo de errores en API endpoints
- Timestamps en español (es-CL)
- Icons de Lucide React

## RESUMEN

**3 funcionalidades nuevas, 0 código roto, máximo impacto, mínimo riesgo.**

Los Quick Wins están listos para usar. Hard refresh (Ctrl+Shift+R) y ve a `/quick-wins` para probar.
