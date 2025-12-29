function analyzeTaskPatterns(task) {
  const patterns = [];
  const now = /* @__PURE__ */ new Date();
  const createdAt = task.createdAt || now;
  const completedAt = task.completedAt;
  const creationHour = createdAt.getHours();
  const creationDay = createdAt.getDay();
  const dueTime = task.dueTime;
  const dueDate = task.dueDate;
  if (dueDate) {
    const dueDay = new Date(dueDate).getDay();
    patterns.push({
      patternType: "timing",
      patternData: {
        preferredCreationHours: [creationHour],
        preferredCreationDays: [creationDay],
        preferredDueTimes: dueTime ? [dueTime] : [],
        preferredDueDays: [dueDay],
        completionTimes: completedAt ? [completedAt.getHours()] : [],
        averageTimeToComplete: completedAt ? (completedAt.getTime() - createdAt.getTime()) / (1e3 * 60 * 60) : 0
      },
      confidence: 1
    });
  }
  if (task.category) {
    patterns.push({
      patternType: "category",
      patternData: {
        mostUsedCategories: [{ category: task.category, count: 1 }],
        categoryTagCombinations: task.tags.length > 0 ? { [task.category]: task.tags } : {},
        categoryPriorityMap: { [task.category]: task.priority }
      },
      confidence: 1
    });
  }
  patterns.push({
    patternType: "priority",
    patternData: {
      defaultPriority: task.priority,
      priorityByContext: task.category ? { [task.category]: task.priority } : {},
      urgencyIndicators: []
    },
    confidence: 1
  });
  if (task.tags.length > 0) {
    patterns.push({
      patternType: "tags",
      patternData: {
        mostCommonTags: task.tags.map((tag) => ({ tag, count: 1 })),
        tagCombinations: task.tags.length > 1 ? [{ tags: task.tags, count: 1 }] : [],
        tagCategoryMap: task.category ? Object.fromEntries(task.tags.map((tag) => [tag, [task.category]])) : {},
        tagPriorityMap: Object.fromEntries(task.tags.map((tag) => [tag, task.priority]))
      },
      confidence: 1
    });
  }
  if (completedAt && task.category) {
    const hoursToComplete = (completedAt.getTime() - createdAt.getTime()) / (1e3 * 60 * 60);
    patterns.push({
      patternType: "completion",
      patternData: {
        averageCompletionTimeByCategory: { [task.category]: hoursToComplete },
        averageCompletionTimeByPriority: { [task.priority]: hoursToComplete },
        completionRateByCategory: { [task.category]: 1 },
        overduePatterns: {
          categories: [],
          priorities: []
        }
      },
      confidence: 1
    });
  }
  return patterns;
}
function analyzeReminderPatterns(reminder) {
  const patterns = [];
  const reminderTime = reminder.reminderTime;
  const reminderHour = reminderTime.getHours();
  const reminderDay = reminderTime.getDay();
  patterns.push({
    patternType: "timing",
    patternData: {
      preferredCreationHours: [],
      preferredCreationDays: [],
      preferredDueTimes: [`${String(reminderHour).padStart(2, "0")}:${String(reminderTime.getMinutes()).padStart(2, "0")}`],
      preferredDueDays: [reminderDay],
      completionTimes: [],
      averageTimeToComplete: 0
    },
    confidence: 1
  });
  if (reminder.priority) {
    patterns.push({
      patternType: "priority",
      patternData: {
        defaultPriority: reminder.priority,
        priorityByContext: {},
        urgencyIndicators: []
      },
      confidence: 1
    });
  }
  if (reminder.tags && reminder.tags.length > 0) {
    patterns.push({
      patternType: "tags",
      patternData: {
        mostCommonTags: reminder.tags.map((tag) => ({ tag, count: 1 })),
        tagCombinations: reminder.tags.length > 1 ? [{ tags: reminder.tags, count: 1 }] : [],
        tagCategoryMap: {},
        tagPriorityMap: reminder.priority ? Object.fromEntries(reminder.tags.map((tag) => [tag, reminder.priority])) : {}
      },
      confidence: 1
    });
  }
  if (reminder.isRecurring && reminder.recurrencePattern) {
    patterns.push({
      patternType: "recurring",
      patternData: {
        detectedRecurring: [{
          title: reminder.title,
          frequency: reminder.recurrencePattern,
          commonTime: `${String(reminderHour).padStart(2, "0")}:${String(reminderTime.getMinutes()).padStart(2, "0")}`,
          commonDay: reminderDay
        }],
        recurrenceFrequency: { [reminder.recurrencePattern]: 1 }
      },
      confidence: 1
    });
  }
  return patterns;
}

export { analyzeReminderPatterns, analyzeTaskPatterns };
