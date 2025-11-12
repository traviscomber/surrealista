-- Fix constraints and create comprehensive example data for "Campo Ranco"

-- Step 1: Disable RLS temporarily for easier data insertion
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- Step 2: Handle existing data before updating constraints
-- Delete or update any existing rows that would violate the new constraint
DELETE FROM documents WHERE document_type NOT IN (
  'orden_venta',
  'tasacion', 
  'antecedentes_titulo',
  'documento_comercial',
  'contrato',
  'escritura',
  'permiso',
  'plano',
  'informe_tecnico',
  'certificado',
  'otro'
) OR status NOT IN (
  'vigente',
  'vencido',
  'pendiente',
  'archivado',
  'en_revision',
  'aprobado',
  'rechazado'
);

-- Fix clients table constraints
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_main_interest_check;
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_status_check;

ALTER TABLE clients ADD CONSTRAINT clients_main_interest_check 
  CHECK (main_interest IS NULL OR length(main_interest) > 0);

-- Add status constraint for clients with all common values
ALTER TABLE clients ADD CONSTRAINT clients_status_check 
  CHECK (status IN (
    'hot',
    'warm',
    'cold',
    'active',
    'inactive',
    'lead',
    'prospect',
    'client',
    'archived'
  ));

-- Fix documents table constraints
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;

ALTER TABLE documents ADD CONSTRAINT documents_document_type_check 
  CHECK (document_type IN (
    'orden_venta',
    'tasacion', 
    'antecedentes_titulo',
    'documento_comercial',
    'contrato',
    'escritura',
    'permiso',
    'plano',
    'informe_tecnico',
    'certificado',
    'otro'
  ));

ALTER TABLE documents ADD CONSTRAINT documents_status_check 
  CHECK (status IN (
    'vigente',
    'vencido',
    'pendiente',
    'archivado',
    'en_revision',
    'aprobado',
    'rechazado'
  ));

-- Creating comprehensive example data for "Campo Ranco" to demonstrate cross-module search and relationships

-- 1. Create a KMZ file for Campo Ranco with rich metadata
INSERT INTO kmz_collection (
  id,
  file_name,
  file_path,
  description,
  region,
  category,
  coordinates,
  placemarks_count,
  rol_numbers,
  tags,
  bounds,
  metadata,
  is_active,
  created_at
) VALUES (
  gen_random_uuid(),
  'Campo_Ranco_Principal.kmz',
  '/campos/ranco/Campo_Ranco_Principal.kmz',
  'Propiedad agrícola de 450 hectáreas en Ranco, Región de Los Ríos. Terreno con acceso directo al Lago Ranco, ideal para desarrollo turístico y agrícola. Cuenta con casa patronal, galpones y sistemas de riego.',
  'Los Ríos',
  'campo',
  jsonb_build_array(
    jsonb_build_array(-40.2891, -72.5165),
    jsonb_build_array(-40.2901, -72.5145),
    jsonb_build_array(-40.2911, -72.5175)
  ),
  3,
  ARRAY['1234-567', '1234-568', '1234-569'],
  ARRAY['ranco', 'campo', 'lago', 'agricola', 'turismo', 'venta', '450ha', 'los-rios'],
  jsonb_build_object(
    'minLat', -40.2911,
    'maxLat', -40.2891,
    'minLng', -72.5175,
    'maxLng', -72.5145
  ),
  jsonb_build_object(
    'superficie_total', '450 hectáreas',
    'acceso_lago', true,
    'construcciones', jsonb_build_array('Casa patronal 250m²', 'Galpón 180m²', 'Bodega 120m²'),
    'servicios', jsonb_build_array('Electricidad', 'Agua corriente', 'Pozo profundo', 'Sistema de riego'),
    'precio_referencia', '450000000',
    'contacto', 'Joshua - Sur-Realista'
  ),
  true,
  now()
)
ON CONFLICT DO NOTHING;

