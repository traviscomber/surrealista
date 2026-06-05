-- CRM Database Schema for Sur-Realista
-- Creates tables for client interactions, tasks, notes, and communication tracking

-- 1. CLIENT INTERACTIONS TABLE
CREATE TABLE IF NOT EXISTS client_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('call', 'email', 'whatsapp', 'visit', 'meeting', 'note', 'proposal')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 0,
  outcome VARCHAR(100),
  next_action VARCHAR(255),
  next_action_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- 2. CLIENT TASKS TABLE
CREATE TABLE IF NOT EXISTS client_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('follow_up', 'call', 'email', 'meeting', 'proposal', 'document', 'other')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  due_date DATE NOT NULL,
  completed_at TIMESTAMP,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- 3. CLIENT NOTES TABLE
CREATE TABLE IF NOT EXISTS client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_category VARCHAR(50) CHECK (note_category IN ('general', 'internal', 'preference', 'issue', 'opportunity')),
  is_internal BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- 4. CLIENT COMMUNICATION HISTORY TABLE
CREATE TABLE IF NOT EXISTS client_communication_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'phone', 'whatsapp', 'sms', 'in_app')),
  subject VARCHAR(255),
  message_preview TEXT,
  direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
  status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'received')),
  external_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- 5. CLIENT ALERTS TABLE
CREATE TABLE IF NOT EXISTS client_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  alert_type VARCHAR(100) NOT NULL CHECK (alert_type IN ('no_contact_7days', 'no_contact_14days', 'offer_expiring', 'new_match', 'birthday', 'anniversary', 'follow_up_due', 'task_overdue')),
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  acknowledged_at TIMESTAMP,
  acknowledged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- INDEXES for performance
CREATE INDEX idx_client_interactions_client_id ON client_interactions(client_id);
CREATE INDEX idx_client_interactions_created_at ON client_interactions(created_at DESC);
CREATE INDEX idx_client_interactions_next_action_date ON client_interactions(next_action_date);

CREATE INDEX idx_client_tasks_client_id ON client_tasks(client_id);
CREATE INDEX idx_client_tasks_status ON client_tasks(status);
CREATE INDEX idx_client_tasks_due_date ON client_tasks(due_date);
CREATE INDEX idx_client_tasks_priority ON client_tasks(priority);

CREATE INDEX idx_client_notes_client_id ON client_notes(client_id);
CREATE INDEX idx_client_notes_created_at ON client_notes(created_at DESC);

CREATE INDEX idx_client_communication_log_client_id ON client_communication_log(client_id);
CREATE INDEX idx_client_communication_log_channel ON client_communication_log(channel);
CREATE INDEX idx_client_communication_log_created_at ON client_communication_log(created_at DESC);

CREATE INDEX idx_client_alerts_client_id ON client_alerts(client_id);
CREATE INDEX idx_client_alerts_active ON client_alerts(is_active);
CREATE INDEX idx_client_alerts_type ON client_alerts(alert_type);

-- Enable RLS for security
ALTER TABLE client_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_communication_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - adjust according to your business logic)
CREATE POLICY "Users can view their company's client interactions" 
  ON client_interactions FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert client interactions" 
  ON client_interactions FOR INSERT 
  WITH CHECK (auth.uid() = created_by OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their company's tasks" 
  ON client_tasks FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their company's notes" 
  ON client_notes FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view communication log" 
  ON client_communication_log FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view alerts" 
  ON client_alerts FOR SELECT 
  USING (auth.uid() IS NOT NULL);
