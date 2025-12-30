import { Memory } from "@mastra/memory";
import { saydoMemory, getFullWorkingMemory, FullUserContext, VoiceHistoryContext, ContentGenerationContext, SaydoThreadMetadata } from "./config";
import { getFullUserContext } from "../tools/user-profile-tool";

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
  
  // Try to get existing thread
  let thread;
  try {
    thread = await memory.getThread({ resourceId: userId });
  } catch (error) {
    // Thread doesn't exist, create it
    thread = null;
  }

  // Load full user context from database
  const userContext = await getFullUserContext(userId);

  // Convert to FullUserContext format
  const fullContext: FullUserContext = {
    preferredName: userContext.preferredName,
    language: userContext.language,
    profession: userContext.profession?.name,
    criticalArtifacts: userContext.criticalArtifacts,
    socialPlatforms: userContext.socialIntelligence,
    newsFocus: userContext.newsFocus,
    healthInterests: userContext.healthInterests,
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
  
  // Get or create thread
  let thread;
  try {
    thread = await memory.getThread({ resourceId: userId });
  } catch (error) {
    // Thread doesn't exist, initialize it first
    await initializeOrUpdateUserMemory(userId);
    thread = await memory.getThread({ resourceId: userId });
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
  const fullContext: FullUserContext = {
    preferredName: userContext.preferredName,
    language: userContext.language,
    profession: userContext.profession?.name,
    criticalArtifacts: userContext.criticalArtifacts,
    socialPlatforms: userContext.socialIntelligence,
    newsFocus: userContext.newsFocus,
    healthInterests: userContext.healthInterests,
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
  const memory = saydoMemory;
  
  try {
    const thread = await memory.getThread({ resourceId: userId });
    return thread.id || null;
  } catch (error) {
    return null;
  }
}

