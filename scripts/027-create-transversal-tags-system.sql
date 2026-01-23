-- Create global tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tag associations for KMZ/Campos
CREATE TABLE IF NOT EXISTS kmz_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kmz_id UUID NOT NULL REFERENCES kmz_collection(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(kmz_id, tag_id)
);

-- Create tag associations for Clients
CREATE TABLE IF NOT EXISTS client_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, tag_id)
);

-- Create tag associations for Communications
CREATE TABLE IF NOT EXISTS communication_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_id UUID NOT NULL REFERENCES client_communications(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(communication_id, tag_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_kmz_tags_kmz_id ON kmz_tags(kmz_id);
CREATE INDEX idx_kmz_tags_tag_id ON kmz_tags(tag_id);
CREATE INDEX idx_client_tags_client_id ON client_tags(client_id);
CREATE INDEX idx_client_tags_tag_id ON client_tags(tag_id);
CREATE INDEX idx_communication_tags_communication_id ON communication_tags(communication_id);
CREATE INDEX idx_communication_tags_tag_id ON communication_tags(tag_id);
CREATE INDEX idx_tags_name ON tags(name);
