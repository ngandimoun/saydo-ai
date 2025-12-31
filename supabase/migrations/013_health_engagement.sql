-- Health Engagement & Skincare Tables
-- This migration creates tables for gamification, engagement, skincare features, and notifications

-- ============================================
-- Health Recommendations Table
-- Daily personalized recommendations (food, exercise, supplements)
-- ============================================

CREATE TABLE IF NOT EXISTS health_recommendations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Recommendation content
  type text NOT NULL CHECK (type IN ('food', 'drink', 'exercise', 'sleep', 'supplement', 'lifestyle')),
  title text NOT NULL,
  description text NOT NULL,
  reason text, -- Why this is recommended based on labs/profile
  
  -- Context
  category text NOT NULL CHECK (category IN (
    'nutrition',
    'exercise',
    'sleep',
    'mental_health',
    'hydration',
    'sun_exposure',
    'medication',
    'general',
    'skincare'
  )),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  
  -- Related data
  related_document_id uuid REFERENCES health_documents(id) ON DELETE SET NULL,
  related_biomarker text, -- e.g., "Iron", "Vitamin D"
  related_insight_id uuid REFERENCES health_insights(id) ON DELETE SET NULL,
  
  -- Action details
  timing text, -- "morning", "before workout", etc.
  frequency text, -- "daily", "3x per week"
  image_url text,
  
  -- Status
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  
  -- Expiration
  expires_at timestamptz, -- When this recommendation expires
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for health recommendations
CREATE INDEX IF NOT EXISTS idx_health_recommendations_user_id ON health_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_health_recommendations_user_created ON health_recommendations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_recommendations_type ON health_recommendations(type);
CREATE INDEX IF NOT EXISTS idx_health_recommendations_category ON health_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_health_recommendations_expires ON health_recommendations(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_health_recommendations_completed ON health_recommendations(user_id, is_completed);

-- Enable RLS
ALTER TABLE health_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own health recommendations" 
  ON health_recommendations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health recommendations" 
  ON health_recommendations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health recommendations" 
  ON health_recommendations FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health recommendations" 
  ON health_recommendations FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Meal Plans Table
-- Weekly/monthly AI-generated meal plans
-- ============================================

CREATE TABLE IF NOT EXISTS meal_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Plan details
  type text NOT NULL CHECK (type IN ('weekly', 'monthly')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  
  -- Plan content (stored as JSONB for flexibility)
  plan_data jsonb NOT NULL DEFAULT '{}', -- Full meal plan structure
  
  -- Based on
  based_on_labs uuid[] DEFAULT '{}', -- Array of health_documents IDs
  based_on_insights uuid[] DEFAULT '{}', -- Array of health_insights IDs
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for meal plans
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_active ON meal_plans(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_meal_plans_dates ON meal_plans(start_date, end_date);

-- Enable RLS
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own meal plans" 
  ON meal_plans FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans" 
  ON meal_plans FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans" 
  ON meal_plans FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans" 
  ON meal_plans FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Proactive Interventions Table
-- Real-time contextual health alerts
-- ============================================

CREATE TABLE IF NOT EXISTS proactive_interventions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Intervention details
  type text NOT NULL CHECK (type IN (
    'uv_advisor',
    'blood_group_fueling',
    'allergy_guardian',
    'recovery_adjuster',
    'pdf_interpreter',
    'voice_stress',
    'hydration_safety',
    'jetlag_biosync',
    'longevity_tracker',
    'sleep_strategy',
    'pre_meeting',
    'late_night',
    'environmental_shield',
    'supplement_verification',
    'cognitive_load',
    'skincare_routine',
    'sunscreen_reminder'
  )),
  title text NOT NULL,
  description text NOT NULL,
  urgency_level text NOT NULL CHECK (urgency_level IN ('critical', 'high', 'medium', 'low')),
  category text NOT NULL CHECK (category IN ('health', 'nutrition', 'environment', 'recovery', 'cognitive', 'skincare')),
  
  -- Context (stored as JSONB)
  context_data jsonb DEFAULT '{}', -- { location, time, calendar_event, weather, etc. }
  
  -- Biological reason
  biological_reason text, -- Why this matters for user's biology
  
  -- Action items
  action_items text[] DEFAULT '{}',
  
  -- Status
  is_dismissed boolean DEFAULT false,
  dismissed_at timestamptz,
  dismissible boolean DEFAULT true,
  
  -- Expiration
  valid_until timestamptz,
  
  -- Use case specific data
  use_case_data jsonb DEFAULT '{}', -- Type-specific data (UV index, HRV, etc.)
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for proactive interventions
CREATE INDEX IF NOT EXISTS idx_proactive_interventions_user_id ON proactive_interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_interventions_user_active ON proactive_interventions(user_id, is_dismissed, created_at DESC) WHERE is_dismissed = false;
CREATE INDEX IF NOT EXISTS idx_proactive_interventions_type ON proactive_interventions(type);
CREATE INDEX IF NOT EXISTS idx_proactive_interventions_urgency ON proactive_interventions(urgency_level);
CREATE INDEX IF NOT EXISTS idx_proactive_interventions_valid_until ON proactive_interventions(valid_until) WHERE valid_until IS NOT NULL;

-- Enable RLS
ALTER TABLE proactive_interventions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own proactive interventions" 
  ON proactive_interventions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own proactive interventions" 
  ON proactive_interventions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own proactive interventions" 
  ON proactive_interventions FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own proactive interventions" 
  ON proactive_interventions FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Health Status Table
-- Current health rings (energy, stress, recovery)
-- ============================================

CREATE TABLE IF NOT EXISTS health_status (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Health metrics (0-100)
  energy integer NOT NULL CHECK (energy >= 0 AND energy <= 100),
  stress integer NOT NULL CHECK (stress >= 0 AND stress <= 100),
  recovery integer NOT NULL CHECK (recovery >= 0 AND recovery <= 100),
  
  -- Source
  source text CHECK (source IN ('wearable', 'manual', 'inferred', 'calculated')),
  
  -- Trends
  trends jsonb DEFAULT '{}', -- { energy: 'up', stress: 'down', recovery: 'stable' }
  
  -- Timestamps
  last_updated timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for health status
CREATE INDEX IF NOT EXISTS idx_health_status_user_id ON health_status(user_id);
CREATE INDEX IF NOT EXISTS idx_health_status_user_updated ON health_status(user_id, last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_health_status_user_latest ON health_status(user_id, last_updated DESC);

-- Enable RLS
ALTER TABLE health_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own health status" 
  ON health_status FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health status" 
  ON health_status FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health status" 
  ON health_status FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health status" 
  ON health_status FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Health Scores Table
-- Daily health score tracking
-- ============================================

CREATE TABLE IF NOT EXISTS health_scores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Score details
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  date date NOT NULL,
  
  -- Score breakdown
  breakdown jsonb DEFAULT '{}', -- { uploads: 20, compliance: 30, biomarkers: 25, engagement: 25 }
  
  -- Comparison
  previous_score integer, -- Yesterday's score
  trend text CHECK (trend IN ('up', 'down', 'stable')),
  
  -- Timestamps
  calculated_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Unique constraint: one score per user per day
  UNIQUE(user_id, date)
);

-- Indexes for health scores
CREATE INDEX IF NOT EXISTS idx_health_scores_user_id ON health_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_health_scores_user_date ON health_scores(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_health_scores_date ON health_scores(date);

-- Enable RLS
ALTER TABLE health_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own health scores" 
  ON health_scores FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health scores" 
  ON health_scores FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health scores" 
  ON health_scores FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health scores" 
  ON health_scores FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Health Streaks Table
-- Streak tracking for engagement
-- ============================================

CREATE TABLE IF NOT EXISTS health_streaks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Streak details
  streak_type text NOT NULL CHECK (streak_type IN (
    'daily_checkin',
    'document_upload',
    'routine_completion',
    'challenge_completion',
    'recommendation_followed',
    'skincare_routine'
  )),
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  
  -- Dates
  last_activity_date date,
  streak_start_date date,
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Timestamps
  updated_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  
  -- Unique constraint: one streak per user per type
  UNIQUE(user_id, streak_type)
);

-- Indexes for health streaks
CREATE INDEX IF NOT EXISTS idx_health_streaks_user_id ON health_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_health_streaks_user_type ON health_streaks(user_id, streak_type);
CREATE INDEX IF NOT EXISTS idx_health_streaks_active ON health_streaks(user_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE health_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own health streaks" 
  ON health_streaks FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health streaks" 
  ON health_streaks FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health streaks" 
  ON health_streaks FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health streaks" 
  ON health_streaks FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Health Achievements Table
-- Unlockable achievements/badges
-- ============================================

CREATE TABLE IF NOT EXISTS health_achievements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Achievement details
  achievement_key text NOT NULL, -- e.g., "first_upload", "week_streak", "perfect_score"
  title text NOT NULL,
  description text,
  icon_name text, -- Lucide icon name
  category text CHECK (category IN ('upload', 'streak', 'score', 'challenge', 'milestone', 'skincare')),
  
  -- Progress
  progress integer DEFAULT 0, -- Current progress (0-100)
  target integer DEFAULT 100, -- Target to unlock
  
  -- Status
  is_unlocked boolean DEFAULT false,
  unlocked_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Unique constraint: one achievement per user per key
  UNIQUE(user_id, achievement_key)
);

-- Indexes for health achievements
CREATE INDEX IF NOT EXISTS idx_health_achievements_user_id ON health_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_health_achievements_user_unlocked ON health_achievements(user_id, is_unlocked);
CREATE INDEX IF NOT EXISTS idx_health_achievements_key ON health_achievements(achievement_key);

-- Enable RLS
ALTER TABLE health_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own health achievements" 
  ON health_achievements FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health achievements" 
  ON health_achievements FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health achievements" 
  ON health_achievements FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health achievements" 
  ON health_achievements FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Daily Challenges Table
-- Daily health challenges
-- ============================================

CREATE TABLE IF NOT EXISTS daily_challenges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Challenge details
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'nutrition',
    'exercise',
    'hydration',
    'sleep',
    'mindfulness',
    'skincare',
    'general'
  )),
  
  -- Progress
  target_value numeric, -- e.g., 8 (glasses of water)
  current_value numeric DEFAULT 0,
  unit text, -- e.g., "glasses", "minutes", "times"
  
  -- Rewards
  points_reward integer DEFAULT 10,
  
  -- Status
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  
  -- Date
  challenge_date date NOT NULL,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Unique constraint: one challenge per user per date per title (allows multiple challenges per day)
  UNIQUE(user_id, challenge_date, title)
);

-- Indexes for daily challenges
CREATE INDEX IF NOT EXISTS idx_daily_challenges_user_id ON daily_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_user_date ON daily_challenges(user_id, challenge_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_completed ON daily_challenges(user_id, is_completed);

-- Enable RLS
ALTER TABLE daily_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own daily challenges" 
  ON daily_challenges FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily challenges" 
  ON daily_challenges FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily challenges" 
  ON daily_challenges FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily challenges" 
  ON daily_challenges FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- Notifications Table
-- In-app notification storage
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification content
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL CHECK (type IN (
    'intervention',
    'achievement',
    'challenge',
    'recommendation',
    'reminder',
    'system',
    'health_alert'
  )),
  
  -- Related data
  related_id uuid, -- ID of related item (intervention, achievement, etc.)
  related_type text, -- Type of related item
  
  -- Status
  is_read boolean DEFAULT false,
  read_at timestamptz,
  is_dismissed boolean DEFAULT false,
  dismissed_at timestamptz,
  
  -- Action
  action_url text, -- URL to navigate to when clicked
  action_label text, -- Button label
  
  -- Priority
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  
  -- Expiration
  expires_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;

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
-- Skincare Tables
-- ============================================

-- Skincare Profiles Table
CREATE TABLE IF NOT EXISTS skincare_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Skin characteristics
  skin_type text CHECK (skin_type IN ('oily', 'dry', 'combination', 'sensitive', 'normal')),
  skin_conditions text[] DEFAULT '{}', -- e.g., ['acne', 'rosacea', 'eczema']
  skin_goals text[] DEFAULT '{}', -- e.g., ['anti-aging', 'hydration', 'brightening']
  skin_concerns text, -- Free-form text about specific concerns
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for skincare profiles
CREATE INDEX IF NOT EXISTS idx_skincare_profiles_user_id ON skincare_profiles(user_id);

-- Enable RLS
ALTER TABLE skincare_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own skincare profile" 
  ON skincare_profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skincare profile" 
  ON skincare_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skincare profile" 
  ON skincare_profiles FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own skincare profile" 
  ON skincare_profiles FOR DELETE 
  USING (auth.uid() = user_id);

-- Skincare Products Table
CREATE TABLE IF NOT EXISTS skincare_products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Product identification
  name text NOT NULL,
  brand text,
  product_type text CHECK (product_type IN (
    'cleanser',
    'toner',
    'serum',
    'moisturizer',
    'sunscreen',
    'treatment',
    'mask',
    'exfoliant',
    'other'
  )),
  
  -- Analysis results
  ingredients text[] DEFAULT '{}',
  ingredient_analysis jsonb DEFAULT '{}', -- { ingredient: { rating: 'good', reason: '...' } }
  compatibility_score integer CHECK (compatibility_score >= 0 AND compatibility_score <= 100),
  compatibility_notes text,
  
  -- Image
  product_image_url text,
  
  -- Status
  is_in_routine boolean DEFAULT false,
  
  -- Timestamps
  analyzed_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for skincare products
CREATE INDEX IF NOT EXISTS idx_skincare_products_user_id ON skincare_products(user_id);
CREATE INDEX IF NOT EXISTS idx_skincare_products_in_routine ON skincare_products(user_id, is_in_routine) WHERE is_in_routine = true;

-- Enable RLS
ALTER TABLE skincare_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own skincare products" 
  ON skincare_products FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skincare products" 
  ON skincare_products FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skincare products" 
  ON skincare_products FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own skincare products" 
  ON skincare_products FOR DELETE 
  USING (auth.uid() = user_id);

-- Skincare Routines Table
CREATE TABLE IF NOT EXISTS skincare_routines (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Routine details
  routine_type text NOT NULL CHECK (routine_type IN ('am', 'pm')),
  name text, -- Optional custom name
  
  -- Products in routine (ordered)
  product_ids uuid[] DEFAULT '{}', -- Array of skincare_products IDs in order
  
  -- Routine data (full structure as JSONB)
  routine_data jsonb DEFAULT '{}', -- Full routine with products, timing, etc.
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  
  -- Unique constraint: one active routine per type per user
  UNIQUE(user_id, routine_type) WHERE is_active = true
);

-- Indexes for skincare routines
CREATE INDEX IF NOT EXISTS idx_skincare_routines_user_id ON skincare_routines(user_id);
CREATE INDEX IF NOT EXISTS idx_skincare_routines_user_active ON skincare_routines(user_id, routine_type, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE skincare_routines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own skincare routines" 
  ON skincare_routines FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skincare routines" 
  ON skincare_routines FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skincare routines" 
  ON skincare_routines FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own skincare routines" 
  ON skincare_routines FOR DELETE 
  USING (auth.uid() = user_id);

-- Skincare Logs Table
CREATE TABLE IF NOT EXISTS skincare_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  routine_id uuid REFERENCES skincare_routines(id) ON DELETE SET NULL,
  
  -- Log details
  routine_type text NOT NULL CHECK (routine_type IN ('am', 'pm')),
  completed_products uuid[] DEFAULT '{}', -- Products that were actually used
  skipped_products uuid[] DEFAULT '{}', -- Products that were skipped
  
  -- Status
  is_completed boolean DEFAULT false,
  completion_percentage integer CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  
  -- Notes
  notes text,
  
  -- Date
  log_date date NOT NULL,
  
  -- Timestamps
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for skincare logs
CREATE INDEX IF NOT EXISTS idx_skincare_logs_user_id ON skincare_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_skincare_logs_user_date ON skincare_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_skincare_logs_routine ON skincare_logs(routine_id);

-- Enable RLS
ALTER TABLE skincare_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own skincare logs" 
  ON skincare_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skincare logs" 
  ON skincare_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skincare logs" 
  ON skincare_logs FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own skincare logs" 
  ON skincare_logs FOR DELETE 
  USING (auth.uid() = user_id);

-- Skin Analyses Table
CREATE TABLE IF NOT EXISTS skin_analyses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Analysis image
  image_url text NOT NULL,
  
  -- Analysis results
  analysis_data jsonb NOT NULL DEFAULT '{}', -- Full analysis results
  detected_conditions jsonb DEFAULT '{}', -- { acne: { severity: 3, type: 'inflammatory' }, ... }
  
  -- Metrics
  acne_severity integer CHECK (acne_severity >= 0 AND acne_severity <= 10),
  dryness_level integer CHECK (dryness_level >= 0 AND dryness_level <= 10),
  oiliness_level integer CHECK (oiliness_level >= 0 AND oiliness_level <= 10),
  redness_level integer CHECK (redness_level >= 0 AND redness_level <= 10),
  hyperpigmentation_level integer CHECK (hyperpigmentation_level >= 0 AND hyperpigmentation_level <= 10),
  fine_lines_level integer CHECK (fine_lines_level >= 0 AND fine_lines_level <= 10),
  
  -- Overall assessment
  overall_score integer CHECK (overall_score >= 0 AND overall_score <= 100),
  recommendations text[] DEFAULT '{}',
  
  -- Timestamps
  analyzed_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for skin analyses
CREATE INDEX IF NOT EXISTS idx_skin_analyses_user_id ON skin_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_skin_analyses_user_analyzed ON skin_analyses(user_id, analyzed_at DESC);

-- Enable RLS
ALTER TABLE skin_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own skin analyses" 
  ON skin_analyses FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skin analyses" 
  ON skin_analyses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own skin analyses" 
  ON skin_analyses FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own skin analyses" 
  ON skin_analyses FOR DELETE 
  USING (auth.uid() = user_id);

-- Ingredient Database Table
CREATE TABLE IF NOT EXISTS ingredient_database (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ingredient details
  name text NOT NULL UNIQUE,
  aliases text[] DEFAULT '{}', -- Alternative names
  category text, -- e.g., 'humectant', 'antioxidant', 'exfoliant', 'preservative'
  
  -- Effects
  benefits text[] DEFAULT '{}', -- e.g., ['hydration', 'anti-aging']
  concerns text[] DEFAULT '{}', -- e.g., ['irritation', 'photosensitivity']
  
  -- Compatibility
  skin_type_compatibility jsonb DEFAULT '{}', -- { oily: 'good', dry: 'caution', ... }
  condition_compatibility jsonb DEFAULT '{}', -- { acne: 'avoid', rosacea: 'caution', ... }
  
  -- Safety
  safety_rating text CHECK (safety_rating IN ('safe', 'caution', 'avoid')),
  notes text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for ingredient database
CREATE INDEX IF NOT EXISTS idx_ingredient_database_name ON ingredient_database(name);
CREATE INDEX IF NOT EXISTS idx_ingredient_database_category ON ingredient_database(category);

-- No RLS on ingredient_database (public read-only data)

-- ============================================
-- Enable Realtime for new tables
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE health_recommendations;
ALTER PUBLICATION supabase_realtime ADD TABLE meal_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE proactive_interventions;
ALTER PUBLICATION supabase_realtime ADD TABLE health_status;
ALTER PUBLICATION supabase_realtime ADD TABLE health_scores;
ALTER PUBLICATION supabase_realtime ADD TABLE health_streaks;
ALTER PUBLICATION supabase_realtime ADD TABLE health_achievements;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE skincare_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE skincare_products;
ALTER PUBLICATION supabase_realtime ADD TABLE skincare_routines;
ALTER PUBLICATION supabase_realtime ADD TABLE skincare_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE skin_analyses;

-- Set REPLICA IDENTITY for realtime
ALTER TABLE health_recommendations REPLICA IDENTITY FULL;
ALTER TABLE meal_plans REPLICA IDENTITY FULL;
ALTER TABLE proactive_interventions REPLICA IDENTITY FULL;
ALTER TABLE health_status REPLICA IDENTITY FULL;
ALTER TABLE health_scores REPLICA IDENTITY FULL;
ALTER TABLE health_streaks REPLICA IDENTITY FULL;
ALTER TABLE health_achievements REPLICA IDENTITY FULL;
ALTER TABLE daily_challenges REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE skincare_profiles REPLICA IDENTITY FULL;
ALTER TABLE skincare_products REPLICA IDENTITY FULL;
ALTER TABLE skincare_routines REPLICA IDENTITY FULL;
ALTER TABLE skincare_logs REPLICA IDENTITY FULL;
ALTER TABLE skin_analyses REPLICA IDENTITY FULL;


