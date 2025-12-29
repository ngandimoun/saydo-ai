/**
 * Pattern-Based Suggestions Engine
 * 
 * Uses learned patterns to provide smart suggestions for task/reminder creation.
 */

import { getUserPatterns } from "./pattern-storage";
import type { PatternData } from "./pattern-learning";

interface SuggestionContext {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  priority?: string;
}

/**
 * Suggest category based on learned patterns
 */
export async function suggestCategory(
  userId: string,
  title: string,
  patterns?: Array<{ pattern_data: PatternData }>
): Promise<string | null> {
  if (!patterns) {
    const allPatterns = await getUserPatterns(userId, "category");
    patterns = allPatterns;
  }

  const categoryPatterns = patterns.filter((p) => {
    const data = p.pattern_data as { mostUsedCategories?: Array<{ category: string; count: number }> };
    return data.mostUsedCategories && data.mostUsedCategories.length > 0;
  });

  if (categoryPatterns.length === 0) {
    return null;
  }

  // Get most recent category pattern
  const mostRecent = categoryPatterns[0];
  const patternData = mostRecent.pattern_data as {
    mostUsedCategories?: Array<{ category: string; count: number }>;
  };

  if (patternData.mostUsedCategories && patternData.mostUsedCategories.length > 0) {
    // Return most common category
    return patternData.mostUsedCategories[0].category;
  }

  return null;
}

/**
 * Suggest tags based on learned patterns
 */
export async function suggestTags(
  userId: string,
  title: string,
  description?: string,
  patterns?: Array<{ pattern_data: PatternData }>
): Promise<string[]> {
  if (!patterns) {
    const allPatterns = await getUserPatterns(userId, "tags");
    patterns = allPatterns;
  }

  const tagPatterns = patterns.filter((p) => {
    const data = p.pattern_data as { mostCommonTags?: Array<{ tag: string; count: number }> };
    return data.mostCommonTags && data.mostCommonTags.length > 0;
  });

  if (tagPatterns.length === 0) {
    return [];
  }

  // Get most recent tag pattern
  const mostRecent = tagPatterns[0];
  const patternData = mostRecent.pattern_data as {
    mostCommonTags?: Array<{ tag: string; count: number }>;
    tagCombinations?: Array<{ tags: string[]; count: number }>;
  };

  const suggestions: string[] = [];

  // Add most common tags
  if (patternData.mostCommonTags) {
    suggestions.push(...patternData.mostCommonTags.slice(0, 3).map((t) => t.tag));
  }

  // Check for tag combinations that match the title/description
  if (patternData.tagCombinations && (title || description)) {
    const text = `${title} ${description || ""}`.toLowerCase();
    for (const combo of patternData.tagCombinations.slice(0, 5)) {
      // If any tag in the combination matches the text, suggest the whole combination
      if (combo.tags.some((tag) => text.includes(tag.toLowerCase()))) {
        suggestions.push(...combo.tags.filter((tag) => !suggestions.includes(tag)));
      }
    }
  }

  return Array.from(new Set(suggestions)).slice(0, 5);
}

/**
 * Suggest priority based on learned patterns
 */
export async function suggestPriority(
  userId: string,
  title: string,
  context: SuggestionContext,
  patterns?: Array<{ pattern_data: PatternData }>
): Promise<string | null> {
  if (!patterns) {
    const allPatterns = await getUserPatterns(userId, "priority");
    patterns = allPatterns;
  }

  const priorityPatterns = patterns.filter((p) => {
    const data = p.pattern_data as { defaultPriority?: string; priorityByContext?: Record<string, string> };
    return data.defaultPriority || (data.priorityByContext && Object.keys(data.priorityByContext).length > 0);
  });

  if (priorityPatterns.length === 0) {
    return null;
  }

  // Get most recent priority pattern
  const mostRecent = priorityPatterns[0];
  const patternData = mostRecent.pattern_data as {
    defaultPriority?: string;
    priorityByContext?: Record<string, string>;
  };

  // Check if we have a context-specific priority
  if (context.category && patternData.priorityByContext?.[context.category]) {
    return patternData.priorityByContext[context.category];
  }

  // Fall back to default priority
  if (patternData.defaultPriority) {
    return patternData.defaultPriority;
  }

  return null;
}

