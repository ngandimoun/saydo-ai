import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateSkincareRoutineTool } from "@/src/mastra/tools/skincare-tools";

export const dynamic = "force-dynamic";

/**
 * Generate skincare routine
 * POST /api/skincare/generate-routine
 * 
 * Body: { routineType: "am" | "pm" }
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
    const { routineType } = body;

    if (!routineType || !["am", "pm"].includes(routineType)) {
      return NextResponse.json(
        { error: "routineType must be 'am' or 'pm'" },
        { status: 400 }
      );
    }

    const result = await generateSkincareRoutineTool.execute({
      userId: user.id,
      routineType,
    });

    if (!result.success) {
      // Check if it's a profile not found error
      if (result.error?.includes("profile not found")) {
        return NextResponse.json(
          { 
            error: "Please complete your skincare profile first",
            code: "PROFILE_REQUIRED"
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: result.error || "Failed to generate routine" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      routineId: result.routineId,
    });
  } catch (error) {
    console.error("[skincare/generate-routine] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate routine",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

