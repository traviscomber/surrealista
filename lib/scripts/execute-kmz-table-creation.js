import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log("[v0] Initializing Supabase client...")
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const COMPLETE_SQL = `
-- Create KMZ Collection table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kmz_collection_file_name ON kmz_collection(file_name);
CREATE INDEX IF NOT EXISTS idx_kmz_collection_tags ON kmz_collection USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_kmz_collection_rol_numbers ON kmz_collection USING GIN(rol_numbers);
CREATE INDEX IF NOT EXISTS idx_kmz_collection_category ON kmz_collection(category);
CREATE INDEX IF NOT EXISTS idx_kmz_collection_is_active ON kmz_collection(is_active);

-- Enable RLS
ALTER TABLE kmz_collection ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read kmz_collection" ON kmz_collection;
DROP POLICY IF EXISTS "Allow authenticated users to insert kmz_collection" ON kmz_collection;
DROP POLICY IF EXISTS "Allow authenticated users to update kmz_collection" ON kmz_collection;
DROP POLICY IF EXISTS "Allow authenticated users to delete kmz_collection" ON kmz_collection;

-- Create policies
CREATE POLICY "Allow authenticated users to read kmz_collection"
  ON kmz_collection FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert kmz_collection"
  ON kmz_collection FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update kmz_collection"
  ON kmz_collection FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete kmz_collection"
  ON kmz_collection FOR DELETE
  TO authenticated
  USING (true);
`

async function executeSQL() {
  console.log("[v0] Starting KMZ collection table creation...")

  try {
    console.log("[v0] Checking if table already exists...")
    const { data: existingData, error: checkError } = await supabase.from("kmz_collection").select("id").limit(1)

    if (!checkError) {
      console.log("[v0] ✅ Table already exists and is accessible!")
      console.log("[v0] No need to create it again.")
      return
    }

    console.log("[v0] Table doesn't exist yet, creating...")
    console.log("[v0] Please run this SQL manually in your Supabase SQL Editor:")
    console.log("\n" + "=".repeat(60))
    console.log(COMPLETE_SQL)
    console.log("=".repeat(60) + "\n")

    console.log("[v0] Steps to run SQL in Supabase:")
    console.log("1. Go to your Supabase project dashboard")
    console.log("2. Click on 'SQL Editor' in the left sidebar")
    console.log("3. Click 'New Query'")
    console.log("4. Copy and paste the SQL above")
    console.log("5. Click 'Run' to execute")
  } catch (error) {
    console.error("[v0] Error:", error.message)
    throw error
  }
}

executeSQL()
  .then(() => {
    console.log("\n[v0] Script completed")
  })
  .catch((error) => {
    console.error("\n[v0] Script failed:", error)
  })
