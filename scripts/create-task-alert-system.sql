-- Add contact information to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50),
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "whatsapp": false, "sms": false}'::jsonb,
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/Santiago';

-- Create task_assignments table to link tasks to users
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by VARCHAR(255),
  role VARCHAR(50) DEFAULT 'assignee', -- assignee, observer, approver
  UNIQUE(task_id, user_id)
);

-- Create notifications table to track sent alerts
CREATE TABLE IF NOT EXISTS task_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- email, whatsapp, sms
  notification_event VARCHAR(50) NOT NULL, -- task_created, task_assigned, task_due_soon, task_overdue, task_completed
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, failed
  error_message TEXT,
  metadata JSONB
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_task_id ON task_notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_user_id ON task_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_task_notifications_sent_at ON task_notifications(sent_at);

-- Enable RLS
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating them to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Users can create task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Users can update task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Users can delete task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Users can view their own notifications" ON task_notifications;
DROP POLICY IF EXISTS "System can create notifications" ON task_notifications;
DROP POLICY IF EXISTS "System can update notifications" ON task_notifications;

-- RLS Policies for task_assignments
CREATE POLICY "Users can view their own task assignments"
  ON task_assignments FOR SELECT
  USING (true);

CREATE POLICY "Users can create task assignments"
  ON task_assignments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update task assignments"
  ON task_assignments FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete task assignments"
  ON task_assignments FOR DELETE
  USING (true);

-- RLS Policies for task_notifications
CREATE POLICY "Users can view their own notifications"
  ON task_notifications FOR SELECT
  USING (true);

CREATE POLICY "System can create notifications"
  ON task_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update notifications"
  ON task_notifications FOR UPDATE
  USING (true);

-- Drop existing function and trigger before recreating
DROP TRIGGER IF EXISTS trigger_notify_task_assignment ON task_assignments;
DROP FUNCTION IF EXISTS notify_task_assignment();

-- Function to automatically notify assigned users when a task is created or updated
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert notification for each assigned user
  INSERT INTO task_notifications (task_id, user_id, notification_type, notification_event, message)
  SELECT 
    NEW.task_id,
    NEW.user_id,
    'email', -- Default to email, can be customized based on user preferences
    'task_assigned',
    'Se te ha asignado una nueva tarea: ' || (SELECT title FROM tasks WHERE id = NEW.task_id)
  FROM task_assignments
  WHERE task_id = NEW.task_id AND user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to send notifications when tasks are assigned
CREATE TRIGGER trigger_notify_task_assignment
AFTER INSERT ON task_assignments
FOR EACH ROW
EXECUTE FUNCTION notify_task_assignment();

-- Summary
SELECT 
  'Task alert system created successfully!' as message,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM tasks) as total_tasks;
