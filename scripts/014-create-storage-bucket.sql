-- Create the documents storage bucket in Supabase Storage
-- This bucket will store PDF, DOC, DOCX, KMZ, and KML files

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.google-earth.kmz',
    'application/vnd.google-earth.kml+xml',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.google-earth.kmz',
    'application/vnd.google-earth.kml+xml',
    'application/octet-stream'
  ];

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow public uploads to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to documents bucket" ON storage.objects;

-- Create storage policy to allow public uploads
CREATE POLICY "Allow public uploads to documents bucket"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'documents');

-- Create storage policy to allow public reads
CREATE POLICY "Allow public reads from documents bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Create storage policy to allow authenticated deletes
CREATE POLICY "Allow authenticated deletes from documents bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- Create storage policy to allow authenticated updates
CREATE POLICY "Allow authenticated updates to documents bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');
