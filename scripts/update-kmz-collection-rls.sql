-- Update RLS policies for kmz_collection to allow anonymous access
-- This allows KMZ files to be saved and loaded without authentication

-- Drop both old and new policy names to ensure idempotency
-- Drop old authenticated-only policies
DROP POLICY IF EXISTS "Allow authenticated users to read kmz_collection" ON kmz_collection;
DROP POLICY IF EXISTS "Allow authenticated users to insert kmz_collection" ON kmz_collection;
DROP POLICY IF EXISTS "Allow authenticated users to update kmz_collection" ON kmz_collection;
DROP POLICY IF EXISTS "Allow authenticated users to delete kmz_collection" ON kmz_collection;

-- Drop new all-users policies (in case they already exist)
DROP POLICY IF EXISTS "Allow all users to read kmz_collection" ON kmz_collection;
DROP POLICY IF EXISTS "Allow all users to insert kmz_collection" ON kmz_collection;
DROP POLICY IF EXISTS "Allow all users to update kmz_collection" ON kmz_collection;
DROP POLICY IF EXISTS "Allow all users to delete kmz_collection" ON kmz_collection;

-- Create new permissive policies for all users (authenticated and anonymous)
CREATE POLICY "Allow all users to read kmz_collection"
  ON kmz_collection FOR SELECT
  USING (true);

CREATE POLICY "Allow all users to insert kmz_collection"
  ON kmz_collection FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all users to update kmz_collection"
  ON kmz_collection FOR UPDATE
  USING (true);

CREATE POLICY "Allow all users to delete kmz_collection"
  ON kmz_collection FOR DELETE
  USING (true);

-- Alternative: Completely disable RLS (uncomment if you prefer this approach)
-- ALTER TABLE kmz_collection DISABLE ROW LEVEL SECURITY;
