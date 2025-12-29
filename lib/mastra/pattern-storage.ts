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
 * Save or update a pattern in the database
 */
export async function savePattern(
  userId: string,
  patternType: PatternType,
  patternData: PatternData,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; patternId?: string; error?: string }> {
  try {
    const supabase = getSupabaseClient();

    // Insert new pattern observation
    // Note: We create a new pattern entry for each observation
    // The analysis endpoint will aggregate these into consolidated patterns
    const { data, error } = await supabase
      .from("user_patterns")
      .insert({
        user_id: userId,
        pattern_type: patternType,
        pattern_data: patternData as unknown as Record<string, unknown>,
        frequency: 1,
        confidence_score: 10, // Initial confidence
        metadata: metadata || {},
      })
      .select("id")
      .single();

    if (error) {
      console.error("[savePattern] Insert error", error);
      return { success: false, error: error.message };
    }

    return { success: true, patternId: data.id };
  } catch (err) {
    console.error("[savePattern] Exception", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save pattern",
    };
  }
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

