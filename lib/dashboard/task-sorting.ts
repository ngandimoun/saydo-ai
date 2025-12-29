import type { Task, Reminder } from "./types";

/**
 * Priority order for sorting (lower number = higher priority)
 */
const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Get the effective due date/time for a task
 * Combines dueDate and dueTime into a single timestamp for comparison
 */
function getEffectiveDueDateTime(task: Task): number | null {
  if (!task.dueDate) {
    return null;
  }

  const dueDate = new Date(task.dueDate);
  
  // If time is specified, parse it and add to date
  if (task.dueTime) {
    const [hours, minutes] = task.dueTime.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      dueDate.setHours(hours, minutes, 0, 0);
    }
  } else {
    // If no time specified, set to end of day (23:59:59) so tasks without times come after tasks with times on the same day
    dueDate.setHours(23, 59, 59, 999);
  }

  return dueDate.getTime();
}

/**
 * Smart chronological sorting for tasks
 * 
 * Sort order:
 * 1. Due date/time (earliest first, past dates go to bottom, nulls last)
 * 2. Priority (urgent > high > medium > low)
 * 3. Creation date (newest first)
 */
export function sortTasksChronologically(tasks: Task[]): Task[] {
  const now = Date.now();
  
  return [...tasks].sort((a, b) => {
    // First, sort by due date/time
    const aDueTime = getEffectiveDueDateTime(a);
    const bDueTime = getEffectiveDueDateTime(b);

    // Tasks with due dates come before tasks without
    if (aDueTime !== null && bDueTime === null) return -1;
    if (aDueTime === null && bDueTime !== null) return 1;
    
    // If both have due dates, sort by time (earliest first)
    // Past dates should go to the bottom
    if (aDueTime !== null && bDueTime !== null) {
      const aIsPast = aDueTime < now;
      const bIsPast = bDueTime < now;
      
      // Future dates come before past dates
      if (aIsPast && !bIsPast) return 1;
      if (!aIsPast && bIsPast) return -1;
      
      // Both future or both past: sort by time (earliest first)
      if (aDueTime !== bDueTime) {
        return aDueTime - bDueTime;
      }
    }

    // If due dates are equal (or both null), sort by priority
    const aPriority = PRIORITY_ORDER[a.priority] ?? 99;
    const bPriority = PRIORITY_ORDER[b.priority] ?? 99;
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Finally, sort by creation date (newest first)
    const aCreated = a.createdAt.getTime();
    const bCreated = b.createdAt.getTime();
    return bCreated - aCreated;
  });
}

/**
 * Smart chronological sorting for reminders
 * 
 * Sort order:
 * 1. Reminder time (earliest first, past reminders go to bottom)
 * 2. Priority (urgent > high > medium > low)
 * 3. Creation date (newest first)
 */
export function sortRemindersChronologically(reminders: Reminder[]): Reminder[] {
  const now = Date.now();
  
  return [...reminders].sort((a, b) => {
    // First, sort by reminder time
    const aTime = a.reminderTime.getTime();
    const bTime = b.reminderTime.getTime();
    
    const aIsPast = aTime < now;
    const bIsPast = bTime < now;
    
    // Future reminders come before past reminders
    if (aIsPast && !bIsPast) return 1;
    if (!aIsPast && bIsPast) return -1;
    
    // Both future or both past: sort by time (earliest first)
    if (aTime !== bTime) {
      return aTime - bTime;
    }

    // If times are equal, sort by priority
    const aPriority = PRIORITY_ORDER[a.priority || 'medium'] ?? 99;
    const bPriority = PRIORITY_ORDER[b.priority || 'medium'] ?? 99;
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // Finally, sort by creation date (newest first)
    const aCreated = a.createdAt.getTime();
    const bCreated = b.createdAt.getTime();
    return bCreated - aCreated;
  });
}

/**
 * Check if a task is overdue (past due date and not completed)
 */
export function isTaskOverdue(task: Task): boolean {
  if (task.status === 'completed') return false;
  if (!task.dueDate) return false;
  
  const dueTime = getEffectiveDueDateTime(task);
  if (dueTime === null) return false;
  
  return dueTime < Date.now();
}

/**
 * Check if a reminder is overdue (past reminder time and not completed)
 */
export function isReminderOverdue(reminder: Reminder): boolean {
  if (reminder.isCompleted) return false;
  
  return reminder.reminderTime.getTime() < Date.now();
}

/**
 * Get all overdue tasks from a list
 */
export function getOverdueTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => isTaskOverdue(task));
}

/**
 * Get all overdue reminders from a list
 */
export function getOverdueReminders(reminders: Reminder[]): Reminder[] {
  return reminders.filter(reminder => isReminderOverdue(reminder));
}

/**
 * Get days since task became overdue
 */
export function getDaysOverdue(task: Task): number | null {
  if (!isTaskOverdue(task)) return null;
  
  const dueTime = getEffectiveDueDateTime(task);
  if (dueTime === null) return null;
  
  const now = Date.now();
  const diffMs = now - dueTime;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Get days since reminder became overdue
 */
export function getReminderDaysOverdue(reminder: Reminder): number | null {
  if (!isReminderOverdue(reminder)) return null;
  
  const now = Date.now();
  const diffMs = now - reminder.reminderTime.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

