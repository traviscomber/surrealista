import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS kmz_collection (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        drive_file_id TEXT,
        description TEXT,
        metadata JSONB,
        placemarks_count INTEGER DEFAULT 0,
        rol_numbers TEXT[],
        bounds JSONB,
        coordinates JSONB,
        tags TEXT[],
        category TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES auth.users(id),
        UNIQUE(drive_file_id)
      );

      CREATE INDEX IF NOT EXISTS idx_kmz_collection_file_name ON kmz_collection(file_name);
      CREATE INDEX IF NOT EXISTS idx_kmz_collection_tags ON kmz_collection USING GIN(tags);
      CREATE INDEX IF NOT EXISTS idx_kmz_collection_rol_numbers ON kmz_collection USING GIN(rol_numbers);
      CREATE INDEX IF NOT EXISTS idx_kmz_collection_category ON kmz_collection(category);
      CREATE INDEX IF NOT EXISTS idx_kmz_collection_is_active ON kmz_collection(is_active);

      ALTER TABLE kmz_collection ENABLE ROW LEVEL SECURITY;

      CREATE POLICY IF NOT EXISTS "Allow authenticated users to read kmz_collection"
        ON kmz_collection FOR SELECT
        TO authenticated
        USING (true);

      CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert kmz_collection"
        ON kmz_collection FOR INSERT
        TO authenticated
        WITH CHECK (true);

      CREATE POLICY IF NOT EXISTS "Allow authenticated users to update kmz_collection"
        ON kmz_collection FOR UPDATE
        TO authenticated
        USING (true);

      CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete kmz_collection"
        ON kmz_collection FOR DELETE
        TO authenticated
        USING (true);
    `

    return NextResponse.json({
      message: "Please execute this SQL in your Supabase SQL Editor",
      sql: createTableSQL,
      instructions: [
        "1. Go to your Supabase project dashboard",
        "2. Navigate to SQL Editor",
        "3. Copy and paste the SQL provided",
        "4. Click 'Run' to execute",
        "5. Refresh this page after execution",
      ],
    })
  } catch (error: any) {
    console.error("[v0] Fatal error:", error)
    return NextResponse.json(
      {
        error: "Failed to prepare table creation",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
