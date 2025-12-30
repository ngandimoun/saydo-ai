-- Add custom_name and description fields to work_files table
-- This migration adds metadata fields to help AI understand file context

ALTER TABLE work_files
ADD COLUMN IF NOT EXISTS custom_name text,
ADD COLUMN IF NOT EXISTS description text;

-- Add index on custom_name for searchability in future AI voice interactions
CREATE INDEX IF NOT EXISTS idx_work_files_custom_name ON work_files(custom_name) WHERE custom_name IS NOT NULL;

-- Add index on description for searchability
CREATE INDEX IF NOT EXISTS idx_work_files_description ON work_files(description) WHERE description IS NOT NULL;

