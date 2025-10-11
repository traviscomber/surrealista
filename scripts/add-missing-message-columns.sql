-- Add missing columns to messages table
-- Changed property_id from UUID to BIGINT to match properties.id type
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS property_id BIGINT REFERENCES properties(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS property_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Create message_replies table if it doesn't exist
-- Changed id and message_id from UUID to BIGINT to match messages.id type
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
