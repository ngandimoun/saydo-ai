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

  return createNotification({
    userId,
    title: "New Content Ready",
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
      data: options?.data,
      requireInteraction: options?.requireInteraction || false,
    });
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



