-- Create Supabase Storage Buckets for Infrastructure
-- This migration creates the storage buckets needed for audio and voice recordings

-- Note: Storage buckets are created via Supabase Dashboard or API
-- This SQL file documents the required buckets and policies

-- Bucket: calm-audio
-- Purpose: Store meditation/sleep audio files for Calm Zone
-- Access: Public read, authenticated write
-- Max file size: 100MB
-- Allowed MIME types: audio/mpeg, audio/ogg, audio/webm

-- Storage policies for calm-audio bucket
CREATE POLICY IF NOT EXISTS "Public read access for calm-audio"
ON storage.objects
FOR SELECT
USING (bucket_id = 'calm-audio');

CREATE POLICY IF NOT EXISTS "Authenticated upload to calm-audio"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'calm-audio' AND
  auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Authenticated update to calm-audio"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'calm-audio' AND
  auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'calm-audio' AND
  auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Authenticated delete from calm-audio"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'calm-audio' AND
  auth.role() = 'authenticated'
);

-- Bucket: voice-recordings
-- Purpose: Store user voice recordings (private)
-- Access: Private (user-specific, signed URLs)
-- Max file size: 50MB
-- Allowed MIME types: audio/webm, audio/mpeg

-- Storage policies for voice-recordings bucket
CREATE POLICY IF NOT EXISTS "Users can view own voice recordings"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'voice-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can upload own voice recordings"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'voice-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can update own voice recordings"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'voice-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'voice-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete own voice recordings"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'voice-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Note: Buckets must be created manually via Supabase Dashboard:
-- 1. Go to Storage > New Bucket
-- 2. Create "calm-audio" bucket (public)
-- 3. Create "voice-recordings" bucket (private)
-- 4. Policies above will be applied automatically





