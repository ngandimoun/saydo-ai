-- Storage policies for chat-images bucket
-- This allows users to upload and access their own chat images

-- Storage policies for chat-images bucket
-- Users can only access images in their own folder (organized by user_id)

-- Policy: Users can view own chat images
CREATE POLICY IF NOT EXISTS "Users can view own chat images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can upload own chat images
CREATE POLICY IF NOT EXISTS "Users can upload own chat images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update own chat images
CREATE POLICY IF NOT EXISTS "Users can update own chat images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'chat-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'chat-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete own chat images
CREATE POLICY IF NOT EXISTS "Users can delete own chat images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create the chat-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  false, -- Private bucket
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Note: Files should be organized as: {userId}/{timestamp}-{filename}

