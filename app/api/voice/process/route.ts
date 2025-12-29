import { createClient } from "@/lib/supabase-server";
import { processVoiceRecording } from "@/src/mastra/index";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Voice processing API endpoint.
 * Accepts audio file and returns extracted tasks, reminders, and notes.
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

        if (recordingError) {
          console.error("Error fetching recording:", {
            recordingId: sourceRecordingId,
            userId: user.id,
            error: recordingError.message,
            code: recordingError.code,
          });
          return new Response(
            JSON.stringify({ 
              error: "Recording not found",
              details: recordingError.message 
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Check if recording exists and has a valid (non-empty) audio_url
        if (!recording) {
          console.error("Recording not found:", {
            recordingId: sourceRecordingId,
            userId: user.id,
          });
          return new Response(
            JSON.stringify({ 
              error: "Recording not found",
              details: "No recording found with the provided ID"
            }),
            {
              status: 404,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // Check if audio_url is a non-empty string
        if (!recording.audio_url || typeof recording.audio_url !== "string" || recording.audio_url.trim() === "") {
          console.error("Recording found but audio_url is missing or empty:", {
            recordingId: sourceRecordingId,
            userId: user.id,
            status: recording.status,
            audioUrl: recording.audio_url,
          });
          return new Response(
            JSON.stringify({ 
              error: "Audio not yet uploaded",
              details: `Recording status: ${recording.status || "unknown"}. Audio URL is not available yet. Please wait a moment and try again.`
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

    // Process the voice recording using the workflow
    console.log('[voice/process] Starting workflow', {
      userId: user.id,
      sourceRecordingId,
      hasAudioUrl: !!audioUrl,
      hasAudioBase64: !!audioBase64,
      mimeType,
    });

    const result = await processVoiceRecording({
      userId: user.id,
      audioUrl,
      audioBase64,
      mimeType,
      sourceRecordingId,
    });

    console.log('[voice/process] Workflow result', {
      status: result.status,
      hasTranscription: !!result.result?.transcription,
      tasksCount: result.result?.extractedItems?.tasks?.length || 0,
      remindersCount: result.result?.extractedItems?.reminders?.length || 0,
      error: result.result?.error,
    });

    // Return the result
    if (result.status === "success") {
      // Save transcription and summary to database if sourceRecordingId is provided
      if (sourceRecordingId && result.result?.transcription) {
        const updateData: {
          transcription?: string;
          ai_summary?: string;
          status?: string;
        } = {
          transcription: result.result.transcription,
          status: "completed",
        };

        // Add formatted summary if available
        if (result.result.extractedItems?.summary) {
          updateData.ai_summary = result.result.extractedItems.summary;
        }

        const { error: updateError } = await supabase
          .from("voice_recordings")
          .update(updateData)
          .eq("id", sourceRecordingId)
          .eq("user_id", user.id);

        if (updateError) {
          console.error("[voice/process] Failed to update voice recording:", updateError);
          // Continue anyway - don't fail the request
        } else {
          console.log("[voice/process] Voice recording updated successfully", {
            sourceRecordingId,
            tasksSaved: result.result?.extractedItems?.tasks?.length || 0,
            remindersSaved: result.result?.extractedItems?.reminders?.length || 0,
          });
        }
      }

      const responseData = {
        success: true,
        transcription: result.result?.transcription,
        language: result.result?.language,
        extractedItems: result.result?.extractedItems,
      };

      console.log("[voice/process] Returning success response", {
        hasTranscription: !!responseData.transcription,
        tasksInResponse: responseData.extractedItems?.tasks?.length || 0,
        remindersInResponse: responseData.extractedItems?.reminders?.length || 0,
      });

      return new Response(
        JSON.stringify(responseData),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      // Update status to failed if sourceRecordingId is provided
      if (sourceRecordingId) {
        await supabase
          .from("voice_recordings")
          .update({ status: "failed" })
          .eq("id", sourceRecordingId)
          .eq("user_id", user.id);
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: result.result?.error || "Voice processing failed",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Voice processing API error:", error);
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

