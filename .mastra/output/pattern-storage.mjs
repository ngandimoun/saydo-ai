import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function isSchemaCacheError(error) {
  return error.code === "PGRST205";
}
async function savePattern(userId, patternType, patternData, metadata) {
  const maxRetries = 3;
  const retryDelays = [2e3, 4e3, 8e3];
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from("user_patterns").insert({
        user_id: userId,
        pattern_type: patternType,
        pattern_data: patternData,
        frequency: 1,
        confidence_score: 10,
        // Initial confidence
        metadata: metadata || {}
      }).select("id").single();
      if (error) {
        if (isSchemaCacheError(error) && attempt < maxRetries) {
          const delay = retryDelays[attempt];
          console.warn(
            `[savePattern] Schema cache miss (PGRST205), retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
          );
          await sleep(delay);
          continue;
        }
        if (isSchemaCacheError(error)) {
          console.warn(
            "[savePattern] Schema cache still not refreshed after all retries. Pattern save skipped (non-critical)."
          );
        } else {
          console.error("[savePattern] Insert error", error);
        }
        return { success: false, error: error.message };
      }
      if (attempt > 0) {
        console.log(`[savePattern] Successfully saved pattern after ${attempt} retry(ies)`);
      }
      return { success: true, patternId: data.id };
    } catch (err) {
      const errorObj = err;
      if (isSchemaCacheError(errorObj) && attempt < maxRetries) {
        const delay = retryDelays[attempt];
        console.warn(
          `[savePattern] Schema cache exception, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
        );
        await sleep(delay);
        continue;
      }
      console.error("[savePattern] Exception", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to save pattern"
      };
    }
  }
  return {
    success: false,
    error: "Failed to save pattern after all retries"
  };
}
async function getUserPatterns(userId, patternType) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from("user_patterns").select("*").eq("user_id", userId).order("confidence_score", { ascending: false }).order("last_seen_at", { ascending: false });
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
      pattern_type: p.pattern_type,
      pattern_data: p.pattern_data,
      frequency: p.frequency,
      confidence_score: p.confidence_score,
      last_seen_at: p.last_seen_at,
      first_seen_at: p.first_seen_at,
      metadata: p.metadata || {}
    }));
  } catch (err) {
    console.error("[getUserPatterns] Exception", err);
    return [];
  }
}

export { getUserPatterns, savePattern };
