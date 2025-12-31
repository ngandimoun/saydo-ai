/**
 * Voice Context Service
 * 
 * Robust long-term memory service that correlates voice recordings across
 * days, weeks, and months. Never forgets - provides tiered context for AI agents.
 * 
 * Memory Tiers:
 * - Today: Full transcriptions with timestamps
 * - Past 2 days: Detailed summaries with key points
 * - Past week: Topic-focused summaries
 * - Past month: High-level themes and patterns
 */

import { createClient } from "@supabase/supabase-js";

// Create Supabase client for server-side operations
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Voice recording from database
 */
export interface VoiceRecording {
  id: string;
  user_id: string;
  transcription: string | null;
  ai_summary: string | null;
  duration_seconds: number;
  created_at: string;
  status: string;
}

/**
 * Voice summary from database
 */
export interface VoiceSummary {
  id: string;
  user_id: string;
  period_type: "daily" | "weekly" | "monthly";
  period_start: string;
  period_end: string;
  summary_content: string;
  key_topics: string[];
  key_entities: string[];
  sentiment: string | null;
  voice_recording_ids: string[];
  recording_count: number;
  total_duration_seconds: number;
  language: string;
}

/**
 * Full voice context for AI agents
 */
export interface VoiceContext {
  today: TodayContext;
  pastTwoDays: PeriodContext;
  pastWeek: PeriodContext;
  pastMonth: PeriodContext;
  combinedContext: string;
}

/**
 * Today's detailed context
 */
export interface TodayContext {
  recordings: Array<{
    id: string;
    transcription: string;
    timestamp: string;
    durationSeconds: number;
  }>;
  totalRecordings: number;
  totalDurationSeconds: number;
  fullText: string;
}

/**
 * Period summary context
 */
export interface PeriodContext {
  summary: string | null;
  keyTopics: string[];
  keyEntities: string[];
  recordingCount: number;
  available: boolean;
}

/**
 * Get today's voice recordings with full transcriptions
 */
export async function getTodayVoiceContext(userId: string): Promise<TodayContext> {
  const supabase = getSupabaseClient();
  
  // Get start of today in UTC
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data: recordings, error } = await supabase
    .from("voice_recordings")
    .select("id, transcription, created_at, duration_seconds, status")
    .eq("user_id", userId)
    .gte("created_at", today.toISOString())
    .eq("status", "completed")
    .not("transcription", "is", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getTodayVoiceContext] Error fetching recordings:", error);
    return {
      recordings: [],
      totalRecordings: 0,
      totalDurationSeconds: 0,
      fullText: "",
    };
  }

  const validRecordings = (recordings || []).filter(r => r.transcription);
  
  const formattedRecordings = validRecordings.map(r => ({
    id: r.id,
    transcription: r.transcription || "",
    timestamp: r.created_at,
    durationSeconds: r.duration_seconds || 0,
  }));

  // Build full text with timestamps for context
  const fullText = formattedRecordings
    .map(r => {
      const time = new Date(r.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return `[${time}] ${r.transcription}`;
    })
    .join("\n\n");

  return {
    recordings: formattedRecordings,
    totalRecordings: formattedRecordings.length,
    totalDurationSeconds: formattedRecordings.reduce((sum, r) => sum + r.durationSeconds, 0),
    fullText,
  };
}

/**
 * Get past 2 days voice context (excluding today)
 */
