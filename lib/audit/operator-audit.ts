import type { SupabaseClient } from "@supabase/supabase-js"
import { INTERNAL_OPERATOR } from "@/lib/auth/internal-access"

type AuditInput = {
  action: string
  entityType: string
  entityId?: string | null
  requestPath?: string | null
  before?: unknown
  after?: unknown
  metadata?: Record<string, unknown>
}

export async function recordOperatorAudit(supabase: SupabaseClient, input: AuditInput) {
  const { error } = await supabase.from("operator_audit_log").insert({
    actor_id: INTERNAL_OPERATOR.id,
    actor_name: INTERNAL_OPERATOR.name,
    actor_role: INTERNAL_OPERATOR.role,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId || null,
    request_path: input.requestPath || null,
    before_data: input.before ?? null,
    after_data: input.after ?? null,
    metadata: input.metadata || {},
  })

  if (error) throw error
}
