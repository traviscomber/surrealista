# HANDOVER — Sur Realista

Última actualización: 2026-10-02

## Estado actual

Branch activa: `feat/operating-system-shell`
PR: #184
Base: `main`

Objetivo de esta rama: convertir Sur Realista en un Operating System interno con una portada operativa de tres columnas, cinco módulos canónicos y un asistente IA transversal con agentes especialistas.

## Arquitectura de producto

Landing `/`:
- navegación izquierda colapsable;
- superficie operativa central;
- contexto/inteligencia derecha colapsable;
- indicadores canónicos;
- atajos;
- asistente IA transversal.

Módulos canónicos:
1. Campos
2. Clientes
3. Multimedia
4. Documentos
5. Mercado

## Arquitectura IA

Patrón aplicado desde arXiv:2507.17289:
- FastTrack: consulta directa, un dominio, baja latencia.
- FullAgentic: cruza módulos, prepara informes, compara o necesita varias fuentes.
- Router: `lib/ai/sur-realista-os.ts`.
- Endpoint: `app/api/ai-assistant/route.ts`.

Principio obligatorio: el asistente sólo sintetiza evidencia recuperada. No debe inventar tendencias, precios, relaciones cliente-campo ni completar vacíos como hechos.

Fuentes actualmente conectadas al orquestador:
- `clients`
- `kmz_collection`
- `documents`
- `properties_external`
- `client_communications`
- `tasks` cuando la consulta requiere tareas/seguimiento

La respuesta expone:
- modo FastTrack/FullAgentic;
- agente/orquestador;
- fuentes consultadas;
- fuentes fallidas;
- confidence basado en evidencia recuperada;
- número de registros usados.

## Cambios de la rama

- `app/page.tsx`: landing OS y métricas canónicas.
- `components/os/operating-system-dashboard.tsx`: shell 3 columnas colapsables.
- `docs/SUR-REALISTA-OS-AGENTS.md`: contrato conceptual de agentes.
- `lib/ai/sur-realista-os.ts`: router + retrieval de evidencia por dominio.
- `app/api/ai-assistant/route.ts`: reemplaza respuestas inmobiliarias hardcodeadas por síntesis grounded.
- `components/ai-assistant/ai-assistant-chat.tsx`: muestra modo de routing, agente y nivel de evidencia.

## Decisiones canónicas

- No borrar data canónica para simplificar UI.
- No fabricar métricas ni tendencias.
- Una relación cliente-campo sólo se afirma si existe evidencia explícita.
- La portada es operacional; no es una landing de marketing.
- Desktop usa tres columnas. Las columnas laterales deben poder colapsarse.
- Cada módulo tendrá agente especialista, pero la lógica común vive en el router transversal.
- Mantener cambios pequeños, trazables y sin reemplazar rutas existentes innecesariamente.

## Pendientes prioritarios

P0:
- Verificar build de Vercel del PR #184.
- Verificar visualmente desktop y mobile antes de merge.

P1:
- Crear relación canónica explícita cliente ↔ campo. Hoy no existe una tabla única y confiable para responder “qué campos tiene este cliente” sin inferencia.
- Añadir provenance estructurado a nivel de registro, no sólo referencia textual.
- Preparar generador de informes persistente en módulo Documentos.

P2:
- Especializar prompts/herramientas de los cinco agentes.
- Añadir evaluación de routing y groundedness con consultas reales.
- Convertir panel derecho en contexto dinámico del registro/módulo activo.

## Handover rule

Este archivo debe actualizarse antes de cerrar cualquier bloque de trabajo relevante, antes de merge a `main` y siempre que cambien arquitectura, fuente canónica, flujo operativo, rutas principales o blockers.


## 2026-10-02 — Recuperación y profesionalización de Tareas

Se recuperó la capa operativa de tareas existente y se integró al Sur Realista OS.

### Capacidades recuperadas
- módulo global `/gestion-tareas`;
- usuarios y contactos;
- asignación mediante `task_assignments`;
- registro de alertas mediante `task_notifications`;
- WhatsApp por contacto configurado;
- Speech-to-Text en creación completa y creación rápida;
- edición, estado, prioridad, notas y eliminación.

### Integración por módulo
Cada módulo canónico dispone ahora de un To Do contextual mediante `ModuleTasksDock`:
- Campos → `related_to=campos`;
- Clientes → `related_to=clientes`;
- Multimedia → `related_to=multimedia`;
- Documentos → `related_to=documentos`;
- Mercado → `related_to=mercado`.

