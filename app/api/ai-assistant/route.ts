import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"
import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"

import { buildSRPlan, collectSREvidence, evidenceSummary } from "@/lib/ai/sur-realista-os"

export const maxDuration = 60

type TaskDraft = {
  title: string
  description: string | null
  module: "campos" | "clientes" | "multimedia" | "documentos" | "mercado"
  priority: "low" | "medium" | "high" | "urgent"
  dueDate: string | null
  assigneeNames: string[]
  relatedId: string | null
  requiresConfirmation: true
}

function compactEvidence(evidence: Awaited<ReturnType<typeof collectSREvidence>>) {
  return evidence.map((item) => ({
    source: item.source,
    domain: item.domain,
    error: item.error || null,
    records: item.records.slice(0, 10),
  }))
}

function fallbackResponse(plan: ReturnType<typeof buildSRPlan>, evidence: Awaited<ReturnType<typeof collectSREvidence>>) {
  const lines = evidence.flatMap((item) => {
    if (item.error) return [`${item.source}: fuente no disponible (${item.error}).`]
    if (!item.records.length) return [`${item.source}: sin coincidencias verificables.`]
    return [`${item.source}: ${item.records.length} coincidencia(s) verificable(s).`]
  })

  return [
    `Modo ${plan.mode === "fullagentic" ? "FullAgentic" : "FastTrack"}.`,
    ...lines,
    "No se generó una interpretación adicional porque el modelo de síntesis no está disponible.",
  ].join("\n")
}

function validTaskDraft(value: unknown): TaskDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const row = value as Record<string, unknown>
  const modules = new Set(["campos", "clientes", "multimedia", "documentos", "mercado"])
  const priorities = new Set(["low", "medium", "high", "urgent"])
  if (typeof row.title !== "string" || !row.title.trim()) return null
  if (typeof row.module !== "string" || !modules.has(row.module)) return null

  return {
    title: row.title.trim().slice(0, 255),
    description: typeof row.description === "string" && row.description.trim() ? row.description.trim().slice(0, 4000) : null,
    module: row.module as TaskDraft["module"],
    priority: typeof row.priority === "string" && priorities.has(row.priority) ? row.priority as TaskDraft["priority"] : "medium",
    dueDate: typeof row.dueDate === "string" && row.dueDate.trim() ? row.dueDate : null,
    assigneeNames: Array.isArray(row.assigneeNames)
      ? row.assigneeNames.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 10)
      : [],
    relatedId: typeof row.relatedId === "string" && row.relatedId.trim() ? row.relatedId : null,
    requiresConfirmation: true,
  }
}

export async function POST(request: NextRequest) {
  try {
    const authorized = await verifyInternalAccessToken(request.cookies.get(INTERNAL_ACCESS_COOKIE)?.value)
    if (!authorized) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const body = await request.json().catch(() => ({}))
    const contextPath = typeof body?.context?.pathname === "string" ? body.context.pathname.slice(0, 160) : ""
    const allowedModules = ["campos", "clientes", "multimedia", "documentos", "mercado"] as const
    const contextModule = allowedModules.find((module) => contextPath === `/${module}` || contextPath.startsWith(`/${module}/`))
    const contextId = typeof body?.context?.entityId === "string" && /^[0-9a-f-]{36}$/i.test(body.context.entityId) ? body.context.entityId : null
    const message = typeof body?.message === "string" ? body.message.trim() : ""

    if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Assistant data connection is not configured", response: "No puedo consultar las fuentes canónicas en este entorno." },
        { status: 503 },
      )
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const plan = buildSRPlan(message)
    if (contextModule && plan.intent === "general") plan.domains = [contextModule]
    else if (contextModule && !plan.domains.includes(contextModule)) plan.domains = [...plan.domains, contextModule]
    const evidence = await collectSREvidence(supabase, plan, message)
    const summary = evidenceSummary(evidence)
    const groundedContext = compactEvidence(evidence)

    let responseText = fallbackResponse(plan, evidence)
    let taskDraft: TaskDraft | null = null

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Eres el asistente transversal de Sur Realista Operating System.

Responde SIEMPRE como JSON válido:
{
  "answer": "texto en español",
  "taskDraft": null | {
    "title": "string",
    "description": "string o null",
    "module": "campos|clientes|multimedia|documentos|mercado",
    "priority": "low|medium|high|urgent",
    "dueDate": "ISO-8601 o null",
    "assigneeNames": ["nombres mencionados explícitamente"],
    "relatedId": "id explícito de evidencia o null",
    "requiresConfirmation": true
  }
}

REGLAS DE EVIDENCIA:
- Responde usando EXCLUSIVAMENTE la evidencia entregada.
- No inventes nombres, precios, relaciones, tendencias ni conclusiones.
- Si una relación entre cliente y campo no está explícita en la evidencia, di que no está acreditada.
- Si una fuente falló, indícalo brevemente.
- Para informes: Resumen, Evidencia, Vacíos, Próximo paso.
- Para comparaciones, usa sólo atributos presentes.
- Al mencionar registros, referencia [fuente:id].
- No uses conocimiento externo para rellenar datos.

REGLAS DE TAREAS:
- Si el usuario pide crear, registrar, agregar, dejar o asignar una tarea/to-do/pendiente, prepara taskDraft.
- NO escribas la tarea en base de datos desde esta respuesta.
- taskDraft siempre requiere confirmación humana explícita en UI.
- Asigna sólo personas nombradas explícitamente por el usuario. No adivines responsables.
- El módulo debe ser el área operativa donde debe caer la tarea.
- Si no hay fecha explícita, dueDate=null.
- Si no hay prioridad explícita, usa medium.
- El texto answer debe indicar claramente que la tarea está preparada y espera confirmación.

El modo de ejecución es ${plan.mode}. Dominios: ${plan.domains.join(", ")}. Contexto de sección: ${contextModule || "inicio"}. El ID seleccionado es solo contexto, no autorización.`,
          },
          {
            role: "user",
            content: JSON.stringify({ query: message, plan, context: { module: contextModule || null, entityId: contextId }, evidence: groundedContext }),
          },
        ],
      })

      const raw = completion.choices[0]?.message?.content || "{}"
      try {
        const parsed = JSON.parse(raw)
        if (typeof parsed.answer === "string" && parsed.answer.trim()) responseText = parsed.answer.trim()
        taskDraft = validTaskDraft(parsed.taskDraft)
      } catch (error) {
        console.warn("[sur-realista-os] invalid synthesis json", error)
      }
    }

    return NextResponse.json({
      response: responseText,
      type: "sur_realista_os",
      mode: plan.mode,
      domains: plan.domains,
      agent: plan.domains.length === 1 ? `Agente ${plan.domains[0]}` : "Orquestador Sur Realista",
      sources: summary.sources,
      failedSources: summary.failedSources,
      confidence: summary.confidence,
      evidenceCount: summary.recordCount,
      taskDraft,
    })
  } catch (error) {
    console.error("[sur-realista-os] assistant error", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error procesando consulta",
        response: "No fue posible completar la consulta con las fuentes disponibles.",
      },
      { status: 500 },
    )
  }
}
