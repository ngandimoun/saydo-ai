/**
 * Pattern Storage Service
 * 
 * Handles storing and retrieving learned patterns from Supabase.
 * Patterns are stored persistently and can be retrieved for AI agent use.
 */

import { createClient } from "@supabase/supabase-js";
import type { PatternType, PatternData } from "./pattern-learning";

interface UserPattern {
  id: string;
  user_id: string;
  pattern_type: PatternType;
  pattern_data: PatternData;
  frequency: number;
  confidence_score: number;
  last_seen_at: string;
  first_seen_at: string;
  metadata: Record<string, unknown>;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Helper function to sleep/delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is a PostgREST schema cache issue (PGRST205)
 */
function isSchemaCacheError(error: { code?: string }): boolean {
  return error.code === "PGRST205";
}

/**
 * Check if error is a duplicate key constraint violation
 */
function isDuplicateKeyError(error: { code?: string; message?: string }): boolean {
  // PostgreSQL unique violation error code is 23505
  return error.code === "23505" || error.message?.includes("duplicate key");
}

/**
 * Save or update a pattern in the database
 * 
 * Uses UPSERT logic: If a pattern with the same user_id, pattern_type, and pattern_data
 * already exists, it updates the frequency and last_seen_at instead of failing.
 * 
 * Includes retry logic with exponential backoff to handle PostgREST schema cache issues.
 * PostgREST caches the database schema and may not immediately see newly created tables.
 */
export async function savePattern(
  userId: string,
  patternType: PatternType,
  patternData: PatternData,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; patternId?: string; error?: string }> {
  const maxRetries = 3;
  const retryDelays = [2000, 4000, 8000]; // 2s, 4s, 8s

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const supabase = getSupabaseClient();
      const patternDataJson = patternData as unknown as Record<string, unknown>;

      // First, check if this exact pattern already exists
      const { data: existingPattern, error: selectError } = await supabase
        .from("user_patterns")
        .select("id, frequency, confidence_score")
        .eq("user_id", userId)
        .eq("pattern_type", patternType)
        .eq("pattern_data", patternDataJson)
        .maybeSingle();

      if (selectError && !isSchemaCacheError(selectError)) {
        console.error("[savePattern] Select error", selectError);
        // Continue to try insert anyway
      }

      // If pattern exists, update it (increment frequency)
      if (existingPattern) {
        const newFrequency = existingPattern.frequency + 1;
        const newConfidence = Math.min(100, existingPattern.confidence_score + 5); // Increase confidence with each observation

        const { error: updateError } = await supabase
          .from("user_patterns")
          .update({
            frequency: newFrequency,
            confidence_score: newConfidence,
            last_seen_at: new Date().toISOString(),
            metadata: metadata || {},
          })
          .eq("id", existingPattern.id);

        if (updateError) {
          console.error("[savePattern] Update error", updateError);
          return { success: false, error: updateError.message };
        }

        console.log(`[savePattern] Updated existing pattern, frequency: ${newFrequency}`);
        return { success: true, patternId: existingPattern.id };
      }

      // Pattern doesn't exist, insert new one
      const { data, error } = await supabase
        .from("user_patterns")
        .insert({
          user_id: userId,
          pattern_type: patternType,
          pattern_data: patternDataJson,
          frequency: 1,
          confidence_score: 10, // Initial confidence
          metadata: metadata || {},
        })
        .select("id")
        .single();

      if (error) {
        // Handle duplicate key error (race condition - another request inserted the same pattern)
        if (isDuplicateKeyError(error)) {
          console.log("[savePattern] Duplicate key detected, attempting to update existing pattern");
          
          // Fetch and update the existing pattern
          const { data: racePattern } = await supabase
            .from("user_patterns")
            .select("id, frequency, confidence_score")
            .eq("user_id", userId)
            .eq("pattern_type", patternType)
            .eq("pattern_data", patternDataJson)
            .single();

          if (racePattern) {
            const { error: raceUpdateError } = await supabase
              .from("user_patterns")
              .update({
                frequency: racePattern.frequency + 1,
                confidence_score: Math.min(100, racePattern.confidence_score + 5),
                last_seen_at: new Date().toISOString(),
              })
              .eq("id", racePattern.id);

            if (!raceUpdateError) {
              return { success: true, patternId: racePattern.id };
            }
          }
          
          // If we can't update, still consider it a success (pattern exists)
          return { success: true, error: "Pattern already exists" };
        }

        // Check if this is a schema cache error and we have retries left
        if (isSchemaCacheError(error) && attempt < maxRetries) {
          const delay = retryDelays[attempt];
          console.warn(
            `[savePattern] Schema cache miss (PGRST205), retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
          );
          await sleep(delay);
          continue; // Retry
        }

        // Non-retryable error or out of retries
        if (isSchemaCacheError(error)) {
          console.warn(
            "[savePattern] Schema cache still not refreshed after all retries. Pattern save skipped (non-critical)."
          );
        } else {
          console.error("[savePattern] Insert error", error);
        }
        return { success: false, error: error.message };
      }

      // Success!
      if (attempt > 0) {
        console.log(`[savePattern] Successfully saved pattern after ${attempt} retry(ies)`);
      }
      return { success: true, patternId: data.id };
    } catch (err) {
      // Check if this is a schema cache error in the exception
      const errorObj = err as { code?: string; message?: string };
      if (isSchemaCacheError(errorObj) && attempt < maxRetries) {
        const delay = retryDelays[attempt];
        console.warn(
          `[savePattern] Schema cache exception, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
        );
        await sleep(delay);
        continue; // Retry
      }

      // Non-retryable exception or out of retries
      console.error("[savePattern] Exception", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to save pattern",
      };
    }
  }

