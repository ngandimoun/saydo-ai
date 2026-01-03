/**
 * Notification Service
 * 
 * Complete notification system for Saydo Pro Life:
 * - In-app toast notifications
 * - PWA push notifications (when permitted)
 * - Notification history in database
 * - Deep link to specific AI documents
 */

import { createClient } from "@supabase/supabase-js";

// Create Supabase client for server-side operations
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Notification type definitions
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'ai_generated';

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedDocumentId?: string;
  deepLink?: string;
}

export interface StoredNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedDocumentId?: string;
  deepLink?: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: Date;
  readAt?: Date;
}

/**
 * Create a new notification in the database
 */
export async function createNotification(
  payload: NotificationPayload
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: payload.userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      related_document_id: payload.relatedDocumentId,
      deep_link: payload.deepLink,
      is_read: false,
      is_dismissed: false,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[createNotification] Error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, notificationId: data.id };
}

/**
 * Create a notification for AI-generated content
 */
export async function notifyAIContentReady(
  userId: string,
  documentId: string,
  documentTitle: string,
  documentType: string
): Promise<{ success: boolean; error?: string }> {
  const typeLabel = documentType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  // Generate dynamic title: "TypeLabel: DocumentTitle"
  // Truncate if too long (max ~60 chars for readability)
  const dynamicTitle = `${typeLabel}: ${documentTitle}`;
  const title = dynamicTitle.length > 60 
    ? `${dynamicTitle.substring(0, 57)}...` 
    : dynamicTitle;

  return createNotification({
    userId,
    title,
    message: `I drafted a ${typeLabel}: "${documentTitle}"`,
    type: "ai_generated",
    relatedDocumentId: documentId,
    deepLink: `/dashboard/pro?doc=${documentId}`,
  });
}

/**
 * Create a notification for proactive content suggestion
 */
export async function notifyProactiveSuggestion(
  userId: string,
  documentId: string,
  documentTitle: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  return createNotification({
    userId,
    title: "Content Suggestion",
    message: `Based on ${reason}, I prepared: "${documentTitle}"`,
    type: "ai_generated",
    relatedDocumentId: documentId,
    deepLink: `/dashboard/pro?doc=${documentId}`,
  });
}

/**
 * Create a notification for an urgent task
 */
export async function notifyUrgentTask(
  userId: string,
  taskId: string,
  taskTitle: string,
  dueDate?: string,
  dueTime?: string
): Promise<{ success: boolean; error?: string }> {
  // Format due date/time message
  let message = taskTitle;
  if (dueDate) {
    const dueDateObj = new Date(dueDate);
    const now = new Date();
    const diffMs = dueDateObj.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 0) {
      message = `${taskTitle} - Overdue`;
    } else if (diffMins < 60) {
      message = `${taskTitle} - Due in ${diffMins} minutes`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      if (dueTime) {
        message = `${taskTitle} - Due: ${dueDateObj.toLocaleDateString()} at ${dueTime}`;
      } else {
        message = `${taskTitle} - Due: ${dueDateObj.toLocaleDateString()}`;
      }
    }
  }

  const title = `Urgent Task: ${taskTitle}`;
  const truncatedTitle = title.length > 60 ? `${title.substring(0, 57)}...` : title;

  return createNotification({
    userId,
    title: truncatedTitle,
    message,
    type: "system",
    deepLink: `/dashboard/tasks?task=${taskId}`,
  });
}

/**
 * Create a notification for a reminder
 */
