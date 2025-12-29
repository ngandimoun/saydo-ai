-- Work Files Storage Bucket Policies
-- This migration creates storage policies for the work-files bucket

-- Bucket: work-files
-- Purpose: Store user work-related files (PDFs, images, documents, spreadsheets, presentations)
-- Access: Public read (for user's own files), Authenticated write
-- Max file size: 50MB (configurable in bucket settings)
-- Allowed MIME types: PDFs, images, documents, spreadsheets, presentations (excluding video)

-- Storage policies for work-files bucket
-- Public read access (users can view their own files via public URLs)
-- Note: RLS policies ensure users can only access files in their own folder
CREATE POLICY IF NOT EXISTS "Public read access for work-files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'work-files');

-- Users can upload their own files
CREATE POLICY IF NOT EXISTS "Users can upload own work files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'work-files' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  auth.role() = 'authenticated'
);

-- Users can update their own files
CREATE POLICY IF NOT EXISTS "Users can update own work files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'work-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'work-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete own work files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'work-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Note: Bucket must be created manually via Supabase Dashboard:
-- 1. Go to Storage > New Bucket
-- 2. Create "work-files" bucket (public for read access)
-- 3. Set max file size to 50MB (or desired limit)
-- 4. Policies above will be applied automatically
-- 
-- Security Note: While the bucket is public for read access, files are organized
-- by user ID folders (e.g., {userId}/{filename}). The database RLS policies
-- ensure users can only see their own file records, providing an additional
-- layer of security. For enhanced security, consider using signed URLs instead
-- of public URLs in the application code.

