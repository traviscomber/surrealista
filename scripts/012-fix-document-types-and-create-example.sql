-- Script para arreglar constraints y crear datos de ejemplo para Campo Ranco

-- Usando DROP CONSTRAINT IF EXISTS en lugar de bloque condicional
-- Parte 1: Arreglar constraints de la tabla documents (más robusto)

-- Eliminar constraints antiguos si existen
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_status_check;

-- Agregar nuevos constraints con valores en español
ALTER TABLE documents 
  ADD CONSTRAINT documents_document_type_check 
  CHECK (document_type IN (
    'Orden de Venta',
    'Tasacion',
    'Antecedentes de Titulo',
    'Documento Comercial',
    'Escritura',
    'Plano',
    'Certificado',
    'Contrato',
    'Mandato',
    'Info del Campo',
    'Estudio de Suelo',
    'Certificado de Avaluo',
    'Informe Tecnico',
    'Permiso Municipal',
    'Certificado Vigencia',
    'Otro'
  ));

ALTER TABLE documents 
  ADD CONSTRAINT documents_status_check 
  CHECK (status IN (
    'activo',
    'inactivo', 
    'pendiente',
    'archivado',
    'vencido',
    'en_revision',
    'aprobado',
    'rechazado'
  ));

-- Parte 2: Crear datos de ejemplo para Campo Ranco con documentos vinculados

DO $$ 
DECLARE
  v_kmz_id UUID;
  v_doc_orden_venta_id UUID := 'a1b2c3d4-e5f6-47a8-89ab-0c1d2e3f4a5b'::uuid;
  v_doc_tasacion_id UUID := 'b2c3d4e5-f6a7-48b9-9abc-1d2e3f4a5b6c'::uuid;
  v_doc_antecedentes_id UUID := 'c3d4e5f6-a7b8-49ca-abcd-2e3f4a5b6c7d'::uuid;
