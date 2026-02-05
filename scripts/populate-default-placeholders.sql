-- Add default placeholders to existing folders that don't have any
INSERT INTO folder_placeholders (folder_id, placeholder_name, placeholder_label, sort_order, created_by)
SELECT 
  f.id,
  placeholder_data.placeholder_name,
  placeholder_data.placeholder_label,
  placeholder_data.sort_order,
  f.created_by
FROM folders f
CROSS JOIN (
  VALUES 
    ('propuesta-comercial'::VARCHAR, 'Propuesta Comercial'::VARCHAR, 0::INTEGER),
    ('presentacion'::VARCHAR, 'Presentacion'::VARCHAR, 1::INTEGER),
    ('kmz'::VARCHAR, 'KMZ'::VARCHAR, 2::INTEGER)
) AS placeholder_data(placeholder_name, placeholder_label, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM folder_placeholders fp 
  WHERE fp.folder_id = f.id
)
ON CONFLICT (folder_id, placeholder_name) DO NOTHING;

COMMENT ON TABLE folder_placeholders IS 'Updated: Now includes default placeholders (Propuesta Comercial, Presentacion, KMZ) for all folders';
