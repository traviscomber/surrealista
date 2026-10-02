import { NextRequest, NextResponse } from "next/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function asString(value: unknown, max = 4000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : ""
}

function makeWhatsAppUrl(rawPhone: unknown, message: string): string | null {
  if (typeof rawPhone !== "string" || !rawPhone.trim()) return null
  let phone = rawPhone.replace(/[\s()\-]/g, "").replace(/^\+/, "")
  if (phone.startsWith("9")) phone = `56${phone}`
  if (!/^569\d{8}$/.test(phone)) return null
  return `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
}

export async function POST(request: NextRequest) {
  const session = await createServerClient()
  const { data: { user }, error: authError } = await session.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const admin = getAdminClient()
  if (!admin) return NextResponse.json({ error: "Conexión de datos no configurada" }, { status: 503 })

  try {
    const body: Record<string, unknown> = await request.json().catch(() => ({}))
    const title = asString(body.title, 255)
    if (!title) return NextResponse.json({ error: "El título es requerido" }, { status: 400 })

    const taskId = asString(body.taskId, 80) || null
    const selectedUserIds = Array.isArray(body.selectedUserIds)
      ? body.selectedUserIds.filter((item): item is string => typeof item === "string" && item.length > 0).slice(0, 50)
      : []
    const priority = ["low", "medium", "high", "urgent"].includes(asString(body.priority, 20))
      ? asString(body.priority, 20)
      : "medium"
    const now = new Date().toISOString()
    const taskData = {
      title,
      description: asString(body.description) || null,
      priority,
      due_date: asString(body.dueDate, 80) || null,
      location: asString(body.location, 255) || null,
      status: asString(body.status, 40) || "pending",
      related_to: asString(body.relatedTo, 255) || null,
      related_id: asString(body.relatedId, 80) || null,
      notes: asString(body.notes, 1000) || null,
      updated_at: now,
      tags: Array.isArray(body.tags)
        ? body.tags.filter((item): item is string => typeof item === "string").slice(0, 30)
        : [],
    }

    let id = taskId
    if (id) {
      const { error } = await admin.from("tasks").update(taskData).eq("id", id)
      if (error) throw error
    } else {
      const { data, error } = await admin
        .from("tasks")
        .insert({ ...taskData, created_at: now, created_by: user.email || user.id })
        .select("id")
        .single()
      if (error) throw error
      id = String(data.id)
    }

    await admin.from("task_assignments").delete().eq("task_id", id)
    let assignedUsers: Array<Record<string, unknown>> = []

    if (selectedUserIds.length) {
      const { data: users, error: usersError } = await admin
        .from("users")
        .select("id,name,email,phone,whatsapp,notification_preferences")
        .in("id", selectedUserIds)
      if (usersError) throw usersError
      assignedUsers = users || []

      const { error: assignmentError } = await admin.from("task_assignments").insert(
        assignedUsers.map((candidate) => ({
          task_id: id,
          user_id: candidate.id,
          assigned_at: now,
          assigned_by: user.email || user.id,
          role: "assignee",
        })),
      )
      if (assignmentError) throw assignmentError
    }

    const priorityLabels: Record<string, string> = {
      urgent: "URGENTE",
      high: "ALTA",
      medium: "MEDIA",
      low: "BAJA",
    }
    const message =
      `NUEVA TAREA ASIGNADA\n\nTítulo: ${title}\n\nDescripción:\n${taskData.description || "Sin descripción"}\n\n` +
      `Prioridad: ${priorityLabels[priority] || "MEDIA"}\nFecha límite: ${taskData.due_date ? new Date(taskData.due_date).toLocaleDateString("es-CL") : "Sin fecha límite"}\n` +
      `${taskData.related_to ? `Módulo: ${taskData.related_to}\n` : ""}Enviado desde Sur Realista`

    const whatsappActions = assignedUsers.flatMap((candidate) => {
      const preferences = candidate.notification_preferences as { whatsapp?: boolean } | null
      if (preferences?.whatsapp === false) return []
      const url = makeWhatsAppUrl(candidate.whatsapp || candidate.phone, message)
      if (!url) return []
      return [{
        userId: String(candidate.id),
        name: String(candidate.name || candidate.email || "Responsable"),
        url,
      }]
    })

    if (whatsappActions.length) {
      const { error: notificationError } = await admin.from("task_notifications").insert(
        whatsappActions.map((action) => ({
          task_id: id,
          user_id: action.userId,
          notification_type: "whatsapp",
          notification_event: taskId ? "task_updated" : "task_assigned",
          message,
          delivery_status: "pending",
          metadata: { channel: "whatsapp_web", requires_user_send: true },
        })),
      )
      if (notificationError) throw notificationError
    }

    return NextResponse.json({
      taskId: id,
      whatsappActions: whatsappActions.map(({ name, url }) => ({ name, url })),
    })
  } catch (error) {
    console.error("[task-manage] failed", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo guardar la tarea" },
      { status: 500 },
    )
  }
}
