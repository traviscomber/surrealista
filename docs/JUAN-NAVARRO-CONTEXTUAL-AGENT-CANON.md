# Sur Realista — Asistente contextual agentico (canon de producto)

Estado: contrato de producto y criterios de aceptacion; NO declara implementacion completa.

## Base de investigacion
- arXiv:2507.17289 — Compliance Brain Assistant. Arquitectura dual FastTrack (lectura y recuperacion contextual) / FullAgentic (herramientas, multiples pasos, composicion de evidencias).
- arXiv:1512.06808 — Game Theory (Bonanno), inspiracion para el Game-Aware Agent Decision Layer en decisiones con objetivos, restricciones, creencias y evidencia. No implica optimizacion automatica sin autorizacion.

## Experiencia de Juan Navarro
- Un asistente persistente, discreto y accesible en Inicio, Campos, Ficha 360, Clientes, Visitas/Tareas, Multimedia, Documentos y Mercado. El contexto se actualiza con modulo, entidad seleccionada, id estable, permisos y periodo; no arrastrar silenciosamente el contexto de un predio distinto.
- Acciones sugeridas segun contexto: resumir campo y pendientes, registrar visita y evidencia, crear/editar tarea, vincular o abrir Google Docs, consultar ROL/propietario, revisar mapas/KMZ, evidencia satelital y mercado, generar informe.
- Respuestas breves con CTA y "Ver detalles"; mostrar fuentes, marca temporal, alcance y faltantes. Nunca inventar data, propietarios, ROL, superficies ni valoraciones.
- El asistente no suplanta al operador: prepara propuestas con vista previa; escrituras significativas, envios, borrados y acciones externas requieren confirmacion explicita y permisos de backend.

## Orquestacion
1. Resolver identidad y autorizacion. Construir sobre entidad canonica y alcance del modulo.
2. Clasificar solicitud FastTrack vs FullAgentic; la complejidad, no la palabra del usuario, decide.
3. FastTrack: respuesta fundamentada desde fuentes autorizadas (sin herramientas de escritura).
4. FullAgentic: plan de pasos acotado y herramientas especificas para Campos, Clientes, Tareas, Visitas, Documentos, Mercado e Informes; validar contratos y evidencia tras cada paso.
5. Estado operativo de ejecucion visible: plan, progreso, herramienta, resultado, errores recuperables, fuente y auditoria.
6. Memoria solo de preferencias no sensibles, decisiones confirmadas y eventos auditados; aislamiento de usuarios y entidades.

## Gates de seguridad y calidad
- Permisos RLS + API/servidor por accion, entidad y rol; ninguna autorizacion basada solo en botones o prompt.
- Herramientas con schemas, paginacion, presupuesto de operaciones, idempotencia, timeouts, limites y proteccion contra prompt injection en documentos.
- Read-only por defecto. Confirmacion antes de cualquier escritura a produccion y bloqueo de operaciones destructivas.
- Ficha 360: contexto correcto por KMZ; Google Docs editable y persistente; registros de visitas y tareas enlazados sin duplicados.
- Pruebas: cambio de seccion/predio, acceso denegado, fuentes faltantes, fallo de herramienta, respuesta con evidencias, acciones autorizadas, cancelacion y QA mobile.
- No etiquetar "full agentic" como entregado hasta demostrar en preview y produccion un flujo multietapa real con herramientas, permisos y trazabilidad.
