-- File content extraction cache
-- This migration creates a cache table for extracted file content and adds embedding support to work_files

-- Create file_content_cache table
CREATE TABLE IF NOT EXISTS file_content_cache (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id uuid REFERENCES work_files(id) ON DELETE CASCADE UNIQUE,
  extracted_text text,
  structured_data jsonb,
  extraction_method text,
  model_used text,
  embedding vector(1536), -- For semantic search within file content
  token_count integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add embedding and searchable_text columns to work_files for semantic matching
ALTER TABLE work_files 
ADD COLUMN IF NOT EXISTS searchable_text text,
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_content_cache_file_id ON file_content_cache(file_id);
CREATE INDEX IF NOT EXISTS idx_work_files_embedding ON work_files 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Index for searchable_text
CREATE INDEX IF NOT EXISTS idx_work_files_searchable_text ON work_files(searchable_text) WHERE searchable_text IS NOT NULL;

-- Enable RLS on file_content_cache
ALTER TABLE file_content_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can access their own file cache entries
CREATE POLICY "Users can access own file cache" ON file_content_cache
  FOR ALL USING (
    file_id IN (SELECT id FROM work_files WHERE user_id = auth.uid())
  );




