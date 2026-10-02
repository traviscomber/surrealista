import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

type ModuleName = "campos" | "clientes" | "multimedia" | "documentos" | "mercado"
type Priority = "low" | "medium" | "high" | "urgent"

const MODULES: ModuleName[] = ["campos", "clientes", "multimedia", "documentos", "mercado"]
const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"]

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

function asModule(value: unknown): ModuleName | null {
  return typeof value === "string" && MODULES.includes(value as ModuleName) ? value as ModuleName : null
}

function asPriority(value: unknown): Priority {
  return typeof value === "string" && PRIORITIES.includes(value as Priority) ? value as Priority : "medium"
}

function asString(value: unknown, max = 4000) {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function whatsappUrl(rawPhone: unknown, message: string) {
  if (typeof rawPhone !== "string" || !rawPhone.trim()) return null
  let phone = rawPhone.replace(/[\s()\-]/g, "").replace(/^\+/, "")
  if (phone.startsWith("9")) phone = `56${phone}`
  if (!/^569\d{8}$/.test(phone)) return null
  return `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function POST(request: NextRequest) {
  const session = await createServerClient()
  const { data: { user }, error: authError } = await session.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const admin = getAdminClient()
  if (!admin) return NextResponse.json({ error: "Conexión de datos no configurada" }, { status: 503 })

  try {
    const body: Record<string, unknown> = await request.json().catch(() => ({}))
    if (body.explicitConfirm !== true) {
      return NextResponse.json({ error: "Se requiere confirmación explícita" }, { status: 409 })
    }

    const moduleName = asModule(body.module)
    const title = asString(body.title, 255)
    if (!moduleName || !title) {
      return NextResponse.json({ error: "Módulo y título son requeridos" }, { status: 400 })
    }

    const description = asString(body.description) || null
    const priority = asPriority(body.priority)
    const dueDate = asString(body.dueDate, 80) || null
    const relatedId = asString(body.relatedId, 80) || null
    const assigneeNames = Array.isArray(body.assigneeNames)
      ? body.assigneeNames.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 10)
      : []

    const { data: users, error: usersError } = await admin
      .from("users")
      .select("id,name,email,phone,whatsapp,notification_preferences")
      .order("name")
    if (usersError) throw usersError

    const wanted = assigneeNames.map(normalize)
    const matchedUsers = (users || []).filter((candidate) => {
      if (!wanted.length) return false
      const name = normalize(String(candidate.name || ""))
      const email = normalize(String(candidate.email || ""))
      return wanted.some((wantedName) =>
        wantedName === name || wantedName === email || name.includes(wantedName) || wantedName.includes(name),
      )
    })

    const missingAssignees = assigneeNames.filter((requested) => {
      const wantedName = normalize(requested)
      return !matchedUsers.some((candidate) => {
        const name = normalize(String(candidate.name || ""))
        const email = normalize(String(candidate.email || ""))
        return wantedName === name || wantedName === email || name.includes(wantedName) || wantedName.includes(name)
      })
    })
    if (missingAssignees.length) {
      return NextResponse.json({ error: "Responsable no encontrado", missingAssignees }, { status: 409 })
    }

    const now = new Date().toISOString()
    const { data: task, error: taskError } = await admin
      .from("tasks")
      .insert({
        title,
        description,
        created_by: user.email || user.id,
        assigned_to: matchedUsers.length === 1 ? String(matchedUsers[0].email || matchedUsers[0].name || "") : null,
        created_at: now,
        updated_at: now,
        due_date: dueDate,
        status: "pending",
        priority,
        related_to: moduleName,
        related_id: relatedId,
        tags: ["router", moduleName],
      })
      .select("id,title,status,priority,due_date,related_to")
      .single()
    if (taskError) throw taskError

    if (matchedUsers.length) {
      const { error: assignmentError } = await admin.from("task_assignments").insert(
        matchedUsers.map((candidate) => ({
          task_id: task.id,
          user_id: candidate.id,
          assigned_at: now,
          assigned_by: user.email || user.id,
          role: "assignee",
        })),
      )
      if (assignmentError) throw assignmentError
    }

    const priorityLabels: Record<Priority, string> = {
      urgent: "URGENTE",
      high: "ALTA",
      medium: "MEDIA",
      low: "BAJA",
    }
    const notificationMessage =
      `NUEVA TAREA ASIGNADA\n\nTítulo: ${title}\n\nDescripción:\n${description || "Sin descripción"}\n\n` +
      `Prioridad: ${priorityLabels[priority]}\nMódulo: ${moduleName}\n` +
      `Fecha límite: ${dueDate ? new Date(dueDate).toLocaleDateString("es-CL") : "Sin fecha límite"}\n\nEnviado desde Sur Realista`

    const whatsappActions = matchedUsers.flatMap((candidate) => {
      const preferences = candidate.notification_preferences as { whatsapp?: boolean } | null
      if (preferences?.whatsapp === false) return []
      const url = whatsappUrl(candidate.whatsapp || candidate.phone, notificationMessage)
      if (!url) return []
      return [{ userId: String(candidate.id), name: String(candidate.name || candidate.email || "Responsable"), url }]
    })

    if (whatsappActions.length) {
      const { error: notificationError } = await admin.from("task_notifications").insert(
        whatsappActions.map((action) => ({
          task_id: task.id,
          user_id: action.userId,
          notification_type: "whatsapp",
          notification_event: "task_assigned",
          message: notificationMessage,
          delivery_status: "pending",
          metadata: { channel: "whatsapp_web", requires_user_send: true },
        })),
      )
      if (notificationError) throw notificationError
    }

    return NextResponse.json({
      task,
      assignees: matchedUsers.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
      })),
      whatsappActions: whatsappActions.map(({ name, url }) => ({ name, url })),
    })
  } catch (error) {
    console.error("[router-task] create failed", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear la tarea" },
      { status: 500 },
    )
  }
}
