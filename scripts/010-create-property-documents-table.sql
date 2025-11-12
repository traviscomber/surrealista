-- Create property_documents table for Sur-Realista documentation system
CREATE TABLE IF NOT EXISTS property_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL CHECK (
    document_type IN (
      'orden_venta',
      'documento_comercial',
      'tasacion',
      'info_campo',
      'antecedentes_titulo',
      'escritura',
      'certificado',
      'plano',
      'informe_tecnico',
      'contrato',
      'otro'
    )
  ),
  description TEXT,
  file_url TEXT,
  file_type VARCHAR(50),
  file_size INTEGER,
  
  -- Links to properties/campos
  linked_kmz_ids UUID[] DEFAULT '{}',
  linked_property_ids UUID[] DEFAULT '{}',
  linked_client_ids UUID[] DEFAULT '{}',
  
  -- Metadata
  document_date DATE,
  validity_date DATE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'expired', 'draft')),
  
  -- Tags and categorization
  tags TEXT[] DEFAULT '{}',
  category VARCHAR(100),
  
  -- Ownership and tracking
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_property_documents_type ON property_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_property_documents_status ON property_documents(status);
CREATE INDEX IF NOT EXISTS idx_property_documents_linked_kmz ON property_documents USING GIN(linked_kmz_ids);
CREATE INDEX IF NOT EXISTS idx_property_documents_created_by ON property_documents(created_by);
CREATE INDEX IF NOT EXISTS idx_property_documents_created_at ON property_documents(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_property_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_documents_updated_at
  BEFORE UPDATE ON property_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_property_documents_updated_at();
