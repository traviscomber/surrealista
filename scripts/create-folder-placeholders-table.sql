-- Create folder_placeholders table to store custom document type placeholders per folder
CREATE TABLE IF NOT EXISTS folder_placeholders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  folder_id UUID NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
  placeholder_name VARCHAR(255) NOT NULL,
  placeholder_label VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID NOT NULL,
  UNIQUE(folder_id, placeholder_name)
);

-- Enable RLS
ALTER TABLE folder_placeholders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view placeholders" ON folder_placeholders FOR SELECT USING (true);
CREATE POLICY "Only admins can create placeholders" ON folder_placeholders FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
CREATE POLICY "Only admins can update placeholders" ON folder_placeholders FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
CREATE POLICY "Only admins can delete placeholders" ON folder_placeholders FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_folder_placeholders_folder_id ON folder_placeholders(folder_id);
