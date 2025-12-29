"use server"

import { createClient as createSupabaseClient } from "@/lib/supabase/server"

export interface EmailTemplate {
  id?: string
  name: string
  subject: string
  body: string
  variables?: string[]
  is_active?: boolean
}

export interface EmailLog {
  id?: string
  client_id: string
  recipient_email: string
  subject: string
  body: string
  status: "pending" | "sent" | "failed"
  error_message?: string
  created_by?: string
}

export async function getEmailTemplates() {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching email templates:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("[v0] Error in getEmailTemplates:", error)
    return { success: false, error: "Error al obtener plantillas", data: [] }
  }
}

export async function createEmailTemplate(template: EmailTemplate) {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase.from("email_templates").insert([template]).select().single()

    if (error) {
      console.error("[v0] Error creating email template:", error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error in createEmailTemplate:", error)
    return { success: false, error: "Error al crear plantilla", data: null }
  }
}

export async function getEmailLogs(clientId?: string, limit = 50) {
  try {
    const supabase = await createSupabaseClient()
    let query = supabase.from("email_logs").select("*")

    if (clientId) {
      query = query.eq("client_id", clientId)
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(limit)

    if (error) {
      console.error("[v0] Error fetching email logs:", error)
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("[v0] Error in getEmailLogs:", error)
    return { success: false, error: "Error al obtener historial", data: [] }
  }
}

export async function logEmail(emailLog: EmailLog) {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase.from("email_logs").insert([emailLog]).select().single()

    if (error) {
      console.error("[v0] Error logging email:", error)
      return { success: false, error: error.message, data: null }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error in logEmail:", error)
    return { success: false, error: "Error al registrar email", data: null }
  }
}

export async function updateEmailLog(id: string, status: string, errorMessage?: string) {
  try {
    const supabase = await createSupabaseClient()
    const updateData: any = { status }
    if (errorMessage) updateData.error_message = errorMessage
    if (status === "sent") updateData.sent_at = new Date().toISOString()

    const { data, error } = await supabase.from("email_logs").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating email log:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error in updateEmailLog:", error)
    return { success: false, error: "Error al actualizar estado del email" }
  }
}
