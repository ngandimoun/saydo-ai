-- Enable Supabase Realtime for critical tables
-- This allows real-time updates for urgent alerts, interventions, tasks, etc.

-- Enable Realtime publication (if not already enabled)
CREATE PUBLICATION IF NOT EXISTS supabase_realtime;

-- Add tables to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE urgent_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE proactive_interventions;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE voice_recordings;
-- Note: health_status is added to Realtime in migration 013_health_engagement.sql
-- after the table is created

-- Note: Realtime requires the tables to have REPLICA IDENTITY set
-- This is usually set automatically, but we ensure it here
ALTER TABLE urgent_alerts REPLICA IDENTITY FULL;
ALTER TABLE proactive_interventions REPLICA IDENTITY FULL;
ALTER TABLE tasks REPLICA IDENTITY FULL;
ALTER TABLE voice_recordings REPLICA IDENTITY FULL;
-- Note: health_status REPLICA IDENTITY is set in migration 013_health_engagement.sql



