-- Enable pg_trgm extension first before creating trigram indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add indexes to clients table for optimized querying

-- Index on RUT for fast duplicate detection
CREATE INDEX IF NOT EXISTS idx_clients_rut ON clients(rut) WHERE rut IS NOT NULL;

-- Index on email for duplicate detection and search
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email) WHERE email IS NOT NULL;

-- Index on phone for duplicate detection
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone) WHERE phone IS NOT NULL;

-- Composite index for name searches
CREATE INDEX IF NOT EXISTS idx_clients_names ON clients(first_name, last_name);

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status) WHERE status IS NOT NULL;

-- Index on industry for filtering
CREATE INDEX IF NOT EXISTS idx_clients_industry ON clients(industry) WHERE industry IS NOT NULL;

-- Index on client_type for filtering
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(client_type) WHERE client_type IS NOT NULL;

-- Index on created_at for sorting (most common sort)
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Full-text search indexes now work because pg_trgm is enabled above
-- Full-text search index for company_name
CREATE INDEX IF NOT EXISTS idx_clients_company_name_trgm ON clients USING gin(company_name gin_trgm_ops);

-- Full-text search index for combined name
CREATE INDEX IF NOT EXISTS idx_clients_full_name_trgm ON clients USING gin((first_name || ' ' || last_name) gin_trgm_ops);

-- Add helpful comments
COMMENT ON INDEX idx_clients_rut IS 'Fast lookup for RUT-based duplicate detection';
COMMENT ON INDEX idx_clients_email IS 'Fast lookup for email-based duplicate detection and search';
COMMENT ON INDEX idx_clients_phone IS 'Fast lookup for phone-based duplicate detection';
COMMENT ON INDEX idx_clients_created_at IS 'Optimizes default sort by creation date';
