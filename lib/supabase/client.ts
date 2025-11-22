"use client"

import { createBrowserClient as createBrowserSupabaseClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

function getEnvVar(key: string): string {
  // Strategy 1: Direct process.env access (works in standard Next.js)
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key]!
  }

  // Strategy 2: Check window object (Next.js injects env vars here)
  if (typeof window !== "undefined" && (window as any).__ENV__ && (window as any).__ENV__[key]) {
    return (window as any).__ENV__[key]
  }

  // Strategy 3: Check global object
  if (typeof globalThis !== "undefined" && (globalThis as any)[key]) {
    return (globalThis as any)[key]
  }

  console.error(`[v0] Environment variable ${key} not found`)
  return ""
}

export function createBrowserClient() {
  const url = getEnvVar("NEXT_PUBLIC_SUPABASE_URL")
  const key = getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY")

  console.log("[v0] Creating Supabase client with:", {
    hasUrl: !!url,
    hasKey: !!key,
    urlLength: url?.length || 0,
    keyLength: key?.length || 0,
  })

  if (!url || !key) {
    throw new Error("Supabase URL and Anon Key are required. Check environment variables.")
  }

  return createBrowserSupabaseClient<Database>(url, key)
}

export const createClient = createBrowserClient

let _supabase: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseClient() {
  if (!_supabase) {
    _supabase = createBrowserClient()
  }
  return _supabase
}

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(target, prop) {
    const client = getSupabaseClient()
    const value = client[prop as keyof typeof client]
    return typeof value === "function" ? value.bind(client) : value
  },
})
