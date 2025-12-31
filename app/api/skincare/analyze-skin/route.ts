import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { analyzeSkinTool } from "@/src/mastra/tools/skincare-tools";

export const dynamic = "force-dynamic";

/**
 * Analyze skin photo
 * POST /api/skincare/analyze-skin
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
    const { fileUrl, mimeType } = body;

    if (!fileUrl || !mimeType) {
      return NextResponse.json(
        { error: "fileUrl and mimeType are required" },
        { status: 400 }
      );
    }

    const result = await analyzeSkinTool.execute({
      userId: user.id,
      fileUrl,
      mimeType,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to analyze skin" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysisId: result.analysisId,
      analysis: result.analysis,
    });
  } catch (error) {
    console.error("[skincare/analyze-skin] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze skin",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

