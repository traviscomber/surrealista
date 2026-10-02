# Sur Realista Operating System — Agent Architecture

## Objective

Sur Realista should behave as one operating system, not as a collection of disconnected pages. The landing dashboard is the command surface. Five operational modules own their domain data and tools, while one transversal assistant can answer and execute questions that cross module boundaries.

## Canonical modules

1. Campos — territorial inventory, KMZ/KML, ROL, geospatial intelligence and field-level evidence.
2. Clientes — people, companies, commercial relationships, interests, interactions and linked fields.
3. Multimedia — media assets, social channels, post packs, communications and publishing workflows.
4. Documentos — documentary evidence, report preparation, document retrieval and generated reports.
5. Mercado — external properties, comparables, prospecting, market signals and opportunity analysis.

Each module exposes a specialist agent with a constrained tool catalogue. The transversal assistant never duplicates domain logic; it routes work to the appropriate specialist and combines grounded results.

## Query router

The system follows the routing pattern described in Zhu et al., “Compliance Brain Assistant: Conversational Agentic AI for Assisting Compliance Tasks in Enterprise Environments” (arXiv:2507.17289).

### FastTrack

Use when a request needs:
- a direct answer;
- one retrieval step;
- one known entity lookup;
- no multi-module action chain.

Goal: low latency and minimal tool usage.

### FullAgentic

Use when a request requires:
- multiple internal entities;
- more than one module;
- sequential retrieval or actions;
- report assembly;
- cross-validation;
- evidence from APIs, databases and documents.

The workflow is:
1. classify the request;
2. build the minimum tool plan;
3. execute specialist tools;
4. inspect observations;
5. continue only if evidence is insufficient;
6. compose the answer with provenance.

## Specialist agents

### Campos Agent

Owns:
- field lookup;
- KMZ/KML structure;
- ROL and parcel evidence;
- geographic relationships;
- satellite and territorial intelligence;
- linked documents and owners when canonically available.

Example: “¿Qué campos tiene Cliente X y cuál tiene información territorial más completa?”

### Clientes Agent

Owns:
- client identity;
- company/person relationships;
- linked fields;
- interactions;
- tasks;
- commercial interests;
- follow-up context.

Example: “Muéstrame los campos vinculados a este cliente y las tareas pendientes.”

### Multimedia Agent

Owns:
- media inventory;
- social channels;
- post packs;
- publication plans;
- approved copy/assets;
- campaign evidence.

Example: “Prepara un pack de posteos para este campo usando sólo material aprobado.”

### Document Agent

Owns:
- document search;
- document metadata;
- evidence sets;
- report templates;
- automatic report assembly;
- source traceability.

Example: “Hazme un informe del Campo X con sus documentos, ROL y evidencia territorial.”

### Market Agent

Owns:
- external properties;
- comparables;
- market metrics;
- prospecting;
- opportunities;
- source freshness;
- market evidence.

Example: “Compara este campo con propiedades similares publicadas y explícame la evidencia.”

## Evidence contract

Every specialist response should return:
- entity identifiers;
- source name;
- retrieval timestamp where available;
- confidence or data-quality state where applicable;
- missing-data flags;
- links or references to the originating record.

The transversal assistant must distinguish:
- verified fact;
- computed result;
- inference;
- missing evidence.

If evidence is unavailable, it must say so rather than completing the gap.

## UI model

Desktop follows a three-column operating-system layout:
- left column: global module navigation;
- center column: active work surface;
- right column: contextual intelligence, tasks, evidence and agent state.

Left and right columns are independently collapsible. The center surface expands without changing the information hierarchy.

Mobile collapses to one column. Navigation and context become drawers or sheets rather than compressed sidebars.

## Initial implementation

Phase 1:
- root route becomes the operating dashboard;
- five canonical module shortcuts;
- canonical live counters;
- transversal assistant embedded in the dashboard;
- collapsible left navigation and right context column.

Phase 2:
- module-specific assistant contracts;
- shared router;
- provenance schema;
- cross-module entity graph.

Phase 3:
- action tools and report generation;
- evaluation set based on real Sur Realista queries;
- routing accuracy, answer-grounding and latency telemetry.
