import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateAllInterventions } from "@/lib/intervention-service";

export const dynamic = "force-dynamic";

/**
 * Generate proactive interventions for the authenticated user
 * POST /api/health/interventions/generate
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

    // Generate interventions
    const result = await generateAllInterventions(user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate interventions" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      interventions: result.interventions,
      count: result.interventions.length,
    });
  } catch (error) {
    console.error("[interventions/generate] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate interventions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

