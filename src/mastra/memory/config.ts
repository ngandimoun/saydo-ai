import { Memory } from "@mastra/memory";
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
 * - Semantic recall disabled (requires vector DB)
 */
export const saydoMemoryConfig = {
  lastMessages: 20, // Keep last 20 messages in context
  workingMemory: {
    enabled: true,
    template: saydoWorkingMemoryTemplate,
  },
  semanticRecall: false, // Disable semantic recall (requires vector DB)
};

/**
 * Creates a Memory instance for Saydo agents.
 * Uses the default storage configured in Mastra.
 */
export function createSaydoMemory(): Memory {
  return new Memory({
    options: {
      lastMessages: 20,
      semanticRecall: false,
    },
  });
}

/**
 * Default Saydo memory instance.
 * Used when registering with Mastra.
 */
export const saydoMemory = createSaydoMemory();

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
