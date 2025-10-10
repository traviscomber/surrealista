-- Create tasks table for the Nuevas Tareas module
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  created_by VARCHAR(100) NOT NULL,
  assigned_to VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  location VARCHAR(200),
  related_to VARCHAR(100),
  related_id UUID,
  tags TEXT[],
  notes TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at_trigger
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_tasks_updated_at();

COMMENT ON TABLE tasks IS 'Open task list for team collaboration and tracking';
COMMENT ON COLUMN tasks.related_to IS 'Type of related entity: campo, cliente, propiedad, etc.';
COMMENT ON COLUMN tasks.related_id IS 'UUID of the related entity';
