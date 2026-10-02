import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const MODULES = new Set(["campos", "clientes", "multimedia", "documentos", "mercado"])
const PRIORITIES = new Set(["low", "medium", "high", "urgent"])

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
}

function cleanPhone(raw: string | null | undefined) {
  if (!raw) return null
  let value = raw.replace(/[\s\-()]/g, "").replace(/^\+/, "")
  if (value.startsWith("9")) value = `56${value}`
  if (!/^569\d{8}$/.test(value)) return null
  return value
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    if (body?.explicitConfirm !== true) {
      return NextResponse.json({ error: "Explicit confirmation is required" }, { status: 409 })
    }

    const moduleName = typeof body?.module === "string" && MODULES.has(body.module) ? body.module : null
    const title = typeof body?.title === "string" ? body.title.trim().slice(0, 255) : ""
    const description = typeof body?.description === "string" ? body.description.trim().slice(0, 4000) : null
    const priority = typeof body?.priority === "string" && PRIORITIES.has(body.priority) ? body.priority : "medium"
    const dueDate = typeof body?.dueDate === "string" && body.dueDate ? body.dueDate : null
    const assigneeNames = Array.isArray(body?.assigneeNames)
      ? body.assigneeNames.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0).slice(0, 10)
      : []

    if (!moduleName || !title) {
      return NextResponse.json({ error: "Module and title are required" }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ error: "Task data connection is not configured" }, { status: 503 })

    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

    let matchedUsers: any[] = []
    if (assigneeNames.length) {
      const { data: users, error } = await supabase
        .from("users")
        .select("id,name,email,phone,whatsapp,notification_preferences")
        .order("name")

      if (error) throw error

      const wanted = assigneeNames.map(normalize)
      matchedUsers = (users || []).filter((user) => {
        const userName = normalize(String(user.name || ""))
        const userEmail = normalize(String(user.email || ""))
        return wanted.some((name) => userName === name || userName.includes(name) || name.includes(userName) || userEmail === name)
      })

      const missing = assigneeNames.filter((name) => {
        const wantedName = normalize(name)
        return !matchedUsers.some((user) => {
          const userName = normalize(String(user.name || ""))
          const userEmail = normalize(String(user.email || ""))
          return userName === wantedName || userName.includes(wantedName) || wantedName.includes(userName) || userEmail === wantedName
        })
      })

      if (missing.length) {
        return NextResponse.json({ error: "Assignee not found", missingAssignees: missing }, { status: 409 })
      }
    }

    const now = new Date().toISOString()
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        title,
        description,
        priority,
        due_date: dueDate,
        status: "pending",
        related_to: moduleName,
        related_id: typeof body?.relatedId === "string" ? body.relatedId : null,
        created_by: typeof body?.createdBy === "string" ? body.createdBy : "sur-realista-router",
        created_at: now,
        updated_at: now,
        tags: ["router", moduleName],
      })
      .select("id,title,description,priority,due_date,status,related_to")
      .single()

    if (taskError) throw taskError

    if (matchedUsers.length) {
      const { error: assignmentError } = await supabase.from("task_assignments").insert(
        matchedUsers.map((user) => ({
          task_id: task.id,
          user_id: user.id,
          assigned_by: "sur-realista-router",
          assigned_at: now,
          role: "assignee",
        })),
      )
      if (assignmentError) throw assignmentError
    }

    const priorityText: Record<string, string> = { urgent: "URGENTE", high: "ALTA", medium: "MEDIA", low: "BAJA" }
    const message =
      `NUEVA TAREA ASIGNADA\n\nTitulo: ${title}\n\nDescripcion:\n${description || "Sin descripción"}\n\nPrioridad: ${priorityText[priority]}\n` +
      `Modulo: ${moduleName}\nFecha limite: ${dueDate ? new Date(dueDate).toLocaleDateString("es-CL") : "Sin fecha límite"}\n\nEnviado desde Sur Realista`

    const whatsappActions = matchedUsers.flatMap((user) => {
      const prefs = user.notification_preferences || {}
      if (prefs.whatsapp === false) return []
      const phone = cleanPhone(user.whatsapp || user.phone)
      if (!phone) return []
      return [{ userId: user.id, name: user.name, url: `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}` }]
    })

    if (whatsappActions.length) {
      await supabase.from("task_notifications").insert(
        whatsappActions.map((action) => ({
          task_id: task.id,
          user_id: action.userId,
          notification_type: "whatsapp",
          notification_event: "task_assigned",
          message,
          delivery_status: "pending",
          metadata: { channel: "whatsapp_web", requires_user_send: true },
        })),
      )
    }

    return NextResponse.json({
      task,
      assignees: matchedUsers.map((user) => ({ id: user.id, name: user.name, email: user.email })),
      whatsappActions,
    })
  } catch (error) {
    console.error("[os-tasks] create failed", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Task creation failed" }, { status: 500 })
  }
}
