"use client"

import { createBrowserClient as createBrowserSupabaseClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createBrowserClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("[v0] Supabase credentials missing:", {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_ANON_KEY,
    })
    throw new Error("Supabase URL and Anon Key are required")
  }

  return createBrowserSupabaseClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
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
