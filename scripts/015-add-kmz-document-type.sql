-- Add KMZ as a valid document type to property_documents table
ALTER TABLE property_documents 
DROP CONSTRAINT IF EXISTS property_documents_document_type_check;

ALTER TABLE property_documents
ADD CONSTRAINT property_documents_document_type_check CHECK (
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
    'kmz',
    'otro'
  )
);
