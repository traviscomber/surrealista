-- Migration: Create enhanced clients table (idempotent version)
-- This script can be run multiple times safely

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS clients_updated_at_trigger ON clients;
DROP TRIGGER IF EXISTS client_properties_updated_at_trigger ON client_properties;
DROP TRIGGER IF EXISTS client_communications_updated_at_trigger ON client_communications;

-- Create clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  rut TEXT UNIQUE,
  birth_date DATE,
  nationality TEXT,
  
  -- Contact Information
  email TEXT,
  phone TEXT,
  mobile TEXT,
  
  -- Professional Information
  company_name TEXT,
  position TEXT,
  company_rut TEXT,
  industry TEXT,
  
  -- Location Information
  address TEXT,
  city TEXT,
  region TEXT,
  country TEXT DEFAULT 'Chile',
  
  -- Commercial Information
  client_type TEXT[] DEFAULT ARRAY[]::TEXT[], -- ['buyer', 'seller', 'investor', 'tenant']
  main_interest TEXT, -- 'agricultural_field', 'parcel', 'conservation_project', 'commercial', 'industrial'
  locations_of_interest TEXT[],
  desired_surface_area_min NUMERIC,
  desired_surface_area_max NUMERIC,
  budget_min NUMERIC,
  budget_max NUMERIC,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create client-property relationships table
-- Changed property_id from UUID to BIGINT to match properties.id type
CREATE TABLE IF NOT EXISTS client_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  property_id BIGINT REFERENCES properties(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'bought', 'sold', 'quoted', 'interested', 'visited'
  relationship_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, property_id, relationship_type)
);

-- Create client communications table
CREATE TABLE IF NOT EXISTS client_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  communication_type TEXT NOT NULL, -- 'whatsapp', 'email', 'phone', 'meeting', 'task'
  subject TEXT,
  content TEXT,
  communication_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create or replace the updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER clients_updated_at_trigger
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER client_properties_updated_at_trigger
  BEFORE UPDATE ON client_properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER client_communications_updated_at_trigger
  BEFORE UPDATE ON client_communications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_rut ON clients(rut);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_client_properties_client_id ON client_properties(client_id);
CREATE INDEX IF NOT EXISTS idx_client_properties_property_id ON client_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_client_communications_client_id ON client_communications(client_id);
CREATE INDEX IF NOT EXISTS idx_client_communications_date ON client_communications(communication_date DESC);
