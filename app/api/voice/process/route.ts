import { createClient } from "@/lib/supabase-server";
import { processVoiceRecording } from "@/src/mastra/index";
import { processVoiceRecordingFromTranscription } from "@/src/mastra/workflows/voice-processing-workflow";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Voice processing API endpoint.
 * 
 * Supports TWO modes:
 * 
 * 1. AUDIO MODE (legacy): Accepts audio file/URL and does full processing
 *    - Used when: audioUrl, audioBase64, or sourceRecordingId with audio
 *    - Flow: Transcribe → Extract → Save
 * 
 * 2. TRANSCRIPTION MODE (new): Accepts edited transcription from user
 *    - Used when: transcription field is provided
 *    - Flow: Extract from text → Save
 *    - Called after user reviews preview and clicks "Done"
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
    let transcription: string | undefined;
    let aiSummary: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload (AUDIO MODE)
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
      // Handle JSON body
      const body = await request.json();
      sourceRecordingId = body.sourceRecordingId;
      transcription = body.transcription;
      aiSummary = body.aiSummary;
      audioUrl = body.audioUrl;
      audioBase64 = body.audioBase64;
      mimeType = body.mimeType || "audio/webm";

      // TRANSCRIPTION MODE: If transcription is provided, use it directly (no audio needed)
      if (transcription) {
        console.log('[voice/process] TRANSCRIPTION MODE - Processing edited transcription', {
          userId: user.id,
          sourceRecordingId,
          transcriptionLength: transcription.length,
          hasAiSummary: !!aiSummary,
        });

        // Verify the recording belongs to the user (if sourceRecordingId provided)
        if (sourceRecordingId) {
          const { data: recording, error: fetchError } = await supabase
            .from("voice_recordings")
            .select("id, user_id")
            .eq("id", sourceRecordingId)
            .eq("user_id", user.id)
            .single();

          if (fetchError || !recording) {
            console.error('[voice/process] Recording not found', {
              recordingId: sourceRecordingId,
              userId: user.id,
              error: fetchError,
            });
            return new Response(
              JSON.stringify({ error: "Recording not found or access denied" }),
              {
                status: 404,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
        }

        // Use the workflow to process the transcription
        // skipSaveItems: false - ALWAYS save items when processing from transcription
        const workflowResult = await processVoiceRecordingFromTranscription({
          userId: user.id,
          transcription: transcription,
          sourceRecordingId: sourceRecordingId,
          skipSaveItems: false, // Save items immediately
          aiSummary: aiSummary,
        });

        console.log('[voice/process] Transcription mode workflow result', {
          status: workflowResult.status,
          success: workflowResult.result.success,
          tasksCount: workflowResult.result.extractedItems?.tasks?.length || 0,
          remindersCount: workflowResult.result.extractedItems?.reminders?.length || 0,
          contentGeneratedCount: workflowResult.result.generatedContent?.length || 0,
        });

        if (workflowResult.status === "error" || !workflowResult.result.success) {
          console.error('[voice/process] Workflow failed', {
            recordingId: sourceRecordingId,
            error: workflowResult.result.error,
          });

          return new Response(
            JSON.stringify({
              success: false,
              error: workflowResult.result.error || "Failed to process transcription",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        const extractedItems = workflowResult.result.extractedItems;
        const generatedContent = workflowResult.result.generatedContent || [];

        // Extract saved items from the workflow result
        const savedTasks = (extractedItems?.tasks || []).map((task: { id?: string; title: string; priority: string }) => ({
          id: task.id,
          title: task.title,
          priority: task.priority,
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const savedReminders = (extractedItems?.reminders || []).map((reminder: any) => ({
          id: reminder.id,
          title: reminder.title,
          priority: reminder.priority || "medium",
          type: reminder.type || "reminder",
        }));

        // Update voice recording with final transcription and status
        if (sourceRecordingId) {
          const updateData: {
            transcription?: string;
            ai_summary?: string;
            status?: string;
          } = {
            transcription: transcription,
            status: "completed",
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (aiSummary || (extractedItems as any)?.summary) {
            updateData.ai_summary = aiSummary || (extractedItems as any).summary;
          }

          const { error: updateError } = await supabase
            .from("voice_recordings")
            .update(updateData)
            .eq("id", sourceRecordingId)
            .eq("user_id", user.id);

          if (updateError) {
            console.error('[voice/process] Failed to update voice recording', {
              recordingId: sourceRecordingId,
              error: updateError,
            });
          }
        }

        console.log('[voice/process] Transcription mode complete', {
          tasksSaved: savedTasks.length,
          remindersSaved: savedReminders.length,
          healthNotesSaved: extractedItems?.healthNotes?.length || 0,
          contentGenerated: generatedContent.length,
        });

        return new Response(
          JSON.stringify({
            success: true,
            transcription: transcription,
            language: workflowResult.result.language,
            extractedItems: extractedItems,
            saved: {
              tasks: savedTasks.length,
              reminders: savedReminders.length,
              healthNotes: extractedItems?.healthNotes?.length || 0,
            },
            items: {
              tasks: savedTasks,
              reminders: savedReminders,
            },
            generatedContent,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            contentPredictions: (extractedItems as any)?.contentPredictions?.length || 0,
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // AUDIO MODE: Only if no transcription was provided
      // If only sourceRecordingId is provided, fetch the audio URL from the database
      if (!transcription && !audioUrl && !audioBase64 && sourceRecordingId) {
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

      // Only check for audio if transcription wasn't provided
      if (!transcription && !audioUrl && !audioBase64) {
        return new Response(
          JSON.stringify({ error: "Either transcription (for transcription mode) or audioUrl/audioBase64 (for audio mode) is required" }),
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

    // AUDIO MODE: Process the voice recording using the workflow (only if no transcription was provided)
    if (transcription) {
      // This should have been handled in transcription mode above
      // If we reach here, something went wrong
      return new Response(
        JSON.stringify({ error: "Transcription provided but transcription mode was not executed" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log('[voice/process] AUDIO MODE - Starting workflow', {
      userId: user.id,
      sourceRecordingId,
      hasAudioUrl: !!audioUrl,
      hasAudioBase64: !!audioBase64,
      mimeType,
    });

    // In AUDIO MODE, we still skip saving items to allow user to preview first
    // User should use /api/voice/preview for preview, then call this endpoint with transcription
    const workflowRun = await processVoiceRecording({
      userId: user.id,
      audioUrl,
      audioBase64,
      mimeType,
      sourceRecordingId,
      skipSaveItems: false, // Save items immediately in audio mode too
    });

    // Extract result based on workflow status
    // Mastra workflow returns { status, result } for success or { status, error } for failure
    const workflowStatus = workflowRun.status;
    const workflowResult = 'result' in workflowRun ? workflowRun.result : undefined;

    console.log('[voice/process] Audio mode workflow result', {
      status: workflowStatus,
      hasTranscription: !!workflowResult?.transcription,
      tasksCount: workflowResult?.extractedItems?.tasks?.length || 0,
      remindersCount: workflowResult?.extractedItems?.reminders?.length || 0,
      error: workflowResult?.error,
    });

    // Return the result
    if (workflowStatus === "success" && workflowResult) {
      // Save transcription and summary to database if sourceRecordingId is provided
      if (sourceRecordingId && workflowResult.transcription) {
        const updateData: {
          transcription?: string;
          ai_summary?: string;
          status?: string;
        } = {
          transcription: workflowResult.transcription,
          status: "completed",
        };

        // Add formatted summary if available
        if (workflowResult.extractedItems?.summary) {
          updateData.ai_summary = workflowResult.extractedItems.summary;
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
            tasksSaved: workflowResult.extractedItems?.tasks?.length || 0,
            remindersSaved: workflowResult.extractedItems?.reminders?.length || 0,
          });
        }
      }

      const extractedItems = workflowResult.extractedItems;
      const savedTasks = (extractedItems?.tasks || []).map((task: { id?: string; title: string; priority: string }) => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const savedReminders = (extractedItems?.reminders || []).map((reminder: any) => ({
        id: reminder.id,
        title: reminder.title,
        priority: reminder.priority || "medium",
        type: reminder.type || "reminder",
      }));

      const responseData = {
        success: true,
        transcription: workflowResult.transcription,
        language: workflowResult.language,
        extractedItems: workflowResult.extractedItems,
        saved: {
          tasks: savedTasks.length,
          reminders: savedReminders.length,
          healthNotes: extractedItems?.healthNotes?.length || 0,
        },
        items: {
          tasks: savedTasks,
          reminders: savedReminders,
        },
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
          error: workflowResult?.error || "Voice processing failed",
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
