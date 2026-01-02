/**
 * Memory Updater Service
 * 
 * Syncs learned patterns from Supabase to Mastra working memory.
 * This makes patterns available to AI agents in their conversation context.
 */

import { Memory } from "@mastra/memory";
import { getUserPatterns } from "./pattern-storage";
import type { PatternType, PatternData } from "./pattern-learning";

interface PatternSummary {
  preferredTimes: string[];
  commonCategories: string[];
  tagCombinations: string[];
  completionHabits: string;
  recurringItems: string[];
}

interface ReminderPatternSummary {
  preferredTimes: string[];
  commonTags: string[];
  recurringPatterns: string[];
}

/**
 * Format patterns for insertion into Mastra memory template
 */
function formatPatternsForMemory(patterns: Array<{ pattern_type: PatternType; pattern_data: PatternData }>): {
  taskPatterns: PatternSummary;
  reminderPatterns: ReminderPatternSummary;
} {
  const taskPatterns: PatternSummary = {
    preferredTimes: [],
    commonCategories: [],
    tagCombinations: [],
    completionHabits: "",
    recurringItems: [],
  };

  const reminderPatterns: ReminderPatternSummary = {
    preferredTimes: [],
    commonTags: [],
    recurringPatterns: [],
  };

  for (const pattern of patterns) {
    switch (pattern.pattern_type) {
      case "timing": {
        const timingData = pattern.pattern_data as {
          preferredCreationHours?: number[];
          preferredDueTimes?: string[];
          averageTimeToComplete?: number;
        };
        if (timingData.preferredDueTimes) {
          taskPatterns.preferredTimes.push(...timingData.preferredDueTimes);
          reminderPatterns.preferredTimes.push(...timingData.preferredDueTimes);
        }
        if (timingData.averageTimeToComplete) {
          taskPatterns.completionHabits = `Average completion time: ${Math.round(timingData.averageTimeToComplete)} hours`;
        }
        break;
      }
      case "category": {
        const categoryData = pattern.pattern_data as {
          mostUsedCategories?: Array<{ category: string; count: number }>;
        };
        if (categoryData.mostUsedCategories) {
          taskPatterns.commonCategories.push(
            ...categoryData.mostUsedCategories.slice(0, 5).map((c) => c.category)
          );
        }
        break;
      }
      case "tags": {
        const tagData = pattern.pattern_data as {
          mostCommonTags?: Array<{ tag: string; count: number }>;
          tagCombinations?: Array<{ tags: string[]; count: number }>;
        };
        if (tagData.mostCommonTags) {
          reminderPatterns.commonTags.push(
            ...tagData.mostCommonTags.slice(0, 5).map((t) => t.tag)
          );
        }
        if (tagData.tagCombinations) {
          taskPatterns.tagCombinations.push(
            ...tagData.tagCombinations.slice(0, 5).map((c) => c.tags.join(", "))
          );
        }
        break;
      }
      case "completion": {
        const completionData = pattern.pattern_data as {
          averageCompletionTimeByCategory?: Record<string, number>;
          completionRateByCategory?: Record<string, number>;
        };
        const habits: string[] = [];
        if (completionData.averageCompletionTimeByCategory) {
          for (const [category, hours] of Object.entries(completionData.averageCompletionTimeByCategory)) {
            habits.push(`${category}: ${Math.round(hours)}h avg`);
          }
        }
        if (completionData.completionRateByCategory) {
          for (const [category, rate] of Object.entries(completionData.completionRateByCategory)) {
            habits.push(`${category}: ${Math.round(rate * 100)}% completion`);
          }
        }
        if (habits.length > 0) {
          taskPatterns.completionHabits = habits.join("; ");
        }
        break;
      }
      case "recurring": {
        const recurringData = pattern.pattern_data as {
          detectedRecurring?: Array<{ title: string; frequency: string }>;
          recurrenceFrequency?: Record<string, number>;
        };
        if (recurringData.detectedRecurring) {
          taskPatterns.recurringItems.push(
            ...recurringData.detectedRecurring.map((r) => `${r.title} (${r.frequency})`)
          );
        }
        if (recurringData.recurrenceFrequency) {
          reminderPatterns.recurringPatterns.push(
            ...Object.entries(recurringData.recurrenceFrequency).map(([freq, count]) => `${freq} (${count}x)`)
          );
        }
        break;
      }
    }
  }

  // Remove duplicates
  taskPatterns.preferredTimes = Array.from(new Set(taskPatterns.preferredTimes));
  taskPatterns.commonCategories = Array.from(new Set(taskPatterns.commonCategories));
  reminderPatterns.preferredTimes = Array.from(new Set(reminderPatterns.preferredTimes));
  reminderPatterns.commonTags = Array.from(new Set(reminderPatterns.commonTags));

  return { taskPatterns, reminderPatterns };
}