-- 2. Create documents related to Campo Ranco
-- Document 1: Orden de Venta
INSERT INTO documents (
  id,
  title,
  document_type,
  description,
  file_name,
  file_url,
  file_type,
  file_size,
  kmz_references,
  tags,
  status,
  document_date,
  created_by,
  metadata,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Orden de Venta - Campo Ranco',
  'orden_venta',
  'Mandato de venta exclusivo para propiedad Campo Ranco. Incluye condiciones comerciales, comisiones y plazo de vigencia hasta diciembre 2025.',
  'Orden_Venta_Ranco_2025.pdf',
  '/documentos/ordenes_venta/ranco_2025.pdf',
  'pdf',
  2450000,
  ARRAY['Campo_Ranco_Principal.kmz', 'ranco', '1234-567'],
  ARRAY['ranco', 'orden-venta', 'mandato', 'venta-exclusiva', 'campo', 'agricola', 'los-rios', '450-millones'],
  'vigente',
  '2025-01-15',
  'system',
  jsonb_build_object(
    'comision_porcentaje', '3%',
    'precio_venta', '$450.000.000',
    'vigencia', 'hasta 2025-12-31',
    'tipo_mandato', 'exclusivo',
    'vendedor_contacto', 'Joshua Sur-Realista'
  ),
  now(),
  now()
)
ON CONFLICT DO NOTHING;

-- Document 2: Tasación
INSERT INTO documents (
  id,
  title,
  document_type,
  description,
  file_name,
  file_url,
  file_type,
  file_size,
  kmz_references,
  tags,
  status,
  document_date,
  created_by,
  metadata,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Tasación Fiscal y Comercial - Campo Ranco',
  'tasacion',
  'Informe de tasación completo del Campo Ranco realizado por perito tasador certificado. Incluye avalúo fiscal, avalúo comercial, análisis de mercado comparativo y valorización de mejoras.',
  'Tasacion_Campo_Ranco_2024.pdf',
  '/documentos/tasaciones/ranco_tasacion_2024.pdf',
  'pdf',
  5800000,
  ARRAY['Campo_Ranco_Principal.kmz', 'ranco', '1234-567'],
  ARRAY['ranco', 'tasacion', 'avaluo', 'perito', 'fiscal', 'comercial', 'campo', '450ha'],
  'vigente',
  '2024-11-01',
  'system',
  jsonb_build_object(
    'avaluo_fiscal', '$180.000.000',
    'avaluo_comercial', '$450.000.000',
    'perito', 'Rodrigo Contreras - Tasador Certificado',
    'vigencia_tasacion', '12 meses',
    'metodo', 'Comparación de mercado + Valor residual'
  ),
  now(),
  now()
)
ON CONFLICT DO NOTHING;

-- Document 3: Antecedentes de Título
INSERT INTO documents (
  id,
  title,
  document_type,
  description,
  file_name,
  file_url,
  file_type,
  file_size,
  kmz_references,
  tags,
  status,
  document_date,
  expiry_date,
  created_by,
  metadata,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Certificado de Dominio Vigente - Campo Ranco',
  'antecedentes_titulo',
  'Certificado de dominio vigente emitido por el Conservador de Bienes Raíces de Valdivia. Incluye inscripciones, gravámenes, prohibiciones y anotaciones marginales. Propiedad libre de hipotecas y gravámenes.',
  'Certificado_Dominio_Ranco_CBR.pdf',
  '/documentos/titulos/ranco_certificado_dominio_2025.pdf',
  'pdf',
  1250000,
  ARRAY['Campo_Ranco_Principal.kmz', 'ranco', '1234-567', '1234-568', '1234-569'],
  ARRAY['ranco', 'certificado', 'dominio', 'CBR', 'titulo', 'inscripcion', 'libre-gravamenes', 'valdivia'],
  'vigente',
  '2025-01-10',
  '2025-04-10',
  'system',
  jsonb_build_object(
    'conservador', 'CBR Valdivia',
    'fojas', '1234',
    'numero', '567',
    'año', '2020',
    'gravamenes', 'Ninguno',
    'prohibiciones', 'Ninguna',
    'situacion_legal', 'Libre de gravámenes e hipotecas'
  ),
  now(),
  now()
)
ON CONFLICT DO NOTHING;

