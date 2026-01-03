import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { checkAndNotifyUrgentItems } from "@/lib/mastra/notification-service";

export const dynamic = "force-dynamic";

/**
 * Check for urgent tasks and reminders and create notifications
 * GET /api/notifications/check-urgent
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check and create notifications for urgent items
    const result = await checkAndNotifyUrgentItems(user.id);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Failed to check urgent items",
          details: result.error || "Unknown error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notificationsCreated: result.notificationsCreated,
    });
  } catch (error) {
    console.error("[check-urgent] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to check urgent items",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

