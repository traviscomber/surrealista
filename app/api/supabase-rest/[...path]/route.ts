import { type NextRequest, NextResponse } from "next/server"

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "accept-profile",
  "content-profile",
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

async function proxyPostgrest(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Database proxy unavailable" }, { status: 503 })
  }

  const { path } = await context.params
  if (!Array.isArray(path) || path.length === 0) {
    return NextResponse.json({ error: "Invalid database path" }, { status: 400 })
  }

  const encodedPath = path.map((segment) => encodeURIComponent(decodeURIComponent(segment))).join("/")
  const target = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${encodedPath}${request.nextUrl.search}`
  const headers = new Headers({
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
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
