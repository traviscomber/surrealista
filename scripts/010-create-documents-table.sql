-- Crear tabla de documentos para Sur-Realista
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información básica del documento
  title VARCHAR(500) NOT NULL,
  document_type VARCHAR(100) NOT NULL CHECK (
    document_type IN (
      'orden_venta',
      'documento_comercial', 
      'tasacion',
      'info_campo',
      'antecedentes_titulo',
      'escritura',
      'plano',
      'certificado',
      'contrato',
      'otro'
    )
  ),
  
  -- Contenido y almacenamiento
  description TEXT,
  file_url TEXT,
  file_name VARCHAR(500),
  file_size INTEGER,
  file_type VARCHAR(100),
  
  -- Vinculación con propiedades (KMX)
  property_ids UUID[] DEFAULT '{}',
  kmx_references TEXT[] DEFAULT '{}', -- ROL numbers o códigos KMX
  
  -- Metadata adicional
  tags TEXT[] DEFAULT '{}',
  related_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Fechas importantes
  document_date DATE,
  expiry_date DATE,
  
  -- Control de versiones
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  
  -- Estado
  status VARCHAR(50) DEFAULT 'active' CHECK (
    status IN ('active', 'archived', 'expired', 'draft')
  ),
  
  -- Metadata JSON para campos personalizados
  metadata JSONB DEFAULT '{}',
  
  -- Auditoría
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_property_ids ON documents USING GIN(property_ids);
CREATE INDEX IF NOT EXISTS idx_documents_kmx_references ON documents USING GIN(kmx_references);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trigger_update_documents_updated_at ON documents;
CREATE TRIGGER trigger_update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

COMMENT ON TABLE documents IS 'Documentos de Sur-Realista con vinculación a propiedades (KMX)';
