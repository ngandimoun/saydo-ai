import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Reminder priority and type enums
const ReminderPrioritySchema = z.enum(["urgent", "high", "medium", "low"]);
const ReminderTypeSchema = z.enum(["task", "todo", "reminder"]);

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
 * Smart time parsing helper
 * Parses relative times like "in 30 min", "in 10 min", "tomorrow", etc.
 */
function parseSmartTime(timeString: string | undefined): Date | null {
  if (!timeString) return null;

  const now = new Date();
  const lowerTime = timeString.toLowerCase().trim();

  // Handle "in X min" or "in X minutes"
  const inMinutesMatch = lowerTime.match(/in\s+(\d+)\s+min(?:ute)?s?/i);
  if (inMinutesMatch) {
    const minutes = parseInt(inMinutesMatch[1], 10);
    return new Date(now.getTime() + minutes * 60 * 1000);
  }

  // Handle "in X hour" or "in X hours"
  const inHoursMatch = lowerTime.match(/in\s+(\d+)\s+hour?s?/i);
  if (inHoursMatch) {
    const hours = parseInt(inHoursMatch[1], 10);
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  // Handle "tomorrow"
  if (lowerTime.includes("tomorrow")) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    // If time is specified, parse it
    const timeMatch = lowerTime.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const ampm = timeMatch[3]?.toLowerCase();
      if (ampm === "pm" && hours !== 12) hours += 12;
      if (ampm === "am" && hours === 12) hours = 0;
      tomorrow.setHours(hours, minutes, 0, 0);
    } else {
      tomorrow.setHours(9, 0, 0, 0); // Default to 9 AM
    }
    return tomorrow;
  }

  // Try parsing as ISO datetime string
  try {
    const parsed = new Date(timeString);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch {
    // Continue to next parsing method
  }

  return null;
}

/**
 * Tool to create a new reminder for the user.
 * Supports smart time parsing, AI tagging, priority detection, and type classification.
 */
export const createReminderTool = createTool({
  id: "create-reminder",
  description:
    "Creates a new reminder for the user. Supports smart time parsing (e.g., 'in 30 min', 'tomorrow'), AI tagging, priority detection, and type classification (task/todo/reminder).",
  inputSchema: z.object({
    userId: z.string().describe("The user's unique identifier"),
    title: z.string().describe("The reminder title - what needs to be reminded"),
    description: z.string().optional().describe("Optional detailed description"),
    reminderTime: z
      .string()
      .describe(
        "When to remind - can be ISO datetime, relative time like 'in 30 min', or 'tomorrow'"
      ),
    isRecurring: z.boolean().default(false).describe("Whether the reminder repeats"),
    recurrencePattern: z
      .string()
      .optional()
      .describe("Recurrence pattern like 'daily', 'weekly', 'monthly'"),
    tags: z
      .array(z.string())
      .default([])
      .describe("AI-generated tags for categorization (e.g., 'health', 'work', 'meeting')"),
    priority: ReminderPrioritySchema.default("medium").describe(
      "Reminder priority: urgent, high, medium, or low"
    ),
    type: ReminderTypeSchema.default("reminder").describe(
      "Item type: task (has due date), todo (general item), or reminder (time-sensitive)"
    ),
    sourceRecordingId: z
      .string()
      .optional()
      .describe("ID of voice recording if extracted from voice"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    reminderId: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({
    userId,
    title,
    description,
    reminderTime,
    isRecurring,
    recurrencePattern,
    tags,
    priority,
    type,
    sourceRecordingId,
  }) => {
    console.log('[createReminderTool] Executing', {
      userId,
      title,
      reminderTime,
      priority,
      type,
      tags,
      sourceRecordingId,
    });

    try {
      const supabase = getSupabaseClient();

      // Parse smart time
      const parsedTime = parseSmartTime(reminderTime);
      if (!parsedTime) {
        console.error('[createReminderTool] Failed to parse time', {
          reminderTime,
          title,
          userId,
        });
        return {
          success: false,
          error: `Unable to parse reminder time: ${reminderTime}`,
        };
      }

      console.log('[createReminderTool] Parsed time', {
        original: reminderTime,
        parsed: parsedTime.toISOString(),
        title,
      });

      const insertData = {
        user_id: userId,
        title,
        description: description || null,
        reminder_time: parsedTime.toISOString(),
        is_recurring: isRecurring,
        recurrence_pattern: recurrencePattern || null,
        tags: tags || [],
        priority: priority,
        type: type,
        source_recording_id: sourceRecordingId || null,
        is_completed: false,
        is_snoozed: false,
      };

      console.log('[createReminderTool] Inserting reminder', insertData);

      const { data, error } = await supabase
        .from("reminders")
        .insert(insertData)
        .select("id")
        .single();

      if (error) {
        console.error('[createReminderTool] Database error', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          title,
          userId,
        });
        return { success: false, error: error.message };
      }

      console.log('[createReminderTool] Reminder created successfully', {
        reminderId: data.id,
        title,
        userId,
      });

      // Learn patterns from this reminder (async, don't block)
      import("@/lib/mastra/pattern-learning").then(({ analyzeReminderPatterns }) => {
        import("@/lib/mastra/pattern-storage").then(({ savePattern }) => {
          import("@/lib/dashboard/types").then(({ Reminder }) => {
            const reminderObj: Reminder = {
              id: data.id,
              userId,
              title,
              description: description || undefined,
              reminderTime: parsedTime,
              isRecurring: isRecurring,
              recurrencePattern: recurrencePattern || undefined,
              isCompleted: false,
              isSnoozed: false,
              tags: tags || [],
              priority: priority,
              type: type,
              sourceRecordingId: sourceRecordingId || undefined,
              createdAt: new Date(),
            };
            const patterns = analyzeReminderPatterns(reminderObj);
            patterns.forEach((pattern) => {
              savePattern(userId, pattern.patternType, pattern.patternData).catch(
                (err) => console.error("[createReminderTool] Pattern learning error", err)
              );
            });
          });
        });
      });

      return { success: true, reminderId: data.id };
    } catch (err) {
      console.error('[createReminderTool] Exception', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        title,
        userId,
      });
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create reminder",
      };
    }
  },
});

