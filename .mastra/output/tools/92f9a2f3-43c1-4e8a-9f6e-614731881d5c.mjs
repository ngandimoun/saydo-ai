import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}
const getUserProfileTool = createTool({
  id: "get-user-profile",
  description: "Fetches complete user context including profile, language preference, profession, health data, allergies, and interests from the database. Use this to personalize responses.",
  inputSchema: z.object({
    userId: z.string().describe("The user's unique identifier (UUID)")
  }),
  outputSchema: z.object({
    userId: z.string(),
    language: z.string(),
    preferredName: z.string(),
    profession: z.object({
      id: z.string(),
      name: z.string()
    }).nullable(),
    criticalArtifacts: z.array(z.string()),
    socialIntelligence: z.array(z.string()),
    newsFocus: z.array(z.string()),
    gender: z.string().nullable(),
    age: z.number().nullable(),
    bloodGroup: z.string().nullable(),
    bodyType: z.string().nullable(),
    weight: z.number().nullable(),
    skinTone: z.string().nullable(),
    allergies: z.array(z.string()),
    healthInterests: z.array(z.string())
  }),
  execute: async ({ userId }) => {
    const supabase = getSupabaseClient();
    const [
      profileResult,
      allergiesResult,
      healthInterestsResult,
      criticalArtifactsResult,
      socialIntelligenceResult,
      newsFocusResult
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("user_allergies").select("allergy").eq("user_id", userId),
      supabase.from("user_health_interests").select("interest").eq("user_id", userId),
      supabase.from("user_critical_artifacts").select("artifact_name").eq("user_id", userId),
      supabase.from("user_social_intelligence").select("source_id").eq("user_id", userId),
      supabase.from("user_news_focus").select("vertical_id").eq("user_id", userId)
    ]);
    const profile = profileResult.data;
    if (!profile) {
      return {
        userId,
        language: "en",
        preferredName: "there",
        profession: null,
        criticalArtifacts: [],
        socialIntelligence: [],
        newsFocus: [],
        gender: null,
        age: null,
        bloodGroup: null,
        bodyType: null,
        weight: null,
        skinTone: null,
        allergies: [],
        healthInterests: []
      };
    }
    return {
      userId,
      language: profile.language || "en",
      preferredName: profile.preferred_name || "there",
      profession: profile.profession ? {
        id: profile.profession_id || profile.profession.toLowerCase().replace(/\s+/g, "-"),
        name: profile.profession
      } : null,
      criticalArtifacts: criticalArtifactsResult.data?.map((a) => a.artifact_name) || [],
      socialIntelligence: socialIntelligenceResult.data?.map((s) => s.source_id) || [],
      newsFocus: newsFocusResult.data?.map((n) => n.vertical_id) || [],
      gender: profile.gender || null,
      age: profile.age ? Number(profile.age) : null,
      bloodGroup: profile.blood_group || null,
      bodyType: profile.body_type || null,
      weight: profile.weight ? Number(profile.weight) : null,
      skinTone: profile.skin_tone || null,
      allergies: allergiesResult.data?.map((a) => a.allergy) || [],
      healthInterests: healthInterestsResult.data?.map((h) => h.interest) || []
    };
  }
});
async function getUserContext(userId) {
  const result = await getUserProfileTool.execute?.({ userId });
  return result;
}
async function getUserTimezone(userId) {
  try {
    const supabase = getSupabaseClient();
    const { data: location, error } = await supabase.from("user_locations").select("timezone").eq("user_id", userId).not("timezone", "is", null).order("created_at", { ascending: false }).limit(1).single();
    if (!error && location?.timezone) {
      return location.timezone;
    }
  } catch (err) {
    console.warn("[getUserTimezone] Failed to fetch user timezone, using server timezone", {
      userId,
      error: err instanceof Error ? err.message : "Unknown error"
    });
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export { getUserContext, getUserProfileTool, getUserTimezone };