Las tareas siguen viviendo en la tabla canónica `tasks`; no se crean silos por módulo.

### Router → tareas
El asistente transversal puede detectar intención de crear/asignar una tarea y preparar un `taskDraft`.
Reglas:
- el router no ejecuta el write por inferencia;
- presenta el borrador;
- requiere confirmación humana explícita;
- asigna sólo responsables nombrados explícitamente;
- después de confirmar, escribe en `tasks`, `task_assignments` y `task_notifications`;
- WhatsApp se prepara sólo para usuarios con teléfono válido y preferencias compatibles.

Endpoint router: `POST /api/tasks/router`.
Endpoint gestión: `GET|POST|PATCH|DELETE /api/tasks/manage`.

Autorización: ambos endpoints usan el mismo `INTERNAL_ACCESS_COOKIE` de Sur Realista, no dependen de una sesión Supabase separada.

### Base de datos verificada
Tablas existentes confirmadas:
- `tasks`;
- `users`;
- `task_assignments`;
- `task_notifications`.

El esquema de notificaciones usa:
- `notification_type`;
- `notification_event`;
- `delivery_status`;
- `message`;
- `metadata`.

### Estado de QA
Se encontraron varios builds intermedios fallidos mientras se movían operaciones directas del navegador hacia APIs autenticadas. Los commits estables previos construyeron correctamente. La última rama se dejó nuevamente sobre la página estable de tareas mientras se mantiene la nueva capa server-side.

No mergear a `main` hasta:
1. build final Vercel = READY;
2. prueba funcional de creación manual con STT;
3. prueba de asignación a usuario existente;
4. prueba de creación desde el asistente con confirmación;
5. comprobación de que la tarea cae en el módulo correcto;
6. comprobación de WhatsApp sin duplicación.


## 2026-10-02 — Shell OS aplicado a Campos

Se validó en Opera que la landing del nuevo OS ya usa navegación modular, indicadores, asistente transversal y lenguaje operativo coherente, pero el módulo `/campos` seguía visualmente dentro de la shell antigua de Sur Realista.

Cambio implementado en la rama `feat/operating-system-shell`:
- nuevo `components/os/module-operating-shell.tsx`;
- navegación lateral compacta y colapsable con los cinco módulos canónicos;
- header operativo consistente con el OS;
- acceso directo a Tareas y Asistente IA;
- `/campos` usa la nueva shell sin cambiar su inventario, mapa, buscador, CIREN, filtros, inteligencia ni To Do contextual;
- el wrapper de Campos cubre localmente el header/footer antiguo para evitar migrar toda la aplicación de una vez.

Commits:
- `7031eea` — shared module operating shell;
- `7634ccf` — Campos alineado con la shell del OS.

Estado: IMPLEMENTED / pendiente de gate final.
No mergear hasta que el deployment de Vercel del commit `7634ccf` quede READY y se repita QA visual/funcional en Opera.


## 2026-10-02 — Simplificación UX de Campos / mapa

Auditoría Frida + Opera confirmó exceso de complejidad simultánea en `/campos`.

Implementado:
- shell de Campos queda por encima del chrome legado para evitar doble navegación;
- toolbar del mapa reducida a `Capas`, `Seleccionar` y pantalla completa;
- Rectángulo / Polígono / Radio pasan a disclosure dentro de `Seleccionar`;
- geometría del campo seleccionado usa jerarquía sage y mayor peso visual;
- overlay CIREN vuelve a renderizarse junto al KMZ seleccionado y usa línea secundaria discontinua;
- ficha/inteligencia del campo deja de consumir ~46% vertical del mapa y pasa a drawer derecho colapsable en desktop, bottom drawer en pantallas menores;
- endpoint `/api/kmz/search` amplía búsqueda canónica a `rol_numbers` para ROL exactos;
- buscador de Campos consume ese endpoint y permite abrir directamente un resultado, recuperando después el registro canónico por ID.

Build gate:
- `bec2c8d` mapa simplificado = READY;
- `03bfc87` drawer aislado = READY;
- `0999f37` búsqueda ROL + UI = READY.

QA visual final pendiente únicamente de revalidar el preview autenticado en Opera (la pantalla de acceso está abierta con la contraseña autocompletada).
No mergear PR #184 hasta completar ese QA visual/funcional.


## 2026-10-02 — Navegación canónica primero

Decisión UX: antes de continuar refinando mapa/Campos, cerrar la navegación global de Sur Realista.

Arquitectura canónica:
- Inicio
- Campos
- Clientes
- Multimedia
- Documentos
- Mercado