/**
 * Update Mastra working memory with learned patterns
 */
export async function updateWorkingMemoryWithPatterns(
  memory: Memory,
  userId: string,
  threadId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Load patterns from Supabase
    const patterns = await getUserPatterns(userId);

    if (patterns.length === 0) {
      // No patterns yet, skip update
      return { success: true };
    }

    // Format patterns for memory template
    const { taskPatterns, reminderPatterns } = formatPatternsForMemory(patterns);

    // Get current working memory
    const currentMemory = await memory.getWorkingMemory({
      threadId,
      resourceId: userId,
    });

    // Build updated memory string
    const patternSection = `
<task_patterns>
  <preferred_times>${taskPatterns.preferredTimes.join(", ") || "None yet"}</preferred_times>
  <common_categories>${taskPatterns.commonCategories.join(", ") || "None yet"}</common_categories>
  <tag_combinations>${taskPatterns.tagCombinations.join("; ") || "None yet"}</tag_combinations>
  <completion_habits>${taskPatterns.completionHabits || "No data yet"}</completion_habits>
  <recurring_items>${taskPatterns.recurringItems.join("; ") || "None yet"}</recurring_items>
</task_patterns>
<reminder_patterns>
  <preferred_times>${reminderPatterns.preferredTimes.join(", ") || "None yet"}</preferred_times>
  <common_tags>${reminderPatterns.commonTags.join(", ") || "None yet"}</common_tags>
  <recurring_patterns>${reminderPatterns.recurringPatterns.join("; ") || "None yet"}</recurring_patterns>
</reminder_patterns>
`.trim();

    // Merge with existing memory (append patterns section)
    const updatedMemory = currentMemory
      ? `${currentMemory}\n${patternSection}`
      : patternSection;

    // Update working memory
    await memory.updateWorkingMemory({
      threadId,
      resourceId: userId,
      workingMemory: updatedMemory,
    });

    return { success: true };
  } catch (err) {
    console.error("[updateWorkingMemoryWithPatterns] Exception", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update memory",
    };
  }
}

/**
 * Sync patterns to memory for a user
 * Can be called periodically or after pattern updates
 */
export async function syncPatternsToMemory(
  memory: Memory,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Find user's thread
    const threads = await memory.getThreads({ resourceId: userId });
    
    if (threads.length === 0) {
      // No thread exists yet, skip
      return { success: true };
    }

    // Update memory for the most recent thread
    const latestThread = threads.sort(
      (a, b) => 
        new Date(b.metadata?.lastActiveAt || 0).getTime() - 
        new Date(a.metadata?.lastActiveAt || 0).getTime()
    )[0];

    if (!latestThread.id) {
      return { success: false, error: "Thread ID not found" };
    }

    return await updateWorkingMemoryWithPatterns(memory, userId, latestThread.id);
  } catch (err) {
    console.error("[syncPatternsToMemory] Exception", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to sync patterns",
    };
  }
}




