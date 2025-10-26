-- ============================================
-- SISTEMA DE REPORTES V2
-- Script completo y limpio sin dependencias
-- ============================================

-- Eliminar tablas existentes si hay conflictos
DROP TABLE IF EXISTS property_reports CASCADE;
DROP TABLE IF EXISTS report_templates CASCADE;

-- Tabla de reportes generados
CREATE TABLE property_reports (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT,
    report_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    generated_by BIGINT,
    file_url TEXT,
    file_size INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Tabla de plantillas de reportes
CREATE TABLE report_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_property_reports_property_id ON property_reports(property_id);
CREATE INDEX idx_property_reports_generated_by ON property_reports(generated_by);
CREATE INDEX idx_property_reports_status ON property_reports(status);
CREATE INDEX idx_property_reports_created_at ON property_reports(created_at DESC);
CREATE INDEX idx_report_templates_type ON report_templates(template_type);
CREATE INDEX idx_report_templates_active ON report_templates(is_active);

-- Función para crear reporte
CREATE OR REPLACE FUNCTION create_property_report(
    p_property_id BIGINT,
    p_report_type VARCHAR,
    p_title VARCHAR,
    p_generated_by BIGINT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT AS $$
DECLARE
    new_report_id BIGINT;
BEGIN
    INSERT INTO property_reports (
        property_id, report_type, title, generated_by, metadata, status
    )
    VALUES (
        p_property_id, p_report_type, p_title, p_generated_by, p_metadata, 'pending'
    )
    RETURNING id INTO new_report_id;
    
    RETURN new_report_id;
END;
$$ LANGUAGE plpgsql;

-- Función para completar reporte
CREATE OR REPLACE FUNCTION complete_property_report(
    p_report_id BIGINT,
    p_file_url TEXT,
    p_file_size INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE property_reports
    SET 
        status = 'completed',
        file_url = p_file_url,
        file_size = p_file_size,
        completed_at = NOW()
    WHERE id = p_report_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS
ALTER TABLE property_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own reports"
    ON property_reports FOR SELECT
    USING (generated_by = (SELECT id FROM users WHERE id = auth.uid()::bigint));

CREATE POLICY "Users can create reports"
    ON property_reports FOR INSERT
    WITH CHECK (generated_by = (SELECT id FROM users WHERE id = auth.uid()::bigint));

CREATE POLICY "Everyone can view active templates"
    ON report_templates FOR SELECT
    USING (is_active = TRUE);

-- Insertar plantillas por defecto
INSERT INTO report_templates (name, template_type, description, template_data) VALUES
('Reporte de Propiedad Estándar', 'property', 'Reporte completo con detalles de la propiedad', '{"sections": ["details", "images", "location", "pricing"]}'::jsonb),
('Reporte Financiero', 'financial', 'Análisis financiero de la propiedad', '{"sections": ["pricing", "taxes", "roi", "projections"]}'::jsonb),
('Reporte de Comparación', 'comparison', 'Comparación con propiedades similares', '{"sections": ["property", "comparables", "market"]}'::jsonb);
