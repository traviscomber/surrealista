"use server"

import { createOpenAIChatCompletion } from "@/lib/ai/openai-chat"


export type CAMPOSAgentContext = {
  title?: string | null
  role?: string | null
  commune?: string | null
  area?: string | null
  latitude?: string | null
  longitude?: string | null
  sections?: string[]
  text?: string | null
  source?: string | null
  capturedAt?: string | null
}


const contextBlock = (context?: CAMPOSAgentContext | null) => {
  if (!context?.title) return "No hay un expediente seleccionado actualmente."

  return [
    `Predio: ${context.title}`,
    `ROL: ${context.role || "no disponible"}`,
    `Comuna o sector: ${context.commune || "no disponible"}`,
    `Superficie: ${context.area || "no disponible"}`,
    `Latitud: ${context.latitude || "no disponible"}`,
    `Longitud: ${context.longitude || "no disponible"}`,
    `Secciones detectadas: ${context.sections?.join(", ") || "ninguna"}`,
    context.text ? `Extracto del expediente:\n${context.text.slice(0, 8000)}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export async function streamCAMPOSAgent(userMessage: string, context?: CAMPOSAgentContext | null) {
  const text = await createOpenAIChatCompletion({
    model: "gpt-4-turbo",
    system: `Eres el copiloto territorial experto de CAMPOS, el sistema de inteligencia y gestión de propiedades de Sur Realista.
Responde siempre en español claro, profesional y orientado a decisiones.
Usa primero el expediente activo incluido abajo. Distingue expresamente entre datos confirmados, inferencias y datos faltantes.
No inventes antecedentes legales, registrales, comerciales ni geográficos. Cuando falte evidencia, indícalo y recomienda la verificación concreta necesaria.
No infieras ni atribuyas propietarios. Los antecedentes de dominio sólo pueden tratarse como confirmados cuando exista evidencia documental o registral verificable.
No afirmes haber consultado la base de datos ni datos que no estén presentes en el expediente activo.

EXPEDIENTE ACTIVO
${contextBlock(context)}`,
    prompt: userMessage,
    temperature: 0.35,
    maxTokens: 2000,
  })

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
