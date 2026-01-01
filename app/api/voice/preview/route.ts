import { createClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";
import { transcribeAudioTool } from "@/src/mastra/tools/transcription-tool";
import { generatePreview } from "@/src/mastra/agents/transcription-preview-agent";
import { getUserContext } from "@/src/mastra/tools/user-profile-tool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Voice preview API endpoint.
 * LIGHTWEIGHT: Only transcribes audio and generates AI summary.
 * No item extraction, no content predictions - those happen when user clicks "Done".
 * 
 * Flow:
 * 1. User records voice → This endpoint transcribes + generates summary
 * 2. User reviews/edits → Frontend shows the preview
 * 3. User clicks "Done" → /api/voice/process does full extraction + save
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

    // Check content type
    const contentType = request.headers.get("content-type") || "";

    let audioBase64: string | undefined;
    let audioUrl: string | undefined;
    let mimeType: "audio/webm" | "audio/mpeg" | "audio/mp3" | "audio/mp4" | "audio/wav" | "audio/ogg" | "audio/flac" = "audio/webm";
    let sourceRecordingId: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await request.formData();
      const audioFile = formData.get("audio") as File | null;
      sourceRecordingId = formData.get("sourceRecordingId") as string | null || undefined;

      if (!audioFile) {
        return new Response(JSON.stringify({ error: "Audio file is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Convert file to base64
      const arrayBuffer = await audioFile.arrayBuffer();
      audioBase64 = Buffer.from(arrayBuffer).toString("base64");
      
      // Determine MIME type
      const fileType = audioFile.type || "audio/webm";
      if (fileType.includes("webm")) mimeType = "audio/webm";
      else if (fileType.includes("mpeg") || fileType.includes("mp3")) mimeType = "audio/mpeg";
      else if (fileType.includes("mp4") || fileType.includes("m4a")) mimeType = "audio/mp4";
      else if (fileType.includes("wav")) mimeType = "audio/wav";
      else if (fileType.includes("ogg")) mimeType = "audio/ogg";
      else if (fileType.includes("flac")) mimeType = "audio/flac";
    } else if (contentType.includes("application/json")) {
      // Handle JSON body with URL or base64 or sourceRecordingId
      const body = await request.json();
      audioUrl = body.audioUrl;
      audioBase64 = body.audioBase64;
      mimeType = body.mimeType || "audio/webm";
      sourceRecordingId = body.sourceRecordingId;

      // If only sourceRecordingId is provided, fetch the audio URL from the database
      if (!audioUrl && !audioBase64 && sourceRecordingId) {
        const { data: recording, error: recordingError } = await supabase
          .from("voice_recordings")
          .select("audio_url, status")
          .eq("id", sourceRecordingId)
          .eq("user_id", user.id)
          .single();

        if (recordingError || !recording) {
          console.error("[voice/preview] Recording not found:", {
            recordingId: sourceRecordingId,
            userId: user.id,
            error: recordingError?.message,
          });
          return new Response(
            JSON.stringify({ 
              error: "Recording not found",
              details: recordingError?.message || "No recording found"
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        if (!recording.audio_url || typeof recording.audio_url !== "string" || recording.audio_url.trim() === "") {
          return new Response(
            JSON.stringify({ 
              error: "Audio not yet uploaded",
              details: `Recording status: ${recording.status || "unknown"}`
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        audioUrl = recording.audio_url;
      }

      if (!audioUrl && !audioBase64) {
        return new Response(
          JSON.stringify({ error: "Either audioUrl, audioBase64, or sourceRecordingId is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Unsupported content type" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log('[voice/preview] Starting lightweight preview', {
      userId: user.id,
      sourceRecordingId,
      hasAudioUrl: !!audioUrl,
      hasAudioBase64: !!audioBase64,
      mimeType,
    });

    // Step 1: Transcribe audio using Whisper
    const transcriptionResult = await transcribeAudioTool.execute?.({
      audioUrl,
      audioBase64,
      mimeType,
    });

    if (!transcriptionResult?.success || !transcriptionResult.text) {
      console.error('[voice/preview] Transcription failed:', transcriptionResult?.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: transcriptionResult?.error || "Transcription failed",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log('[voice/preview] Transcription complete', {
      textLength: transcriptionResult.text.length,
      language: transcriptionResult.language,
      duration: transcriptionResult.duration,
    });

    // Step 2: Get user context for the preview agent
    const userContext = await getUserContext(user.id);

    // Step 3: Generate preview (cleaned transcription + AI summary)
    const previewResult = await generatePreview(
      transcriptionResult.text,
      userContext
    );

    console.log('[voice/preview] Preview generated', {
      cleanedTextLength: previewResult.cleanedTranscription.length,
      summaryLength: previewResult.aiSummary.length,
    });

    // Step 4: Update the voice recording with transcription and summary (if sourceRecordingId provided)
    if (sourceRecordingId) {
      const { error: updateError } = await supabase
        .from("voice_recordings")
        .update({
          transcription: previewResult.cleanedTranscription,
          ai_summary: previewResult.aiSummary,
          status: "processing", // Still processing - user will review and then we'll extract items
        })
        .eq("id", sourceRecordingId)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("[voice/preview] Failed to update voice recording:", updateError);
        // Continue anyway - don't fail the request
      } else {
        console.log("[voice/preview] Voice recording updated with preview");
      }
    }

    // Return the preview result
    const responseData = {
      success: true,
      transcription: previewResult.cleanedTranscription,
      aiSummary: previewResult.aiSummary,
      language: transcriptionResult.language,
      duration: transcriptionResult.duration,
    };

    console.log("[voice/preview] Returning preview response", {
      transcriptionLength: responseData.transcription.length,
      summaryLength: responseData.aiSummary.length,
    });

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Voice preview API error:", error);
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