/**
 * Tool to get user's reminders with optional filters.
 */
export const getRemindersTool = createTool({
  id: "get-reminders",
  description:
    "Fetches the user's reminders with optional filtering by priority, type, or tags.",
  inputSchema: z.object({
    userId: z.string().describe("The user's unique identifier"),
    priority: ReminderPrioritySchema.optional().describe("Filter by priority"),
    type: ReminderTypeSchema.optional().describe("Filter by type"),
    includeCompleted: z
      .boolean()
      .default(false)
      .describe("Whether to include completed reminders"),
    limit: z.number().default(20).describe("Maximum number of reminders to return"),
  }),
  outputSchema: z.object({
    reminders: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        reminderTime: z.string(),
        isRecurring: z.boolean(),
        recurrencePattern: z.string().nullable(),
        tags: z.array(z.string()),
        priority: ReminderPrioritySchema,
        type: ReminderTypeSchema,
        isCompleted: z.boolean(),
        isSnoozed: z.boolean(),
        snoozeUntil: z.string().nullable(),
        createdAt: z.string(),
      })
    ),
    error: z.string().optional(),
  }),
  execute: async ({ userId, priority, type, includeCompleted, limit }) => {
    try {
      const supabase = getSupabaseClient();

      let query = supabase
        .from("reminders")
        .select("*")
        .eq("user_id", userId)
        .order("reminder_time", { ascending: true })
        .limit(limit);

      if (!includeCompleted) {
        query = query.eq("is_completed", false);
      }

      if (priority) {
        query = query.eq("priority", priority);
      }

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;

      if (error) {
        return { reminders: [], error: error.message };
      }

      return {
        reminders: (data || []).map((reminder) => ({
          id: reminder.id,
          title: reminder.title,
          description: reminder.description,
          reminderTime: reminder.reminder_time,
          isRecurring: reminder.is_recurring,
          recurrencePattern: reminder.recurrence_pattern,
          tags: reminder.tags || [],
          priority: reminder.priority || "medium",
          type: reminder.type || "reminder",
          isCompleted: reminder.is_completed,
          isSnoozed: reminder.is_snoozed,
          snoozeUntil: reminder.snooze_until,
          createdAt: reminder.created_at,
        })),
      };
    } catch (err) {
      return {
        reminders: [],
        error: err instanceof Error ? err.message : "Failed to fetch reminders",
      };
    }
  },
});

/**
 * Tool to update an existing reminder.
 * Can be used to reschedule, complete, or update other reminder properties.
 */
