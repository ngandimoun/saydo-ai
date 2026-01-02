import { createClient } from "@/lib/supabase-server";
import { generateAISummary } from "@/lib/dashboard/generate-ai-summary";
import type { ProductivityStats, SummaryContext } from "@/src/mastra/agents/summary-agent";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * AI Summary API endpoint.
 * Generates daily productivity summary in user's selected language.
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
    const { 
      stats,
      context 
    } = body as {
      stats: ProductivityStats;
      context?: SummaryContext;
    };

    if (!stats) {
      return new Response(JSON.stringify({ error: "Productivity stats are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate stats structure
    if (
      typeof stats.tasksCreated !== "number" ||
      typeof stats.aiDocumentsGenerated !== "number" ||
      typeof stats.voiceNotesRecorded !== "number" ||
      typeof stats.workFilesUploaded !== "number"
    ) {
      return new Response(JSON.stringify({ error: "Invalid productivity stats format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate summary in user's language
    const summary = await generateAISummary(user.id, stats, context);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("AI Summary API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}




