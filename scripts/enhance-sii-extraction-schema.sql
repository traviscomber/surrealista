-- Add comprehensive SII property data fields to match the detailed property information
ALTER TABLE sii_coordinate_extractions 
ADD COLUMN IF NOT EXISTS rol_predial VARCHAR(50),
ADD COLUMN IF NOT EXISTS direccion_propiedad TEXT,
ADD COLUMN IF NOT EXISTS ubicacion VARCHAR(20),
ADD COLUMN IF NOT EXISTS destino VARCHAR(100),
ADD COLUMN IF NOT EXISTS reavaluo VARCHAR(50),
ADD COLUMN IF NOT EXISTS area_homogenea VARCHAR(20),
ADD COLUMN IF NOT EXISTS avaluo_total BIGINT,
ADD COLUMN IF NOT EXISTS avaluo_afecto BIGINT,
ADD COLUMN IF NOT EXISTS avaluo_exento BIGINT,
ADD COLUMN IF NOT EXISTS periodo_avaluo VARCHAR(50);

-- Create index on rol_predial for faster searches
CREATE INDEX IF NOT EXISTS idx_sii_extractions_rol_predial ON sii_coordinate_extractions(rol_predial);

-- Add comment explaining the comprehensive data structure
COMMENT ON TABLE sii_coordinate_extractions IS 'Comprehensive SII property data including Catastro Legal and Catastro Valorizado information';
COMMENT ON COLUMN sii_coordinate_extractions.rol_predial IS 'ROL Predial in format MANZANA-PREDIO';
COMMENT ON COLUMN sii_coordinate_extractions.direccion_propiedad IS 'Property name or address from SII';
COMMENT ON COLUMN sii_coordinate_extractions.ubicacion IS 'Location type: RURAL or URBANO';
COMMENT ON COLUMN sii_coordinate_extractions.destino IS 'Property destination/use type';
COMMENT ON COLUMN sii_coordinate_extractions.reavaluo IS 'Revaluation category and year';
COMMENT ON COLUMN sii_coordinate_extractions.area_homogenea IS 'Homogeneous area code';
COMMENT ON COLUMN sii_coordinate_extractions.avaluo_total IS 'Total tax valuation in CLP';
COMMENT ON COLUMN sii_coordinate_extractions.avaluo_afecto IS 'Taxable valuation in CLP';
COMMENT ON COLUMN sii_coordinate_extractions.avaluo_exento IS 'Tax-exempt valuation in CLP';
