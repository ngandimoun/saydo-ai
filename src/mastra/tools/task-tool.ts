import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getUserIdFromContext } from "./utils";

// Task priority and status enums matching lib/dashboard/types.ts
const TaskPrioritySchema = z.enum(["urgent", "high", "medium", "low"]);
const TaskStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

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
 * Tool to create a new task for the user.
 * Can be used by agents to create tasks from voice commands.
 */
export const createTaskTool = createTool({
  id: "create-task",
  description:
    "Creates a new task for the user. Use this when the user wants to add a task, to-do item, or reminder about something to do.",
  inputSchema: z.object({
    userId: z.string().describe("The user's unique identifier"),
    title: z.string().describe("The task title - what needs to be done"),
    description: z.string().optional().describe("Optional detailed description"),
    priority: TaskPrioritySchema.default("medium").describe(
      "Task priority: urgent, high, medium, or low"
    ),
    dueDate: z
      .string()
      .optional()
      .describe("Due date in ISO format (YYYY-MM-DD)"),
    dueTime: z
      .string()
      .optional()
      .describe("Due time in HH:MM format (24-hour)"),
    category: z
      .string()
      .optional()
      .describe("Category like 'work', 'health', 'personal'"),
    tags: z
      .array(z.string())
      .default([])
      .describe("Tags for organizing the task"),
    sourceRecordingId: z
      .string()
      .optional()
      .describe("ID of voice recording if extracted from voice"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    taskId: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({
    userId,
    title,
    description,
    priority,
    dueDate,
    dueTime,
    category,
    tags,
    sourceRecordingId,
  }) => {
    console.log('[createTaskTool] Executing', {
      userId,
      title,
      priority,
      dueDate,
      tags,
      sourceRecordingId,
    });

    try {
      const supabase = getSupabaseClient();

      const insertData = {
        user_id: userId,
        title,
        description: description || null,
        priority,
        status: "pending",
        due_date: dueDate || null,
        due_time: dueTime || null,
        category: category || null,
        tags: tags || [],
        source_recording_id: sourceRecordingId || null,
      };

      console.log('[createTaskTool] Inserting task', insertData);

      const { data, error } = await supabase
        .from("tasks")
        .insert(insertData)
        .select("id")
        .single();

      if (error) {
        console.error('[createTaskTool] Database error', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          title,
          userId,
        });
        return { success: false, error: error.message };
      }

      console.log('[createTaskTool] Task created successfully', {
        taskId: data.id,
        title,
        userId,
      });

      // Learn patterns from this task (async, don't block)
      import("@/lib/mastra/pattern-learning").then(({ analyzeTaskPatterns }) => {
        import("@/lib/mastra/pattern-storage").then(({ savePattern }) => {
          import("@/lib/dashboard/types").then(({ Task }) => {
            const taskObj: Task = {
              id: data.id,
              userId,
              title,
              description: description || undefined,
              priority,
              status: "pending",
              dueDate: dueDate ? new Date(dueDate) : undefined,
              dueTime: dueTime || undefined,
              category: category || undefined,
              tags: tags || [],
              sourceRecordingId: sourceRecordingId || undefined,
              createdAt: new Date(),
            };
            const patterns = analyzeTaskPatterns(taskObj);
            patterns.forEach((pattern) => {
              savePattern(userId, pattern.patternType, pattern.patternData).catch(
                (err) => console.error("[createTaskTool] Pattern learning error", err)
              );
            });
          });
        });
      });

      // Check if task is urgent and create notification (async, don't block)
      const isUrgentPriority = priority === "urgent";
      let isDueSoon = false;
      
      if (dueDate) {
        const dueDateObj = new Date(dueDate);
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        
        if (dueTime) {
          const [hours, minutes] = dueTime.split(':').map(Number);
          dueDateObj.setHours(hours, minutes, 0, 0);
        }
        
        isDueSoon = dueDateObj.getTime() <= oneHourFromNow.getTime() && dueDateObj.getTime() >= now.getTime();
      }

      if (isUrgentPriority || isDueSoon) {
        import("@/lib/mastra/notification-service").then(({ notifyUrgentTask }) => {
          notifyUrgentTask(userId, data.id, title, dueDate || undefined, dueTime || undefined).catch(
            (err) => console.error("[createTaskTool] Failed to create urgent task notification", err)
          );
        });
      }

      return { success: true, taskId: data.id };
    } catch (err) {
      console.error('[createTaskTool] Exception', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        title,
        userId,
      });
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create task",
      };
    }
  },
});

/**
 * Tool to get user's tasks with optional filters.
 */