export const updateReminderTool = createTool({
  id: "update-reminder",
  description:
    "Updates an existing reminder. Can change reminder time (for rescheduling), completion status, priority, tags, or other fields.",
  inputSchema: z.object({
    reminderId: z.string().describe("The reminder's unique identifier"),
    userId: z.string().describe("The user's unique identifier"),
    title: z.string().optional().describe("The reminder title"),
    description: z.string().optional().describe("Optional detailed description"),
    reminderTime: z
      .string()
      .optional()
      .describe(
        "When to remind - can be ISO datetime, relative time like 'in 30 min', 'tomorrow', or ISO string"
      ),
    isCompleted: z
      .boolean()
      .optional()
      .describe("Whether the reminder is completed"),
    isSnoozed: z.boolean().optional().describe("Whether the reminder is snoozed"),
    snoozeUntil: z
      .string()
      .optional()
      .describe("When to show the reminder again if snoozed (ISO datetime)"),
    priority: ReminderPrioritySchema.optional().describe(
      "Reminder priority: urgent, high, medium, or low"
    ),
    type: ReminderTypeSchema.optional().describe(
      "Item type: task, todo, or reminder"
    ),
    tags: z
      .array(z.string())
      .optional()
      .describe("Tags for organizing the reminder"),
    isRecurring: z.boolean().optional().describe("Whether the reminder repeats"),
    recurrencePattern: z
      .string()
      .optional()
      .describe("Recurrence pattern like 'daily', 'weekly', 'monthly'"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async ({
    reminderId,
    userId,
    title,
    description,
    reminderTime,
    isCompleted,
    isSnoozed,
    snoozeUntil,
    priority,
    type,
    tags,
    isRecurring,
    recurrencePattern,
  }) => {
    try {
      const supabase = getSupabaseClient();

      // Build update object with only provided fields
      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (priority !== undefined) updates.priority = priority;
      if (type !== undefined) updates.type = type;
      if (tags !== undefined) updates.tags = tags;
      if (isRecurring !== undefined) updates.is_recurring = isRecurring;
      if (recurrencePattern !== undefined)
        updates.recurrence_pattern = recurrencePattern;
      if (isCompleted !== undefined) updates.is_completed = isCompleted;
      if (isSnoozed !== undefined) updates.is_snoozed = isSnoozed;
      if (snoozeUntil !== undefined)
        updates.snooze_until = snoozeUntil ? snoozeUntil : null;

      // Handle reminder time (for rescheduling)
      if (reminderTime !== undefined) {
        // Try parsing as smart time first
        const parsedTime = parseSmartTime(reminderTime);
        if (parsedTime) {
          updates.reminder_time = parsedTime.toISOString();
        } else {
          // Try parsing as ISO string
          try {
            const isoDate = new Date(reminderTime);
            if (!isNaN(isoDate.getTime())) {
              updates.reminder_time = isoDate.toISOString();
            } else {
              return {
                success: false,
                error: `Unable to parse reminder time: ${reminderTime}`,
              };
            }
          } catch {
            return {
              success: false,
              error: `Unable to parse reminder time: ${reminderTime}`,
            };
          }
        }
      }

      const { error } = await supabase
        .from("reminders")
        .update(updates)
        .eq("id", reminderId)
        .eq("user_id", userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Learn patterns from this update (async, don't block)
      if (isCompleted || priority || tags || reminderTime) {
        import("@/lib/mastra/pattern-learning").then(({ analyzeReminderPatterns }) => {
          import("@/lib/mastra/pattern-storage").then(({ savePattern }) => {
            import("@/lib/dashboard/types").then(({ Reminder }) => {
              // Fetch updated reminder to learn from
              getSupabaseClient()
                .from("reminders")
                .select("*")
                .eq("id", reminderId)
                .single()
                .then(({ data: updatedReminder }) => {
                  if (updatedReminder) {
                    const reminderObj: Reminder = {
                      id: updatedReminder.id,
                      userId,
                      title: updatedReminder.title,
                      description: updatedReminder.description || undefined,
                      reminderTime: new Date(updatedReminder.reminder_time),
                      isRecurring: updatedReminder.is_recurring,
                      recurrencePattern: updatedReminder.recurrence_pattern || undefined,
                      isCompleted: updatedReminder.is_completed,
                      isSnoozed: updatedReminder.is_snoozed,
                      snoozeUntil: updatedReminder.snooze_until ? new Date(updatedReminder.snooze_until) : undefined,
                      tags: updatedReminder.tags || [],
                      priority: updatedReminder.priority,
                      type: updatedReminder.type,
                      createdAt: new Date(updatedReminder.created_at),
                    };
                    const patterns = analyzeReminderPatterns(reminderObj);
                    patterns.forEach((pattern) => {
                      savePattern(userId, pattern.patternType, pattern.patternData).catch(
                        (err) => console.error("[updateReminderTool] Pattern learning error", err)
                      );
                    });
                  }
                });
            });
          });
        });
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update reminder",
      };
    }
  },
});

// Export all reminder tools
export const reminderTools = {
  createReminder: createReminderTool,
  getReminders: getRemindersTool,
  updateReminder: updateReminderTool,
};

