import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { initializeUserMemory, initializeOrUpdateUserMemory } from "@/src/mastra/memory/onboarding-memory";
import { getFullUserContext } from "@/src/mastra/tools/user-profile-tool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Initialize Mastra memory with user onboarding data.
 * Called after user completes onboarding to save all onboarding details
 * to Mastra memory for use by agents, workflows, and memory.
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

    // Load full user context from database (includes all onboarding data)
    const userContext = await getFullUserContext(user.id);

    // Initialize or update Mastra memory with onboarding data
    // This ensures all onboarding details are available to agents via memory
    const threadId = await initializeOrUpdateUserMemory(user.id);

    console.log("[onboarding/initialize-memory] Memory initialized", {
      userId: user.id,
      threadId,
      profession: userContext.profession?.name,
      language: userContext.language,
      criticalArtifactsCount: userContext.criticalArtifacts.length,
      socialPlatformsCount: userContext.socialIntelligence.length,
    });

    return NextResponse.json({
      success: true,
      threadId,
      message: "Memory initialized successfully",
    });
  } catch (error) {
    console.error("[onboarding/initialize-memory] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize memory",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