export const getTasksTool = createTool({
  id: "get-tasks",
  description:
    "Fetches the user's tasks with optional filtering by status, priority, or category. NOTE: userId is automatically provided - you don't need to pass it.",
  inputSchema: z.object({
    userId: z.string().optional().describe("User ID (automatically provided - do not pass this parameter)"),
    status: TaskStatusSchema.optional().describe("Filter by task status"),
    priority: TaskPrioritySchema.optional().describe("Filter by priority"),
    category: z.string().optional().describe("Filter by category"),
    includeCompleted: z
      .boolean()
      .default(false)
      .describe("Whether to include completed tasks"),
    limit: z.number().default(20).describe("Maximum number of tasks to return"),
  }),
  outputSchema: z.object({
    tasks: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        priority: TaskPrioritySchema,
        status: TaskStatusSchema,
        dueDate: z.string().nullable(),
        dueTime: z.string().nullable(),
        category: z.string().nullable(),
        tags: z.array(z.string()),
        createdAt: z.string(),
        completedAt: z.string().nullable(),
      })
    ),
    error: z.string().optional(),
  }),
  execute: async ({
    userId,
    status,
    priority,
    category,
    includeCompleted,
    limit,
  }, context?) => {
    try {
      console.log("[getTasksTool] Executing", {
        inputUserId: userId,
        status,
        priority,
        category,
        includeCompleted,
        limit,
        hasContext: !!context,
      });

      // Validate and get userId from context
      const actualUserId = getUserIdFromContext(userId, context);
      
      console.log("[getTasksTool] Using userId", {
        userId: actualUserId,
        filters: { status, priority, category, includeCompleted, limit },
      });

      const supabase = getSupabaseClient();

      let query = supabase
        .from("tasks")
        .select("*")
        .eq("user_id", actualUserId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!includeCompleted) {
        query = query.neq("status", "completed");
      }

      if (status) {
        query = query.eq("status", status);
      }

      if (priority) {
        query = query.eq("priority", priority);
      }

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[getTasksTool] Database error", {
          userId: actualUserId,
          error: error.message,
        });
        return { tasks: [], error: error.message };
      }

      const result = {
        tasks: (data || []).map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          dueDate: task.due_date,
          dueTime: task.due_time,
          category: task.category,
          tags: task.tags || [],
          createdAt: task.created_at,
          completedAt: task.completed_at,
        })),
      };
    } catch (err) {
      return {
        tasks: [],
        error: err instanceof Error ? err.message : "Failed to fetch tasks",
      };
    }
  },
});

/**
 * Tool to update an existing task.
 */
export const updateTaskTool = createTool({
  id: "update-task",
  description:
    "Updates an existing task. Can change status, priority, due date, or other fields.",
  inputSchema: z.object({
    taskId: z.string().describe("The task ID to update"),
    userId: z.string().describe("The user's ID (for verification)"),
    title: z.string().optional().describe("New task title"),
    description: z.string().optional().describe("New description"),
    priority: TaskPrioritySchema.optional().describe("New priority"),
    status: TaskStatusSchema.optional().describe("New status"),
    dueDate: z.string().optional().describe("New due date (ISO format)"),
    dueTime: z.string().optional().describe("New due time (HH:MM)"),
    category: z.string().optional().describe("New category"),
    tags: z.array(z.string()).optional().describe("New tags"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async ({
    taskId,
    userId,
    title,
    description,
    priority,
    status,
    dueDate,
    dueTime,
    category,
    tags,
  }) => {
    try {
      const supabase = getSupabaseClient();

      // Build update object with only provided fields
      const updates: Record<string, unknown> = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (priority !== undefined) updates.priority = priority;
      if (status !== undefined) {
        updates.status = status;
        if (status === "completed") {
          updates.completed_at = new Date().toISOString();
        }
      }
      if (dueDate !== undefined) updates.due_date = dueDate;
      if (dueTime !== undefined) updates.due_time = dueTime;
      if (category !== undefined) updates.category = category;
      if (tags !== undefined) updates.tags = tags;

      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId)
        .eq("user_id", userId);

      if (error) {
        return { success: false, error: error.message };
      }

      // Learn patterns from this update (async, don't block)
      if (status === "completed" || priority || category || tags) {
        import("@/lib/mastra/pattern-learning").then(({ analyzeTaskPatterns }) => {
          import("@/lib/mastra/pattern-storage").then(({ savePattern }) => {
            import("@/lib/dashboard/types").then(({ Task }) => {
              // Fetch updated task to learn from
              getSupabaseClient()
                .from("tasks")
                .select("*")
                .eq("id", taskId)
                .single()
                .then(({ data: updatedTask }) => {
                  if (updatedTask) {
                    const taskObj: Task = {
                      id: updatedTask.id,
                      userId,
                      title: updatedTask.title,
                      description: updatedTask.description || undefined,
                      priority: updatedTask.priority,
                      status: updatedTask.status,
                      dueDate: updatedTask.due_date ? new Date(updatedTask.due_date) : undefined,
                      dueTime: updatedTask.due_time || undefined,
                      category: updatedTask.category || undefined,
                      tags: updatedTask.tags || [],
                      createdAt: new Date(updatedTask.created_at),
                      completedAt: updatedTask.completed_at ? new Date(updatedTask.completed_at) : undefined,
                    };
                    const patterns = analyzeTaskPatterns(taskObj);
                    patterns.forEach((pattern) => {
                      savePattern(userId, pattern.patternType, pattern.patternData).catch(
                        (err) => console.error("[updateTaskTool] Pattern learning error", err)
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
        error: err instanceof Error ? err.message : "Failed to update task",
      };
    }
  },
});

/**
 * Tool to delete (soft-delete by setting status to cancelled) a task.
 */
export const deleteTaskTool = createTool({
  id: "delete-task",
  description:
    "Deletes a task by setting its status to cancelled. Use when user wants to remove a task.",
  inputSchema: z.object({
    taskId: z.string().describe("The task ID to delete"),
    userId: z.string().describe("The user's ID (for verification)"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async ({ taskId, userId }) => {
    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from("tasks")
        .update({ status: "cancelled" })
        .eq("id", taskId)
        .eq("user_id", userId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to delete task",
      };
    }
  },
});

// Export all task tools
export const taskTools = {
  createTask: createTaskTool,
  getTasks: getTasksTool,
  updateTask: updateTaskTool,
  deleteTask: deleteTaskTool,
};

