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
