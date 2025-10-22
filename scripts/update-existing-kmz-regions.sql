-- Update existing KMZ records with region information based on their coordinates
-- This script analyzes the coordinates of each KMZ file and assigns the appropriate Chilean region

DO $$
DECLARE
    kmz_record RECORD;
    first_coord JSONB;
    lat NUMERIC;
    lng NUMERIC;
    detected_region TEXT;
BEGIN
    -- Loop through all KMZ records that don't have a region set
    FOR kmz_record IN 
        SELECT id, file_name, coordinates, bounds
        FROM kmz_collection
        WHERE region IS NULL OR region = '' OR region = 'Offline'
    LOOP
        -- Try to extract coordinates from the first coordinate in the array
        IF kmz_record.coordinates IS NOT NULL AND jsonb_array_length(kmz_record.coordinates) > 0 THEN
            first_coord := kmz_record.coordinates->0;
            
            -- Handle different coordinate formats
            IF jsonb_typeof(first_coord) = 'array' AND jsonb_array_length(first_coord) >= 2 THEN
                -- Format: [[lng, lat, ...], ...]
                lng := (first_coord->0)::numeric;
                lat := (first_coord->1)::numeric;
            ELSIF jsonb_typeof(first_coord) = 'object' THEN
                -- Format: [{lat: ..., lng: ...}, ...]
                lat := (first_coord->>'lat')::numeric;
                lng := (first_coord->>'lng')::numeric;
            END IF;
            
            -- Detect region based on latitude (approximate Chilean regions)
            IF lat IS NOT NULL THEN
                IF lat >= -18.5 AND lat <= -17.5 THEN
                    detected_region := 'Arica y Parinacota';
                ELSIF lat >= -21.5 AND lat <= -18.5 THEN
                    detected_region := 'Tarapacá';
                ELSIF lat >= -26.0 AND lat <= -21.5 THEN
                    detected_region := 'Antofagasta';
                ELSIF lat >= -29.0 AND lat <= -26.0 THEN
                    detected_region := 'Atacama';
                ELSIF lat >= -32.0 AND lat <= -29.0 THEN
                    detected_region := 'Coquimbo';
                ELSIF lat >= -33.7 AND lat <= -32.0 THEN
                    detected_region := 'Valparaíso';
                ELSIF lat >= -34.5 AND lat <= -33.0 THEN
                    detected_region := 'Metropolitana';
                ELSIF lat >= -35.5 AND lat <= -34.0 THEN
                    detected_region := 'O''Higgins';
                ELSIF lat >= -36.5 AND lat <= -35.0 THEN
                    detected_region := 'Maule';
                ELSIF lat >= -37.5 AND lat <= -36.0 THEN
                    detected_region := 'Ñuble';
                ELSIF lat >= -38.8 AND lat <= -37.0 THEN
                    detected_region := 'Biobío';
                ELSIF lat >= -39.8 AND lat <= -38.5 THEN
                    detected_region := 'La Araucanía';
                ELSIF lat >= -41.6 AND lat <= -39.5 THEN
                    detected_region := 'Los Ríos';
                ELSIF lat >= -44.0 AND lat <= -41.0 THEN
                    detected_region := 'Los Lagos';
                ELSIF lat >= -47.0 AND lat <= -43.5 THEN
                    detected_region := 'Aysén';
                ELSIF lat >= -56.0 AND lat <= -47.0 THEN
                    detected_region := 'Magallanes';
                ELSE
                    detected_region := 'Sin Región';
                END IF;
                
                -- Update the record with the detected region
                UPDATE kmz_collection
                SET region = detected_region,
                    updated_at = NOW()
                WHERE id = kmz_record.id;
                
                RAISE NOTICE 'Updated % (lat: %) with region: %', kmz_record.file_name, lat, detected_region;
            END IF;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Region update complete!';
END $$;

-- Show summary of regions
SELECT 
    COALESCE(region, 'Sin Región') as region,
    COUNT(*) as file_count,
    array_agg(file_name) as files
FROM kmz_collection
GROUP BY region
ORDER BY region;