export async function getPastTwoDaysContext(userId: string): Promise<PeriodContext> {
  const supabase = getSupabaseClient();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // First try to get from summaries
  const { data: summaries } = await supabase
    .from("voice_summaries")
    .select("*")
    .eq("user_id", userId)
    .eq("period_type", "daily")
    .gte("period_start", twoDaysAgo.toISOString().split("T")[0])
    .lt("period_start", today.toISOString().split("T")[0])
    .order("period_start", { ascending: false });

  if (summaries && summaries.length > 0) {
    // Combine daily summaries
    const combinedSummary = summaries
      .map(s => `## ${new Date(s.period_start).toLocaleDateString()}\n${s.summary_content}`)
      .join("\n\n");
    
    const allTopics = [...new Set(summaries.flatMap(s => s.key_topics || []))];
    const allEntities = [...new Set(summaries.flatMap(s => s.key_entities || []))];
    const totalCount = summaries.reduce((sum, s) => sum + (s.recording_count || 0), 0);

    return {
      summary: combinedSummary,
      keyTopics: allTopics,
      keyEntities: allEntities,
      recordingCount: totalCount,
      available: true,
    };
  }

  // Fallback: fetch raw recordings and summarize on the fly
  const { data: recordings } = await supabase
    .from("voice_recordings")
    .select("id, transcription, created_at")
    .eq("user_id", userId)
    .gte("created_at", twoDaysAgo.toISOString())
    .lt("created_at", today.toISOString())
    .eq("status", "completed")
    .not("transcription", "is", null)
    .order("created_at", { ascending: false });

  if (!recordings || recordings.length === 0) {
    return {
      summary: null,
      keyTopics: [],
      keyEntities: [],
      recordingCount: 0,
      available: false,
    };
  }

  // Create a simple combined summary
  const combinedText = recordings
    .map(r => r.transcription)
    .filter(Boolean)
    .join("\n\n");

  return {
    summary: combinedText.length > 500 ? combinedText.substring(0, 500) + "..." : combinedText,
    keyTopics: [],
    keyEntities: [],
    recordingCount: recordings.length,
    available: true,
  };
}

/**
 * Get past week voice context (summaries preferred)
 */
export async function getWeekVoiceContext(userId: string): Promise<PeriodContext> {
  const supabase = getSupabaseClient();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // First try weekly summary
  const { data: weeklySummary } = await supabase
    .from("voice_summaries")
    .select("*")
    .eq("user_id", userId)
    .eq("period_type", "weekly")
    .gte("period_start", weekAgo.toISOString().split("T")[0])
    .order("period_start", { ascending: false })
    .limit(1)
    .single();

  if (weeklySummary) {
    return {
      summary: weeklySummary.summary_content,
      keyTopics: weeklySummary.key_topics || [],
      keyEntities: weeklySummary.key_entities || [],
      recordingCount: weeklySummary.recording_count || 0,
      available: true,
    };
  }

  // Fallback: combine daily summaries
  const { data: dailySummaries } = await supabase
    .from("voice_summaries")
    .select("*")
    .eq("user_id", userId)
    .eq("period_type", "daily")
    .gte("period_start", weekAgo.toISOString().split("T")[0])
    .lt("period_start", today.toISOString().split("T")[0])
    .order("period_start", { ascending: false });

  if (dailySummaries && dailySummaries.length > 0) {
    const combinedSummary = dailySummaries
      .map(s => `**${new Date(s.period_start).toLocaleDateString()}**: ${s.summary_content}`)
      .join("\n\n");
    
    const allTopics = [...new Set(dailySummaries.flatMap(s => s.key_topics || []))];
    const allEntities = [...new Set(dailySummaries.flatMap(s => s.key_entities || []))];
    const totalCount = dailySummaries.reduce((sum, s) => sum + (s.recording_count || 0), 0);

    return {
      summary: combinedSummary,
      keyTopics: allTopics,
      keyEntities: allEntities,
      recordingCount: totalCount,
      available: true,
    };
  }

  // No summaries available
  return {
    summary: null,
    keyTopics: [],
    keyEntities: [],
    recordingCount: 0,
    available: false,
  };
}

/**
 * Get past month voice context (high-level themes)
 */
