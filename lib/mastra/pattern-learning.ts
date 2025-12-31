/**
 * Pattern Learning Library
 * 
 * Analyzes user tasks, todos, and reminders to extract behavioral patterns.
 * Patterns are used to personalize AI suggestions and improve task/reminder creation.
 */

import type { Task, Reminder } from "@/lib/dashboard/types";

export type PatternType = 'timing' | 'category' | 'priority' | 'tags' | 'completion' | 'recurring';

export interface TimingPattern {
  preferredCreationHours: number[]; // Hours of day (0-23) when user creates items
  preferredCreationDays: number[]; // Days of week (0-6, Sunday=0) when user creates items
  preferredDueTimes: string[]; // Preferred due times (HH:MM format)
  preferredDueDays: number[]; // Preferred due days of week
  completionTimes: number[]; // Hours of day when user completes items
  averageTimeToComplete: number; // Average hours from creation to completion
}

export interface CategoryPattern {
  mostUsedCategories: Array<{ category: string; count: number }>;
  categoryTagCombinations: Record<string, string[]>; // category -> common tags
  categoryPriorityMap: Record<string, string>; // category -> most common priority
}

export interface PriorityPattern {
  defaultPriority: string; // Most common priority
  priorityByContext: Record<string, string>; // context (e.g., "work") -> priority
  urgencyIndicators: string[]; // Words/phrases that indicate urgency
}

export interface TagPattern {
  mostCommonTags: Array<{ tag: string; count: number }>;
  tagCombinations: Array<{ tags: string[]; count: number }>; // Co-occurring tags
  tagCategoryMap: Record<string, string[]>; // tag -> common categories
  tagPriorityMap: Record<string, string>; // tag -> most common priority
}

export interface CompletionPattern {
  averageCompletionTimeByCategory: Record<string, number>; // category -> hours
  averageCompletionTimeByPriority: Record<string, number>; // priority -> hours
  completionRateByCategory: Record<string, number>; // category -> completion rate (0-1)
  overduePatterns: {
    categories: string[]; // Categories that often go overdue
    priorities: string[]; // Priorities that often go overdue
  };
}

export interface RecurringPattern {
  detectedRecurring: Array<{
    title: string;
    frequency: string; // "daily", "weekly", "monthly"
    commonTime?: string; // HH:MM
    commonDay?: number; // 0-6
  }>;
  recurrenceFrequency: Record<string, number>; // frequency type -> count
}

export type PatternData = 
  | TimingPattern 
  | CategoryPattern 
  | PriorityPattern 
  | TagPattern 
  | CompletionPattern 
  | RecurringPattern;

export interface ExtractedPattern {
  patternType: PatternType;
  patternData: PatternData;
  confidence: number;
}

/**
 * Extract patterns from a single task
 */
export function analyzeTaskPatterns(task: Task): ExtractedPattern[] {
  const patterns: ExtractedPattern[] = [];
  const now = new Date();
  const createdAt = task.createdAt || now;
  const completedAt = task.completedAt;

  // Timing pattern
  const creationHour = createdAt.getHours();
  const creationDay = createdAt.getDay();
  const dueTime = task.dueTime;
  const dueDate = task.dueDate;
  
  if (dueDate) {
    const dueDay = new Date(dueDate).getDay();
    patterns.push({
      patternType: 'timing',
      patternData: {
        preferredCreationHours: [creationHour],
        preferredCreationDays: [creationDay],
        preferredDueTimes: dueTime ? [dueTime] : [],
        preferredDueDays: [dueDay],
        completionTimes: completedAt ? [completedAt.getHours()] : [],
        averageTimeToComplete: completedAt 
          ? (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60) 
          : 0,
      } as TimingPattern,
      confidence: 1,
    });
  }

  // Category pattern
  if (task.category) {
    patterns.push({
      patternType: 'category',
      patternData: {
        mostUsedCategories: [{ category: task.category, count: 1 }],
        categoryTagCombinations: task.tags.length > 0 
          ? { [task.category]: task.tags } 
          : {},
        categoryPriorityMap: { [task.category]: task.priority },
      } as CategoryPattern,
      confidence: 1,
    });
  }

  // Priority pattern
  patterns.push({
    patternType: 'priority',
    patternData: {
      defaultPriority: task.priority,
      priorityByContext: task.category ? { [task.category]: task.priority } : {},
      urgencyIndicators: [],
    } as PriorityPattern,
    confidence: 1,
  });

  // Tag pattern
  if (task.tags.length > 0) {
    patterns.push({
      patternType: 'tags',
      patternData: {
        mostCommonTags: task.tags.map(tag => ({ tag, count: 1 })),
        tagCombinations: task.tags.length > 1 
          ? [{ tags: task.tags, count: 1 }] 
          : [],
        tagCategoryMap: task.category 
          ? Object.fromEntries(task.tags.map(tag => [tag, [task.category!]]))
          : {},
        tagPriorityMap: Object.fromEntries(task.tags.map(tag => [tag, task.priority])),
      } as TagPattern,
      confidence: 1,
    });
  }

  // Completion pattern
  if (completedAt && task.category) {
    const hoursToComplete = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    patterns.push({
      patternType: 'completion',
      patternData: {
        averageCompletionTimeByCategory: { [task.category]: hoursToComplete },
        averageCompletionTimeByPriority: { [task.priority]: hoursToComplete },
        completionRateByCategory: { [task.category]: 1 },
        overduePatterns: {
          categories: [],
          priorities: [],
        },
      } as CompletionPattern,
      confidence: 1,
    });
  }

  return patterns;
}

