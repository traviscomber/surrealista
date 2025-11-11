-- Fix the direction check constraint for client_communications table
-- This allows all necessary direction values

ALTER TABLE client_communications 
DROP CONSTRAINT IF EXISTS client_communications_direction_check;

ALTER TABLE client_communications 
ADD CONSTRAINT client_communications_direction_check 
CHECK (direction IN ('inbound', 'outbound', 'incoming', 'outgoing', 'internal'));

-- Update any existing rows that might have invalid directions
UPDATE client_communications 
SET direction = 'outbound' 
WHERE direction NOT IN ('inbound', 'outbound', 'incoming', 'outgoing', 'internal');
