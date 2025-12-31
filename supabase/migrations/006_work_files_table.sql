-- Work Files Table
-- This migration creates the work_files table for storing user's work-related files

CREATE TABLE IF NOT EXISTS work_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('pdf', 'image', 'document', 'spreadsheet', 'presentation', 'other')),
  file_url text NOT NULL,
  thumbnail_url text,
  file_size bigint NOT NULL,
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('uploading', 'processing', 'ready', 'failed')),
  category text,
  uploaded_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_work_files_user_id ON work_files(user_id);
CREATE INDEX IF NOT EXISTS idx_work_files_user_uploaded ON work_files(user_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_files_status ON work_files(status);
CREATE INDEX IF NOT EXISTS idx_work_files_file_type ON work_files(file_type);

-- Enable RLS
ALTER TABLE work_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and manage their own files
CREATE POLICY "Users can view own work files" 
  ON work_files FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own work files" 
  ON work_files FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work files" 
  ON work_files FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own work files" 
  ON work_files FOR DELETE 
  USING (auth.uid() = user_id);