Utilidades transversales:
- Tareas
- Asistente
- Administración

Reglas:
- Prospección y Valorización pertenecen a Mercado; no compiten como módulos principales.
- La navegación OS debe permanecer al profundizar en módulos y utilidades.
- Desktop inicia con labels visibles; el sidebar puede colapsarse.
- Mobile usa drawer lateral con los mismos módulos y utilidades.
- Una sola configuración canónica vive en `components/os/navigation-config.ts`.
- Rutas históricas como `/gestion-clientes` y `/asistente-ia` quedan sólo como redirects de compatibilidad.

Implementado:
- `/clientes` es el destino canónico del módulo Clientes.
- nuevo workspace canónico `/asistente`.
- middleware redirige `/asistente-ia` a `/asistente`.
- Campos, Clientes, Multimedia, Documentos y Mercado usan navegación persistente del OS.
- Tareas, Prospección y Valorización mantienen la navegación global al profundizar.
- sidebar OS visible por defecto en desktop y drawer equivalente en mobile.
- dashboard, header legado y shell OS fueron alineados con la nueva IA.

Gate: no continuar refinando mapa hasta completar QA visual de navegación en Opera y confirmar build READY del HEAD.


## 2026-10-02 — Navegación OS consolidada en layouts

Refactor posterior al primer handover de navegación:

- `app/(main)/layout.tsx` usa directamente `ModuleOperatingShell`; se retiraron Header/Footer legacy de este route group.
- `app/(dashboard)/layout.tsx` usa la misma shell OS, por lo que Prospección y sus subrutas conservan navegación global.
- Campos, Mercado, Tareas, Comunicaciones y Valorización ya no montan shells anidadas ni overlays para ocultar chrome viejo.
- `app/clientes/layout.tsx` y `app/documentacion/layout.tsx` mantienen la shell en fichas profundas e importación.
- `app/home-spotter/layout.tsx` mantiene Mercado visible al revisar evidencia de oportunidades.
- Inicio usa ahora la misma shell global que los módulos; el dashboard quedó como contenido operativo, eliminando el salto entre sidebars distintos.
- `components/os/navigation-config.ts` es la única fuente canónica de módulos, utilidades, prefijos y estado activo.
- Rutas legacy: `/asistente-ia` y `/ai` → `/asistente`; `/properties` → `/propiedades`.
- Login directo en `/` vuelve a Inicio; sólo respeta otra ruta cuando existe un `?redirect=` válido.
- CTAs internos del asistente fueron actualizados a `/asistente`.
- Smoke test de rutas actualizado para validar Inicio, Asistente, aliases canónicos y login en Inicio.

QA pendiente:
- HEAD actual debe quedar READY en Vercel.
- Después, QA visual autenticado en Opera: Inicio → cinco módulos → Prospección/Valorización → ficha cliente → documentos → Home Spotter → Tareas → Asistente, más drawer móvil.
- No mergear PR #184 hasta completar ese recorrido.


## 2026-10-02 — Home Spotter pasa a Inteligencia de Oportunidades

Decisión de producto:
- El nombre visible `Home Spotter` queda retirado.
- Nombre corporativo canónico: `Inteligencia de Oportunidades`.
- Jerarquía: `Mercado → Inteligencia de Oportunidades`.
- Ruta canónica: `/mercado/oportunidades`.
- Detalle: `/mercado/oportunidades/[id]`.

Compatibilidad:
- `/home-spotter` redirige a `/mercado/oportunidades`.
- `/home-spotter/opportunities/[id]` redirige a `/mercado/oportunidades/[id]`.
- Nombres internos legacy en librerías/APIs pueden mantenerse mientras no se expongan al usuario y sigan operativos.

UI:
- Mercado expone tres subflujos claros: Inteligencia de Oportunidades, Prospección y Valorización.
- El feed y las fichas ya enlazan a las rutas corporativas.
- Prospección abre evidencia en la nueva ruta corporativa.
- Smoke tests cubren ruta canónica y aliases legacy.

No separar Inteligencia de Oportunidades como módulo principal del OS.


## 2026-10-02 — Subnavegación contextual de Mercado

Para reducir saltos y evitar que Inteligencia de Oportunidades parezca otro producto:
- Mercado mantiene un subnav persistente de segundo nivel.
- Orden: Resumen · Inteligencia de Oportunidades · Prospección · Valorización.
- El subnav aparece sólo dentro del contexto Mercado.
- En mobile es horizontal y desplazable; no agrega otro drawer.
- Propiedades/comparables permanecen dentro del Resumen de Mercado por ahora.
