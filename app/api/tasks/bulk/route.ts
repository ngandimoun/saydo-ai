import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * Bulk operations API for tasks
 * Supports: complete, reschedule, dismiss (cancel)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await request.json();
    const { action, taskIds, dueDate, dueTime } = body as {
      action: "complete" | "reschedule" | "dismiss";
      taskIds: string[];
      dueDate?: string; // ISO date string for reschedule
      dueTime?: string; // HH:MM format for reschedule
    };

    if (!action || !taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Action and taskIds array are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Build update object based on action
    const updates: Record<string, unknown> = {};

    if (action === "complete") {
      updates.status = "completed";
      updates.completed_at = new Date().toISOString();
    } else if (action === "reschedule") {
      if (!dueDate) {
        return new Response(
          JSON.stringify({ error: "dueDate is required for reschedule action" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      updates.due_date = dueDate;
      if (dueTime) {
        updates.due_time = dueTime;
      }
    } else if (action === "dismiss") {
      updates.status = "cancelled";
    }

    // Perform bulk update
    const { error } = await supabase
      .from("tasks")
      .update(updates)
      .in("id", taskIds)
      .eq("user_id", user.id);

    if (error) {
      console.error("[Bulk Tasks API] Error:", error);
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        updatedCount: taskIds.length,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Bulk Tasks API] Exception:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}


