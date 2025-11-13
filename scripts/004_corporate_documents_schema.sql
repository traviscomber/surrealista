-- Corporate Documents and Templates Schema
-- Creates tables for whitepaper generation and corporate document templates

-- Template definitions table
CREATE TABLE IF NOT EXISTS corporate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_type VARCHAR(50) NOT NULL, -- 'whitepaper', 'proposal', 'report', etc.
  slides JSONB NOT NULL, -- Array of slide definitions
  default_variables JSONB, -- Default placeholder values
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  is_active BOOLEAN DEFAULT true
);

-- Client brandbooks table
CREATE TABLE IF NOT EXISTS client_brandbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  logo_white_url TEXT,
  isotipo_url TEXT,
  isotipo_white_url TEXT,
  primary_color VARCHAR(7), -- Hex color
  secondary_color VARCHAR(7),
  accent_color VARCHAR(7),
  font_primary VARCHAR(100),
  font_secondary VARCHAR(100),
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated corporate documents table
CREATE TABLE IF NOT EXISTS generated_corporate_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES corporate_templates(id),
  brandbook_id UUID REFERENCES client_brandbooks(id),
  property_id UUID, -- Optional link to property
  document_name VARCHAR(255) NOT NULL,
  document_data JSONB NOT NULL, -- Filled variables and content
  pdf_url TEXT, -- Generated PDF URL
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'generated', 'published'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255)
);

-- Insert default whitepaper template
INSERT INTO corporate_templates (name, description, template_type, slides, default_variables, created_by) VALUES (
  'Whitepaper Sur Realista',
  'Template de whitepaper corporativo de 7 slides para presentación de propiedades',
  'whitepaper',
  '[
    {
      "slide_number": 1,
      "slide_type": "cover",
      "title": "Portada",
      "variables": ["property_name", "property_subtitle", "hero_image", "logo_white", "isotipo_white"],
      "layout": "hero_cover"
    },
    {
      "slide_number": 2,
      "slide_type": "property_details",
      "title": "Detalles de Propiedad",
      "variables": ["ubicacion", "superficie_total", "infraestructura", "agua_riego", "servicios", "polygon_image"],
      "layout": "dark_content"
    },
    {
      "slide_number": 3,
      "slide_type": "stats_overview",
      "title": "Vista General",
      "variables": ["superficie_total", "polygon_image_large"],
      "layout": "light_minimal"
    },
    {
      "slide_number": 4,
      "slide_type": "location_proximity",
      "title": "Ubicación y Proximidad",
      "variables": ["comuna", "region", "provincia", "poblacion", "poblados_cercanos", "location_map"],
      "layout": "location_info"
    },
    {
      "slide_number": 5,
      "slide_type": "photo_gallery",
      "title": "Fotografías",
      "variables": ["photo_1", "photo_2"],
      "layout": "two_column_gallery"
    },
    {
      "slide_number": 6,
      "slide_type": "back_cover",
      "title": "Contraportada",
      "variables": ["cover_image", "contact_name", "contact_email", "contact_phone", "contact_website", "commission"],
      "layout": "contact_footer"
    },
    {
      "slide_number": 7,
      "slide_type": "visual_tour",
      "title": "Recorrido Visual",
      "variables": ["tour_image", "tour_title"],
      "layout": "fullscreen_visual"
    }
  ]'::jsonb,
  '{
    "property_name": "Nombre de la Propiedad",
    "property_subtitle": "Subtítulo descriptivo",
    "superficie_total": "10,67",
    "ubicacion": "Comuna, Región",
    "commission": "2% + IVA"
  }'::jsonb,
  'system'
) ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_corporate_templates_type ON corporate_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_client_brandbooks_client ON client_brandbooks(client_id);
CREATE INDEX IF NOT EXISTS idx_generated_docs_template ON generated_corporate_documents(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_docs_brandbook ON generated_corporate_documents(brandbook_id);
CREATE INDEX IF NOT EXISTS idx_generated_docs_status ON generated_corporate_documents(status);

COMMENT ON TABLE corporate_templates IS 'Plantillas de documentos corporativos reutilizables';
COMMENT ON TABLE client_brandbooks IS 'Brandbooks de clientes con logos, colores y tipografía';
COMMENT ON TABLE generated_corporate_documents IS 'Documentos corporativos generados a partir de templates';
