-- Seed initial AI agents for Sur-Realista document processing system
-- This script creates the 4 core agents that power the document organization workflow

-- Delete existing agents to avoid duplicates
DELETE FROM ai_agents WHERE name IN ('Folder Agent', 'Document Agent', 'Extraction Agent', 'Validation Agent');

-- 1. Folder Agent - Organizes folder structure according to Sur-Realista standard
INSERT INTO ai_agents (
  id,
  name,
  role,
  description,
  capabilities,
  model,
  status,
  parameters,
  success_rate,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Folder Agent',
  'folder_organizer',
  'Organización y estructura de carpetas según estándar Sur-Realista de 6 categorías',
  ARRAY['folder_analysis', 'structure_validation', 'organization_recommendations', 'compliance_scoring'],
  'gpt-4',
  'active',
  jsonb_build_object(
    'temperature', 0.3,
    'max_tokens', 2000,
    'standard_categories', jsonb_build_array(
      '1_FOTOS',
      '2_DOCUMENTOS', 
      '3_COMUNICACIONES',
      '4_MARKETING',
      '5_PDF_SUELTO',
      '6_KMZ_SUELTO'
    )
  ),
  0.92,
  NOW(),
  NOW()
);

-- 2. Document Agent - Classifies documents intelligently
INSERT INTO ai_agents (
  id,
  name,
  role,
  description,
  capabilities,
  model,
  status,
  parameters,
  success_rate,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Document Agent',
  'document_classifier',
  'Clasificación inteligente de documentos en categorías predefinidas',
  ARRAY['document_classification', 'content_analysis', 'metadata_extraction', 'category_suggestion'],
  'gpt-4',
  'active',
  jsonb_build_object(
    'temperature', 0.2,
    'max_tokens', 1500,
    'document_types', jsonb_build_array(
      'legal',
      'financial',
      'marketing',
      'photos',
      'communications',
      'other'
    )
  ),
  0.88,
  NOW(),
  NOW()
);

-- 3. Extraction Agent - Extracts structured data from documents
INSERT INTO ai_agents (
  id,
  name,
  role,
  description,
  capabilities,
  model,
  status,
  parameters,
  success_rate,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Extraction Agent',
  'data_extractor',
  'OCR y extracción de datos de documentos (ROL, fechas, montos)',
  ARRAY['ocr_processing', 'rol_extraction', 'date_extraction', 'amount_extraction', 'parallel_processing'],
  'gpt-4-vision',
  'active',
  jsonb_build_object(
    'temperature', 0.1,
    'max_tokens', 2500,
    'extraction_patterns', jsonb_build_object(
      'rol_pattern', '\\d{3,4}-\\d{4}-[A-Z]',
      'date_formats', jsonb_build_array('YYYY-MM-DD', 'DD/MM/YYYY', 'DD-MM-YYYY'),
      'currency_symbols', jsonb_build_array('$', 'CLP', 'USD', 'UF')
    )
  ),
  0.90,
  NOW(),
  NOW()
);

-- 4. Validation Agent - Validates compliance with standards
INSERT INTO ai_agents (
  id,
  name,
  role,
  description,
  capabilities,
  model,
  status,
  parameters,
  success_rate,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Validation Agent',
  'compliance_validator',
  'Validación de estándares PARA y estructura de 6 categorías',
  ARRAY['structure_validation', 'naming_validation', 'content_validation', 'metadata_validation', 'issue_detection'],
  'gpt-4',
  'active',
  jsonb_build_object(
    'temperature', 0.2,
    'max_tokens', 2000,
    'validation_rules', jsonb_build_object(
      'required_folders', jsonb_build_array('1_FOTOS', '2_DOCUMENTOS', '3_COMUNICACIONES', '4_MARKETING', '5_PDF_SUELTO', '6_KMZ_SUELTO'),
      'naming_convention', 'YYYY-MM-DD_description',
      'severity_levels', jsonb_build_object(
        'error', jsonb_build_array(8, 9, 10),
        'warning', jsonb_build_array(4, 5, 6, 7),
        'info', jsonb_build_array(1, 2, 3)
      )
    )
  ),
  0.95,
  NOW(),
  NOW()
);
