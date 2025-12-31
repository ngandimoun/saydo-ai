import { Memory } from "@mastra/memory";
import { saydoMemory, getFullWorkingMemory, FullUserContext, VoiceHistoryContext, ContentGenerationContext, SaydoThreadMetadata, getMemoryStorage, getThreadByResourceId, SkincareContext, HealthContext } from "./config";
import { getFullUserContext } from "../tools/user-profile-tool";
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
 * Get skincare profile from database
 */
async function getSkincareProfile(userId: string): Promise<SkincareContext | null> {
  const supabase = getSupabaseClient();
  
  const { data: profile } = await supabase
    .from("skincare_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  
  if (!profile) {
    return null;
  }
  
  // Get current routine streak
  const { data: streak } = await supabase
    .from("health_streaks")
    .select("current_streak")
    .eq("user_id", userId)
    .eq("streak_type", "skincare_routine")
    .single();
  
  // Get active routines
  const { data: routines } = await supabase
    .from("skincare_routines")
    .select("routine_type, name")
    .eq("user_id", userId)
    .eq("is_active", true);
  
  const routineNames = routines?.map(r => `${r.routine_type.toUpperCase()}: ${r.name || 'Routine'}`).join(", ") || "";
  
  return {
    skinType: profile.skin_type || undefined,
    skinConditions: profile.skin_conditions || [],
    skinGoals: profile.skin_goals || [],
    currentRoutine: routineNames,
    routineStreak: streak?.current_streak || 0,
  };
}

/**
 * Get health context from database
 */
async function getHealthContext(userId: string): Promise<HealthContext | null> {
  const supabase = getSupabaseClient();
  
  // Get latest health score
  const { data: latestScore } = await supabase
    .from("health_scores")
    .select("score")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(1)
    .single();
  
  // Get health streak
  const { data: healthStreak } = await supabase
    .from("health_streaks")
    .select("current_streak")
    .eq("user_id", userId)
    .eq("streak_type", "daily_checkin")
    .single();
  
  // Get recent biomarkers
  const { data: recentBiomarkers } = await supabase
    .from("biomarkers")
    .select("name")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);
  
  // Get active interventions
  const { data: activeInterventions } = await supabase
    .from("proactive_interventions")
    .select("title")
    .eq("user_id", userId)
    .eq("is_dismissed", false)
    .limit(3);
  
  return {
    healthScore: latestScore?.score || undefined,
    healthStreak: healthStreak?.current_streak || 0,
    recentBiomarkers: recentBiomarkers?.map(b => b.name) || [],
    activeInterventions: activeInterventions?.map(i => i.title) || [],
  };
}

/**
 * Onboarding data interface matching what's saved during onboarding
 */
export interface OnboardingData {
  preferredName: string;
  language: string;
  profession?: { id: string; name: string };
  criticalArtifacts: string[];
  socialIntelligence: string[];
  newsFocus: string[];
  healthInterests: string[];
  gender?: string | null;
  age?: number | null;
  bloodGroup?: string | null;
  bodyType?: string | null;
  weight?: number | null;
  skinTone?: string | null;
  allergies?: string[];
  // Skincare data
  skinType?: string;
  skinConditions?: string[];
  skinGoals?: string[];
  skinConcerns?: string;
}

/**
 * Initialize Mastra memory with user onboarding data.
 * Called when user completes onboarding.
 * 
 * This creates a memory thread for the user and initializes working memory
 * with all onboarding context (profession, artifacts, platforms, etc.)
 * so that agents can access this information from memory, not just prompts.
 */
export async function initializeUserMemory(
  userId: string,
  onboardingData: OnboardingData
): Promise<string> {
  const memory = saydoMemory;
  
  // Create user's memory thread
  const thread = await memory.createThread({
    resourceId: userId,
    metadata: {
      userId,
      language: onboardingData.language,
      profession: onboardingData.profession?.name,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      messageCount: 0,
    } as SaydoThreadMetadata,
  });

  // Initialize working memory with full onboarding context
  const userContext: FullUserContext = {
    preferredName: onboardingData.preferredName,
    language: onboardingData.language,
    profession: onboardingData.profession?.name,
    criticalArtifacts: onboardingData.criticalArtifacts,
    socialPlatforms: onboardingData.socialIntelligence,
    newsFocus: onboardingData.newsFocus,
    healthInterests: onboardingData.healthInterests,
    skincareContext: onboardingData.skinType ? {
      skinType: onboardingData.skinType,
      skinConditions: onboardingData.skinConditions || [],
      skinGoals: onboardingData.skinGoals || [],
      currentRoutine: "",
      routineStreak: 0,
    } : undefined,
  };

  const workingMemory = getFullWorkingMemory(userContext);

  if (thread.id) {
    await memory.updateWorkingMemory({
      threadId: thread.id,
      resourceId: userId,
      workingMemory: workingMemory,
    });
  }

  return thread.id;
}

