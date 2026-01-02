-- Fix health_recommendations type constraint to ensure 'lifestyle' is included
-- This migration ensures the constraint is properly set even if previous migration wasn't applied

-- Drop old constraint if it exists (in case it was created without 'lifestyle')
ALTER TABLE health_recommendations 
  DROP CONSTRAINT IF EXISTS health_recommendations_type_check;

-- Add the correct constraint with all allowed types including 'lifestyle'
ALTER TABLE health_recommendations
  ADD CONSTRAINT health_recommendations_type_check 
  CHECK (type IN ('food', 'drink', 'exercise', 'sleep', 'supplement', 'lifestyle'));