  // Should never reach here, but TypeScript needs this
  return {
    success: false,
    error: "Failed to save pattern after all retries",
  };
}

/**
 * Get all patterns for a user, optionally filtered by type
 */
export async function getUserPatterns(
  userId: string,
  patternType?: PatternType
): Promise<UserPattern[]> {
  try {
    const supabase = getSupabaseClient();

    let query = supabase
      .from("user_patterns")
      .select("*")
      .eq("user_id", userId)
      .order("confidence_score", { ascending: false })
      .order("last_seen_at", { ascending: false });

    if (patternType) {
      query = query.eq("pattern_type", patternType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[getUserPatterns] Error", error);
      return [];
    }

    return (data || []).map((p) => ({
      id: p.id,
      user_id: p.user_id,
      pattern_type: p.pattern_type as PatternType,
      pattern_data: p.pattern_data as PatternData,
      frequency: p.frequency,
      confidence_score: p.confidence_score,
      last_seen_at: p.last_seen_at,
      first_seen_at: p.first_seen_at,
      metadata: (p.metadata || {}) as Record<string, unknown>,
    }));
  } catch (err) {
    console.error("[getUserPatterns] Exception", err);
    return [];
  }
}

/**
 * Update pattern frequency
 */
export async function updatePatternFrequency(
  patternId: string,
  increment: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // Get current frequency
    const { data: pattern } = await supabase
      .from("user_patterns")
      .select("frequency")
      .eq("id", patternId)
      .single();

    if (!pattern) {
      return { success: false, error: "Pattern not found" };
    }

    const newFrequency = pattern.frequency + increment;

    const { error } = await supabase
      .from("user_patterns")
      .update({
        frequency: newFrequency,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", patternId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update frequency",
    };
  }
}

/**
 * Merge similar patterns
 */
export async function mergePatterns(
  existingPatternId: string,
  newPatternData: PatternData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    const { data: existing } = await supabase
      .from("user_patterns")
      .select("*")
      .eq("id", existingPatternId)
      .single();

    if (!existing) {
      return { success: false, error: "Pattern not found" };
    }

    // Merge pattern data (simplified - would need type-specific merging logic)
    const mergedData = {
      ...(existing.pattern_data as Record<string, unknown>),
      ...(newPatternData as unknown as Record<string, unknown>),
    };

    const { error } = await supabase
      .from("user_patterns")
      .update({
        pattern_data: mergedData,
        frequency: existing.frequency + 1,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", existingPatternId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to merge patterns",
    };
  }
}

/**
 * Get pattern-based suggestions for a given context
 */
export async function getPatternSuggestions(
  userId: string,
  context: {
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
  }
): Promise<{
  suggestedCategory?: string;
  suggestedTags?: string[];
  suggestedPriority?: string;
  suggestedDueTime?: string;
}> {
  try {
    const patterns = await getUserPatterns(userId);

    const categoryPatterns = patterns.filter((p) => p.pattern_type === "category");
    const tagPatterns = patterns.filter((p) => p.pattern_type === "tags");
    const priorityPatterns = patterns.filter((p) => p.pattern_type === "priority");
    const timingPatterns = patterns.filter((p) => p.pattern_type === "timing");

    const suggestions: {
      suggestedCategory?: string;
      suggestedTags?: string[];
      suggestedPriority?: string;
      suggestedDueTime?: string;
    } = {};

    // Suggest category based on patterns
    if (categoryPatterns.length > 0 && !context.category) {
      const mostRecent = categoryPatterns[0];
      const patternData = mostRecent.pattern_data as {
        mostUsedCategories?: Array<{ category: string; count: number }>;
      };
      if (patternData.mostUsedCategories && patternData.mostUsedCategories.length > 0) {
        suggestions.suggestedCategory = patternData.mostUsedCategories[0].category;
      }
    }

    // Suggest tags based on patterns
    if (tagPatterns.length > 0) {
      const mostRecent = tagPatterns[0];
      const patternData = mostRecent.pattern_data as {
        mostCommonTags?: Array<{ tag: string; count: number }>;
      };
      if (patternData.mostCommonTags && patternData.mostCommonTags.length > 0) {
        suggestions.suggestedTags = patternData.mostCommonTags
          .slice(0, 3)
          .map((t) => t.tag);
      }
    }

    // Suggest priority based on patterns
    if (priorityPatterns.length > 0) {
      const mostRecent = priorityPatterns[0];
      const patternData = mostRecent.pattern_data as {
        defaultPriority?: string;
        priorityByContext?: Record<string, string>;
      };
      if (context.category && patternData.priorityByContext?.[context.category]) {
        suggestions.suggestedPriority = patternData.priorityByContext[context.category];
      } else if (patternData.defaultPriority) {
        suggestions.suggestedPriority = patternData.defaultPriority;
      }
    }

    // Suggest due time based on patterns
    if (timingPatterns.length > 0) {
      const mostRecent = timingPatterns[0];
      const patternData = mostRecent.pattern_data as {
        preferredDueTimes?: string[];
      };
      if (patternData.preferredDueTimes && patternData.preferredDueTimes.length > 0) {
        suggestions.suggestedDueTime = patternData.preferredDueTimes[0];
      }
    }

    return suggestions;
  } catch (err) {
    console.error("[getPatternSuggestions] Exception", err);
    return {};
  }
}