/**
 * Extract patterns from a single reminder
 */
export function analyzeReminderPatterns(reminder: Reminder): ExtractedPattern[] {
  const patterns: ExtractedPattern[] = [];
  const reminderTime = reminder.reminderTime;
  const reminderHour = reminderTime.getHours();
  const reminderDay = reminderTime.getDay();

  // Timing pattern
  patterns.push({
    patternType: 'timing',
    patternData: {
      preferredCreationHours: [],
      preferredCreationDays: [],
      preferredDueTimes: [`${String(reminderHour).padStart(2, '0')}:${String(reminderTime.getMinutes()).padStart(2, '0')}`],
      preferredDueDays: [reminderDay],
      completionTimes: [],
      averageTimeToComplete: 0,
    } as TimingPattern,
    confidence: 1,
  });

  // Priority pattern
  if (reminder.priority) {
    patterns.push({
      patternType: 'priority',
      patternData: {
        defaultPriority: reminder.priority,
        priorityByContext: {},
        urgencyIndicators: [],
      } as PriorityPattern,
      confidence: 1,
    });
  }

  // Tag pattern
  if (reminder.tags && reminder.tags.length > 0) {
    patterns.push({
      patternType: 'tags',
      patternData: {
        mostCommonTags: reminder.tags.map(tag => ({ tag, count: 1 })),
        tagCombinations: reminder.tags.length > 1 
          ? [{ tags: reminder.tags, count: 1 }] 
          : [],
        tagCategoryMap: {},
        tagPriorityMap: reminder.priority 
          ? Object.fromEntries(reminder.tags.map(tag => [tag, reminder.priority!]))
          : {},
      } as TagPattern,
      confidence: 1,
    });
  }

  // Recurring pattern
  if (reminder.isRecurring && reminder.recurrencePattern) {
    patterns.push({
      patternType: 'recurring',
      patternData: {
        detectedRecurring: [{
          title: reminder.title,
          frequency: reminder.recurrencePattern,
          commonTime: `${String(reminderHour).padStart(2, '0')}:${String(reminderTime.getMinutes()).padStart(2, '0')}`,
          commonDay: reminderDay,
        }],
        recurrenceFrequency: { [reminder.recurrencePattern]: 1 },
      } as RecurringPattern,
      confidence: 1,
    });
  }

  return patterns;
}

/**
 * Analyze timing patterns from multiple items
 */
