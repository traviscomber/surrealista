import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"

import { buildSRPlan, collectSREvidence, evidenceSummary } from "@/lib/ai/sur-realista-os"

export const maxDuration = 60

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
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
    const evidence = await collectSREvidence(supabase, plan, message)
    const summary = evidenceSummary(evidence)
    const groundedContext = compactEvidence(evidence)

    let responseText = fallbackResponse(plan, evidence)

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: `Eres el asistente transversal de Sur Realista Operating System.

Tu trabajo es responder consultas operativas usando EXCLUSIVAMENTE la evidencia entregada.

REGLAS:
- No inventes nombres, precios, relaciones, tendencias ni conclusiones.
- Distingue hechos encontrados, cálculos simples e información faltante.
- Si una relación entre cliente y campo no está explícita en la evidencia, di que no está acreditada.
- Si una fuente falló, indícalo de forma breve.
- Para informes, usa secciones compactas: Resumen, Evidencia, Vacíos, Próximo paso.
- Para comparaciones, compara sólo atributos presentes en los registros.
- Al mencionar un registro, agrega una referencia corta con formato [fuente:id].
- No uses conocimiento externo para rellenar datos.
- Responde en español, claro y ejecutivo.
- El modo de ejecución es ${plan.mode}. Los dominios solicitados son: ${plan.domains.join(", ")}.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              query: message,
              plan,
              evidence: groundedContext,
            }),
          },
        ],
      })

      responseText = completion.choices[0]?.message?.content?.trim() || responseText
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
