-- Phase 1: Database Enhancement for Home Spotter Opportunity Engine
-- Creates parcels table and upgrades opportunities table with UF/score fields

-- Create parcels table linking to kmz_collection
CREATE TABLE IF NOT EXISTS parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kmz_id UUID NOT NULL REFERENCES kmz_collection(id) ON DELETE CASCADE,
  parcel_number TEXT UNIQUE,
  legal_description TEXT,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  coordinates JSONB,
  area_sqft DECIMAL(12,2),
  lot_size DECIMAL(12,2),
  zoning TEXT,
  current_use TEXT,
  tax_assessed_value DECIMAL(15,2),
  market_value DECIMAL(15,2),
  ownership TEXT,
  years_owned INTEGER,
  days_on_market INTEGER,
  price_per_sqft DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add UF (Utility Factor) and Score columns to opportunities table
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS uf_score DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS investment_potential TEXT DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS market_trend TEXT,
ADD COLUMN IF NOT EXISTS comparables_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_analyzed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_parcels_kmz_id ON parcels(kmz_id);
CREATE INDEX IF NOT EXISTS idx_parcels_address ON parcels(address, city, state);
CREATE INDEX IF NOT EXISTS idx_opportunities_uf_score ON opportunities(uf_score DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_investment_potential ON opportunities(investment_potential);

-- Enable RLS on parcels table
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read parcels (public portal)
DROP POLICY IF EXISTS "Parcels are viewable by everyone" ON parcels;
CREATE POLICY "Parcels are viewable by everyone" 
ON parcels FOR SELECT USING (true);

-- Ensure opportunities RLS is enabled
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Everyone can read opportunities
DROP POLICY IF EXISTS "Opportunities are viewable by everyone" ON opportunities;
CREATE POLICY "Opportunities are viewable by everyone" 
ON opportunities FOR SELECT USING (true);

-- Create activity view for opportunities
DROP VIEW IF EXISTS opportunity_activity_feed;
CREATE VIEW opportunity_activity_feed AS
SELECT 
  oa.id,
  oa.opportunity_id,
  oa.changed_by,
  oa.action,
  oa.created_at,
  o.title as opportunity_title,
  o.status
FROM opportunity_activity oa
LEFT JOIN opportunities o ON oa.opportunity_id = o.id
ORDER BY oa.created_at DESC;

-- Grant permissions
GRANT SELECT ON parcels TO authenticated;
GRANT SELECT ON parcels TO anon;
GRANT SELECT ON opportunities TO authenticated;
GRANT SELECT ON opportunities TO anon;
GRANT SELECT ON opportunity_activity_feed TO authenticated;
GRANT SELECT ON opportunity_activity_feed TO anon;