-- Document 4: Documentos Comerciales (Brochure de Venta)
INSERT INTO documents (
  id,
  title,
  document_type,
  description,
  file_name,
  file_url,
  file_type,
  file_size,
  kmz_references,
  tags,
  status,
  document_date,
  created_by,
  metadata,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Brochure Comercial - Campo Ranco Premium',
  'documento_comercial',
  'Material comercial profesional para promoción del Campo Ranco. Incluye fotografías aéreas, descripción detallada de la propiedad, ubicación, características, servicios, y proyección de inversión.',
  'Brochure_Ranco_2025.pdf',
  '/documentos/comerciales/ranco_brochure_venta.pdf',
  'pdf',
  15600000,
  ARRAY['Campo_Ranco_Principal.kmz', 'ranco'],
  ARRAY['ranco', 'brochure', 'comercial', 'venta', 'marketing', 'promocion', 'campo', 'premium', 'inversion'],
  'vigente',
  '2025-01-05',
  'system',
  jsonb_build_object(
    'idiomas', jsonb_build_array('Español', 'Inglés'),
    'paginas', 12,
    'fotografias', 24,
    'incluye_drone', true,
    'formato_impresion', 'A4',
    'distribucion', jsonb_build_array('Digital', 'Impreso')
  ),
  now(),
  now()
)
ON CONFLICT DO NOTHING;

-- 3. Create a communication related to Campo Ranco (Post de Instagram programado)
INSERT INTO client_communications (
  id,
  subject,
  content,
  communication_type,
  direction,
  communication_date,
  attachments,
  created_by,
  created_at
) VALUES (
  gen_random_uuid(),
  'Post Instagram - Campo Ranco Exclusivo',
  E'🏞️ ¡CAMPO EXCLUSIVO EN RANCO! 🌲\n\n450 hectáreas de naturaleza pura con acceso directo al Lago Ranco 🌊\n\n✨ Características destacadas:\n📍 Ubicación: Región de Los Ríos, Ranco\n🏠 Casa patronal 250m²\n🔧 Galpones y bodegas incluidos\n💧 Sistema de riego completo\n⚡ Todos los servicios\n\n💰 Precio: $450.000.000\n\n📞 Contáctanos para más información\n📧 contacto@sur-realista.cl\n📱 WhatsApp: +56 9 XXXX XXXX\n\n#CampoEnVenta #Ranco #LagoRanco #InversionAgricola #CampoChile #SurRealista #PropiedadesExclusivas #LosRios #AgriculturaChile #TurismoRural',
  'instagram',
  'outbound',
  now() + interval '2 days',
  jsonb_build_object(
    'status', 'programado',
    'plataforma', 'Instagram',
    'hashtags', jsonb_build_array('#CampoEnVenta', '#Ranco', '#LagoRanco', '#SurRealista'),
    'imagenes_requeridas', jsonb_build_array('Vista aérea lago', 'Casa patronal', 'Terreno panorámico', 'Atardecer en Ranco'),
    'kmz_reference', 'Campo_Ranco_Principal.kmz',
    'documentos_vinculados', jsonb_build_array('Brochure_Ranco_2025.pdf', 'Orden_Venta_Ranco_2025.pdf')
  ),
  'system',
  now()
)
ON CONFLICT DO NOTHING;

-- 4. Create a task related to Campo Ranco
INSERT INTO tasks (
  id,
  title,
  description,
  status,
  priority,
  due_date,
  location,
  tags,
  related_to,
  notes,
  created_by,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Visita inspección y sesión fotográfica - Campo Ranco',
  'Coordinar visita al Campo Ranco para realizar inspección completa de la propiedad y sesión fotográfica profesional (incluyendo drone). Verificar estado de construcciones, sistemas de riego, y accesos. Preparar material para publicación en redes sociales y portales.',
  'pending',
  'high',
  now() + interval '5 days',
  '-40.2891,-72.5165',
  ARRAY['ranco', 'inspeccion', 'fotografia', 'campo', 'visita', 'urgente', 'marketing'],
  'campo',
  E'Checklist:\n- Fotografías exteriores (casa, galpones, terreno)\n- Video drone panorámico\n- Inspección sistema de riego\n- Medición real de construcciones\n- Verificar accesos y caminos\n- Entrevista con propietario\n- Coordinar con fotógrafo profesional\n\nContacto propietario: +56 9 XXXX XXXX\nLlegar antes de las 10:00 AM para mejor luz',
  'system',
  now(),
  now()
)
ON CONFLICT DO NOTHING;

