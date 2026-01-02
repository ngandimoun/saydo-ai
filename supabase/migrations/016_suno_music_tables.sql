-- Suno Music Generation Tables
-- This migration creates tables for storing Suno API-generated music files and metadata

-- ============================================
-- Suno Music Generations Table
-- Tracks each music generation task from Suno API
-- ============================================

CREATE TABLE IF NOT EXISTS suno_music_generations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Suno API task information
  suno_task_id text NOT NULL UNIQUE,
  suno_operation_type text NOT NULL CHECK (suno_operation_type IN (
    'generate', 
    'extend', 
    'upload_cover', 
    'upload_extend',
    'add_vocals',
    'add_instrumental'
  )),
  
  -- Generation parameters
  prompt text,
  style text,
  title text,
  model_name text NOT NULL CHECK (model_name IN ('V4', 'V4_5', 'V4_5PLUS', 'V4_5ALL', 'V5')),
  custom_mode boolean DEFAULT false,
  instrumental boolean DEFAULT false,
  
  -- Status tracking
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'generating',
    'completed',
    'failed'
  )),
  error_message text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_suno_music_generations_task_id 
  ON suno_music_generations(suno_task_id);
CREATE INDEX IF NOT EXISTS idx_suno_music_generations_status 
  ON suno_music_generations(status);
CREATE INDEX IF NOT EXISTS idx_suno_music_generations_created 
  ON suno_music_generations(created_at DESC);

-- ============================================
-- Suno Music Files Table
-- Stores file metadata for each generated song (2 songs per generation)
-- ============================================

CREATE TABLE IF NOT EXISTS suno_music_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Links
  generation_id uuid REFERENCES suno_music_generations(id) ON DELETE CASCADE NOT NULL,
  audio_content_id uuid REFERENCES audio_content(id) ON DELETE SET NULL,
  
  -- Suno API identifiers
  suno_audio_id text NOT NULL,
  song_index integer NOT NULL CHECK (song_index IN (1, 2)), -- 1 or 2 (each generation has 2 songs)
  
  -- File storage paths in Supabase
  audio_file_path text NOT NULL, -- Path in calm-audio bucket
  audio_signed_url text NOT NULL, -- Auto-refresh signed URL
  cover_image_path text, -- Path to cover image in calm-audio bucket
  cover_image_url text, -- Signed URL for cover image
  wav_file_path text, -- Path to WAV file (if converted)
  wav_signed_url text, -- Signed URL for WAV file
  
  -- Original Suno URLs (for reference, expire after 15 days)
  original_audio_url text,
  original_stream_url text,
  original_image_url text,
  
  -- Metadata from Suno
  suno_title text NOT NULL,
  suno_tags text, -- Comma-separated tags from Suno
  suno_prompt text, -- The prompt/lyrics used
  duration_seconds numeric NOT NULL,
  model_name text NOT NULL,
  
  -- URL refresh tracking
  signed_url_expires_at timestamptz, -- When signed URL expires
  last_url_refresh_at timestamptz, -- Last time URL was refreshed
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Ensure unique combination
  UNIQUE(generation_id, song_index)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_suno_music_files_generation_id 
  ON suno_music_files(generation_id);
CREATE INDEX IF NOT EXISTS idx_suno_music_files_audio_content_id 
  ON suno_music_files(audio_content_id);
CREATE INDEX IF NOT EXISTS idx_suno_music_files_suno_audio_id 
  ON suno_music_files(suno_audio_id);
CREATE INDEX IF NOT EXISTS idx_suno_music_files_url_refresh 
  ON suno_music_files(signed_url_expires_at) 
  WHERE signed_url_expires_at IS NOT NULL;

-- ============================================
-- Extend audio_content table for Suno integration
-- ============================================

