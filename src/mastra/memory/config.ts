import { Memory } from "@mastra/memory";
import { PostgresStore, PgVector } from "@mastra/pg";
import type { StorageThreadType } from "@mastra/core/memory";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

/**
 * Extended working memory template for Saydo conversations.
 * Includes full onboarding context, voice history, and content generation preferences.
 */
export const saydoWorkingMemoryTemplate = `
<user_context>
  <name>{{preferredName}}</name>
  <language>{{language}}</language>
  <last_topic>{{lastTopic}}</last_topic>
  <mood>{{mood}}</mood>
  <pending_actions>{{pendingActions}}</pending_actions>
</user_context>

<onboarding_context>
  <profession>{{profession}}</profession>
  <critical_artifacts>{{criticalArtifacts}}</critical_artifacts>
  <social_platforms>{{socialPlatforms}}</social_platforms>
  <news_focus>{{newsFocus}}</news_focus>
  <health_interests>{{healthInterests}}</health_interests>
</onboarding_context>

<voice_history>
  <today_topics>{{todayTopics}}</today_topics>
  <today_recording_count>{{todayRecordingCount}}</today_recording_count>
  <week_summary>{{weekSummary}}</week_summary>
  <month_themes>{{monthThemes}}</month_themes>
</voice_history>

<content_generation>
  <recent_documents>{{recentDocuments}}</recent_documents>
  <preferred_content_types>{{preferredContentTypes}}</preferred_content_types>
  <generation_preferences>{{generationPreferences}}</generation_preferences>
</content_generation>

<skincare_context>
  <skin_type>{{skinType}}</skin_type>
  <skin_conditions>{{skinConditions}}</skin_conditions>
  <skin_goals>{{skinGoals}}</skin_goals>
  <current_routine>{{currentRoutine}}</current_routine>
  <routine_streak>{{routineStreak}}</routine_streak>
</skincare_context>

<health_context>
  <health_score>{{healthScore}}</health_score>
  <health_streak>{{healthStreak}}</health_streak>
  <recent_biomarkers>{{recentBiomarkers}}</recent_biomarkers>
  <active_interventions>{{activeInterventions}}</active_interventions>
</health_context>

<task_patterns>
  <preferred_times>{{preferredTimes}}</preferred_times>
  <common_categories>{{commonCategories}}</common_categories>
  <tag_combinations>{{tagCombinations}}</tag_combinations>
  <completion_habits>{{completionHabits}}</completion_habits>
  <recurring_items>{{recurringItems}}</recurring_items>
</task_patterns>

<reminder_patterns>
  <preferred_times>{{reminderPreferredTimes}}</preferred_times>
  <common_tags>{{reminderCommonTags}}</common_tags>
  <recurring_patterns>{{reminderRecurringPatterns}}</recurring_patterns>
</reminder_patterns>
`;

/**
 * Extended working memory schema for structured memory
 */
export const WorkingMemorySchema = z.object({
  // Basic user context
  preferredName: z.string().describe("User's preferred name"),
  language: z.string().describe("User's preferred language code"),
  lastTopic: z.string().optional().describe("The last topic discussed"),
  mood: z.enum(["positive", "neutral", "stressed", "tired", "motivated", "excited"]).optional().describe("Detected user mood"),
  pendingActions: z.array(z.string()).optional().describe("Actions the user mentioned but haven't been created as tasks"),
  importantDetails: z.array(z.string()).optional().describe("Important details mentioned in conversation"),

  // Onboarding context
  onboardingContext: z.object({
    profession: z.string().optional().describe("User's profession"),
    criticalArtifacts: z.array(z.string()).optional().describe("Critical documents/artifacts for this profession"),
    socialPlatforms: z.array(z.string()).optional().describe("User's preferred social platforms"),
    newsFocus: z.array(z.string()).optional().describe("User's news/information focus areas"),
    healthInterests: z.array(z.string()).optional().describe("User's health interests"),
  }).optional().describe("Context from user onboarding"),

  // Voice history context
  voiceHistory: z.object({
    todayTopics: z.array(z.string()).optional().describe("Main topics from today's voice recordings"),
    todayRecordingCount: z.number().optional().describe("Number of recordings today"),
    weekSummary: z.string().optional().describe("Summary of past week's voice recordings"),
    monthThemes: z.array(z.string()).optional().describe("Major themes from past month"),
  }).optional().describe("Voice recording history context"),

  // Content generation context
  contentGeneration: z.object({
    recentDocuments: z.array(z.string()).optional().describe("Recently generated document titles"),
    preferredContentTypes: z.array(z.string()).optional().describe("User's preferred content types"),
    generationPreferences: z.string().optional().describe("User's content generation preferences"),
  }).optional().describe("Content generation history and preferences"),

  // Task patterns (existing)
  taskPatterns: z.object({
    preferredTimes: z.array(z.string()).optional().describe("Preferred times for creating/completing tasks"),
    commonCategories: z.array(z.string()).optional().describe("Most commonly used task categories"),
    tagCombinations: z.array(z.string()).optional().describe("Common tag combinations used together"),
    completionHabits: z.string().optional().describe("User's completion habits and patterns"),
    recurringItems: z.array(z.string()).optional().describe("Detected recurring tasks"),
  }).optional().describe("Learned patterns from user's task behavior"),

  // Reminder patterns (existing)
  reminderPatterns: z.object({
    preferredTimes: z.array(z.string()).optional().describe("Preferred times for reminders"),
    commonTags: z.array(z.string()).optional().describe("Most commonly used reminder tags"),
    recurringPatterns: z.array(z.string()).optional().describe("Detected recurring reminder patterns"),
  }).optional().describe("Learned patterns from user's reminder behavior"),
});

