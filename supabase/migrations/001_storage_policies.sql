-- Storage policies for generated-images bucket
-- This allows public read access and authenticated write access

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to generated-images bucket
CREATE POLICY "Public read access for generated-images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'generated-images');

-- Policy: Allow authenticated users to upload to generated-images bucket
CREATE POLICY "Authenticated upload to generated-images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'generated-images' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to update files in generated-images bucket
CREATE POLICY "Authenticated update to generated-images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'generated-images' AND
  auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'generated-images' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to delete files in generated-images bucket
CREATE POLICY "Authenticated delete from generated-images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'generated-images' AND
  auth.role() = 'authenticated'
);

-- Note: For scripts using service role key, these policies are bypassed
-- Service role key has full access regardless of RLS policies






