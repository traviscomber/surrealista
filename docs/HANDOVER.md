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
