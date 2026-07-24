import { streamCAMPOSAgent, type CAMPOSAgentContext } from "@/app/actions/campos-agent"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const message = typeof body?.message === "string" ? body.message : ""
    const context = body?.context as CAMPOSAgentContext | undefined

    if (!message.trim()) {
      return Response.json({ error: "Message required" }, { status: 400 })
    }

    return await streamCAMPOSAgent(message, context)
  } catch (error) {
    console.error("CAMPOS agent route error", error)
    return Response.json({ error: "Unable to process request" }, { status: 500 })
  }
}