/**
 * Initialize or update Mastra memory with user context from database.
 * This is useful when we need to ensure memory is initialized even if
 * onboarding memory initialization was missed.
 */
export async function initializeOrUpdateUserMemory(userId: string): Promise<string> {
  const memory = saydoMemory;
  const storage = getMemoryStorage();
  
  // Try to get existing thread using storage
  let thread;
  try {
    // Use helper function to get thread by resourceId
    thread = await getThreadByResourceId(storage, userId);
  } catch (error) {
    // Thread doesn't exist, create it
    thread = null;
  }

  // Load full user context from database
  const userContext = await getFullUserContext(userId);
  
  // Load skincare and health context
  const [skincareContext, healthContext] = await Promise.all([
    getSkincareProfile(userId),
    getHealthContext(userId),
  ]);

  // Convert to FullUserContext format
  const fullContext: FullUserContext = {
    preferredName: userContext.preferredName,
    language: userContext.language,
    profession: userContext.profession?.name,
    criticalArtifacts: userContext.criticalArtifacts,
    socialPlatforms: userContext.socialIntelligence,
    newsFocus: userContext.newsFocus,
    healthInterests: userContext.healthInterests,
    skincareContext: skincareContext || undefined,
    healthContext: healthContext || undefined,
  };

  if (!thread || !thread.id) {
    // Create new thread
    const newThread = await memory.createThread({
      resourceId: userId,
      metadata: {
        userId,
        language: fullContext.language,
        profession: fullContext.profession,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        messageCount: 0,
      } as SaydoThreadMetadata,
    });

    const workingMemory = getFullWorkingMemory(fullContext);
    
    if (newThread.id) {
      await memory.updateWorkingMemory({
        threadId: newThread.id,
        resourceId: userId,
        workingMemory: workingMemory,
      });
    }

    return newThread.id;
  } else {
    // Update existing thread's working memory
    const workingMemory = getFullWorkingMemory(fullContext);
    
    await memory.updateWorkingMemory({
      threadId: thread.id,
      resourceId: userId,
      workingMemory: workingMemory,
    });

    return thread.id;
  }
}

/**
 * Update memory with voice context (correlated voices throughout the day).
 * This should be called before processing a voice to ensure the agent
 * has access to all previous voices from today.
 */
export async function updateMemoryWithVoiceContext(
  userId: string,
  voiceContext: VoiceHistoryContext
): Promise<void> {
  const memory = saydoMemory;
  const storage = getMemoryStorage();
  
  // Get or create thread using storage
  let thread;
  try {
    thread = await getThreadByResourceId(storage, userId);
  } catch (error) {
    // Thread doesn't exist, initialize it first
    await initializeOrUpdateUserMemory(userId);
    // Try to get thread again after initialization
    try {
      thread = await getThreadByResourceId(storage, userId);
    } catch (err) {
      thread = null;
    }
  }

  if (!thread || !thread.id) {
    throw new Error(`Failed to get or create memory thread for user ${userId}`);
  }

  // Load current working memory
  const currentMemory = await memory.getWorkingMemory({
    threadId: thread.id,
    resourceId: userId,
  });

  // Get full user context
  const userContext = await getFullUserContext(userId);
  
  // Load skincare and health context
  const [skincareContext, healthContext] = await Promise.all([
    getSkincareProfile(userId),
    getHealthContext(userId),
  ]);
  
  const fullContext: FullUserContext = {
    preferredName: userContext.preferredName,
    language: userContext.language,
    profession: userContext.profession?.name,
    criticalArtifacts: userContext.criticalArtifacts,
    socialPlatforms: userContext.socialIntelligence,
    newsFocus: userContext.newsFocus,
    healthInterests: userContext.healthInterests,
    skincareContext: skincareContext || undefined,
    healthContext: healthContext || undefined,
  };

  // Update working memory with voice context
  const workingMemory = getFullWorkingMemory(fullContext, voiceContext);

  await memory.updateWorkingMemory({
    threadId: thread.id,
    resourceId: userId,
    workingMemory: workingMemory,
  });
}

/**
 * Get user's memory thread ID.
 * Returns null if thread doesn't exist.
 */
export async function getUserMemoryThreadId(userId: string): Promise<string | null> {
  const storage = getMemoryStorage();
  
  try {
    const thread = await getThreadByResourceId(storage, userId);
    return thread?.id || null;
  } catch (error) {
    return null;
  }
}