export type WorkingMemory = z.infer<typeof WorkingMemorySchema>;

/**
 * Memory configuration for Saydo agents.
 * 
 * Features:
 * - Extended working memory with onboarding and voice context
 * - Message history for recent conversations
 * - Semantic recall enabled with Supabase pgvector
 * 
 * Note: This config object is for reference. Actual configuration is in createSaydoMemory().
 */
export const saydoMemoryConfig = {
  lastMessages: 20, // Keep last 20 messages in context
  workingMemory: {
    enabled: true,
    template: saydoWorkingMemoryTemplate,
  },
  semanticRecall: true, // Enabled with Supabase pgvector
};

/**
 * Gets Supabase database connection string.
 * Requires SUPABASE_DATABASE_URL environment variable.
 * 
 * IMPORTANT: Use the connection pooling URL, not the direct database URL.
 * 
 * To get your connection string:
 * 1. Go to Supabase Dashboard > Settings > Database
 * 2. Find "Connection string" section
 * 3. Select "Connection pooling" tab (NOT "Direct connection")
 * 4. Select "URI" mode
 * 5. Copy the connection string (should look like: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres)
 * 6. Replace [YOUR-PASSWORD] with your database password
 * 7. Add to .env.local as SUPABASE_DATABASE_URL
 * 
 * The connection pooling URL is required for serverless environments and provides better connection management.
 */
function getSupabaseConnectionString(): string {
  const dbUrl = process.env.SUPABASE_DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error(
      "SUPABASE_DATABASE_URL is required for Mastra Memory with Supabase Postgres.\n\n" +
      "To get your connection string:\n" +
      "1. Go to Supabase Dashboard > Settings > Database\n" +
      "2. Click on 'Connection pooling' tab (NOT 'Direct connection')\n" +
      "3. Select 'URI' mode\n" +
      "4. Copy the connection string\n" +
      "5. Replace [YOUR-PASSWORD] with your database password\n" +
      "6. Add to .env.local as SUPABASE_DATABASE_URL\n\n" +
      "Format should be: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
    );
  }
  
  // Validate that it's using the pooler format (not direct db connection)
  if (dbUrl.includes("db.") && dbUrl.includes(".supabase.co:5432")) {
    throw new Error(
      "Invalid connection string format. You're using the direct database connection.\n\n" +
      "Please use the Connection Pooling URL instead:\n" +
      "1. Go to Supabase Dashboard > Settings > Database\n" +
      "2. Click on 'Connection pooling' tab\n" +
      "3. Select 'URI' mode\n" +
      "4. Copy that connection string (should contain 'pooler.supabase.com' and port 6543)\n\n" +
      "The direct connection (port 5432) doesn't work well in serverless environments."
    );
  }
  
  return dbUrl;
}

/**
 * Creates a Postgres storage instance for Mastra Memory using Supabase.
 */
function createStorage() {
  const connectionString = getSupabaseConnectionString();
  
  return new PostgresStore({
    id: "saydo-memory-storage",
    connectionString,
  });
}

/**
 * Gets the storage instance from memory for direct thread operations.
 * This is a helper to access storage methods when Memory API doesn't expose them directly.
 */
export function getMemoryStorage() {
  return createStorage();
}

/**
 * Helper function to get a thread by resource ID using the correct Mastra API.
 * 
 * The PostgresStore doesn't have a direct getThreadByResourceId method.
 * Instead, we need to:
 * 1. Get the memory domain store
 * 2. Use listThreadsByResourceId which returns a paginated list
 * 3. Return the first thread (or null if none exists)
 * 
 * @param storage - The PostgresStore instance
 * @param resourceId - The resource ID (userId) to find threads for
 * @returns The first thread for the resource, or null if none exists
 */
