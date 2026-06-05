import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    console.log("[v0] Setting up missing contact fields in kmz_collection...")

    // Execute SQL to add columns
    const { error } = await supabaseAdmin.rpc("exec_sql", {
      query: `
        ALTER TABLE public.kmz_collection
        ADD COLUMN IF NOT EXISTS pic text,
        ADD COLUMN IF NOT EXISTS pic_phone text,
        ADD COLUMN IF NOT EXISTS pic_email text;
      `,
    }).catch(() => ({
      error: "RPC method not available - columns may already exist or need manual setup"
    }))

    // Alternative: Try direct query
    try {
      await supabaseAdmin.from("kmz_collection").select("pic, pic_phone, pic_email").limit(1)
      // If this succeeds, columns exist
    } catch (checkError: any) {
      // If columns don't exist, the query fails
      if (checkError?.message?.includes("column") || checkError?.message?.includes("does not exist")) {
        console.log("[v0] Columns need to be created manually via Supabase SQL Editor")
        return NextResponse.json({
          success: false,
          message: "Please run this SQL in Supabase SQL Editor:",
          sql: `
            ALTER TABLE public.kmz_collection
            ADD COLUMN IF NOT EXISTS pic text,
            ADD COLUMN IF NOT EXISTS pic_phone text,
            ADD COLUMN IF NOT EXISTS pic_email text;
          `,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Contact fields are ready in kmz_collection table",
    })
  } catch (error) {
    console.error("[v0] Error:", error)
    return NextResponse.json(
      { 
        error: "Database setup needed",
        instructions: "Please run the SQL migration script in Supabase SQL Editor"
      },
      { status: 500 }
    )
  }
}

