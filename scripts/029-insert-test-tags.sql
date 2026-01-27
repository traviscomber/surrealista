-- Insert test tags
INSERT INTO tags (name) VALUES 
('arándanos'),
('volcán'),
('viña'),
('frutilla'),
('hortalizas')
ON CONFLICT (name) DO NOTHING;

-- Get tag IDs
WITH tag_ids AS (
  SELECT id, name FROM tags WHERE name IN ('arándanos', 'volcán', 'viña', 'frutilla', 'hortalizas')
)
-- Link some clients to tags (finding first few clients and linking them)
INSERT INTO client_tags (client_id, tag_id)
SELECT 
  c.id,
  t.id
FROM (
  SELECT id FROM clients ORDER BY created_at DESC LIMIT 5
) c
CROSS JOIN tag_ids t
WHERE t.name IN ('arándanos', 'viña')
ON CONFLICT (client_id, tag_id) DO NOTHING;

-- Link some KMZ files to tags
WITH tag_ids AS (
  SELECT id, name FROM tags WHERE name IN ('arándanos', 'volcán', 'viña', 'frutilla', 'hortalizas')
)
INSERT INTO kmz_tags (kmz_id, tag_id)
SELECT 
  k.id,
  t.id
FROM (
  SELECT id FROM kmz_collection ORDER BY created_at DESC LIMIT 8
) k
CROSS JOIN tag_ids t
WHERE t.name IN ('arándanos', 'volcán', 'frutilla')
ON CONFLICT (kmz_id, tag_id) DO NOTHING;

-- Link some communications to tags
WITH tag_ids AS (
  SELECT id, name FROM tags WHERE name IN ('arándanos', 'volcán', 'viña')
)
INSERT INTO communication_tags (communication_id, tag_id)
SELECT 
  c.id,
  t.id
FROM (
  SELECT id FROM client_communications ORDER BY created_at DESC LIMIT 6
) c
CROSS JOIN tag_ids t
ON CONFLICT (communication_id, tag_id) DO NOTHING;

-- Link some tasks to tags
WITH tag_ids AS (
  SELECT id, name FROM tags WHERE name IN ('arándanos', 'volcán', 'hortalizas')
)
INSERT INTO task_tags (task_id, tag_id)
SELECT 
  t.id,
  tg.id
FROM (
  SELECT id FROM tasks ORDER BY created_at DESC LIMIT 4
) t
CROSS JOIN tag_ids tg
ON CONFLICT (task_id, tag_id) DO NOTHING;