export async function getThreadByResourceId(
  storage: ReturnType<typeof createStorage>,
  resourceId: string
): Promise<StorageThreadType | null> {
  // Ensure storage is initialized
  await storage.init();
  
  // Get the memory domain store
  const memoryStore = await storage.getStore('memory');
  if (!memoryStore) {
    throw new Error('Memory storage domain not available');
  }
  
  // Use listThreadsByResourceId to get threads for this resource
  const { threads } = await memoryStore.listThreadsByResourceId({ 
    resourceId,
    perPage: 1, // We only need the first thread
    page: 0
  });
  
  // Return the first thread or null
  return threads[0] || null;
}

/**
 * Creates a PgVector instance for semantic recall using Supabase pgvector.
 */
function createVectorStore() {
  const connectionString = getSupabaseConnectionString();
  
  return new PgVector({
    id: "saydo-memory-vector",
    connectionString,
  });
}

/**
 * Creates a Memory instance for Saydo agents.
 * Configures Supabase Postgres storage with pgvector for semantic recall.
 * Uses OpenAI embeddings for vector generation.
 */
export function createSaydoMemory(): Memory {
  const storage = createStorage();
  const vector = createVectorStore();
  
  return new Memory({
    storage,
    vector,
    embedder: openai.embedding("text-embedding-3-small"),
    options: {
      lastMessages: 20,
      workingMemory: {
        enabled: true,
        template: saydoWorkingMemoryTemplate,
      },
      semanticRecall: {
        topK: 5,
        messageRange: 2,
        scope: "resource",
      },
    },
  });
}

/**
 * Default Saydo memory instance.
 * Used when registering with Mastra.
 */
export const saydoMemory = createSaydoMemory();

/**
 * Skincare context interface for working memory
 */
export interface SkincareContext {
  skinType?: string;
  skinConditions?: string[];
  skinGoals?: string[];
  currentRoutine?: string;
  routineStreak?: number;
}

/**
 * Health context interface for working memory
 */
export interface HealthContext {
  healthScore?: number;
  healthStreak?: number;
  recentBiomarkers?: string[];
  activeInterventions?: string[];
}

/**
 * Full user context interface for working memory initialization
 */
export interface FullUserContext {
  preferredName: string;
  language: string;
  profession?: string;
  criticalArtifacts?: string[];
  socialPlatforms?: string[];
  newsFocus?: string[];
  healthInterests?: string[];
  skincareContext?: SkincareContext;
  healthContext?: HealthContext;
}

/**
 * Voice context interface for working memory
 */
export interface VoiceHistoryContext {
  todayTopics: string[];
  todayRecordingCount: number;
  weekSummary?: string;
  monthThemes?: string[];
}

/**
 * Content generation context interface
 */
export interface ContentGenerationContext {
  recentDocuments: string[];
  preferredContentTypes?: string[];
  generationPreferences?: string;
}

/**
 * Helper function to initialize working memory with full context
 */
export function getInitialWorkingMemory(userContext: {
  preferredName: string;
  language: string;
}): string {
  return `
<user_context>
  <name>${userContext.preferredName}</name>
  <language>${userContext.language}</language>
  <last_topic></last_topic>
  <mood>neutral</mood>
  <pending_actions></pending_actions>
</user_context>

<onboarding_context>
  <profession></profession>
  <critical_artifacts></critical_artifacts>
  <social_platforms></social_platforms>
  <news_focus></news_focus>
  <health_interests></health_interests>
</onboarding_context>

<voice_history>
  <today_topics></today_topics>
  <today_recording_count>0</today_recording_count>
  <week_summary></week_summary>
  <month_themes></month_themes>
</voice_history>

<content_generation>
  <recent_documents></recent_documents>
  <preferred_content_types></preferred_content_types>
  <generation_preferences></generation_preferences>
</content_generation>

<skincare_context>
  <skin_type></skin_type>
  <skin_conditions></skin_conditions>
  <skin_goals></skin_goals>
  <current_routine></current_routine>
  <routine_streak>0</routine_streak>
</skincare_context>

<health_context>
  <health_score></health_score>
  <health_streak>0</health_streak>
  <recent_biomarkers></recent_biomarkers>
  <active_interventions></active_interventions>
</health_context>

<task_patterns>
  <preferred_times></preferred_times>
  <common_categories></common_categories>
  <tag_combinations></tag_combinations>
  <completion_habits></completion_habits>
  <recurring_items></recurring_items>
</task_patterns>

<reminder_patterns>
  <preferred_times></preferred_times>
  <common_tags></common_tags>
  <recurring_patterns></recurring_patterns>
</reminder_patterns>
`.trim();
}

