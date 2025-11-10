-- Make client fields nullable to allow flexible imports
-- This allows importing clients with partial information

-- Drop the NOT NULL constraint from first_name
ALTER TABLE clients 
ALTER COLUMN first_name DROP NOT NULL;

-- Also make last_name nullable for flexibility
ALTER TABLE clients 
ALTER COLUMN last_name DROP NOT NULL;

-- Add a comment explaining this change
COMMENT ON COLUMN clients.first_name IS 'First name of the client (optional - can be filled later)';
COMMENT ON COLUMN clients.last_name IS 'Last name of the client (optional - can be filled later)';

-- Create an index to help find clients without names for cleanup
CREATE INDEX IF NOT EXISTS idx_clients_missing_names 
ON clients (id) 
WHERE first_name IS NULL OR last_name IS NULL;
