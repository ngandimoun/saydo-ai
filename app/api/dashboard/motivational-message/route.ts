import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateMotivationalMessage } from "@/lib/dashboard/generate-motivational-message";
import { getTimeOfDay } from "@/lib/dashboard/time-utils";

export const dynamic = "force-dynamic";

/**
 * Motivational Message API endpoint.
 * Generates personalized motivational message based on user's Saydo journey.
 * 
 * GET /api/dashboard/motivational-message
 * 
 * Returns a short, personalized message in the user's onboarding language
 * that reflects their current Saydo activity and context.
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

    // Determine time of day for contextual messaging
    const timeOfDay = getTimeOfDay();

    // Generate personalized motivational message
    const message = await generateMotivationalMessage(user.id, timeOfDay);

    // Validate message is not empty
    if (!message || message.trim() === '') {
      console.warn('[motivational-message/route] Generated message is empty, using fallback');
      const hour = new Date().getHours();
      const fallbackMessage = hour < 12 
        ? "Ready to make today count?" 
        : hour < 17 
        ? "Let's keep the momentum going" 
        : "Wind down and reflect";
      
      return NextResponse.json({
        success: true,
        message: fallbackMessage,
        timeOfDay,
      });
    }

    console.log('[motivational-message/route] Returning message:', message);

    return NextResponse.json({
      success: true,
      message: message.trim(),
      timeOfDay,
    });
  } catch (error) {
    console.error("[motivational-message/route] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

