-- User Patterns Table for Pattern Learning System
-- This migration creates a table to store learned patterns from user tasks, todos, and reminders

CREATE TABLE IF NOT EXISTS user_patterns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pattern_type text NOT NULL CHECK (pattern_type IN ('timing', 'category', 'priority', 'tags', 'completion', 'recurring')),
  pattern_data jsonb NOT NULL DEFAULT '{}',
  frequency integer DEFAULT 1 NOT NULL,
  confidence_score numeric(5, 2) DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  last_seen_at timestamptz DEFAULT now() NOT NULL,
  first_seen_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Ensure unique pattern per user and type
  UNIQUE(user_id, pattern_type, pattern_data)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_patterns_user_id ON user_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_patterns_pattern_type ON user_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_user_patterns_last_seen_at ON user_patterns(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_patterns_user_type ON user_patterns(user_id, pattern_type);
CREATE INDEX IF NOT EXISTS idx_user_patterns_confidence ON user_patterns(user_id, confidence_score DESC);

-- GIN index for JSONB pattern_data queries
CREATE INDEX IF NOT EXISTS idx_user_patterns_pattern_data ON user_patterns USING GIN (pattern_data);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_patterns_updated_at
  BEFORE UPDATE ON user_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_user_patterns_updated_at();

-- Comments for documentation
COMMENT ON TABLE user_patterns IS 'Stores learned patterns from user tasks, todos, and reminders for AI personalization';
COMMENT ON COLUMN user_patterns.pattern_type IS 'Type of pattern: timing, category, priority, tags, completion, or recurring';
COMMENT ON COLUMN user_patterns.pattern_data IS 'JSONB object containing the actual pattern data (varies by pattern_type)';
COMMENT ON COLUMN user_patterns.frequency IS 'Number of times this pattern has been observed';
COMMENT ON COLUMN user_patterns.confidence_score IS 'Confidence score from 0-100 indicating pattern reliability';
COMMENT ON COLUMN user_patterns.metadata IS 'Additional context about the pattern (e.g., time range, sample items)';



