import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}
async function getTodayVoiceContext(userId) {
  const supabase = getSupabaseClient();
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const { data: recordings, error } = await supabase.from("voice_recordings").select("id, transcription, created_at, duration_seconds, status").eq("user_id", userId).gte("created_at", today.toISOString()).eq("status", "completed").not("transcription", "is", null).order("created_at", { ascending: true });
  if (error) {
    console.error("[getTodayVoiceContext] Error fetching recordings:", error);
    return {
      recordings: [],
      totalRecordings: 0,
      totalDurationSeconds: 0,
      fullText: ""
    };
  }
  const validRecordings = (recordings || []).filter((r) => r.transcription);
  const formattedRecordings = validRecordings.map((r) => ({
    id: r.id,
    transcription: r.transcription || "",
    timestamp: r.created_at,
    durationSeconds: r.duration_seconds || 0
  }));
  const fullText = formattedRecordings.map((r) => {
    const time = new Date(r.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
    return `[${time}] ${r.transcription}`;
  }).join("\n\n");
  return {
    recordings: formattedRecordings,
    totalRecordings: formattedRecordings.length,
    totalDurationSeconds: formattedRecordings.reduce((sum, r) => sum + r.durationSeconds, 0),
    fullText
  };
}
async function getPastTwoDaysContext(userId) {
  const supabase = getSupabaseClient();
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const { data: summaries } = await supabase.from("voice_summaries").select("*").eq("user_id", userId).eq("period_type", "daily").gte("period_start", twoDaysAgo.toISOString().split("T")[0]).lt("period_start", today.toISOString().split("T")[0]).order("period_start", { ascending: false });
  if (summaries && summaries.length > 0) {
    const combinedSummary = summaries.map((s) => `## ${new Date(s.period_start).toLocaleDateString()}
${s.summary_content}`).join("\n\n");
    const allTopics = [...new Set(summaries.flatMap((s) => s.key_topics || []))];
    const allEntities = [...new Set(summaries.flatMap((s) => s.key_entities || []))];
    const totalCount = summaries.reduce((sum, s) => sum + (s.recording_count || 0), 0);
    return {
      summary: combinedSummary,
      keyTopics: allTopics,
      keyEntities: allEntities,
      recordingCount: totalCount,
      available: true
    };
  }
  const { data: recordings } = await supabase.from("voice_recordings").select("id, transcription, created_at").eq("user_id", userId).gte("created_at", twoDaysAgo.toISOString()).lt("created_at", today.toISOString()).eq("status", "completed").not("transcription", "is", null).order("created_at", { ascending: false });
  if (!recordings || recordings.length === 0) {
    return {
      summary: null,
      keyTopics: [],
      keyEntities: [],
      recordingCount: 0,
      available: false
    };
  }
  const combinedText = recordings.map((r) => r.transcription).filter(Boolean).join("\n\n");
  return {
    summary: combinedText.length > 500 ? combinedText.substring(0, 500) + "..." : combinedText,
    keyTopics: [],
    keyEntities: [],
    recordingCount: recordings.length,
    available: true
  };
}
async function getWeekVoiceContext(userId) {
  const supabase = getSupabaseClient();
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: weeklySummary } = await supabase.from("voice_summaries").select("*").eq("user_id", userId).eq("period_type", "weekly").gte("period_start", weekAgo.toISOString().split("T")[0]).order("period_start", { ascending: false }).limit(1).single();
  if (weeklySummary) {
    return {
      summary: weeklySummary.summary_content,
      keyTopics: weeklySummary.key_topics || [],
      keyEntities: weeklySummary.key_entities || [],
      recordingCount: weeklySummary.recording_count || 0,
      available: true
    };
  }
  const { data: dailySummaries } = await supabase.from("voice_summaries").select("*").eq("user_id", userId).eq("period_type", "daily").gte("period_start", weekAgo.toISOString().split("T")[0]).lt("period_start", today.toISOString().split("T")[0]).order("period_start", { ascending: false });
  if (dailySummaries && dailySummaries.length > 0) {
    const combinedSummary = dailySummaries.map((s) => `**${new Date(s.period_start).toLocaleDateString()}**: ${s.summary_content}`).join("\n\n");
    const allTopics = [...new Set(dailySummaries.flatMap((s) => s.key_topics || []))];
    const allEntities = [...new Set(dailySummaries.flatMap((s) => s.key_entities || []))];
    const totalCount = dailySummaries.reduce((sum, s) => sum + (s.recording_count || 0), 0);
    return {
      summary: combinedSummary,
      keyTopics: allTopics,
      keyEntities: allEntities,
      recordingCount: totalCount,
      available: true
    };
  }
  return {
    summary: null,
    keyTopics: [],
    keyEntities: [],
    recordingCount: 0,
    available: false
  };
}
async function getMonthVoiceContext(userId) {
  const supabase = getSupabaseClient();
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const { data: monthlySummary } = await supabase.from("voice_summaries").select("*").eq("user_id", userId).eq("period_type", "monthly").gte("period_start", monthAgo.toISOString().split("T")[0]).order("period_start", { ascending: false }).limit(1).single();
  if (monthlySummary) {
    return {
      summary: monthlySummary.summary_content,
      keyTopics: monthlySummary.key_topics || [],
      keyEntities: monthlySummary.key_entities || [],
      recordingCount: monthlySummary.recording_count || 0,
      available: true
    };
  }
  const { data: weeklySummaries } = await supabase.from("voice_summaries").select("*").eq("user_id", userId).eq("period_type", "weekly").gte("period_start", monthAgo.toISOString().split("T")[0]).order("period_start", { ascending: false });
  if (weeklySummaries && weeklySummaries.length > 0) {
    const combinedSummary = weeklySummaries.map((s) => `**Week of ${new Date(s.period_start).toLocaleDateString()}**: ${s.summary_content}`).join("\n\n");
    const allTopics = [...new Set(weeklySummaries.flatMap((s) => s.key_topics || []))];
    const allEntities = [...new Set(weeklySummaries.flatMap((s) => s.key_entities || []))];
    const totalCount = weeklySummaries.reduce((sum, s) => sum + (s.recording_count || 0), 0);
    return {
      summary: combinedSummary,
      keyTopics: allTopics,
      keyEntities: allEntities,
      recordingCount: totalCount,
      available: true
    };
  }
  return {
    summary: null,
    keyTopics: [],
    keyEntities: [],
    recordingCount: 0,
    available: false
  };
}
async function getFullVoiceContext(userId) {
  const [today, pastTwoDays, pastWeek, pastMonth] = await Promise.all([
    getTodayVoiceContext(userId),
    getPastTwoDaysContext(userId),
    getWeekVoiceContext(userId),
    getMonthVoiceContext(userId)
  ]);
  const sections = [];
  if (today.totalRecordings > 0) {
    sections.push(`## TODAY'S VOICE NOTES (${today.totalRecordings} recordings)
${today.fullText}`);
  }
  if (pastTwoDays.available && pastTwoDays.summary) {
    sections.push(`## PAST 2 DAYS SUMMARY
${pastTwoDays.summary}`);
  }
  if (pastWeek.available && pastWeek.summary) {
    const topicsStr = pastWeek.keyTopics.length > 0 ? `
Key Topics: ${pastWeek.keyTopics.join(", ")}` : "";
    sections.push(`## PAST WEEK SUMMARY${topicsStr}
${pastWeek.summary}`);
  }
  if (pastMonth.available && pastMonth.summary) {
    const topicsStr = pastMonth.keyTopics.length > 0 ? `
Key Themes: ${pastMonth.keyTopics.join(", ")}` : "";
    sections.push(`## PAST MONTH THEMES${topicsStr}
${pastMonth.summary}`);
  }
  const combinedContext = sections.length > 0 ? sections.join("\n\n---\n\n") : "No voice recordings found.";
  return {
    today,
    pastTwoDays,
    pastWeek,
    pastMonth,
    combinedContext
  };
}

export { getFullVoiceContext, getMonthVoiceContext, getPastTwoDaysContext, getTodayVoiceContext, getWeekVoiceContext };
