import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

/**
 * Bulk operations API for reminders
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
    const { action, reminderIds, reminderTime } = body as {
      action: "complete" | "reschedule" | "dismiss";
      reminderIds: string[];
      reminderTime?: string; // ISO datetime string for reschedule
    };

    if (
      !action ||
      !reminderIds ||
      !Array.isArray(reminderIds) ||
      reminderIds.length === 0
    ) {
      return new Response(
        JSON.stringify({ error: "Action and reminderIds array are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Build update object based on action
    const updates: Record<string, unknown> = {};

    if (action === "complete") {
      updates.is_completed = true;
    } else if (action === "reschedule") {
      if (!reminderTime) {
        return new Response(
          JSON.stringify({
            error: "reminderTime is required for reschedule action",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      // Parse and validate the reminder time
      const parsedTime = new Date(reminderTime);
      if (isNaN(parsedTime.getTime())) {
        return new Response(
          JSON.stringify({ error: "Invalid reminderTime format" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      updates.reminder_time = parsedTime.toISOString();
      // Clear snooze if rescheduling
      updates.is_snoozed = false;
      updates.snooze_until = null;
    } else if (action === "dismiss") {
      // For reminders, we mark as completed to dismiss
      updates.is_completed = true;
    }

    // Perform bulk update
    const { error } = await supabase
      .from("reminders")
      .update(updates)
      .in("id", reminderIds)
      .eq("user_id", user.id);

    if (error) {
      console.error("[Bulk Reminders API] Error:", error);
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
        updatedCount: reminderIds.length,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[Bulk Reminders API] Exception:", error);
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

