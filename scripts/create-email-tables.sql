-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create email_logs table for history
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE SET NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  metadata JSONB
);

-- Create index for faster queries
CREATE INDEX idx_email_logs_client_id ON email_logs(client_id);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at);
CREATE INDEX idx_email_logs_status ON email_logs(status);
