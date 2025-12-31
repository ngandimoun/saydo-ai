import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { updateStreakTool } from "@/src/mastra/tools/health-engagement-tools";

export const dynamic = "force-dynamic";

/**
 * Update user's streak
 * POST /api/health/update-streak
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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { streakType } = body;

    if (!streakType) {
      return NextResponse.json(
        { error: "streakType is required" },
        { status: 400 }
      );
    }

    const result = await updateStreakTool.execute({
      userId: user.id,
      streakType,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update streak" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      currentStreak: result.currentStreak,
    });
  } catch (error) {
    console.error("[update-streak] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to update streak",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