export function analyzeTimingPatterns(
  items: Array<{ createdAt?: Date; dueDate?: Date; dueTime?: string; completedAt?: Date }>
): TimingPattern {
  const creationHours: number[] = [];
  const creationDays: number[] = [];
  const dueTimes: string[] = [];
  const dueDays: number[] = [];
  const completionTimes: number[] = [];
  const completionDurations: number[] = [];

  for (const item of items) {
    if (item.createdAt) {
      creationHours.push(item.createdAt.getHours());
      creationDays.push(item.createdAt.getDay());
    }
    if (item.dueDate) {
      const dueDay = new Date(item.dueDate).getDay();
      dueDays.push(dueDay);
      if (item.dueTime) {
        dueTimes.push(item.dueTime);
      }
    }
    if (item.completedAt) {
      completionTimes.push(item.completedAt.getHours());
      if (item.createdAt) {
        const duration = (item.completedAt.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60);
        completionDurations.push(duration);
      }
    }
  }

  // Get most common values
  const getMostCommon = (arr: number[], topN: number = 3): number[] => {
    const counts: Record<number, number> = {};
    for (const val of arr) {
      counts[val] = (counts[val] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([val]) => parseInt(val));
  };

  const getMostCommonStrings = (arr: string[], topN: number = 5): string[] => {
    const counts: Record<string, number> = {};
    for (const val of arr) {
      counts[val] = (counts[val] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([val]) => val);
  };

  const avgTimeToComplete = completionDurations.length > 0
    ? completionDurations.reduce((a, b) => a + b, 0) / completionDurations.length
    : 0;

  return {
    preferredCreationHours: getMostCommon(creationHours),
    preferredCreationDays: getMostCommon(creationDays),
    preferredDueTimes: getMostCommonStrings(dueTimes),
    preferredDueDays: getMostCommon(dueDays),
    completionTimes: getMostCommon(completionTimes),
    averageTimeToComplete: avgTimeToComplete,
  };
}

/**
 * Analyze category patterns from multiple items
 */
export function analyzeCategoryPatterns(
  items: Array<{ category?: string; tags?: string[]; priority: string }>
): CategoryPattern {
  const categoryCounts: Record<string, number> = {};
  const categoryTags: Record<string, Record<string, number>> = {};
  const categoryPriorities: Record<string, Record<string, number>> = {};

  for (const item of items) {
    if (item.category) {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      
      if (item.tags && item.tags.length > 0) {
        if (!categoryTags[item.category]) {
          categoryTags[item.category] = {};
        }
        for (const tag of item.tags) {
          categoryTags[item.category][tag] = (categoryTags[item.category][tag] || 0) + 1;
        }
      }

      if (!categoryPriorities[item.category]) {
        categoryPriorities[item.category] = {};
      }
      categoryPriorities[item.category][item.priority] = 
        (categoryPriorities[item.category][item.priority] || 0) + 1;
    }
  }

  const mostUsedCategories = Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const categoryTagCombinations: Record<string, string[]> = {};
  for (const [category, tagCounts] of Object.entries(categoryTags)) {
    categoryTagCombinations[category] = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  }

  const categoryPriorityMap: Record<string, string> = {};
  for (const [category, priorityCounts] of Object.entries(categoryPriorities)) {
    const mostCommon = Object.entries(priorityCounts)
      .sort((a, b) => b[1] - a[1])[0];
    if (mostCommon) {
      categoryPriorityMap[category] = mostCommon[0];
    }
  }

  return {
    mostUsedCategories,
    categoryTagCombinations,
    categoryPriorityMap,
  };
}

/**
 * Analyze priority patterns from multiple items
 */
export function analyzePriorityPatterns(
  items: Array<{ priority: string; category?: string }>
): PriorityPattern {
  const priorityCounts: Record<string, number> = {};
  const priorityByContext: Record<string, Record<string, number>> = {};

  for (const item of items) {
    priorityCounts[item.priority] = (priorityCounts[item.priority] || 0) + 1;
    
    if (item.category) {
      if (!priorityByContext[item.category]) {
        priorityByContext[item.category] = {};
      }
      priorityByContext[item.category][item.priority] = 
        (priorityByContext[item.category][item.priority] || 0) + 1;
    }
  }

  const defaultPriority = Object.entries(priorityCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'medium';

  const priorityByContextMap: Record<string, string> = {};
  for (const [context, counts] of Object.entries(priorityByContext)) {
    const mostCommon = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])[0];
    if (mostCommon) {
      priorityByContextMap[context] = mostCommon[0];
    }
  }

  return {
    defaultPriority,
    priorityByContext: priorityByContextMap,
    urgencyIndicators: [],
  };
}

/**
 * Analyze tag patterns from multiple items
 */
export function analyzeTagPatterns(
  items: Array<{ tags?: string[]; category?: string; priority: string }>
): TagPattern {
  const tagCounts: Record<string, number> = {};
  const tagCombinations: Record<string, number> = {};
  const tagCategories: Record<string, Record<string, number>> = {};
  const tagPriorities: Record<string, Record<string, number>> = {};

  for (const item of items) {
    if (item.tags && item.tags.length > 0) {
      for (const tag of item.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;

        if (item.category) {
          if (!tagCategories[tag]) {
            tagCategories[tag] = {};
          }
          tagCategories[tag][item.category] = (tagCategories[tag][item.category] || 0) + 1;
        }

        if (!tagPriorities[tag]) {
          tagPriorities[tag] = {};
        }
        tagPriorities[tag][item.priority] = (tagPriorities[tag][item.priority] || 0) + 1;
      }

      // Track tag combinations (pairs)
      if (item.tags.length > 1) {
        for (let i = 0; i < item.tags.length; i++) {
          for (let j = i + 1; j < item.tags.length; j++) {
            const combo = [item.tags[i], item.tags[j]].sort().join('|');
            tagCombinations[combo] = (tagCombinations[combo] || 0) + 1;
          }
        }
      }
    }
  }

  const mostCommonTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  const tagCombinationsList = Object.entries(tagCombinations)
    .map(([combo, count]) => ({ tags: combo.split('|'), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const tagCategoryMap: Record<string, string[]> = {};
  for (const [tag, categoryCounts] of Object.entries(tagCategories)) {
    tagCategoryMap[tag] = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);
  }

  const tagPriorityMap: Record<string, string> = {};
  for (const [tag, priorityCounts] of Object.entries(tagPriorities)) {
    const mostCommon = Object.entries(priorityCounts)
      .sort((a, b) => b[1] - a[1])[0];
    if (mostCommon) {
      tagPriorityMap[tag] = mostCommon[0];
    }
  }

  return {
    mostCommonTags,
    tagCombinations: tagCombinationsList,
    tagCategoryMap,
    tagPriorityMap,
  };
}

/**
 * Analyze completion patterns from multiple items
 */
export function analyzeCompletionPatterns(
  items: Array<{
    category?: string;
    priority: string;
    createdAt?: Date;
    completedAt?: Date;
    dueDate?: Date;
  }>
): CompletionPattern {
  const completionTimesByCategory: Record<string, number[]> = {};
  const completionTimesByPriority: Record<string, number[]> = {};
  const completedByCategory: Record<string, { total: number; completed: number }> = {};
  const overdueCategories: Record<string, number> = {};
  const overduePriorities: Record<string, number> = {};

  const now = Date.now();

  for (const item of items) {
    const category = item.category || 'uncategorized';
    const priority = item.priority;

    if (item.createdAt && item.completedAt) {
      const hours = (item.completedAt.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60);
      
      if (!completionTimesByCategory[category]) {
        completionTimesByCategory[category] = [];
      }
      completionTimesByCategory[category].push(hours);

      if (!completionTimesByPriority[priority]) {
        completionTimesByPriority[priority] = [];
      }
      completionTimesByPriority[priority].push(hours);
    }

    if (!completedByCategory[category]) {
      completedByCategory[category] = { total: 0, completed: 0 };
    }
    completedByCategory[category].total++;
    if (item.completedAt) {
      completedByCategory[category].completed++;
    }

    // Check for overdue
    if (item.dueDate && !item.completedAt) {
      const dueTime = new Date(item.dueDate).getTime();
      if (dueTime < now) {
        overdueCategories[category] = (overdueCategories[category] || 0) + 1;
        overduePriorities[priority] = (overduePriorities[priority] || 0) + 1;
      }
    }
  }

  const averageCompletionTimeByCategory: Record<string, number> = {};
  for (const [category, times] of Object.entries(completionTimesByCategory)) {
    averageCompletionTimeByCategory[category] = 
      times.reduce((a, b) => a + b, 0) / times.length;
  }

  const averageCompletionTimeByPriority: Record<string, number> = {};
  for (const [priority, times] of Object.entries(completionTimesByPriority)) {
    averageCompletionTimeByPriority[priority] = 
      times.reduce((a, b) => a + b, 0) / times.length;
  }

  const completionRateByCategory: Record<string, number> = {};
  for (const [category, stats] of Object.entries(completedByCategory)) {
    completionRateByCategory[category] = stats.total > 0 
      ? stats.completed / stats.total 
      : 0;
  }

  const overdueCategoriesList = Object.entries(overdueCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category]) => category);

  const overduePrioritiesList = Object.entries(overduePriorities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([priority]) => priority);

  return {
    averageCompletionTimeByCategory,
    averageCompletionTimeByPriority,
    completionRateByCategory,
    overduePatterns: {
      categories: overdueCategoriesList,
      priorities: overduePrioritiesList,
    },
  };
}

/**
 * Analyze recurring patterns from multiple items
 */
export function analyzeRecurringPatterns(
  items: Array<{
    title: string;
    isRecurring?: boolean;
    recurrencePattern?: string;
    reminderTime?: Date;
  }>
): RecurringPattern {
  const detectedRecurring: RecurringPattern['detectedRecurring'] = [];
  const recurrenceFrequency: Record<string, number> = {};

  for (const item of items) {
    if (item.isRecurring && item.recurrencePattern) {
      const reminderTime = item.reminderTime;
      detectedRecurring.push({
        title: item.title,
        frequency: item.recurrencePattern,
        commonTime: reminderTime 
          ? `${String(reminderTime.getHours()).padStart(2, '0')}:${String(reminderTime.getMinutes()).padStart(2, '0')}`
          : undefined,
        commonDay: reminderTime ? reminderTime.getDay() : undefined,
      });

      recurrenceFrequency[item.recurrencePattern] = 
        (recurrenceFrequency[item.recurrencePattern] || 0) + 1;
    }
  }

  return {
    detectedRecurring,
    recurrenceFrequency,
  };
}

/**
 * Aggregate multiple pattern observations into a single pattern
 */
export function aggregatePatterns(
  patterns: ExtractedPattern[]
): Record<PatternType, PatternData | null> {
  const grouped: Record<PatternType, PatternData[]> = {
    timing: [],
    category: [],
    priority: [],
    tags: [],
    completion: [],
    recurring: [],
  };

  for (const pattern of patterns) {
    grouped[pattern.patternType].push(pattern.patternData);
  }

  const aggregated: Record<PatternType, PatternData | null> = {
    timing: null,
    category: null,
    priority: null,
    tags: null,
    completion: null,
    recurring: null,
  };

  // Aggregate timing patterns
  if (grouped.timing.length > 0) {
    const timingItems = grouped.timing as TimingPattern[];
    aggregated.timing = {
      preferredCreationHours: Array.from(new Set(timingItems.flatMap(p => p.preferredCreationHours))),
      preferredCreationDays: Array.from(new Set(timingItems.flatMap(p => p.preferredCreationDays))),
      preferredDueTimes: Array.from(new Set(timingItems.flatMap(p => p.preferredDueTimes))),
      preferredDueDays: Array.from(new Set(timingItems.flatMap(p => p.preferredDueDays))),
      completionTimes: Array.from(new Set(timingItems.flatMap(p => p.completionTimes))),
      averageTimeToComplete: timingItems.reduce((sum, p) => sum + p.averageTimeToComplete, 0) / timingItems.length,
    };
  }

  // Aggregate category patterns
  if (grouped.category.length > 0) {
    aggregated.category = analyzeCategoryPatterns(
      grouped.category.map(p => ({
        category: (p as CategoryPattern).mostUsedCategories[0]?.category,
        tags: (p as CategoryPattern).categoryTagCombinations[(p as CategoryPattern).mostUsedCategories[0]?.category || ''] || [],
        priority: (p as CategoryPattern).categoryPriorityMap[(p as CategoryPattern).mostUsedCategories[0]?.category || ''] || 'medium',
      }))
    );
  }

  // Similar aggregation for other pattern types...
  // (Simplified for brevity - full implementation would merge all fields)

  return aggregated;
}

/**
 * Calculate confidence score for a pattern based on frequency
 */
export function calculatePatternConfidence(
  pattern: PatternData,
  frequency: number
): number {
  // Base confidence increases with frequency, capped at 100
  const baseConfidence = Math.min(frequency * 10, 100);
  
  // Adjust based on pattern type and data quality
  let qualityMultiplier = 1.0;
  
  if ('mostUsedCategories' in pattern && pattern.mostUsedCategories.length === 0) {
    qualityMultiplier *= 0.5;
  }
  
  if ('mostCommonTags' in pattern && pattern.mostCommonTags.length === 0) {
    qualityMultiplier *= 0.5;
  }

  return Math.round(baseConfidence * qualityMultiplier);
}



