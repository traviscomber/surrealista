-- Fix RLS policies for users table to allow team member management
-- This script updates the users table policies to allow creating and managing team members

-- Drop ALL existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable update for users based on id" ON users;
-- Added missing policy drops that were causing "already exists" errors
DROP POLICY IF EXISTS "Authenticated users can view all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert users" ON users;
DROP POLICY IF EXISTS "Authenticated users can update all users" ON users;
DROP POLICY IF EXISTS "Prevent user deletion" ON users;

-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow all authenticated users to view all users
-- This is needed for task assignments and team management
CREATE POLICY "Authenticated users can view all users"
ON users
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow authenticated users to insert new users
-- This allows team managers to add new team members
CREATE POLICY "Authenticated users can insert users"
ON users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3: Allow users to update their own data
-- Users can update their own profile information
CREATE POLICY "Users can update their own data"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Allow users to update other users (for team management)
-- This allows managers to update team member information
CREATE POLICY "Authenticated users can update all users"
ON users
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 5: Prevent users from deleting themselves or others
-- Only allow deletion through admin interface
CREATE POLICY "Prevent user deletion"
ON users
FOR DELETE
TO authenticated
USING (false);

-- Display summary
DO $$
BEGIN
  RAISE NOTICE 'Users table RLS policies updated successfully';
  RAISE NOTICE 'Total users: %', (SELECT COUNT(*) FROM users);
END $$;
