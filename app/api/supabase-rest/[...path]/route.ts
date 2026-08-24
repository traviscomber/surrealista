import { type NextRequest, NextResponse } from "next/server"
import { INTERNAL_ACCESS_COOKIE, verifyInternalAccessToken } from "@/lib/auth/internal-access"

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "content-type",
  "if-match",
  "if-none-match",
  "prefer",
  "range",
  "range-unit",
  "x-client-info",
]

const FORWARDED_RESPONSE_HEADERS = [
  "content-location",
  "content-profile",
  "content-range",
  "content-type",
  "etag",
  "location",
  "preference-applied",
  "range-unit",
]

const RELATION_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/

async function proxyPostgrest(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const token = request.cookies.get(INTERNAL_ACCESS_COOKIE)?.value
  if (!(await verifyInternalAccessToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Database proxy unavailable" }, { status: 503 })
  }

  const { path } = await context.params
  if (!Array.isArray(path) || path.length !== 1 || !RELATION_NAME.test(path[0])) {
    return NextResponse.json({ error: "Unsupported database path" }, { status: 404 })
  }

  // This proxy intentionally supports public-schema table/view operations only.
  // PostgREST RPC endpoints and alternate schema profiles are not reachable from the browser.
  const relation = path[0]
  const target = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${encodeURIComponent(relation)}${request.nextUrl.search}`
  const headers = new Headers({
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    "accept-profile": "public",
    "content-profile": "public",
  })

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers.set(name, value)
  }

  const method = request.method.toUpperCase()
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer()

  let upstream: Response
  try {
    upstream = await fetch(target, {
      method,
      headers,
      body,
      cache: "no-store",
    })
  } catch (error) {
    console.error("[supabase-rest-proxy] upstream request failed", error)
    return NextResponse.json({ error: "Database request failed" }, { status: 502 })
  }

  const responseHeaders = new Headers()
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name)
    if (value) responseHeaders.set(name, value)
  }
  responseHeaders.set("cache-control", "private, no-store")

  if (method === "HEAD" || upstream.status === 204 || upstream.status === 304) {
    return new NextResponse(null, { status: upstream.status, headers: responseHeaders })
  }

  return new NextResponse(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export const GET = proxyPostgrest
export const POST = proxyPostgrest
export const PATCH = proxyPostgrest
export const PUT = proxyPostgrest
export const DELETE = proxyPostgrest
export const HEAD = proxyPostgrest
