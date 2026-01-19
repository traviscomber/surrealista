-- Add "presentacion" and "plano" as valid document types in property_documents table
-- First, drop the old constraint
ALTER TABLE property_documents 
DROP CONSTRAINT property_documents_document_type_check;

-- Add the new constraint with both "presentacion" and "plano" included
ALTER TABLE property_documents 
ADD CONSTRAINT property_documents_document_type_check 
CHECK (document_type IN (
  'orden_venta',
  'documento_comercial',
  'tasacion',
  'info_campo',
  'antecedentes_titulo',
  'escritura',
  'certificado',
  'informe_tecnico',
  'contrato',
  'presentacion',
  'plano',
  'kmz',
  'otro'
));

-- Verify the constraint was created
SELECT constraint_name 
FROM information_schema.table_constraints
WHERE table_name = 'property_documents' 
AND constraint_type = 'CHECK';
