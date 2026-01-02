-- Infrastructure Tables for Saydo
-- This migration creates tables for logging, location tracking, and environment data

-- User location tracking (IP-based, no permission required)
CREATE TABLE IF NOT EXISTS user_locations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  latitude numeric,
  longitude numeric,
  city text,
  region text,
  country text,
  timezone text,
  source text CHECK (source IN ('ip', 'browser', 'manual')),
  accuracy numeric, -- meters
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_locations_user_id_created ON user_locations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);

-- Environment data cache (UV, weather, air quality)
CREATE TABLE IF NOT EXISTS environment_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  location_city text,
  uv_index integer,
  weather_condition text,
  temperature numeric,
  air_quality_index integer,
  air_quality_category text CHECK (air_quality_category IN ('good', 'moderate', 'unhealthy', 'hazardous')),
  fetched_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_env_data_user_fetched ON environment_data(user_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_env_data_user_id ON environment_data(user_id);

-- App logs (client-side actions and errors)
CREATE TABLE IF NOT EXISTS app_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  log_level text CHECK (log_level IN ('debug', 'info', 'warn', 'error')),
  message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_logs_user_created ON app_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON app_logs(user_id);

-- Performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type text, -- 'page_load', 'api_call', 'audio_playback', 'voice_recording'
  metric_name text,
  value numeric,
  unit text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perf_metrics_user_created ON performance_metrics(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_perf_metrics_user_id ON performance_metrics(user_id);

-- Enable RLS on all tables
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE environment_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own data
CREATE POLICY "Users can view own locations" 
  ON user_locations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own locations" 
  ON user_locations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own environment data" 
  ON environment_data FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own environment data" 
  ON environment_data FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own logs" 
  ON app_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" 
  ON app_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own metrics" 
  ON performance_metrics FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics" 
  ON performance_metrics FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Function to auto-cleanup old location data (30+ days)
CREATE OR REPLACE FUNCTION cleanup_old_locations()
RETURNS void AS $$
BEGIN
  DELETE FROM user_locations 
  WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-cleanup old environment data (7+ days, keep only latest per user)
CREATE OR REPLACE FUNCTION cleanup_old_environment_data()
RETURNS void AS $$
BEGIN
  DELETE FROM environment_data 
  WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id 
    FROM environment_data 
    ORDER BY user_id, fetched_at DESC
  )
  AND fetched_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-cleanup old logs (90+ days)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM app_logs 
  WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-cleanup old metrics (90+ days)
CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
BEGIN
  DELETE FROM performance_metrics 
  WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;





