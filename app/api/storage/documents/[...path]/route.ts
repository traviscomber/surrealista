import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

function getStorageAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase server environment variables")
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function GET(_request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  if (!Array.isArray(path) || path.length === 0 || path.some((segment) => !segment || segment === "." || segment === "..")) {
    return NextResponse.json({ error: "Invalid document path" }, { status: 400 })
  }

  const storagePath = path.map((segment) => decodeURIComponent(segment)).join("/")

  try {
    const supabase = getStorageAdmin()
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(storagePath, 60)
    if (error || !data?.signedUrl) {
      console.error("[documents-storage] signed URL failed", error)
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    return NextResponse.redirect(data.signedUrl, 307)
  } catch (error) {
    console.error("[documents-storage] failed", error)
    return NextResponse.json({ error: "Document access unavailable" }, { status: 503 })
  }
}
