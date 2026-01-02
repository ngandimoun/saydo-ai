import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { fetchBriefRecapData } from "@/lib/dashboard/brief-recap-data";
import { generateBriefRecap } from "@/lib/dashboard/generate-brief-recap";

export const dynamic = "force-dynamic";

/**
 * Brief Recap API endpoint.
 * Generates extremely short recap in user's selected language.
 * 
 * GET /api/dashboard/brief-recap
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

    // Fetch brief recap data and generate recap
    const data = await fetchBriefRecapData(user.id, supabase);
    const recap = await generateBriefRecap(user.id, data);

    // Validate recap is not empty
    if (!recap || recap.trim() === '') {
      console.warn('[brief-recap/route] Generated recap is empty, using fallback');
      return NextResponse.json({
        success: true,
        recap: "Welcome back! Ready to make today count?",
      });
    }

    console.log('[brief-recap/route] Returning recap:', recap);

    return NextResponse.json({
      success: true,
      recap: recap.trim(),
    });
  } catch (error) {
    console.error("[brief-recap/route] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

