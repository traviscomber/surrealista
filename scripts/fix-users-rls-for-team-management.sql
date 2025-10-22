-- Fix RLS policies for users table to allow team management
-- This script allows internal team management without strict authentication requirements

-- Drop all existing RLS policies on users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert users" ON users;
DROP POLICY IF EXISTS "Authenticated users can update users" ON users;
DROP POLICY IF EXISTS "Only admins can delete users" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;

-- Temporarily disable RLS to allow team management operations
-- This is appropriate for internal team management systems
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled but allow all operations,
-- uncomment the following lines and comment out the DISABLE RLS line above:

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow all operations for team management"
-- ON users
-- FOR ALL
-- USING (true)
-- WITH CHECK (true);

-- Display confirmation
DO $$
BEGIN
  RAISE NOTICE 'RLS disabled on users table for team management';
  RAISE NOTICE 'Users can now be created, updated, and deleted without authentication restrictions';
END $$;