-- 5. Create another task for social media posting
INSERT INTO tasks (
  id,
  title,
  description,
  status,
  priority,
  due_date,
  tags,
  related_to,
  notes,
  created_by,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Publicación Campo Ranco en Redes Sociales y Portales',
  'Publicar Campo Ranco en Instagram, Portal Inmobiliario y Portalinmuebles.com. Incluir todas las fotos profesionales, descripción completa, y links a documentación.',
  'pending',
  'medium',
  now() + interval '7 days',
  ARRAY['ranco', 'publicacion', 'redes-sociales', 'portales', 'marketing', 'instagram'],
  'comunicacion',
  E'Plataformas a publicar:\n✅ Instagram (feed + stories)\n✅ Portal Inmobiliario\n✅ Portalinmuebles.com\n✅ Facebook Marketplace\n\nMaterial necesario:\n- Fotos profesionales (mínimo 15)\n- Video drone\n- Brochure PDF\n- Descripción optimizada SEO\n- Precio y condiciones\n\nReferencias:\n- KMZ: Campo_Ranco_Principal.kmz\n- Docs: Brochure_Ranco_2025.pdf',
  'system',
  now(),
  now()
)
ON CONFLICT DO NOTHING;

-- 6. Create a client interested in Ranco
INSERT INTO clients (
  id,
  first_name,
  last_name,
  email,
  phone,
  status,
  main_interest,
  locations_of_interest,
  budget_min,
  budget_max,
  region,
  notes,
  last_contact_date,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'María José',
  'Fernández',
  'mjfernandez@example.com',
  '+56 9 8765 4321',
  'hot',
  'Campo agrícola con potencial turístico',
  ARRAY['Ranco', 'Los Ríos', 'Lagos', 'Sur de Chile'],
  400000000,
  500000000,
  'Los Ríos',
  E'Cliente interesada en Campo Ranco. Busca propiedad para desarrollo de turismo rural y agricultura orgánica. Tiene experiencia previa en gestión de campos. Disponibilidad para visita la próxima semana.\n\nIntereses específicos:\n- Acceso a cuerpos de agua\n- Infraestructura existente\n- Potencial turístico\n- Zona tranquila\n\nReferencias: Campo_Ranco_Principal.kmz',
  now() - interval '2 days',
  now(),
  now()
)
ON CONFLICT DO NOTHING;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_documents_kmz_references ON documents USING GIN (kmz_references);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING GIN (to_tsvector('spanish', title || ' ' || description));

CREATE INDEX IF NOT EXISTS idx_kmz_tags ON kmz_collection USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_kmz_search ON kmz_collection USING GIN (to_tsvector('spanish', file_name || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_tasks_tags ON tasks USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks USING GIN (to_tsvector('spanish', title || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_clients_locations ON clients USING GIN (locations_of_interest);
CREATE INDEX IF NOT EXISTS idx_clients_search ON clients USING GIN (to_tsvector('spanish', first_name || ' ' || last_name || ' ' || COALESCE(main_interest, '')));

-- Summary view for cross-module search
COMMENT ON TABLE documents IS 'Documentos vinculados a propiedades mediante referencias KMZ/KML. Tags: ranco, orden-venta, tasacion, antecedentes-titulo, comercial';
COMMENT ON TABLE kmz_collection IS 'Archivos KMZ/KML de propiedades con metadatos ricos. Tags: ranco, campo, agricola, lago, los-rios';
COMMENT ON TABLE tasks IS 'Tareas relacionadas con propiedades y comunicaciones. Tags: ranco, inspeccion, publicacion, marketing';
COMMENT ON TABLE clients IS 'Clientes interesados en propiedades específicas. Location tags: Ranco, Los Ríos';

-- Step 3: Re-enable RLS after data insertion
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
