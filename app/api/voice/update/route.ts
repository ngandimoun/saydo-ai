import { createClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Voice recording update API endpoint.
 * Updates transcription and/or ai_summary for a voice recording.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log("[Voice Update API] Request received");
    
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[Voice Update API] Authentication failed", {
        authError: authError?.message,
        hasUser: !!user,
      });
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("[Voice Update API] User authenticated", { userId: user.id });

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("[Voice Update API] Failed to parse request body", { error: parseError });
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { recordingId, transcription, aiSummary } = body;

    console.log("[Voice Update API] Request data", {
      recordingId,
      hasTranscription: transcription !== undefined,
      hasAiSummary: aiSummary !== undefined,
      transcriptionLength: transcription?.length || 0,
      aiSummaryLength: aiSummary?.length || 0,
    });

    if (!recordingId) {
      console.error("[Voice Update API] Missing recordingId");
      return new Response(
        JSON.stringify({ error: "recordingId is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (transcription === undefined && aiSummary === undefined) {
      console.error("[Voice Update API] No fields to update");
      return new Response(
        JSON.stringify({ error: "Either transcription or aiSummary must be provided" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify the recording belongs to the user
    const { data: recording, error: fetchError } = await supabase
      .from("voice_recordings")
      .select("id, user_id")
      .eq("id", recordingId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      console.error("[Voice Update API] Failed to fetch recording", {
        recordingId,
        userId: user.id,
        error: fetchError.message,
        code: fetchError.code,
        details: fetchError.details,
      });
      return new Response(
        JSON.stringify({ 
          error: "Recording not found or access denied",
          details: fetchError.message,
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!recording) {
      console.error("[Voice Update API] Recording not found", {
        recordingId,
        userId: user.id,
      });
      return new Response(
        JSON.stringify({ error: "Recording not found or access denied" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("[Voice Update API] Recording verified", { recordingId });

    // Build update data
    const updateData: {
      transcription?: string;
      ai_summary?: string;
    } = {};

    if (transcription !== undefined) {
      updateData.transcription = transcription;
      console.log("[Voice Update API] Will update transcription", {
        length: transcription.length,
      });
    }

    if (aiSummary !== undefined) {
      updateData.ai_summary = aiSummary;
      console.log("[Voice Update API] Will update ai_summary", {
        length: aiSummary.length,
      });
    }

    // Update the recording
    const { error: updateError, data: updateResult } = await supabase
      .from("voice_recordings")
      .update(updateData)
      .eq("id", recordingId)
      .eq("user_id", user.id)
      .select();

    if (updateError) {
      console.error("[Voice Update API] Failed to update voice recording", {
        recordingId,
        userId: user.id,
        error: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
      });
      return new Response(
        JSON.stringify({
          error: "Failed to update recording",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const duration = Date.now() - startTime;
    console.log("[Voice Update API] Update successful", {
      recordingId,
      duration: `${duration}ms`,
      updatedFields: Object.keys(updateData),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Recording updated successfully",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[Voice Update API] Unexpected error", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
    });
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error && error.stack ? error.stack.split('\n')[0] : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

