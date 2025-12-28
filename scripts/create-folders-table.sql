-- Create folders table for document organization
CREATE TABLE IF NOT EXISTS folders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL,
  UNIQUE(name, parent_id)
);

-- Enable RLS
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to allow all operations
CREATE POLICY "Users can create folders" ON folders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view folders" ON folders FOR SELECT USING (true);
CREATE POLICY "Users can update folders" ON folders FOR UPDATE USING (true);
CREATE POLICY "Users can delete folders" ON folders FOR DELETE USING (true);