BEGIN

  -- Verificar si ya existe un KMZ de ejemplo para Ranco
  SELECT id INTO v_kmz_id 
  FROM kmz_collection 
  WHERE file_name ILIKE '%ranco%' 
  LIMIT 1;

  -- Si no existe, crear uno de ejemplo
  IF v_kmz_id IS NULL THEN
    v_kmz_id := 'd4e5f6a7-b8c9-4adb-bcde-3f4a5b6c7d8e'::uuid;
    
    INSERT INTO kmz_collection (
      id,
      file_name,
      file_path,
      description,
      region,
      category,
      tags,
      rol_numbers,
      coordinates,
      placemarks_count,
      is_active,
      created_at
    ) VALUES (
      v_kmz_id,
      'Campo_Ranco_Completo.kmz',
      '/campos/ranco/Campo_Ranco_Completo.kmz',
      'Campo Ranco - 450 hectáreas agrícolas en la región de Los Ríos',
      'Los Ríos',
      'agricola',
      ARRAY['ranco', 'agricola', 'forestal', 'ganaderia'],
      ARRAY['ROL-001-2024', 'ROL-002-2024'],
      '{"type": "Point", "coordinates": [-72.5, -40.3]}'::jsonb,
      15,
      true,
      NOW()
    );
    
    RAISE NOTICE 'KMZ de ejemplo creado para Campo Ranco: %', v_kmz_id;
  ELSE
    RAISE NOTICE 'KMZ existente encontrado para Ranco: %', v_kmz_id;
  END IF;

  -- Documento 1: Orden de Venta
  INSERT INTO documents (
    id,
    title,
    description,
    document_type,
    file_url,
    file_name,
    file_type,
    file_size,
    property_ids,
    kmz_references,
    tags,
    document_date,
    expiry_date,
    version,
    status,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    v_doc_orden_venta_id,
    'Orden de Venta - Campo Ranco',
    'Orden de venta exclusiva para Campo Ranco de 450 hectáreas. Incluye mandato exclusivo por 180 días, comisión 3%, precio UF 45.000.',
    'Orden de Venta',
    'https://storage.surealista.cl/documentos/orden_venta_campo_ranco_2024.pdf',
    'Orden_Venta_Campo_Ranco_2024.pdf',
    'pdf',
    2458000,
    ARRAY[v_kmz_id],
    ARRAY['ROL-001-2024'],
    ARRAY['ranco', 'orden_venta', 'mandato', 'exclusivo', 'campo'],
    '2024-11-01'::date,
    '2025-05-01'::date,
    1,
    'activo',
    jsonb_build_object(
      'tipo_mandato', 'Exclusivo',
      'duracion_dias', 180,
      'comision_porcentaje', 3,
      'precio_venta_uf', 45000,
      'propietario', 'Familia Fernández',
      'agente_responsable', 'Joshua Sur-Realista',
      'condiciones_especiales', ARRAY['Incluye todos los animales (50 vacunos)', 'Maquinaria agrícola incluida', 'Reserva de agua']
    ),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Documento Orden de Venta creado';

  -- Documento 2: Tasación
  INSERT INTO documents (
    id,
    title,
    description,
    document_type,
    file_url,
    file_name,
    file_type,
    file_size,
    property_ids,
    kmz_references,
    tags,
    document_date,
    expiry_date,
    version,
    status,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    v_doc_tasacion_id,
    'Tasación Campo Ranco 2024',
    'Tasación comercial completa del Campo Ranco realizada por tasador certificado. Incluye valorización de tierra, construcciones, mejoras y derechos de agua.',
    'Tasacion',
    'https://storage.surealista.cl/documentos/tasacion_campo_ranco_2024.pdf',
    'Tasacion_Campo_Ranco_2024.pdf',
    'pdf',
    5892000,
    ARRAY[v_kmz_id],
    ARRAY['ROL-001-2024', 'ROL-002-2024'],
    ARRAY['ranco', 'tasacion', 'avaluo', 'certificado'],
    '2024-10-15'::date,
    '2025-10-15'::date,
    1,
    'activo',
    jsonb_build_object(
      'tasador', 'Luis Herrera & Asociados',
      'valor_tasacion_uf', 48000,
      'valor_tierra_uf', 35000,
      'valor_construcciones_uf', 8000,
      'valor_mejoras_uf', 5000,
      'derechos_agua', 'Sí - 15 acciones',
      'metodo_valuacion', 'Comparación de mercado y capitalización de rentas',
      'superficie_productiva_ha', 420,
      'superficie_bosque_ha', 30
    ),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Documento Tasación creado';

  -- Documento 3: Antecedentes de Título
  INSERT INTO documents (
    id,
    title,
    description,
    document_type,
    file_url,
    file_name,
    file_type,
    file_size,
    property_ids,
    kmz_references,
    tags,
    document_date,
    version,
    status,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    v_doc_antecedentes_id,
    'Antecedentes de Título - Campo Ranco',
    'Estudio completo de títulos del Campo Ranco. Incluye inscripciones, gravámenes, hipotecas y situación registral actualizada.',
    'Antecedentes de Titulo',
    'https://storage.surealista.cl/documentos/antecedentes_titulo_ranco_2024.pdf',
    'Antecedentes_Titulo_Ranco_2024.pdf',
    'pdf',
    3245000,
    ARRAY[v_kmz_id],
    ARRAY['ROL-001-2024', 'ROL-002-2024'],
    ARRAY['ranco', 'titulo', 'escritura', 'legal', 'inscripcion'],
    '2024-10-01'::date,
    1,
    'activo',
    jsonb_build_object(
      'estudio_realizado_por', 'Estudio Jurídico Campos & Asociados',
      'conservador', 'CBR Río Bueno',
      'fojas', 'F. 2341 v.',
      'numero_inscripcion', '3456',
      'año_inscripcion', 1998,
      'propietario_inscrito', 'Familia Fernández López',
      'gravamenes', 'Sin gravámenes',
      'hipotecas', 'Ninguna',
      'prohibiciones', 'Ninguna',
      'litigios', 'Ninguno',
      'observaciones', 'Títulos saneados y al día. Apto para compraventa.'
    ),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Documento Antecedentes de Título creado';

  RAISE NOTICE '=== Datos de ejemplo creados exitosamente ===';
  RAISE NOTICE 'KMZ ID: %', v_kmz_id;
  RAISE NOTICE 'Documentos vinculados: 3';
  RAISE NOTICE 'Tags para búsqueda: ranco, agricola, orden_venta, tasacion, titulo';
  RAISE NOTICE 'Puede buscar "ranco" en la búsqueda unificada para ver toda la información relacionada';

END $$;