export async function getMonthVoiceContext(userId: string): Promise<PeriodContext> {
  const supabase = getSupabaseClient();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  // First try monthly summary
  const { data: monthlySummary } = await supabase
    .from("voice_summaries")
    .select("*")
    .eq("user_id", userId)
    .eq("period_type", "monthly")
    .gte("period_start", monthAgo.toISOString().split("T")[0])
    .order("period_start", { ascending: false })
    .limit(1)
    .single();

  if (monthlySummary) {
    return {
      summary: monthlySummary.summary_content,
      keyTopics: monthlySummary.key_topics || [],
      keyEntities: monthlySummary.key_entities || [],
      recordingCount: monthlySummary.recording_count || 0,
      available: true,
    };
  }

  // Fallback: combine weekly summaries
  const { data: weeklySummaries } = await supabase
    .from("voice_summaries")
    .select("*")
    .eq("user_id", userId)
    .eq("period_type", "weekly")
    .gte("period_start", monthAgo.toISOString().split("T")[0])
    .order("period_start", { ascending: false });

  if (weeklySummaries && weeklySummaries.length > 0) {
    const combinedSummary = weeklySummaries
      .map(s => `**Week of ${new Date(s.period_start).toLocaleDateString()}**: ${s.summary_content}`)
      .join("\n\n");
    
    const allTopics = [...new Set(weeklySummaries.flatMap(s => s.key_topics || []))];
    const allEntities = [...new Set(weeklySummaries.flatMap(s => s.key_entities || []))];
    const totalCount = weeklySummaries.reduce((sum, s) => sum + (s.recording_count || 0), 0);

    return {
      summary: combinedSummary,
      keyTopics: allTopics,
      keyEntities: allEntities,
      recordingCount: totalCount,
      available: true,
    };
  }

  // No summaries available
  return {
    summary: null,
    keyTopics: [],
    keyEntities: [],
    recordingCount: 0,
    available: false,
  };
}

/**
 * Get full voice context combining all tiers
 * This is the main function agents should use
 */
export async function getFullVoiceContext(userId: string): Promise<VoiceContext> {
  // Fetch all contexts in parallel
  const [today, pastTwoDays, pastWeek, pastMonth] = await Promise.all([
    getTodayVoiceContext(userId),
    getPastTwoDaysContext(userId),
    getWeekVoiceContext(userId),
    getMonthVoiceContext(userId),
  ]);

  // Build combined context string for AI agents
  const sections: string[] = [];

  if (today.totalRecordings > 0) {
    sections.push(`## TODAY'S VOICE NOTES (${today.totalRecordings} recordings)\n${today.fullText}`);
  }

  if (pastTwoDays.available && pastTwoDays.summary) {
    sections.push(`## PAST 2 DAYS SUMMARY\n${pastTwoDays.summary}`);
  }

  if (pastWeek.available && pastWeek.summary) {
    const topicsStr = pastWeek.keyTopics.length > 0 
      ? `\nKey Topics: ${pastWeek.keyTopics.join(", ")}` 
      : "";
    sections.push(`## PAST WEEK SUMMARY${topicsStr}\n${pastWeek.summary}`);
  }

  if (pastMonth.available && pastMonth.summary) {
    const topicsStr = pastMonth.keyTopics.length > 0 
      ? `\nKey Themes: ${pastMonth.keyTopics.join(", ")}` 
      : "";
    sections.push(`## PAST MONTH THEMES${topicsStr}\n${pastMonth.summary}`);
  }

  const combinedContext = sections.length > 0 
    ? sections.join("\n\n---\n\n")
    : "No voice recordings found.";

  return {
    today,
    pastTwoDays,
    pastWeek,
    pastMonth,
    combinedContext,
  };
}

/**
 * Find relevant voice context for a specific query
 * Uses keyword matching for now, can be upgraded to semantic search
 */
