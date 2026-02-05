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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_folder_placeholders_folder_id ON folder_placeholders(folder_id);

-- Comment on table
COMMENT ON TABLE folder_placeholders IS 'Custom document type placeholders per folder, allowing admins to customize what files can be added to each folder';
