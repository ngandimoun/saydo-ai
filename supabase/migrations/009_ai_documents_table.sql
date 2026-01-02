-- AI Documents Table
-- This migration creates tables for AI-generated content and voice summaries for long-term memory

-- ============================================
-- AI Documents Table
-- Stores all AI-generated content (posts, emails, reports, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS ai_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Document content
  title text NOT NULL,
  document_type text NOT NULL, -- Fully dynamic: 'social_post', 'email', 'report', 'summary', etc.
  content text NOT NULL, -- Full generated content
  preview_text text, -- First 200 chars for preview
  
  -- Source tracking
  source_voice_note_ids uuid[] DEFAULT '{}', -- Voice recordings that triggered this
  source_file_ids uuid[] DEFAULT '{}', -- Files used as reference
  
  -- Generation metadata
  status text NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed', 'archived')),
  language text NOT NULL DEFAULT 'en', -- Language of generated content
  model_used text, -- AI model that generated this
  tokens_used integer, -- Token count for tracking
  confidence_score numeric, -- How confident the AI was (0-1)
  generation_type text DEFAULT 'explicit' CHECK (generation_type IN ('explicit', 'proactive', 'suggestion')),
  
  -- Categorization
  tags text[] DEFAULT '{}', -- Auto-extracted tags
  profession_context text, -- Profession that influenced generation
  
  -- Versioning
  version integer DEFAULT 1,
  parent_document_id uuid REFERENCES ai_documents(id), -- For regenerated versions
  
  -- Timestamps
  generated_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_documents_user_id ON ai_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_documents_user_generated ON ai_documents(user_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_documents_status ON ai_documents(status);
CREATE INDEX IF NOT EXISTS idx_ai_documents_type ON ai_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_ai_documents_generation_type ON ai_documents(generation_type);
CREATE INDEX IF NOT EXISTS idx_ai_documents_tags ON ai_documents USING GIN(tags);

-- Enable RLS
ALTER TABLE ai_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and manage their own documents
CREATE POLICY "Users can view own ai documents" 
  ON ai_documents FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai documents" 
  ON ai_documents FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai documents" 
  ON ai_documents FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai documents" 
  ON ai_documents FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Voice Summaries Table
-- Stores AI-generated summaries of voice recordings for long-term memory
-- ============================================

CREATE TABLE IF NOT EXISTS voice_summaries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Period information
  period_type text NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  
  -- Summary content
  summary_content text NOT NULL, -- AI-generated summary
  key_topics text[] DEFAULT '{}', -- Extracted topics/themes
  key_entities text[] DEFAULT '{}', -- People, places, things mentioned
  sentiment text, -- Overall sentiment of the period
  
  -- Voice recording references
  voice_recording_ids uuid[] DEFAULT '{}', -- IDs of recordings in this period
  recording_count integer DEFAULT 0,
  total_duration_seconds integer DEFAULT 0,
  
  -- Metadata
  language text NOT NULL DEFAULT 'en',
  model_used text,
  
  -- Timestamps
  generated_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Ensure unique period per user
  UNIQUE (user_id, period_type, period_start)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voice_summaries_user_id ON voice_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_summaries_user_period ON voice_summaries(user_id, period_type, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_voice_summaries_period_type ON voice_summaries(period_type);
CREATE INDEX IF NOT EXISTS idx_voice_summaries_topics ON voice_summaries USING GIN(key_topics);

-- Enable RLS
ALTER TABLE voice_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see and manage their own summaries
CREATE POLICY "Users can view own voice summaries" 
  ON voice_summaries FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice summaries" 
  ON voice_summaries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice summaries" 
  ON voice_summaries FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice summaries" 
  ON voice_summaries FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Notifications Table (for PWA push notifications)
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification content
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'ai_generated')),
  
  -- Link to related content
  related_document_id uuid REFERENCES ai_documents(id) ON DELETE SET NULL,
  deep_link text, -- URL to navigate to when clicked
  
  -- Status
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  read_at timestamptz
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications" 
  ON notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" 
  ON notifications FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
  ON notifications FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" 
  ON notifications FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Update triggers for updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_documents_updated_at
  BEFORE UPDATE ON ai_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_summaries_updated_at
  BEFORE UPDATE ON voice_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Enable Realtime for new tables
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE ai_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- Cleanup functions
-- ============================================

-- Function to auto-cleanup old notifications (30+ days)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications 
  WHERE created_at < now() - interval '30 days'
  AND is_read = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup archived documents (90+ days)
CREATE OR REPLACE FUNCTION cleanup_archived_documents()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_documents 
  WHERE status = 'archived'
  AND updated_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;




