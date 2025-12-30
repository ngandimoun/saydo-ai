import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// User context interface matching onboarding data
export interface UserContext {
  userId: string;
  language: string;
  preferredName: string;
  profession: { id: string; name: string } | null;
  criticalArtifacts: string[];
  socialIntelligence: string[];
  newsFocus: string[];
  // Health profile
  gender: string | null;
  age: number | null;
  bloodGroup: string | null;
  bodyType: string | null;
  weight: number | null;
  skinTone: string | null;
  allergies: string[];
  healthInterests: string[];
}

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
 * Tool to fetch complete user context from all onboarding tables.
 * This includes profile data, health information, preferences, and interests.
 * Used to personalize AI responses based on user's language, profession, and health profile.
 */
export const getUserProfileTool = createTool({
  id: "get-user-profile",
  description:
    "Fetches complete user context including profile, language preference, profession, health data, allergies, and interests from the database. Use this to personalize responses.",
  inputSchema: z.object({
    userId: z.string().describe("The user's unique identifier (UUID)"),
  }),
  outputSchema: z.object({
    userId: z.string(),
    language: z.string(),
    preferredName: z.string(),
    profession: z
      .object({
        id: z.string(),
        name: z.string(),
      })
      .nullable(),
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
    healthInterests: z.array(z.string()),
  }),
  execute: async ({ userId }): Promise<UserContext> => {
    const supabase = getSupabaseClient();

    // Fetch all user data in parallel
    const [
      profileResult,
      allergiesResult,
      healthInterestsResult,
      criticalArtifactsResult,
      socialIntelligenceResult,
      newsFocusResult,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("user_allergies").select("allergy").eq("user_id", userId),
      supabase
        .from("user_health_interests")
        .select("interest")
        .eq("user_id", userId),
      supabase
        .from("user_critical_artifacts")
        .select("artifact_name")
        .eq("user_id", userId),
      supabase
        .from("user_social_intelligence")
        .select("source_id")
        .eq("user_id", userId),
      supabase
        .from("user_news_focus")
        .select("vertical_id")
        .eq("user_id", userId),
    ]);

    const profile = profileResult.data;

    if (!profile) {
      // Return default context if profile not found
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
        healthInterests: [],
      };
    }

    return {
      userId,
      language: profile.language || "en",
      preferredName: profile.preferred_name || "there",
      profession: profile.profession
        ? {
            id: profile.profession_id || profile.profession.toLowerCase().replace(/\s+/g, "-"),
            name: profile.profession,
          }
        : null,
      criticalArtifacts:
        criticalArtifactsResult.data?.map((a) => a.artifact_name) || [],
      socialIntelligence:
        socialIntelligenceResult.data?.map((s) => s.source_id) || [],
      newsFocus: newsFocusResult.data?.map((n) => n.vertical_id) || [],
      gender: profile.gender || null,
      age: profile.age ? Number(profile.age) : null,
      bloodGroup: profile.blood_group || null,
      bodyType: profile.body_type || null,
      weight: profile.weight ? Number(profile.weight) : null,
      skinTone: profile.skin_tone || null,
      allergies: allergiesResult.data?.map((a) => a.allergy) || [],
      healthInterests:
        healthInterestsResult.data?.map((h) => h.interest) || [],
    };
  },
});

/**
 * Helper function to get user context directly (for use in API routes)
 */
export async function getUserContext(userId: string): Promise<UserContext> {
  const result = await getUserProfileTool.execute?.({ userId });
  return result as UserContext;
}

/**
 * Helper function to fetch user's latest timezone from user_locations table
 * Falls back to server timezone if user timezone not available
 */