/**
 * Suggest due time based on learned patterns
 */
export async function suggestDueTime(
  userId: string,
  patterns?: Array<{ pattern_data: PatternData }>
): Promise<string | null> {
  if (!patterns) {
    const allPatterns = await getUserPatterns(userId, "timing");
    patterns = allPatterns;
  }

  const timingPatterns = patterns.filter((p) => {
    const data = p.pattern_data as { preferredDueTimes?: string[] };
    return data.preferredDueTimes && data.preferredDueTimes.length > 0;
  });

  if (timingPatterns.length === 0) {
    return null;
  }

  // Get most recent timing pattern
  const mostRecent = timingPatterns[0];
  const patternData = mostRecent.pattern_data as {
    preferredDueTimes?: string[];
  };

  if (patternData.preferredDueTimes && patternData.preferredDueTimes.length > 0) {
    // Return most preferred due time
    return patternData.preferredDueTimes[0];
  }

  return null;
}

/**
 * Suggest recurrence based on learned patterns
 */
export async function suggestRecurrence(
  userId: string,
  item: { title: string; reminderTime?: Date },
  patterns?: Array<{ pattern_data: PatternData }>
): Promise<{ frequency: string; time?: string; day?: number } | null> {
  if (!patterns) {
    const allPatterns = await getUserPatterns(userId, "recurring");
    patterns = allPatterns;
  }

  const recurringPatterns = patterns.filter((p) => {
    const data = p.pattern_data as { detectedRecurring?: Array<{ title: string; frequency: string }> };
    return data.detectedRecurring && data.detectedRecurring.length > 0;
  });

  if (recurringPatterns.length === 0) {
    return null;
  }

  // Get most recent recurring pattern
  const mostRecent = recurringPatterns[0];
  const patternData = mostRecent.pattern_data as {
    detectedRecurring?: Array<{
      title: string;
      frequency: string;
      commonTime?: string;
      commonDay?: number;
    }>;
  };

  if (patternData.detectedRecurring) {
    // Check if there's a similar recurring item
    const itemTitleLower = item.title.toLowerCase();
    const similar = patternData.detectedRecurring.find((r) =>
      r.title.toLowerCase().includes(itemTitleLower) ||
      itemTitleLower.includes(r.title.toLowerCase())
    );

    if (similar) {
      return {
        frequency: similar.frequency,
        time: similar.commonTime,
        day: similar.commonDay,
      };
    }

    // Otherwise, return most common frequency
    const frequencies: Record<string, number> = {};
    for (const item of patternData.detectedRecurring) {
      frequencies[item.frequency] = (frequencies[item.frequency] || 0) + 1;
    }

    const mostCommon = Object.entries(frequencies)
      .sort((a, b) => b[1] - a[1])[0];

    if (mostCommon) {
      return {
        frequency: mostCommon[0],
      };
    }
  }

  return null;
}

/**
 * Get all suggestions for a given context
 */
export async function getAllSuggestions(
  userId: string,
  context: SuggestionContext
): Promise<{
  category?: string;
  tags?: string[];
  priority?: string;
  dueTime?: string;
  recurrence?: { frequency: string; time?: string; day?: number };
}> {
  const [category, tags, priority, dueTime, recurrence] = await Promise.all([
    context.category ? Promise.resolve(null) : suggestCategory(userId, context.title || ""),
    suggestTags(userId, context.title || "", context.description),
    suggestPriority(userId, context.title || "", context),
    suggestDueTime(userId),
    context.title ? suggestRecurrence(userId, { title: context.title }) : Promise.resolve(null),
  ]);

  return {
    category: category || undefined,
    tags: tags.length > 0 ? tags : undefined,
    priority: priority || undefined,
    dueTime: dueTime || undefined,
    recurrence: recurrence || undefined,
  };
}

