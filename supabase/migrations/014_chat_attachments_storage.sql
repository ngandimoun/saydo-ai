-- Chat Attachments Storage Bucket Policies
-- This migration creates storage policies for the chat-attachments bucket

-- Bucket: chat-attachments
-- Purpose: Store files and voice messages uploaded in chat conversations
-- Access: Private (user-specific, signed URLs)
-- Max file size: 20MB (configurable in bucket settings)
-- Allowed MIME types: images, PDFs, documents, audio (excluding video)

-- Storage policies for chat-attachments bucket
-- Users can view their own chat attachments
CREATE POLICY IF NOT EXISTS "Users can view own chat attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can upload their own chat attachments
CREATE POLICY IF NOT EXISTS "Users can upload own chat attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  auth.role() = 'authenticated'
);

-- Users can update their own chat attachments
CREATE POLICY IF NOT EXISTS "Users can update own chat attachments"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own chat attachments
CREATE POLICY IF NOT EXISTS "Users can delete own chat attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Note: Bucket must be created manually via Supabase Dashboard:
-- 1. Go to Storage > New Bucket
-- 2. Create "chat-attachments" bucket (private)
-- 3. Set max file size to 20MB (or desired limit)
-- 4. Policies above will be applied automatically
-- 
-- Security Note: Files are organized by user ID folders (e.g., {userId}/{filename}).
-- The RLS policies ensure users can only access files in their own folder.
-- Voice messages are stored in {userId}/voice/{filename} subfolder.