export async function getUserTimezone(userId: string): Promise<string> {
  try {
    const supabase = getSupabaseClient();
    
    // Fetch latest user location with timezone
    const { data: location, error } = await supabase
      .from('user_locations')
      .select('timezone')
      .eq('user_id', userId)
      .not('timezone', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!error && location?.timezone) {
      return location.timezone;
    }
  } catch (err) {
    console.warn('[getUserTimezone] Failed to fetch user timezone, using server timezone', {
      userId,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
  }
  
  // Fallback to server timezone
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Extended user context for content generation
 * Includes profession-specific guidance and platform preferences
 */
export interface FullUserContext extends UserContext {
  // Computed profession guidance
  professionGuidance: {
    defaultContentTypes: string[];
    commonTerminology: string[];
    formalityLevel: "formal" | "casual" | "professional";
    typicalOutputs: string[];
  };
  // Social platform details
  socialPlatformDetails: Array<{
    id: string;
    name: string;
    characterLimit?: number;
  }>;
  // Recent content generation history
  recentContentTypes: string[];
  // Locale info
  locale: {
    timezone: string;
    dateFormat: string;
    language: string;
  };
}

/**
 * Profession guidance mapping
 */
const PROFESSION_GUIDANCE: Record<string, {
  defaultContentTypes: string[];
  commonTerminology: string[];
  formalityLevel: "formal" | "casual" | "professional";
  typicalOutputs: string[];
}> = {
  nurse: {
    defaultContentTypes: ["shift_report", "patient_notes", "handoff", "medication_log"],
    commonTerminology: ["patient", "vitals", "medication", "shift", "discharge", "admission"],
    formalityLevel: "professional",
    typicalOutputs: ["Shift Report", "Patient Summary", "Handoff Notes", "Care Plan"],
  },
  doctor: {
    defaultContentTypes: ["consultation_notes", "patient_report", "prescription", "referral"],
    commonTerminology: ["diagnosis", "treatment", "prognosis", "prescription", "referral"],
    formalityLevel: "formal",
    typicalOutputs: ["Medical Report", "Consultation Notes", "Referral Letter", "Treatment Plan"],
  },
  founder: {
    defaultContentTypes: ["social_post", "investor_update", "team_memo", "product_insight"],
    commonTerminology: ["startup", "growth", "metrics", "runway", "product", "team"],
    formalityLevel: "casual",
    typicalOutputs: ["X Post", "LinkedIn Post", "Investor Update", "Team Memo"],
  },
  entrepreneur: {
    defaultContentTypes: ["social_post", "pitch", "business_plan", "partnership_note"],
    commonTerminology: ["business", "growth", "revenue", "partnership", "market"],
    formalityLevel: "professional",
    typicalOutputs: ["Social Post", "Pitch Summary", "Business Update", "Partnership Proposal"],
  },
  pastor: {
    defaultContentTypes: ["sermon_notes", "church_announcement", "prayer_points", "bible_study"],
    commonTerminology: ["sermon", "scripture", "congregation", "ministry", "prayer"],
    formalityLevel: "formal",
    typicalOutputs: ["Sermon Outline", "Church Announcement", "Prayer Points", "Devotional"],
  },
  manager: {
    defaultContentTypes: ["team_update", "performance_review", "meeting_notes", "project_status"],
    commonTerminology: ["team", "project", "deadline", "performance", "goal"],
    formalityLevel: "professional",
    typicalOutputs: ["Team Update", "Meeting Notes", "Project Status", "Performance Review"],
  },
  consultant: {
    defaultContentTypes: ["client_report", "analysis", "recommendations", "proposal"],
    commonTerminology: ["client", "analysis", "recommendation", "strategy", "implementation"],
    formalityLevel: "formal",
    typicalOutputs: ["Client Report", "Analysis Summary", "Recommendations", "Proposal"],
  },
  mechanic: {
    defaultContentTypes: ["repair_log", "service_record", "parts_list", "estimate"],
    commonTerminology: ["repair", "diagnosis", "parts", "service", "warranty"],
    formalityLevel: "casual",
    typicalOutputs: ["Repair Log", "Service Record", "Parts List", "Customer Estimate"],
  },
  default: {
    defaultContentTypes: ["summary", "email_draft", "notes", "report"],
    commonTerminology: [],
    formalityLevel: "professional",
    typicalOutputs: ["Summary", "Email Draft", "Notes", "Report"],
  },
};

/**
 * Social platform details
 */
const SOCIAL_PLATFORMS: Record<string, { name: string; characterLimit?: number }> = {
  twitter: { name: "X (Twitter)", characterLimit: 280 },
  linkedin: { name: "LinkedIn", characterLimit: 3000 },
  reddit: { name: "Reddit", characterLimit: 40000 },
  hackernews: { name: "Hacker News" },
  substack: { name: "Substack" },
  medium: { name: "Medium" },
  youtube: { name: "YouTube" },
  podcasts: { name: "Podcasts" },
};

/**
 * Get full user context with profession guidance and platform details
 */
export async function getFullUserContext(userId: string): Promise<FullUserContext> {
  const supabase = getSupabaseClient();
  
  // Get base user context
  const userContext = await getUserContext(userId);
  const timezone = await getUserTimezone(userId);
  
  // Get recent AI documents to understand content preferences
  const { data: recentDocs } = await supabase
    .from("ai_documents")
    .select("document_type")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })
    .limit(10);
  
  const recentContentTypes = [...new Set((recentDocs || []).map(d => d.document_type))];
  
  // Get profession guidance
  const professionKey = userContext.profession?.id?.toLowerCase() || "default";
  const professionGuidance = PROFESSION_GUIDANCE[professionKey] || PROFESSION_GUIDANCE.default;
  
  // Map social platforms to details
  const socialPlatformDetails = userContext.socialIntelligence.map(id => ({
    id,
    name: SOCIAL_PLATFORMS[id]?.name || id,
    characterLimit: SOCIAL_PLATFORMS[id]?.characterLimit,
  }));
  
  // Determine date format based on language
  const dateFormat = userContext.language === "en" ? "MM/DD/YYYY" :
                     userContext.language === "de" || userContext.language === "fr" ? "DD/MM/YYYY" :
                     "YYYY-MM-DD";
  
  return {
    ...userContext,
    professionGuidance,
    socialPlatformDetails,
    recentContentTypes,
    locale: {
      timezone,
      dateFormat,
      language: userContext.language,
    },
  };
}

/**
 * Get profession-specific content type suggestions
 */
export function getProfessionContentTypes(profession: string): string[] {
  const key = profession.toLowerCase().replace(/\s+/g, "_");
  return PROFESSION_GUIDANCE[key]?.defaultContentTypes || PROFESSION_GUIDANCE.default.defaultContentTypes;
}

/**
 * Get profession formality level
 */
export function getProfessionFormality(profession: string): "formal" | "casual" | "professional" {
  const key = profession.toLowerCase().replace(/\s+/g, "_");
  return PROFESSION_GUIDANCE[key]?.formalityLevel || PROFESSION_GUIDANCE.default.formalityLevel;
}