/**
 * Helper function to initialize working memory with full user context
 */
export function getFullWorkingMemory(
  userContext: FullUserContext,
  voiceContext?: VoiceHistoryContext,
  contentContext?: ContentGenerationContext
): string {
  const skincare = userContext.skincareContext || {};
  const health = userContext.healthContext || {};
  
  return `
<user_context>
  <name>${userContext.preferredName}</name>
  <language>${userContext.language}</language>
  <last_topic></last_topic>
  <mood>neutral</mood>
  <pending_actions></pending_actions>
</user_context>

<onboarding_context>
  <profession>${userContext.profession || ""}</profession>
  <critical_artifacts>${(userContext.criticalArtifacts || []).join(", ")}</critical_artifacts>
  <social_platforms>${(userContext.socialPlatforms || []).join(", ")}</social_platforms>
  <news_focus>${(userContext.newsFocus || []).join(", ")}</news_focus>
  <health_interests>${(userContext.healthInterests || []).join(", ")}</health_interests>
</onboarding_context>

<voice_history>
  <today_topics>${(voiceContext?.todayTopics || []).join(", ")}</today_topics>
  <today_recording_count>${voiceContext?.todayRecordingCount || 0}</today_recording_count>
  <week_summary>${voiceContext?.weekSummary || ""}</week_summary>
  <month_themes>${(voiceContext?.monthThemes || []).join(", ")}</month_themes>
</voice_history>

<content_generation>
  <recent_documents>${(contentContext?.recentDocuments || []).join(", ")}</recent_documents>
  <preferred_content_types>${(contentContext?.preferredContentTypes || []).join(", ")}</preferred_content_types>
  <generation_preferences>${contentContext?.generationPreferences || ""}</generation_preferences>
</content_generation>

<skincare_context>
  <skin_type>${skincare.skinType || ""}</skin_type>
  <skin_conditions>${(skincare.skinConditions || []).join(", ")}</skin_conditions>
  <skin_goals>${(skincare.skinGoals || []).join(", ")}</skin_goals>
  <current_routine>${skincare.currentRoutine || ""}</current_routine>
  <routine_streak>${skincare.routineStreak || 0}</routine_streak>
</skincare_context>

<health_context>
  <health_score>${health.healthScore || ""}</health_score>
  <health_streak>${health.healthStreak || 0}</health_streak>
  <recent_biomarkers>${(health.recentBiomarkers || []).join(", ")}</recent_biomarkers>
  <active_interventions>${(health.activeInterventions || []).join(", ")}</active_interventions>
</health_context>

<task_patterns>
  <preferred_times></preferred_times>
  <common_categories></common_categories>
  <tag_combinations></tag_combinations>
  <completion_habits></completion_habits>
  <recurring_items></recurring_items>
</task_patterns>

<reminder_patterns>
  <preferred_times></preferred_times>
  <common_tags></common_tags>
  <recurring_patterns></recurring_patterns>
</reminder_patterns>
`.trim();
}

/**
 * Thread metadata interface for Saydo conversations
 */
export interface SaydoThreadMetadata {
  userId: string;
  language: string;
  profession?: string;
  createdAt: string;
  lastActiveAt: string;
  messageCount: number;
}

/**
 * Creates a new conversation thread for a user
 */
export async function createConversationThread(
  memory: Memory,
  userId: string,
  userContext: { preferredName: string; language: string }
): Promise<string> {
  const thread = await memory.createThread({
    resourceId: userId,
    metadata: {
      userId,
      language: userContext.language,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      messageCount: 0,
    } as SaydoThreadMetadata,
  });

  // Initialize working memory with user context
  if (thread.id) {
    await memory.updateWorkingMemory({
      threadId: thread.id,
      resourceId: userId,
      workingMemory: getInitialWorkingMemory(userContext),
    });
  }

  return thread.id;
}

/**
 * Creates a new conversation thread with full context
 */
export async function createFullContextThread(
  memory: Memory,
  userId: string,
  userContext: FullUserContext,
  voiceContext?: VoiceHistoryContext,
  contentContext?: ContentGenerationContext
): Promise<string> {
  const thread = await memory.createThread({
    resourceId: userId,
    metadata: {
      userId,
      language: userContext.language,
      profession: userContext.profession,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      messageCount: 0,
    } as SaydoThreadMetadata,
  });

  // Initialize working memory with full context
  if (thread.id) {
    await memory.updateWorkingMemory({
      threadId: thread.id,
      resourceId: userId,
      workingMemory: getFullWorkingMemory(userContext, voiceContext, contentContext),
    });
  }

  return thread.id;
}
