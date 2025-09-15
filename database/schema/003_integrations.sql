-- Creating integration-related tables
-- External integrations schema (SII, SIRENE, CIREN)
-- Version: 003
-- Created: 2024-01-03

-- SII integration data
CREATE TABLE IF NOT EXISTS sii_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    rol_number TEXT UNIQUE NOT NULL,
    tax_data JSONB,
    market_value BIGINT,
    contributions JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SIRENE integration data
CREATE TABLE IF NOT EXISTS sirene_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_rut TEXT UNIQUE NOT NULL,
    company_name TEXT,
    business_data JSONB,
    financial_data JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CIREN integration data
CREATE TABLE IF NOT EXISTS ciren_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    geographic_data JSONB,
    environmental_data JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integration logs
CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    integration_type TEXT NOT NULL,
    operation TEXT NOT NULL,
    status TEXT CHECK (status IN ('success', 'error', 'pending')),
    request_data JSONB,
    response_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sii_data_rol_number ON sii_data(rol_number);
CREATE INDEX IF NOT EXISTS idx_sirene_data_rut ON sirene_data(company_rut);
CREATE INDEX IF NOT EXISTS idx_integration_logs_type ON integration_logs(integration_type);
