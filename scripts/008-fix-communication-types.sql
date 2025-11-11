-- Fix communication_type constraint to allow all needed types

-- First, drop the existing constraint if it exists
ALTER TABLE client_communications DROP CONSTRAINT IF EXISTS client_communications_communication_type_check;

-- Add new constraint with all valid communication types
ALTER TABLE client_communications 
ADD CONSTRAINT client_communications_communication_type_check 
CHECK (communication_type IN (
  'whatsapp',
  'gmail', 
  'email',
  'phone',
  'social_media',
  'instagram',
  'listing',
  'document',
  'portal'
));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_client_communications_type 
ON client_communications(communication_type);
