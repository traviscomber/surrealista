-- Migration: Create tasks table (idempotent version)
-- This script can be run multiple times safely

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS tasks_updated_at_trigger ON tasks;

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to TEXT,
  created_by TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER tasks_updated_at_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