export async function findRelevantContext(
  query: string,
  userId: string
): Promise<{
  relevantRecordings: Array<{
    id: string;
    transcription: string;
    timestamp: string;
    relevanceScore: number;
  }>;
  contextSummary: string;
}> {
  const supabase = getSupabaseClient();
  
  // Get recordings from past month
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const { data: recordings } = await supabase
    .from("voice_recordings")
    .select("id, transcription, created_at")
    .eq("user_id", userId)
    .gte("created_at", monthAgo.toISOString())
    .eq("status", "completed")
    .not("transcription", "is", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!recordings || recordings.length === 0) {
    return {
      relevantRecordings: [],
      contextSummary: "No relevant voice recordings found.",
    };
  }

  // Simple keyword-based relevance scoring
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const scoredRecordings = recordings
    .map(r => {
      const text = (r.transcription || "").toLowerCase();
      let score = 0;
      
      for (const word of queryWords) {
        if (text.includes(word)) {
          score += 1;
          // Boost for exact word match
          const regex = new RegExp(`\\b${word}\\b`, "gi");
          const matches = text.match(regex);
          if (matches) {
            score += matches.length * 0.5;
          }
        }
      }
      
      return {
        id: r.id,
        transcription: r.transcription || "",
        timestamp: r.created_at,
        relevanceScore: score,
      };
    })
    .filter(r => r.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 10);

  const contextSummary = scoredRecordings.length > 0
    ? scoredRecordings
        .map(r => {
          const date = new Date(r.timestamp).toLocaleDateString();
          return `[${date}] ${r.transcription}`;
        })
        .join("\n\n")
    : "No relevant voice recordings found.";

  return {
    relevantRecordings: scoredRecordings,
    contextSummary,
  };
}

/**
 * Save or update a voice summary
 */
export async function saveVoiceSummary(
  userId: string,
  periodType: "daily" | "weekly" | "monthly",
  periodStart: Date,
  periodEnd: Date,
  summary: {
    content: string;
    keyTopics: string[];
    keyEntities: string[];
    sentiment?: string;
    voiceRecordingIds: string[];
    recordingCount: number;
    totalDurationSeconds: number;
    language: string;
    model?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("voice_summaries")
    .upsert({
      user_id: userId,
      period_type: periodType,
      period_start: periodStart.toISOString().split("T")[0],
      period_end: periodEnd.toISOString().split("T")[0],
      summary_content: summary.content,
      key_topics: summary.keyTopics,
      key_entities: summary.keyEntities,
      sentiment: summary.sentiment,
      voice_recording_ids: summary.voiceRecordingIds,
      recording_count: summary.recordingCount,
      total_duration_seconds: summary.totalDurationSeconds,
      language: summary.language,
      model_used: summary.model,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,period_type,period_start",
    });

  if (error) {
    console.error("[saveVoiceSummary] Error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Check if summaries need to be updated
 * Called periodically or after new recordings
 */
export async function checkAndUpdateSummaries(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if yesterday's daily summary exists
  const { data: existingSummary } = await supabase
    .from("voice_summaries")
    .select("id")
    .eq("user_id", userId)
    .eq("period_type", "daily")
    .eq("period_start", yesterday.toISOString().split("T")[0])
    .single();

  if (!existingSummary) {
    // Need to generate yesterday's summary
    // This would be triggered by a background job or after recordings
    console.log(`[checkAndUpdateSummaries] Need to generate daily summary for ${yesterday.toISOString().split("T")[0]}`);
    // The actual generation would be done by calling an AI agent
  }
}

/**
 * Get voice context statistics for a user
 */
export async function getVoiceContextStats(userId: string): Promise<{
  totalRecordings: number;
  totalDurationSeconds: number;
  oldestRecording: string | null;
  newestRecording: string | null;
  summariesAvailable: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}> {
  const supabase = getSupabaseClient();

  const [recordingsResult, summariesResult] = await Promise.all([
    supabase
      .from("voice_recordings")
      .select("id, created_at, duration_seconds")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: true }),
    supabase
      .from("voice_summaries")
      .select("period_type")
      .eq("user_id", userId),
  ]);

  const recordings = recordingsResult.data || [];
  const summaries = summariesResult.data || [];

  const dailyCount = summaries.filter(s => s.period_type === "daily").length;
  const weeklyCount = summaries.filter(s => s.period_type === "weekly").length;
  const monthlyCount = summaries.filter(s => s.period_type === "monthly").length;

  return {
    totalRecordings: recordings.length,
    totalDurationSeconds: recordings.reduce((sum, r) => sum + (r.duration_seconds || 0), 0),
    oldestRecording: recordings.length > 0 ? recordings[0].created_at : null,
    newestRecording: recordings.length > 0 ? recordings[recordings.length - 1].created_at : null,
    summariesAvailable: {
      daily: dailyCount,
      weekly: weeklyCount,
      monthly: monthlyCount,
    },
  };
}



