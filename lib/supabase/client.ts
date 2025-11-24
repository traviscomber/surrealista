"use client"

import { createBrowserClient as createBrowserSupabaseClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

export function createBrowserClient() {
  // In Next.js, NEXT_PUBLIC_ env vars must be referenced as string literals to be replaced at build time
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error("[v0] Supabase credentials missing:", { hasUrl: !!url, hasKey: !!key })
    throw new Error("Supabase URL and Anon Key are required")
  }

  return createBrowserSupabaseClient<Database>(url, key)
}

export const createClient = createBrowserClient

// Singleton instance with lazy initialization
let _supabase: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (!_supabase) {
    _supabase = createBrowserClient()
  }
  return _supabase
}

// Default export for backwards compatibility
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(target, prop) {
    const client = getSupabaseClient()
    const value = client[prop as keyof typeof client]
    return typeof value === "function" ? value.bind(client) : value
  },
})
