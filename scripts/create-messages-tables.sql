-- Using ALTER TABLE to add missing columns instead of CREATE TABLE
-- Add missing columns to existing messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS property_id BIGINT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS property_title VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_property_id_fkey'
    ) THEN
        ALTER TABLE messages 
        ADD CONSTRAINT messages_property_id_fkey 
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Changed id and message_id from UUID to BIGINT to match messages table
-- Create table for message replies
CREATE TABLE IF NOT EXISTS message_replies (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  sent_to VARCHAR(255) NOT NULL,
  sent_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_property_id ON messages(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);
CREATE INDEX IF NOT EXISTS idx_message_replies_message_id ON message_replies(message_id);
