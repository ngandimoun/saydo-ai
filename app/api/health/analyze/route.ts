import { createClient } from "@/lib/supabase-server";
import { analyzeHealth } from "@/src/mastra/index";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health analysis API endpoint.
 * Returns personalized health recommendations based on user's health profile.
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
    const { query, includeEnvironment } = body as {
      query?: string;
      includeEnvironment?: boolean;
    };

    // Run health analysis workflow
    const result = await analyzeHealth({
      userId: user.id,
      query,
      includeEnvironment: includeEnvironment ?? true,
    });

    // Return the result
    if (result.status === "success" && result.result?.success) {
      return new Response(
        JSON.stringify({
          success: true,
          analysis: result.result.analysis,
          environment: result.result.environment,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.result?.error || "Health analysis failed",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Health analysis API error:", error);
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

/**
 * GET endpoint for quick health check-in.
 * Returns a personalized health recommendation without a specific query.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Check for query parameter
    const searchParams = request.nextUrl.searchParams;
    const includeEnvironment = searchParams.get("includeEnvironment") !== "false";

    // Run health analysis without specific query
    const result = await analyzeHealth({
      userId: user.id,
      includeEnvironment,
    });

    if (result.status === "success" && result.result?.success) {
      return new Response(
        JSON.stringify({
          success: true,
          analysis: result.result.analysis,
          environment: result.result.environment,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.result?.error || "Health analysis failed",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Health analysis API error:", error);
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

