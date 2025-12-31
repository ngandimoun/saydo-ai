-- Smart Cumulative Health System
-- This migration creates tables for the intelligent, cumulative health tracking system
-- that accumulates findings, tracks evolution, and finds cross-system correlations

-- ============================================
-- Body System Findings Table
-- Stores findings grouped by body system with evolution tracking
-- Findings are NEVER deleted - they accumulate and get superseded
-- ============================================

CREATE TABLE IF NOT EXISTS body_system_findings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES health_documents(id) ON DELETE SET NULL,
  
  -- Body system classification
  body_system text NOT NULL CHECK (body_system IN (
    'eyes',           -- Vision, eye health
    'digestive',      -- GI, stomach, intestines
    'skin',           -- Dermatology
    'blood',          -- Hematology, CBC
    'cardiovascular', -- Heart, blood pressure
    'hormones',       -- Endocrine, thyroid
    'nutrition',      -- Vitamins, minerals
    'respiratory',    -- Lungs, breathing
    'musculoskeletal',-- Bones, joints, muscles
    'neurological',   -- Brain, nerves
    'renal',          -- Kidneys, urinary
    'hepatic',        -- Liver
    'immune',         -- Immune system
    'metabolic',      -- Metabolism, diabetes
    'general'         -- General health findings
  )),
  
  -- Finding identification (for evolution tracking)
  finding_key text NOT NULL, -- Unique key like "vitamin_d_level", "dry_eye_severity"
  
  -- Finding details
  title text NOT NULL,
  value text, -- The actual value (e.g., "45", "20/20", "Mild")
  value_numeric numeric, -- Numeric value for comparison
  unit text, -- Unit of measurement
  
  -- Status assessment
  status text NOT NULL CHECK (status IN ('good', 'attention', 'concern', 'info')),
  severity integer CHECK (severity >= 1 AND severity <= 5), -- 1=mild, 5=severe
  
  -- Reference ranges (for numeric values)
  reference_min numeric,
  reference_max numeric,
  reference_text text,
  
  -- Plain language explanations (user-friendly)
  explanation text NOT NULL, -- Clear explanation of what this means
  action_tip text, -- What the user should do about it
  
  -- Display properties
  icon_name text, -- Lucide icon name
  priority integer DEFAULT 50, -- For ordering (lower = higher priority)
  
  -- Evolution tracking
  is_current boolean DEFAULT true, -- Is this the current/latest finding?
  superseded_by uuid REFERENCES body_system_findings(id), -- Points to newer finding
  previous_finding_id uuid REFERENCES body_system_findings(id), -- Points to older finding
  
  -- Evolution comparison (when superseding another finding)
  evolution_trend text CHECK (evolution_trend IN ('improved', 'stable', 'declined')),
  evolution_note text, -- e.g., "Improved from 18 to 32 ng/mL"
  
  -- Timestamps
  measured_at timestamptz, -- When the test was actually taken
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for body_system_findings
CREATE INDEX IF NOT EXISTS idx_bsf_user_id ON body_system_findings(user_id);
CREATE INDEX IF NOT EXISTS idx_bsf_user_system ON body_system_findings(user_id, body_system);
CREATE INDEX IF NOT EXISTS idx_bsf_user_current ON body_system_findings(user_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_bsf_user_system_current ON body_system_findings(user_id, body_system, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_bsf_finding_key ON body_system_findings(user_id, finding_key);
CREATE INDEX IF NOT EXISTS idx_bsf_document ON body_system_findings(document_id);
CREATE INDEX IF NOT EXISTS idx_bsf_status ON body_system_findings(status);
CREATE INDEX IF NOT EXISTS idx_bsf_created ON body_system_findings(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE body_system_findings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own body system findings" 
  ON body_system_findings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own body system findings" 
  ON body_system_findings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own body system findings" 
  ON body_system_findings FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own body system findings" 
  ON body_system_findings FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Health Correlations Table
-- Stores discovered cross-system correlations
-- ============================================

CREATE TABLE IF NOT EXISTS health_correlations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Correlation identification
  correlation_key text NOT NULL, -- Unique key like "b12_vision_fatigue"
  
  -- Related body systems
  primary_system text NOT NULL,
  related_systems text[] NOT NULL,
  
  -- Correlation details
  title text NOT NULL,
  explanation text NOT NULL, -- Clear explanation of the connection
  confidence numeric CHECK (confidence >= 0 AND confidence <= 1), -- 0-1 confidence score
  
  -- Action
  action_tip text NOT NULL, -- What to do about this correlation
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  
  -- Related findings
  finding_ids uuid[] NOT NULL, -- Array of body_system_findings IDs
  
  -- Display
  icon_name text,
  
  -- Status
  is_active boolean DEFAULT true,
  is_dismissed boolean DEFAULT false,
  dismissed_at timestamptz,
  
  -- Timestamps
  discovered_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Unique constraint: one active correlation per key per user
  UNIQUE(user_id, correlation_key)
);

-- Indexes for health_correlations
CREATE INDEX IF NOT EXISTS idx_hc_user_id ON health_correlations(user_id);
CREATE INDEX IF NOT EXISTS idx_hc_user_active ON health_correlations(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hc_primary_system ON health_correlations(primary_system);
CREATE INDEX IF NOT EXISTS idx_hc_priority ON health_correlations(priority);
CREATE INDEX IF NOT EXISTS idx_hc_confidence ON health_correlations(confidence DESC);

-- Enable RLS
ALTER TABLE health_correlations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own health correlations" 
  ON health_correlations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health correlations" 
  ON health_correlations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health correlations" 
  ON health_correlations FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health correlations" 
  ON health_correlations FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Holistic Health Plans Table
-- Stores comprehensive plans based on all accumulated data
-- ============================================

CREATE TABLE IF NOT EXISTS holistic_health_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Plan type
  plan_type text NOT NULL CHECK (plan_type IN (
    'meal',
    'supplement',
    'hydration',
    'lifestyle',
    'exercise',
    'sleep'
  )),
  
  -- Plan content
  title text NOT NULL,
  description text,
  
  -- Recommendations stored as JSONB
  recommendations jsonb NOT NULL DEFAULT '[]',
  -- Structure: [{ item: "...", reason: "...", timing: "...", priority: "high|medium|low" }]
  
  -- What this plan is based on
  based_on_systems text[] DEFAULT '{}', -- Body systems considered
  based_on_findings uuid[] DEFAULT '{}', -- Specific findings considered
  based_on_correlations uuid[] DEFAULT '{}', -- Correlations considered
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Timestamps
  generated_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- One active plan per type per user
  UNIQUE(user_id, plan_type) WHERE is_active = true
);

-- Indexes for holistic_health_plans
CREATE INDEX IF NOT EXISTS idx_hhp_user_id ON holistic_health_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_hhp_user_active ON holistic_health_plans(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_hhp_user_type ON holistic_health_plans(user_id, plan_type);

-- Enable RLS
ALTER TABLE holistic_health_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own holistic health plans" 
  ON holistic_health_plans FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own holistic health plans" 
  ON holistic_health_plans FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own holistic health plans" 
  ON holistic_health_plans FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own holistic health plans" 
  ON holistic_health_plans FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Add body_system column to health_documents
-- ============================================

ALTER TABLE health_documents 
ADD COLUMN IF NOT EXISTS body_system text CHECK (body_system IN (
  'eyes', 'digestive', 'skin', 'blood', 'cardiovascular', 
  'hormones', 'nutrition', 'respiratory', 'musculoskeletal', 
  'neurological', 'renal', 'hepatic', 'immune', 'metabolic', 'general'
));

CREATE INDEX IF NOT EXISTS idx_health_documents_body_system 
ON health_documents(user_id, body_system);

-- ============================================
-- Enable Realtime for new tables
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE body_system_findings;
ALTER PUBLICATION supabase_realtime ADD TABLE health_correlations;
ALTER PUBLICATION supabase_realtime ADD TABLE holistic_health_plans;

-- Set REPLICA IDENTITY for realtime
ALTER TABLE body_system_findings REPLICA IDENTITY FULL;
ALTER TABLE health_correlations REPLICA IDENTITY FULL;
ALTER TABLE holistic_health_plans REPLICA IDENTITY FULL;


