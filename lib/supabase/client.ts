"use client"

import { createBrowserClient as createBrowserSupabaseClient } from "@supabase/ssr"

const SUPABASE_URL = "https://jvgbrmqsiexwlqsyrwdx.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2Z2JybXFzaWV4d2xxc3lyd2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyODUxNDYsImV4cCI6MjA2MTg2MTE0Nn0.Y_vEM1Y9hSi_M1Lb0I4cFK6U3SeNw7bKckUnVzpD6zY"
const REST_PREFIX = `${SUPABASE_URL}/rest/v1/`

function proxiedFetch(input: RequestInfo | URL, init?: RequestInit) {
  const rawUrl = input instanceof Request ? input.url : input.toString()
  if (typeof window !== "undefined" && rawUrl.startsWith(REST_PREFIX)) {
    const upstreamUrl = new URL(rawUrl)
    const restPath = upstreamUrl.pathname.slice("/rest/v1/".length)
    const proxyUrl = `/api/supabase-rest/${restPath}${upstreamUrl.search}`

    if (input instanceof Request) {
      return fetch(new Request(proxyUrl, input), {
        ...init,
        credentials: "same-origin",
      })
    }

    return fetch(proxyUrl, {
      ...init,
      credentials: "same-origin",
    })
  }

  return fetch(input, init)
}

let _supabase: ReturnType<typeof createBrowserSupabaseClient> | null = null

function initSupabase() {
  if (_supabase) return _supabase

  _supabase = createBrowserSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { fetch: proxiedFetch },
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

  return _supabase
}

export function createBrowserClient() {
  return initSupabase()
}

export const createClient = createBrowserClient

export function getSupabaseClient() {
  return initSupabase()
}

export const supabase = initSupabase()