"use client"

import { createBrowserClient as createBrowserSupabaseClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

const SUPABASE_URL = "https://jvgbrmqsiexwlqsyrwdx.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2Z2JybXFzaWV4d2xxc3lyd2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyODUxNDYsImV4cCI6MjA2MTg2MTE0Nn0.Y_vEM1Y9hSi_M1Lb0I4cFK6U3SeNw7bKckUnVzpD6zY"

console.log("[v0] Supabase client initializing with:", {
  url: SUPABASE_URL?.substring(0, 30) + "...",
  hasKey: !!SUPABASE_ANON_KEY,
})

let _supabase: ReturnType<typeof createBrowserSupabaseClient<Database>> | null = null

function initSupabase() {
  if (_supabase) return _supabase

  console.log("[v0] Creating Supabase browser client...")

  _supabase = createBrowserSupabaseClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        if (typeof document === "undefined") return null
        const value = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`))
        return value ? decodeURIComponent(value.split("=")[1]) : null
      },
      set(name: string, value: string, options: any) {
        if (typeof document === "undefined") return
        let cookie = `${name}=${encodeURIComponent(value)}`
        if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
        if (options?.path) cookie += `; path=${options.path}`
        document.cookie = cookie
      },
      remove(name: string, options: any) {
        if (typeof document === "undefined") return
        document.cookie = `${name}=; max-age=0; path=${options?.path || "/"}`
      },
    },
  })

  console.log("[v0] Supabase client created successfully")
  return _supabase
}

export function createBrowserClient() {
  return initSupabase()
}

export const createClient = createBrowserClient

export function getSupabaseClient() {
  return initSupabase()
}

// Default export for backwards compatibility
export const supabase = initSupabase()
