import { createClient } from "@supabase/supabase-js"

const encoder = new TextEncoder()

export interface InternalAccessRateLimitState {
  locked: boolean
  retryAfterSeconds: number
  failedAttempts: number
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !key) {
    throw new Error("Internal access rate limiting is unavailable")
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

function normalizeRateLimitState(value: unknown): InternalAccessRateLimitState {
  const row = Array.isArray(value) ? value[0] : value
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    throw new Error("Internal access rate limit returned an invalid state")
  }

  const record = row as Record<string, unknown>
  const locked = record.locked
  const retryAfterSeconds = record.retry_after_seconds
  const failedAttempts = record.failed_attempts

  if (
    typeof locked !== "boolean" ||
    typeof retryAfterSeconds !== "number" ||
    !Number.isFinite(retryAfterSeconds) ||
    typeof failedAttempts !== "number" ||
    !Number.isFinite(failedAttempts)
  ) {
    throw new Error("Internal access rate limit returned malformed values")
  }

  return {
    locked,
    retryAfterSeconds: Math.max(0, Math.floor(retryAfterSeconds)),
    failedAttempts: Math.max(0, Math.floor(failedAttempts)),
  }
}

export async function hashInternalAccessIdentifier(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export function getInternalAccessClientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

export async function checkInternalAccessRateLimit(identifierHash: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc("check_internal_access_rate_limit", {
    p_identifier_hash: identifierHash,
  })

  if (error) throw new Error(`Unable to check internal access rate limit: ${error.message}`)
  return normalizeRateLimitState(data)
}

export async function recordInternalAccessAttempt(identifierHash: string, success: boolean) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc("record_internal_access_attempt", {
    p_identifier_hash: identifierHash,
    p_success: success,
  })

  if (error) throw new Error(`Unable to record internal access attempt: ${error.message}`)
  return normalizeRateLimitState(data)
}
