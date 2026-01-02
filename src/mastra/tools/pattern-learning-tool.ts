/**
 * Pattern Learning Tools for Mastra
 * 
 * Tools that allow AI agents to learn from, retrieve, and apply user patterns.
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  analyzeTaskPatterns,
  analyzeReminderPatterns,
  type PatternType,
} from "@/lib/mastra/pattern-learning";
import {
  savePattern,
  getUserPatterns,
  getPatternSuggestions,
} from "@/lib/mastra/pattern-storage";
import type { Task, Reminder } from "@/lib/dashboard/types";

/**
 * Tool to learn patterns from user activity
 */
export const learnPatternsTool = createTool({
  id: "learn-patterns",
  description:
    "Learns patterns from user tasks or reminders. Call this after creating/updating tasks or reminders to extract and store behavioral patterns.",
  inputSchema: z.object({
    userId: z.string().describe("The user's unique identifier"),
    task: z
      .object({
        id: z.string(),
        title: z.string(),
        priority: z.string(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        dueDate: z.string().optional(),
        dueTime: z.string().optional(),
        createdAt: z.string(),
        completedAt: z.string().optional(),
      })
      .optional()
      .describe("Task to learn patterns from"),
    reminder: z
      .object({
        id: z.string(),
        title: z.string(),
        priority: z.string().optional(),
        tags: z.array(z.string()).optional(),
        reminderTime: z.string(),
        isRecurring: z.boolean().optional(),
        recurrencePattern: z.string().optional(),
      })
      .optional()
      .describe("Reminder to learn patterns from"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    patternsLearned: z.number().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, task, reminder }) => {
    try {
      let patternsLearned = 0;

      if (task) {
        // Convert to Task type
        const taskObj: Task = {
          id: task.id,
          userId,
          title: task.title,
          priority: task.priority as Task["priority"],
          status: "pending",
          category: task.category,
          tags: task.tags || [],
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          dueTime: task.dueTime,
          createdAt: new Date(task.createdAt),
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
        };

        const extractedPatterns = analyzeTaskPatterns(taskObj);
        for (const pattern of extractedPatterns) {
          const result = await savePattern(
            userId,
            pattern.patternType,
            pattern.patternData
          );
          if (result.success) {
            patternsLearned++;
          }
        }
      }

      if (reminder) {
        // Convert to Reminder type
        const reminderObj: Reminder = {
          id: reminder.id,
          userId,
          title: reminder.title,
          reminderTime: new Date(reminder.reminderTime),
          isRecurring: reminder.isRecurring || false,
          recurrencePattern: reminder.recurrencePattern,
          isCompleted: false,
          isSnoozed: false,
          tags: reminder.tags,
          priority: reminder.priority as Reminder["priority"],
          createdAt: new Date(),
        };

        const extractedPatterns = analyzeReminderPatterns(reminderObj);
        for (const pattern of extractedPatterns) {
          const result = await savePattern(
            userId,
            pattern.patternType,
            pattern.patternData
          );
          if (result.success) {
            patternsLearned++;
          }
        }
      }

      return { success: true, patternsLearned };
    } catch (err) {
      console.error("[learnPatternsTool] Exception", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to learn patterns",
      };
    }
  },
});

/**
 * Tool to retrieve learned patterns
 */
export const getPatternsTool = createTool({
  id: "get-patterns",
  description:
    "Retrieves learned patterns for a user. Use this to understand user preferences and behavior patterns.",
  inputSchema: z.object({
    userId: z.string().describe("The user's unique identifier"),
    patternType: z
      .enum(["timing", "category", "priority", "tags", "completion", "recurring"])
      .optional()
      .describe("Filter by pattern type"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    patterns: z
      .array(
        z.object({
          patternType: z.string(),
          patternData: z.any(),
          frequency: z.number(),
          confidenceScore: z.number(),
          lastSeenAt: z.string(),
        })
      )
      .optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, patternType }) => {
    try {
      const patterns = await getUserPatterns(
        userId,
        patternType as PatternType | undefined
      );

      return {
        success: true,
        patterns: patterns.map((p) => ({
          patternType: p.pattern_type,
          patternData: p.pattern_data,
          frequency: p.frequency,
          confidenceScore: p.confidence_score,
          lastSeenAt: p.last_seen_at,
        })),
      };
    } catch (err) {
      console.error("[getPatternsTool] Exception", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to get patterns",
      };
    }
  },
});

/**
 * Tool to apply patterns when creating tasks/reminders
 */
export const applyPatternsTool = createTool({
  id: "apply-patterns",
  description:
    "Gets pattern-based suggestions for creating a task or reminder. Use this to provide smart defaults based on user's learned patterns.",
  inputSchema: z.object({
    userId: z.string().describe("The user's unique identifier"),
    title: z.string().optional().describe("Task/reminder title"),
    description: z.string().optional().describe("Task/reminder description"),
    category: z.string().optional().describe("Proposed category"),
    tags: z.array(z.string()).optional().describe("Proposed tags"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    suggestions: z
      .object({
        suggestedCategory: z.string().optional(),
        suggestedTags: z.array(z.string()).optional(),
        suggestedPriority: z.string().optional(),
        suggestedDueTime: z.string().optional(),
      })
      .optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, title, description, category, tags }) => {
    try {
      const suggestions = await getPatternSuggestions(userId, {
        title,
        description,
        category,
        tags,
      });

      return {
        success: true,
        suggestions,
      };
    } catch (err) {
      console.error("[applyPatternsTool] Exception", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to apply patterns",
      };
    }
  },
});

// Export all pattern learning tools
export const patternLearningTools = {
  learnPatterns: learnPatternsTool,
  getPatterns: getPatternsTool,
  applyPatterns: applyPatternsTool,
};




