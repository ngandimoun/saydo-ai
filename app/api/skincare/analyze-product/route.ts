import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { analyzeSkincareProductTool } from "@/src/mastra/tools/skincare-tools";

export const dynamic = "force-dynamic";

/**
 * Analyze skincare product
 * POST /api/skincare/analyze-product
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

    const result = await analyzeSkincareProductTool.execute({
      userId: user.id,
      fileUrl,
      mimeType,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to analyze product" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      productId: result.productId,
      analysis: result.analysis,
    });
  } catch (error) {
    console.error("[skincare/analyze-product] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze product",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