export async function notifyReminder(
  userId: string,
  reminderId: string,
  reminderTitle: string,
  reminderTime: Date,
  priority?: string
): Promise<{ success: boolean; error?: string }> {
  // Format reminder time message
  const now = new Date();
  const diffMs = reminderTime.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  let message = reminderTitle;
  if (diffMins < 0) {
    message = `${reminderTitle} - Overdue`;
  } else if (diffMins < 60) {
    message = `${reminderTitle} - In ${diffMins} minutes`;
  } else {
    const hours = Math.floor(diffMins / 60);
    message = `${reminderTitle} - At ${reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  const title = priority === "urgent" 
    ? `Urgent Reminder: ${reminderTitle}`
    : `Reminder: ${reminderTitle}`;
  const truncatedTitle = title.length > 60 ? `${title.substring(0, 57)}...` : title;

  return createNotification({
    userId,
    title: truncatedTitle,
    message,
    type: "reminder",
    deepLink: `/dashboard/tasks?reminder=${reminderId}`,
  });
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("notifications")
    .update({ 
      is_read: true, 
      read_at: new Date().toISOString() 
    })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    console.error("[markNotificationRead] Error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Dismiss a notification
 */
export async function dismissNotification(
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from("notifications")
    .update({ is_dismissed: true })
    .eq("id", notificationId)
    .eq("user_id", userId);

  if (error) {
    console.error("[dismissNotification] Error:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .eq("is_dismissed", false);

  if (error) {
    console.error("[getUnreadNotificationCount] Error:", error);
    return 0;
  }

  return count || 0;
}

/**
 * Get recent notifications for a user
 */
export async function getRecentNotifications(
  userId: string,
  limit: number = 20
): Promise<StoredNotification[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("is_dismissed", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getRecentNotifications] Error:", error);
    return [];
  }

  return (data || []).map(n => ({
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    type: n.type,
    relatedDocumentId: n.related_document_id,
    deepLink: n.deep_link,
    isRead: n.is_read,
    isDismissed: n.is_dismissed,
    createdAt: new Date(n.created_at),
    readAt: n.read_at ? new Date(n.read_at) : undefined,
  }));
}

/**
 * Cleanup old notifications (30+ days old and read)
 */
export async function cleanupOldNotifications(userId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId)
    .eq("is_read", true)
    .lt("created_at", thirtyDaysAgo.toISOString());

  if (error) {
    console.error("[cleanupOldNotifications] Error:", error);
  }
}

// ============================================
// PWA PUSH NOTIFICATIONS (Client-Side)
// ============================================

/**
 * Check if browser supports push notifications
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    return "denied";
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Get current notification permission
 */
export function getNotificationPermission(): NotificationPermission | null {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }
  return Notification.permission;
}

/**
 * Show a local notification (no server required)
 */
export async function showLocalNotification(
  title: string,
  options?: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: Record<string, unknown>;
    requireInteraction?: boolean;
  }
): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  if (Notification.permission !== "granted") {
    return false;
  }

  try {
    // Use service worker if available for better PWA experience
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body: options?.body,
      icon: options?.icon || "/icon-192x192.png",
      badge: options?.badge || "/badge-72x72.png",
      tag: options?.tag,
      data: { ...options?.data, playSound: true },
      requireInteraction: options?.requireInteraction || false,
    });
    
    // Play sound (service worker will also send message, but play directly as backup)
    if (options?.data?.playSound !== false) {
      const { playNotificationSound } = await import("@/lib/notification-sound");
      playNotificationSound().catch(() => {
        // Ignore errors - sound is optional
      });
    }
    
    return true;
  } catch (error) {
    console.error("[showLocalNotification] Error:", error);
    
    // Fallback to basic Notification API
    try {
      new Notification(title, {
        body: options?.body,
        icon: options?.icon || "/icon-192x192.png",
        tag: options?.tag,
        data: options?.data,
      });
      
      // Play sound for fallback notifications too
      if (options?.data?.playSound !== false) {
        const { playNotificationSound } = await import("@/lib/notification-sound");
        playNotificationSound().catch(() => {
          // Ignore errors - sound is optional
        });
      }
      
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Show notification for AI-generated content (client-side)
 */
export async function showAIContentNotification(
  title: string,
  documentType: string,
  documentId: string
): Promise<boolean> {
  const typeLabel = documentType
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return showLocalNotification(`New ${typeLabel} Ready`, {
    body: title,
    icon: "/icon-192x192.png",
    tag: `ai-doc-${documentId}`,
    data: {
      type: "ai_document",
      documentId,
      url: `/dashboard/pro?doc=${documentId}`,
    },
    requireInteraction: false,
  });
}

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

export interface NotificationPreferences {
  pushEnabled: boolean;
  aiContentAlerts: boolean;
  taskReminders: boolean;
  dailySummary: boolean;
  soundEnabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  pushEnabled: true,
  aiContentAlerts: true,
  taskReminders: true,
  dailySummary: true,
  soundEnabled: true,
};

/**
 * Get notification preferences from localStorage
 */
export function getNotificationPreferences(): NotificationPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem("saydo_notification_prefs");
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore errors
  }

  return DEFAULT_PREFERENCES;
}

/**
 * Save notification preferences to localStorage
 */
export function saveNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const current = getNotificationPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem("saydo_notification_prefs", JSON.stringify(updated));
  } catch {
    // Ignore errors
  }
}

/**
 * Check for urgent tasks and reminders and create notifications
 * Avoids duplicates by checking if notification was created in last 30 minutes
 */
export async function checkAndNotifyUrgentItems(
  userId: string
): Promise<{ success: boolean; notificationsCreated: number; error?: string }> {
  const supabase = getSupabaseClient();
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  
  let notificationsCreated = 0;

  try {
    // 1. Check for urgent tasks (priority="urgent" OR due within 1 hour, status="pending")
    // Fetch urgent priority tasks
    const { data: urgentPriorityTasks, error: urgentError } = await supabase
      .from("tasks")
      .select("id, title, priority, due_date, due_time, status")
      .eq("user_id", userId)
      .eq("status", "pending")
      .eq("priority", "urgent");

    // Fetch tasks due within 1 hour
    const { data: dueSoonTasks, error: dueSoonError } = await supabase
      .from("tasks")
      .select("id, title, priority, due_date, due_time, status")
      .eq("user_id", userId)
      .eq("status", "pending")
      .not("due_date", "is", null)
      .lte("due_date", oneHourFromNow.toISOString());

    const tasksError = urgentError || dueSoonError;
    // Combine and deduplicate tasks
    const urgentTasksMap = new Map();
    if (urgentPriorityTasks) {
      urgentPriorityTasks.forEach(task => urgentTasksMap.set(task.id, task));
    }
    if (dueSoonTasks) {
      dueSoonTasks.forEach(task => urgentTasksMap.set(task.id, task));
    }
    const urgentTasks = Array.from(urgentTasksMap.values());

    if (tasksError) {
      console.error("[checkAndNotifyUrgentItems] Error fetching urgent tasks:", tasksError);
    } else if (urgentTasks) {
      for (const task of urgentTasks) {
        // Check if task is actually urgent (priority="urgent" OR due within 1 hour)
        const isUrgentPriority = task.priority === "urgent";
        let isDueSoon = false;
        
        if (task.due_date) {
          const dueDate = new Date(task.due_date);
          if (task.due_time) {
            const [hours, minutes] = task.due_time.split(':').map(Number);
            dueDate.setHours(hours, minutes, 0, 0);
          }
          isDueSoon = dueDate.getTime() <= oneHourFromNow.getTime() && dueDate.getTime() >= now.getTime();
        }

        if (isUrgentPriority || isDueSoon) {
          // Check if notification already exists for this task (within last 30 minutes)
          const taskDeepLink = `/dashboard/tasks?task=${task.id}`;
          const { data: existingNotification } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", userId)
            .eq("deep_link", taskDeepLink)
            .gte("created_at", thirtyMinutesAgo.toISOString())
            .limit(1)
            .maybeSingle();

          if (!existingNotification) {
            const result = await notifyUrgentTask(
              userId,
              task.id,
              task.title,
              task.due_date || undefined,
              task.due_time || undefined
            );
            if (result.success) {
              notificationsCreated++;
            }
          }
        }
      }
    }

    // 2. Check for upcoming reminders (reminder_time within 1 hour OR priority="urgent", not completed/snoozed)
    // Fetch urgent priority reminders
    const { data: urgentPriorityReminders, error: urgentReminderError } = await supabase
      .from("reminders")
      .select("id, title, reminder_time, priority, is_completed, is_snoozed")
      .eq("user_id", userId)
      .eq("is_completed", false)
      .eq("is_snoozed", false)
      .eq("priority", "urgent");

    // Fetch reminders due within 1 hour
    const { data: dueSoonReminders, error: dueSoonReminderError } = await supabase
      .from("reminders")
      .select("id, title, reminder_time, priority, is_completed, is_snoozed")
      .eq("user_id", userId)
      .eq("is_completed", false)
      .eq("is_snoozed", false)
      .lte("reminder_time", oneHourFromNow.toISOString())
      .gte("reminder_time", now.toISOString());

    const remindersError = urgentReminderError || dueSoonReminderError;
    // Combine and deduplicate reminders
    const remindersMap = new Map();
    if (urgentPriorityReminders) {
      urgentPriorityReminders.forEach(reminder => remindersMap.set(reminder.id, reminder));
    }
    if (dueSoonReminders) {
      dueSoonReminders.forEach(reminder => remindersMap.set(reminder.id, reminder));
    }
    const upcomingReminders = Array.from(remindersMap.values());

    if (remindersError) {
      console.error("[checkAndNotifyUrgentItems] Error fetching reminders:", remindersError);
    } else if (upcomingReminders) {
      for (const reminder of upcomingReminders) {
        // Check if reminder is actually due soon (within 1 hour) OR urgent
        const reminderTime = new Date(reminder.reminder_time);
        const isUrgentPriority = reminder.priority === "urgent";
        const isDueSoon = reminderTime.getTime() <= oneHourFromNow.getTime() && reminderTime.getTime() >= now.getTime();

        if (isUrgentPriority || isDueSoon) {
          // Check if notification already exists for this reminder (within last 30 minutes)
          const reminderDeepLink = `/dashboard/tasks?reminder=${reminder.id}`;
          const { data: existingNotification } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", userId)
            .eq("deep_link", reminderDeepLink)
            .gte("created_at", thirtyMinutesAgo.toISOString())
            .limit(1)
            .maybeSingle();

          if (!existingNotification) {
            const result = await notifyReminder(
              userId,
              reminder.id,
              reminder.title,
              reminderTime,
              reminder.priority || undefined
            );
            if (result.success) {
              notificationsCreated++;
            }
          }
        }
      }
    }

    return { success: true, notificationsCreated };
  } catch (error) {
    console.error("[checkAndNotifyUrgentItems] Error:", error);
    return {
      success: false,
      notificationsCreated,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}




