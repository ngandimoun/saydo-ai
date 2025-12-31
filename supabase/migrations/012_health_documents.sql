-- Health Documents & Tracking Tables
-- This migration creates tables for health document uploads, biomarker tracking, and intake logging

-- ============================================
-- Health Documents Table
-- Unified table for all health-related uploads:
-- food photos, supplements, drinks, lab PDFs, medications, etc.
-- ============================================

CREATE TABLE IF NOT EXISTS health_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- File information
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  mime_type text NOT NULL,
  thumbnail_url text,
  
  -- Classification
  document_type text NOT NULL CHECK (document_type IN (
    'food_photo',
    'supplement',
    'drink',
    'lab_pdf',
    'lab_handwritten',
    'medication',
    'clinical_report',
    'other'
  )),
  classification_confidence numeric,
  detected_elements text[], -- What AI detected in the image/document
  
  -- Processing status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Uploaded, awaiting analysis
    'classifying',  -- Being classified
    'analyzing',    -- Being analyzed
    'analyzed',     -- Analysis complete
    'failed'        -- Analysis failed
  )),
  error_message text, -- Error details if failed
  
  -- Analysis results (type-specific data stored as JSONB)
  extracted_data jsonb DEFAULT '{}',
  analysis_summary text,
  
  -- Health impact assessment
  health_impact jsonb DEFAULT '{}', -- { score: 85, benefits: [], concerns: [] }
  allergy_warnings text[] DEFAULT '{}', -- Matched allergens from user profile
  interaction_warnings text[] DEFAULT '{}', -- Drug/supplement interactions
  
  -- Timestamps
  uploaded_at timestamptz DEFAULT now() NOT NULL,
  analyzed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_documents_user_id ON health_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_health_documents_user_uploaded ON health_documents(user_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_documents_status ON health_documents(status);
CREATE INDEX IF NOT EXISTS idx_health_documents_type ON health_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_health_documents_user_type ON health_documents(user_id, document_type);

-- Enable RLS
ALTER TABLE health_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own health documents" 
  ON health_documents FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health documents" 
  ON health_documents FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health documents" 
  ON health_documents FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health documents" 
  ON health_documents FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Biomarkers Table
-- Extracted biomarker values from lab results
-- Enables historical tracking and trend analysis
-- ============================================

CREATE TABLE IF NOT EXISTS biomarkers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES health_documents(id) ON DELETE SET NULL,
  
  -- Biomarker identification
  name text NOT NULL, -- e.g., "Iron", "Vitamin D", "Cholesterol LDL"
  category text, -- e.g., "blood", "urine", "hormone", "vitamin", "mineral"
  
  -- Value and units
  value numeric NOT NULL,
  unit text NOT NULL,
  value_text text, -- Original text if non-numeric (e.g., "Positive", "Negative")
  
  -- Reference ranges
  reference_min numeric,
  reference_max numeric,
  reference_text text, -- Original reference text from lab
  
  -- Status assessment
  status text CHECK (status IN ('critical_low', 'low', 'normal', 'high', 'critical_high')),
  deviation_percent numeric, -- How far from normal range (%)
  
  -- Measurement context
  measured_at timestamptz, -- When the test was taken
  lab_name text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for biomarkers
CREATE INDEX IF NOT EXISTS idx_biomarkers_user_id ON biomarkers(user_id);
CREATE INDEX IF NOT EXISTS idx_biomarkers_user_name ON biomarkers(user_id, name);
CREATE INDEX IF NOT EXISTS idx_biomarkers_user_measured ON biomarkers(user_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_biomarkers_document_id ON biomarkers(document_id);
CREATE INDEX IF NOT EXISTS idx_biomarkers_status ON biomarkers(status);

-- Enable RLS
ALTER TABLE biomarkers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own biomarkers" 
  ON biomarkers FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own biomarkers" 
  ON biomarkers FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own biomarkers" 
  ON biomarkers FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own biomarkers" 
  ON biomarkers FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Intake Log Table
-- Tracks food, supplements, drinks, medications
-- ============================================

CREATE TABLE IF NOT EXISTS intake_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES health_documents(id) ON DELETE SET NULL,
  
  -- Item identification
  intake_type text NOT NULL CHECK (intake_type IN ('food', 'supplement', 'drink', 'medication')),
  name text NOT NULL,
  brand text,
  description text,
  
  -- Quantity
  quantity text, -- e.g., "1 serving", "2 pills", "500ml"
  quantity_value numeric,
  quantity_unit text,
  
  -- Nutritional info (for food/drinks)
  calories integer,
  nutrients jsonb DEFAULT '{}', -- { protein: 25, carbs: 30, fat: 10, fiber: 5, ... }
  
  -- Ingredients (for supplements/food/drinks)
  ingredients text[] DEFAULT '{}',
  active_ingredients jsonb DEFAULT '{}', -- For supplements/medications: { "Vitamin D": "1000 IU" }
  
  -- Health assessment
  health_score integer CHECK (health_score >= 0 AND health_score <= 100),
  allergy_match text[] DEFAULT '{}', -- Matched allergens from user profile
  interaction_warnings text[] DEFAULT '{}',
  
  -- Benefits and concerns
  benefits text[] DEFAULT '{}',
  concerns text[] DEFAULT '{}',
  
  -- Blood type compatibility (from health agent knowledge)
  blood_type_compatible boolean,
  blood_type_notes text,
  
  -- Timestamps
  logged_at timestamptz DEFAULT now() NOT NULL,
  consumed_at timestamptz, -- When the user actually consumed it
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for intake log
CREATE INDEX IF NOT EXISTS idx_intake_log_user_id ON intake_log(user_id);
CREATE INDEX IF NOT EXISTS idx_intake_log_user_logged ON intake_log(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_intake_log_user_type ON intake_log(user_id, intake_type);
CREATE INDEX IF NOT EXISTS idx_intake_log_document_id ON intake_log(document_id);

-- Enable RLS
ALTER TABLE intake_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own intake log" 
  ON intake_log FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intake log" 
  ON intake_log FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intake log" 
  ON intake_log FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own intake log" 
  ON intake_log FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Health Trends Table
-- Pre-calculated trends for quick visualization
-- ============================================

CREATE TABLE IF NOT EXISTS health_trends (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Trend identification
  metric_name text NOT NULL, -- e.g., "Iron", "Calories", "Supplement Adherence"
  metric_type text NOT NULL CHECK (metric_type IN ('biomarker', 'intake', 'score')),
  
  -- Trend data
  period text NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  
  -- Trend values
  data_points jsonb NOT NULL DEFAULT '[]', -- [{ date: "2024-12-01", value: 45 }, ...]
  average_value numeric,
  min_value numeric,
  max_value numeric,
  
  -- Trend direction
  trend_direction text CHECK (trend_direction IN ('improving', 'stable', 'declining')),
  trend_percent numeric, -- % change over period
  
  -- Timestamps
  calculated_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for health trends
CREATE INDEX IF NOT EXISTS idx_health_trends_user_id ON health_trends(user_id);
CREATE INDEX IF NOT EXISTS idx_health_trends_user_metric ON health_trends(user_id, metric_name);
CREATE INDEX IF NOT EXISTS idx_health_trends_user_period ON health_trends(user_id, period);

-- Enable RLS
ALTER TABLE health_trends ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own health trends" 
  ON health_trends FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health trends" 
  ON health_trends FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health trends" 
  ON health_trends FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health trends" 
  ON health_trends FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Health Insights Table
-- AI-generated health recommendations and insights
-- ============================================

CREATE TABLE IF NOT EXISTS health_insights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Insight content
  type text NOT NULL CHECK (type IN ('recommendation', 'warning', 'observation', 'tip')),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'nutrition',
    'exercise',
    'sleep',
    'mental_health',
    'hydration',
    'sun_exposure',
    'medication',
    'general'
  )),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  
  -- Related information
  related_to_allergy text, -- If related to a specific allergy
  
  -- Expiration
  expires_at timestamptz, -- When this insight expires (optional)
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for health insights
CREATE INDEX IF NOT EXISTS idx_health_insights_user_id ON health_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_health_insights_user_created ON health_insights(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_insights_category ON health_insights(category);
CREATE INDEX IF NOT EXISTS idx_health_insights_priority ON health_insights(priority);
CREATE INDEX IF NOT EXISTS idx_health_insights_expires ON health_insights(expires_at) WHERE expires_at IS NOT NULL;

-- Enable RLS
ALTER TABLE health_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own health insights" 
  ON health_insights FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health insights" 
  ON health_insights FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health insights" 
  ON health_insights FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health insights" 
  ON health_insights FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Health Notes Table
-- Free-form health observations from voice/chat
-- ============================================

CREATE TABLE IF NOT EXISTS health_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Note content
  content text NOT NULL,
  source text NOT NULL DEFAULT 'chat' CHECK (source IN ('voice', 'chat', 'manual')),
  source_recording_id uuid, -- ID of voice recording if from voice
  
  -- Categorization
  tags text[] DEFAULT '{}', -- Tags for categorizing the note
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for health notes
CREATE INDEX IF NOT EXISTS idx_health_notes_user_id ON health_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_health_notes_user_created ON health_notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_notes_source ON health_notes(source);
CREATE INDEX IF NOT EXISTS idx_health_notes_recording ON health_notes(source_recording_id) WHERE source_recording_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_health_notes_tags ON health_notes USING GIN(tags);

-- Enable RLS
ALTER TABLE health_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own health notes" 
  ON health_notes FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health notes" 
  ON health_notes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health notes" 
  ON health_notes FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health notes" 
  ON health_notes FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Storage Bucket Policies for health-documents
-- ============================================

-- Storage policies for health-documents bucket (must create bucket manually)
CREATE POLICY IF NOT EXISTS "Users can view own health documents storage"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'health-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can upload own health documents storage"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'health-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can update own health documents storage"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'health-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'health-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY IF NOT EXISTS "Users can delete own health documents storage"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'health-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- Enable Realtime for health tables
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE health_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE biomarkers;
ALTER PUBLICATION supabase_realtime ADD TABLE intake_log;
ALTER PUBLICATION supabase_realtime ADD TABLE health_insights;
ALTER PUBLICATION supabase_realtime ADD TABLE health_notes;