-- Add Suno-specific fields to audio_content
ALTER TABLE audio_content 
  ADD COLUMN IF NOT EXISTS suno_generation_id uuid REFERENCES suno_music_generations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suno_audio_id text,
  ADD COLUMN IF NOT EXISTS suno_file_id uuid REFERENCES suno_music_files(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual' CHECK (source IN ('manual', 'suno')),
  ADD COLUMN IF NOT EXISTS prompt text, -- Generation prompt/lyrics
  ADD COLUMN IF NOT EXISTS model_name text; -- Suno model used

-- Indexes for Suno-related queries
CREATE INDEX IF NOT EXISTS idx_audio_content_suno_generation 
  ON audio_content(suno_generation_id) 
  WHERE suno_generation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audio_content_suno_audio_id 
  ON audio_content(suno_audio_id) 
  WHERE suno_audio_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audio_content_source 
  ON audio_content(source);
CREATE INDEX IF NOT EXISTS idx_audio_content_tags_gin 
  ON audio_content USING GIN(tags); -- GIN index for array searches

-- ============================================
-- Function to refresh signed URLs
-- ============================================

CREATE OR REPLACE FUNCTION refresh_suno_music_urls()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- This function can be called to refresh URLs before expiration
  -- Implementation will be in application code, but this provides a hook
  NULL;
END;
$$;

-- ============================================
-- Function to create audio_content from Suno file
-- ============================================

CREATE OR REPLACE FUNCTION create_audio_content_from_suno(
  p_suno_file_id uuid,
  p_category text DEFAULT 'music'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_audio_content_id uuid;
  v_suno_file suno_music_files%ROWTYPE;
  v_generation suno_music_generations%ROWTYPE;
BEGIN
  -- Get Suno file data
  SELECT * INTO v_suno_file
  FROM suno_music_files
  WHERE id = p_suno_file_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suno file not found: %', p_suno_file_id;
  END IF;
  
  -- Get generation data
  SELECT * INTO v_generation
  FROM suno_music_generations
  WHERE id = v_suno_file.generation_id;
  
  -- Create audio_content entry
  INSERT INTO audio_content (
    title,
    description,
    category,
    duration_seconds,
    audio_url,
    thumbnail_url,
    tags,
    source,
    suno_generation_id,
    suno_audio_id,
    suno_file_id,
    prompt,
    model_name,
    is_featured,
    play_count
  ) VALUES (
    v_suno_file.suno_title,
    COALESCE(v_suno_file.suno_prompt, 'AI-generated music'),
    p_category,
    v_suno_file.duration_seconds::integer,
    v_suno_file.audio_signed_url, -- Use signed URL
    v_suno_file.cover_image_url,
    string_to_array(v_suno_file.suno_tags, ', '), -- Convert comma-separated to array
    'suno',
    v_generation.id,
    v_suno_file.suno_audio_id,
    v_suno_file.id,
    v_suno_file.suno_prompt,
    v_suno_file.model_name,
    false,
    0
  )
  RETURNING id INTO v_audio_content_id;
  
  -- Update suno_music_files with audio_content_id
  UPDATE suno_music_files
  SET audio_content_id = v_audio_content_id
  WHERE id = p_suno_file_id;
  
  RETURN v_audio_content_id;
END;
$$;

-- ============================================
-- Enable RLS
-- ============================================

ALTER TABLE suno_music_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE suno_music_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suno_music_generations
-- Public read access (music is available to all users)
CREATE POLICY "Public read access for suno_music_generations"
  ON suno_music_generations FOR SELECT
  USING (true);

-- Authenticated users can insert (for automation)
CREATE POLICY "Authenticated insert for suno_music_generations"
  ON suno_music_generations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Service role can update (for automation)
CREATE POLICY "Service role update for suno_music_generations"
  ON suno_music_generations FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for suno_music_files
-- Public read access
CREATE POLICY "Public read access for suno_music_files"
  ON suno_music_files FOR SELECT
  USING (true);

-- Authenticated users can insert
CREATE POLICY "Authenticated insert for suno_music_files"
  ON suno_music_files FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Service role can update
CREATE POLICY "Service role update for suno_music_files"
  ON suno_music_files FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- Trigger to update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_suno_music_generations_updated_at
  BEFORE UPDATE ON suno_music_generations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suno_music_files_updated_at
  BEFORE UPDATE ON suno_music_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

