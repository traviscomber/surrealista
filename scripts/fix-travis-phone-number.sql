-- Fix Travis's phone number - remove duplicate 9
-- Correct number: +56940946660

-- First, let's see what Travis's current number is
SELECT id, name, phone, whatsapp 
FROM users 
WHERE name ILIKE '%travis%';

-- Update Travis's WhatsApp number to the correct format
UPDATE users
SET 
  whatsapp = '+56940946660',
  phone = '+56940946660',
  updated_at = NOW()
WHERE name ILIKE '%travis%';

-- Verify the update
SELECT id, name, phone, whatsapp 
FROM users 
WHERE name ILIKE '%travis%';

-- Display confirmation
SELECT 
  'Travis phone number updated successfully' as message,
  COUNT(*) as users_updated
FROM users 
WHERE name ILIKE '%travis%';
