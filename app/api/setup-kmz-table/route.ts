import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Missing Supabase credentials" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Execute each SQL statement separately
    const statements = [
      // Create table
      `CREATE TABLE IF NOT EXISTS kmz_collection (
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
      )`,

      // Create indexes
      `CREATE INDEX IF NOT EXISTS idx_kmz_collection_file_name ON kmz_collection(file_name)`,
      `CREATE INDEX IF NOT EXISTS idx_kmz_collection_tags ON kmz_collection USING GIN(tags)`,
      `CREATE INDEX IF NOT EXISTS idx_kmz_collection_rol_numbers ON kmz_collection USING GIN(rol_numbers)`,
      `CREATE INDEX IF NOT EXISTS idx_kmz_collection_category ON kmz_collection(category)`,
      `CREATE INDEX IF NOT EXISTS idx_kmz_collection_is_active ON kmz_collection(is_active)`,

      // Enable RLS
      `ALTER TABLE kmz_collection ENABLE ROW LEVEL SECURITY`,
    ]

    const results = []

    for (const statement of statements) {
      const { error } = await supabase.rpc("exec_sql", { sql: statement })

      if (error) {
        console.log(`[v0] Error executing statement: ${error.message}`)
        results.push({ success: false, error: error.message, statement: statement.substring(0, 50) })
      } else {
        results.push({ success: true, statement: statement.substring(0, 50) })
      }
    }

    // Create RLS policies
    const policies = [
      {
        name: "Allow authenticated users to read kmz_collection",
        sql: `CREATE POLICY IF NOT EXISTS "Allow authenticated users to read kmz_collection"
          ON kmz_collection FOR SELECT
          TO authenticated
          USING (true)`,
      },
      {
        name: "Allow authenticated users to insert kmz_collection",
        sql: `CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert kmz_collection"
          ON kmz_collection FOR INSERT
          TO authenticated
          WITH CHECK (true)`,
      },
      {
        name: "Allow authenticated users to update kmz_collection",
        sql: `CREATE POLICY IF NOT EXISTS "Allow authenticated users to update kmz_collection"
          ON kmz_collection FOR UPDATE
          TO authenticated
          USING (true)`,
      },
      {
        name: "Allow authenticated users to delete kmz_collection",
        sql: `CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete kmz_collection"
          ON kmz_collection FOR DELETE
          TO authenticated
          USING (true)`,
      },
    ]

    for (const policy of policies) {
      const { error } = await supabase.rpc("exec_sql", { sql: policy.sql })

      if (error) {
        console.log(`[v0] Error creating policy ${policy.name}: ${error.message}`)
        results.push({ success: false, error: error.message, policy: policy.name })
      } else {
        results.push({ success: true, policy: policy.name })
      }
    }

    // Verify table was created
    const { data: tableCheck, error: checkError } = await supabase.from("kmz_collection").select("count").limit(1)

    if (checkError) {
      return NextResponse.json(
        {
          message: "Table creation attempted but verification failed",
          results,
          verificationError: checkError.message,
          note: "You may need to execute the SQL manually in Supabase SQL Editor",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      message: "KMZ collection table created successfully!",
      results,
      tableExists: true,
    })
  } catch (error: any) {
    console.error("[v0] Fatal error:", error)
    return NextResponse.json(
      {
        error: "Failed to create table",
        details: error.message,
        note: "Please copy the SQL from scripts/create-kmz-collection-table.sql and run it manually in Supabase SQL Editor",
      },
      { status: 500 },
    )
  }
}
