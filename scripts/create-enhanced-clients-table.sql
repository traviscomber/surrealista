-- Create enhanced clients table with comprehensive fields
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  second_last_name VARCHAR(100),
  rut VARCHAR(20) UNIQUE,
  birth_date DATE,
  nationality VARCHAR(100) DEFAULT 'Chilena',
  
  -- Contact Information
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  
  -- Professional Information
  company_name VARCHAR(200),
  position VARCHAR(100),
  company_rut VARCHAR(20),
  industry VARCHAR(100),
  
  -- Location Information
  address TEXT,
  city VARCHAR(100),
  region VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Chile',
  
  -- Commercial Information
  client_type VARCHAR(50) CHECK (client_type IN ('buyer', 'seller', 'investor', 'tenant', 'both')) DEFAULT 'buyer',
  main_interest VARCHAR(100) CHECK (main_interest IN ('agricultural_field', 'parcel', 'conservation_project', 'commercial', 'industrial', 'residential', 'mixed')),
  locations_of_interest TEXT[], -- Array of locations
  desired_surface_area_min NUMERIC,
  desired_surface_area_max NUMERIC,
  budget_min NUMERIC,
  budget_max NUMERIC,
  
  -- Related Documents
  related_documents JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  
  -- Relationships tracking
  properties_bought INTEGER DEFAULT 0,
  properties_sold INTEGER DEFAULT 0,
  properties_quoted INTEGER DEFAULT 0,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  contact_frequency VARCHAR(50) CHECK (contact_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'as_needed'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_rut ON clients(rut);
CREATE INDEX IF NOT EXISTS idx_clients_client_type ON clients(client_type);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_last_contact_date ON clients(last_contact_date DESC);
CREATE INDEX IF NOT EXISTS idx_clients_main_interest ON clients(main_interest);

-- Create full text search index for client names
CREATE INDEX IF NOT EXISTS idx_clients_name_search ON clients USING gin(
  to_tsvector('spanish', first_name || ' ' || last_name || ' ' || COALESCE(second_last_name, ''))
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at_trigger
BEFORE UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION update_clients_updated_at();

-- Create client_property_relationships table for tracking interactions
CREATE TABLE IF NOT EXISTS client_property_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  property_id BIGINT REFERENCES properties(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) CHECK (relationship_type IN ('bought', 'sold', 'quoted_email', 'quoted_whatsapp', 'quoted_phone', 'viewed', 'favorited', 'task_related')) NOT NULL,
  relationship_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, property_id, relationship_type)
);

-- Create indexes for relationships
CREATE INDEX IF NOT EXISTS idx_client_property_client_id ON client_property_relationships(client_id);
CREATE INDEX IF NOT EXISTS idx_client_property_property_id ON client_property_relationships(property_id);
CREATE INDEX IF NOT EXISTS idx_client_property_type ON client_property_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_client_property_date ON client_property_relationships(relationship_date DESC);

-- Create client_communications table for tracking all communications
CREATE TABLE IF NOT EXISTS client_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  communication_type VARCHAR(50) CHECK (communication_type IN ('whatsapp', 'email', 'phone', 'meeting', 'video_call', 'other')) NOT NULL,
  direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
  subject VARCHAR(200),
  content TEXT,
  communication_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100),
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for communications
CREATE INDEX IF NOT EXISTS idx_client_comm_client_id ON client_communications(client_id);
CREATE INDEX IF NOT EXISTS idx_client_comm_type ON client_communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_client_comm_date ON client_communications(communication_date DESC);

COMMENT ON TABLE clients IS 'Enhanced client management with comprehensive personal, professional, and commercial information';
COMMENT ON TABLE client_property_relationships IS 'Tracks all relationships between clients and properties including purchases, sales, quotes, and tasks';
COMMENT ON TABLE client_communications IS 'Complete history of all communications with clients across all channels';
