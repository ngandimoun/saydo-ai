import { Memory } from "@mastra/memory";
import { z } from "zod";

/**
 * Working memory template for Saydo conversations.
 * This template defines what the agent should remember about the conversation.
 */
export const saydoWorkingMemoryTemplate = `
<user_context>
  <name>{{preferredName}}</name>
  <language>{{language}}</language>
  <last_topic>{{lastTopic}}</last_topic>
  <mood>{{mood}}</mood>
  <pending_actions>{{pendingActions}}</pending_actions>
</user_context>
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
  <recurring_patterns>{{reminderRecurringPatterns}}</reminder_recurring_patterns>
</reminder_patterns>
`;

/**
 * Working memory schema for structured memory
 */
export const WorkingMemorySchema = z.object({
  preferredName: z.string().describe("User's preferred name"),
  language: z.string().describe("User's preferred language code"),
  lastTopic: z.string().optional().describe("The last topic discussed"),
  mood: z.enum(["positive", "neutral", "stressed", "tired", "motivated"]).optional().describe("Detected user mood"),
  pendingActions: z.array(z.string()).optional().describe("Actions the user mentioned but haven't been created as tasks"),
  importantDetails: z.array(z.string()).optional().describe("Important details mentioned in conversation"),
  taskPatterns: z.object({
    preferredTimes: z.array(z.string()).optional().describe("Preferred times for creating/completing tasks"),
    commonCategories: z.array(z.string()).optional().describe("Most commonly used task categories"),
    tagCombinations: z.array(z.string()).optional().describe("Common tag combinations used together"),
    completionHabits: z.string().optional().describe("User's completion habits and patterns"),
    recurringItems: z.array(z.string()).optional().describe("Detected recurring tasks"),
  }).optional().describe("Learned patterns from user's task behavior"),
  reminderPatterns: z.object({
    preferredTimes: z.array(z.string()).optional().describe("Preferred times for reminders"),
    commonTags: z.array(z.string()).optional().describe("Most commonly used reminder tags"),
    recurringPatterns: z.array(z.string()).optional().describe("Detected recurring reminder patterns"),
  }).optional().describe("Learned patterns from user's reminder behavior"),
});

/**
 * Memory configuration for Saydo agents.
 * 
 * Features:
 * - Working memory for conversation context
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
 * Helper function to initialize working memory with user context
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

