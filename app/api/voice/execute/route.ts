import { createClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";
import { getUserContext, getUserTimezone, getFullUserContext } from "@/src/mastra/tools/user-profile-tool";
import { createVoiceAgent, type ExtractedItems } from "@/src/mastra/agents/voice-agent";
import { createTaskTool } from "@/src/mastra/tools/task-tool";
import { createReminderTool } from "@/src/mastra/tools/reminder-tool";
import { createHealthNoteTool } from "@/src/mastra/tools/health-tool";
import { generateContent } from "@/src/mastra/agents/content-agent";
import { getFullVoiceContext } from "@/lib/mastra/voice-context";
import { saveGeneratedContent } from "@/src/mastra/tools/content-generation-tool";
import { notifyAIContentReady } from "@/lib/mastra/notification-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Voice execution API endpoint.
 * Extracts and saves items from edited transcription and AI summary.
 * Called when user clicks "Done" after reviewing/editing transcription and summary.
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
    const { recordingId, transcription, aiSummary } = body as {
      recordingId: string;
      transcription: string;
      aiSummary?: string;
    };

    if (!recordingId || !transcription) {
      return new Response(
        JSON.stringify({ error: "recordingId and transcription are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log('[voice/execute] Starting execution', {
      userId: user.id,
      recordingId,
      transcriptionLength: transcription.length,
      hasAiSummary: !!aiSummary,
    });

    // Verify the recording belongs to the user
    const { data: recording, error: fetchError } = await supabase
      .from("voice_recordings")
      .select("id, user_id")
      .eq("id", recordingId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !recording) {
      console.error('[voice/execute] Recording not found', {
        recordingId,
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

    // Get user context
    const userContext = await getUserContext(user.id);
    const userTimezone = await getUserTimezone(user.id);

    // Create voice agent with user context and timezone
    const agent = await createVoiceAgent(userContext, userTimezone);

    // Get current date and time in user's timezone for date parsing
    const now = new Date();
    const dateFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: userTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTimezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const currentDate = dateFormatter.format(now);
    const currentTime = timeFormatter.format(now).substring(0, 5); // HH:MM
    const timezone = userTimezone;

    const languageName = userContext.language === 'en' ? 'English' :
                        userContext.language === 'es' ? 'Spanish' :
                        userContext.language === 'fr' ? 'French' :
                        userContext.language === 'de' ? 'German' :
                        userContext.language === 'ar' ? 'Arabic' :
                        userContext.language === 'zh' ? 'Chinese' :
                        userContext.language === 'ja' ? 'Japanese' :
                        userContext.language === 'pt' ? 'Portuguese' :
                        userContext.language === 'it' ? 'Italian' :
                        userContext.language === 'ru' ? 'Russian' :
                        userContext.language === 'ko' ? 'Korean' :
                        userContext.language === 'hi' ? 'Hindi' :
                        userContext.language === 'tr' ? 'Turkish' :
                        userContext.language === 'nl' ? 'Dutch' :
                        userContext.language === 'pl' ? 'Polish' :
                        userContext.language === 'sv' ? 'Swedish' : 'English';

    // Calculate future dates
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const tomorrowDate = dateFormatter.format(tomorrow);
    const nextWeekDate = dateFormatter.format(nextWeek);

    const prompt = `Please analyze this voice transcription and extract all actionable items. 

## CURRENT DATE AND TIME - CRITICAL FOR DATE PARSING
**TODAY'S DATE: ${currentDate}**
**CURRENT TIME: ${currentTime} (${timezone})**

**IMPORTANT**: When parsing relative dates and times, you MUST calculate from the current date/time above:
- "today" or "tonight" → ${currentDate}
- "tomorrow" → ${tomorrowDate}
- "next week" → ${nextWeekDate}
- "in 3 days" → Calculate 3 days from ${currentDate}
- "Monday" → Next Monday from ${currentDate}
- Always use ISO format (YYYY-MM-DD) for dates and ISO datetime for reminder times
- NEVER use dates from the past - always calculate from ${currentDate}

## TIME EXTRACTION - CRITICAL
**YOU MUST extract specific times mentioned in the transcription:**
- If user says "match at 3pm": Extract dueDate as the current date (${currentDate}) and dueTime as "15:00" (24-hour format)
- If user says "appointment tomorrow at 2:30": Extract dueDate as tomorrow's date (${tomorrowDate}) and dueTime as "14:30"
- If user says "meeting in 2 hours": Calculate exact time and set dueTime in HH:MM format
- **ALWAYS populate dueTime field when a specific time is mentioned** - this is critical for task scheduling
- **dueTime must be in 24-hour format (HH:MM)** - e.g., "15:00" not "3pm"

IMPORTANT: All extracted items (task titles, reminders, notes, tags, and especially the summary) MUST be in ${languageName} (${userContext.language}). Do NOT translate to English.

CRITICAL FOR TAGS: Generate all tags in ${languageName}, NOT English.

## SUMMARY FORMAT REQUIREMENTS
The summary field must be clean and well-structured using markdown formatting:
- Start directly with content - NO boilerplate text
- Use markdown headers (###) for sections: ### Résumé, ### Tâches, ### Rappels
- Format tasks/reminders with numbered lists and clear markdown structure
- Keep it concise - only essential information

Transcription:
"${transcription}"

YOU MUST use the output-extracted-items tool to return the structured extraction. Do NOT just respond with text - you MUST call the tool. Remember: everything including tags must be in ${languageName}, all dates must be calculated from ${currentDate}, and the summary must be clean without boilerplate text.`;

    console.log('[voice/execute] Calling agent.generate', {
      recordingId,
      promptLength: prompt.length,
    });

    const response = await agent.generate(prompt);

    console.log('[voice/execute] Agent response received', {
      recordingId,
      hasText: !!response.text,
      toolCallsCount: response.toolCalls?.length || 0,
    });

    // Parse tool call result
    const toolCalls = response.toolCalls || [];
    let extractionCall = toolCalls.find(
      (call) => call.toolName === "output-extracted-items"
    );

    if (!extractionCall && toolCalls.length > 0) {
      extractionCall = toolCalls[0];
    }

    // Parse the args
    let extractedItems: ExtractedItems | null = null;
    if (extractionCall?.args) {
      try {
        if (typeof extractionCall.args === 'string') {
          extractedItems = JSON.parse(extractionCall.args) as ExtractedItems;
        } else {
          extractedItems = extractionCall.args as ExtractedItems;
        }
      } catch (err) {
        console.error('[voice/execute] Failed to parse tool call args', {
          recordingId,
          error: err,
        });
      }
    }

    // Fallback if no extraction
    if (!extractedItems) {
      extractedItems = {
        tasks: [],
        reminders: [],
        healthNotes: [],
        generalNotes: [],
        summary: response.text || aiSummary || "Unable to extract items",
      };
    }

    // Use provided AI summary if available, otherwise use extracted summary
    if (aiSummary) {
      extractedItems.summary = aiSummary;
    }

    console.log('[voice/execute] Extracted items', {
      recordingId,
      tasksCount: extractedItems.tasks?.length || 0,
      remindersCount: extractedItems.reminders?.length || 0,
      healthNotesCount: extractedItems.healthNotes?.length || 0,
      contentPredictionsCount: extractedItems.contentPredictions?.length || 0,
    });

    // Save extracted items
    const savedTasks = [];
    const savedReminders = [];
    const savedHealthNotes = [];

    // Save tasks
    for (const task of extractedItems.tasks || []) {
      try {
        const result = await createTaskTool.execute?.({
          userId: user.id,
          title: task.title,
          description: task.description,
          priority: (task.priority as "urgent" | "high" | "medium" | "low") || "medium",
          dueDate: task.dueDate,
          dueTime: task.dueTime,
          category: task.category,
          tags: task.tags || [],
          sourceRecordingId: recording.id,
        });

        if (result?.success && result.taskId) {
          savedTasks.push({
            id: result.taskId,
            title: task.title,
            priority: task.priority,
          });
        } else {
          console.error('[voice/execute] Failed to save task', {
            recordingId,
            title: task.title,
            error: result?.error,
          });
        }
      } catch (err) {
        console.error('[voice/execute] Exception saving task', {
          recordingId,
          title: task.title,
          error: err,
        });
      }
    }

    // Save reminders
    for (const reminder of extractedItems.reminders || []) {
      try {
        const result = await createReminderTool.execute?.({
          userId: user.id,
          title: reminder.title,
          description: reminder.description,
          reminderTime: reminder.reminderTime || new Date().toISOString(),
          isRecurring: reminder.isRecurring || false,
          recurrencePattern: reminder.recurrencePattern,
          tags: reminder.tags || [],
          priority: (reminder.priority as "urgent" | "high" | "medium" | "low") || "medium",
          type: (reminder.type as "task" | "todo" | "reminder") || "reminder",
          sourceRecordingId: recording.id,
        });

        if (result?.success && result.reminderId) {
          savedReminders.push({
            id: result.reminderId,
            title: reminder.title,
            priority: reminder.priority,
            type: reminder.type,
          });
        } else {
          console.error('[voice/execute] Failed to save reminder', {
            recordingId,
            title: reminder.title,
            error: result?.error,
          });
        }
      } catch (err) {
        console.error('[voice/execute] Exception saving reminder', {
          recordingId,
          title: reminder.title,
          error: err,
        });
      }
    }

    // Save health notes
    for (const note of extractedItems.healthNotes || []) {
      try {
        const result = await createHealthNoteTool.execute?.({
          userId: user.id,
          content: note.content,
          source: "voice",
          sourceRecordingId: recording.id,
          tags: note.tags,
        });

        if (result?.success) {
          savedHealthNotes.push({
            content: note.content,
            category: note.category,
          });
        }
      } catch (err) {
        console.error('[voice/execute] Exception saving health note', {
          recordingId,
          error: err,
        });
      }
    }

    // Update voice recording with final transcription and AI summary
    const updateData: {
      transcription?: string;
      ai_summary?: string;
      status?: string;
    } = {
      transcription: transcription,
      status: "completed",
    };

    if (aiSummary || extractedItems.summary) {
      updateData.ai_summary = aiSummary || extractedItems.summary;
    }

    const { error: updateError } = await supabase
      .from("voice_recordings")
      .update(updateData)
      .eq("id", recordingId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error('[voice/execute] Failed to update voice recording', {
        recordingId,
        error: updateError,
      });
    }

    // ============================================
    // STEP 2: Content Generation (from voice agent predictions)
    // ============================================
    const generatedContent: Array<{
      documentId?: string;
      title: string;
      contentType: string;
      previewText: string;
      status: string;
    }> = [];

    // Get content predictions from voice agent extraction
    const contentPredictions = extractedItems.contentPredictions || [];

    if (contentPredictions.length > 0) {
      console.log('[voice/execute] Content predictions detected', {
        recordingId,
        predictionsCount: contentPredictions.length,
      });

      try {
        // Get full user context and voice context for content generation
        const [fullUserContext, voiceContext] = await Promise.all([
          getFullUserContext(user.id),
          getFullVoiceContext(user.id),
        ]);

        // Generate content for high-confidence predictions (>= 0.5)
        const highConfidencePredictions = contentPredictions
          .filter((p) => p.confidence >= 0.5)
          .slice(0, 3); // Limit to top 3

        if (highConfidencePredictions.length > 0) {
        console.log('[voice/execute] Generating content for predictions', {
          recordingId,
          predictionsCount: highConfidencePredictions.length,
        });

        for (const prediction of highConfidencePredictions) {
          try {
            // Generate content
            const content = await generateContent(
              fullUserContext,
              voiceContext.combinedContext,
              {
                contentType: prediction.contentType,
                description: prediction.description,
                targetPlatform: prediction.targetPlatform,
                additionalInstructions: undefined, // Description already contains the context
              }
            );

            // Save generated content
            const saveResult = await saveGeneratedContent(
              user.id,
              {
                title: prediction.suggestedTitle || content.title,
                contentType: prediction.contentType,
                content: content.content,
                previewText: content.previewText,
                tags: content.tags,
                language: content.language || fullUserContext.language,
                targetPlatform: prediction.targetPlatform,
              },
              {
                sourceVoiceNoteIds: [recording.id],
                professionContext: fullUserContext.profession?.name,
                confidenceScore: prediction.confidence,
                generationType: prediction.confidence >= 0.8 ? "explicit" : "proactive",
                modelUsed: "openai/gpt-4o",
              }
            );

            if (saveResult.success && saveResult.documentId) {
              generatedContent.push({
                documentId: saveResult.documentId,
                title: prediction.suggestedTitle || content.title,
                contentType: prediction.contentType,
                previewText: content.previewText,
                status: "ready",
              });

              // Send notification
              await notifyAIContentReady(
                user.id,
                saveResult.documentId,
                prediction.suggestedTitle || content.title,
                prediction.contentType
              );

              console.log('[voice/execute] Content generated and saved', {
                recordingId,
                documentId: saveResult.documentId,
                contentType: prediction.contentType,
              });
            } else {
              console.error('[voice/execute] Failed to save generated content', {
                recordingId,
                contentType: prediction.contentType,
                error: saveResult.error,
              });
            }
          } catch (contentErr) {
            console.error('[voice/execute] Failed to generate content', {
              recordingId,
              contentType: prediction.contentType,
              error: contentErr instanceof Error ? contentErr.message : "Unknown error",
            });
            // Continue with next prediction even if this one fails
          }
        }
        } else {
          console.log('[voice/execute] No high-confidence predictions, skipping content generation', {
            recordingId,
          });
        }
      } catch (contentGenErr) {
        // Non-blocking: log error but don't fail the entire request
        console.error('[voice/execute] Content generation failed', {
          recordingId,
          error: contentGenErr instanceof Error ? contentGenErr.message : "Unknown error",
        });
        // Continue - tasks/reminders are already saved
      }
    } else {
      console.log('[voice/execute] No content predictions detected', { recordingId });
    }

    // Note: Events will be dispatched by the client-side code after receiving the response

    console.log('[voice/execute] Execution complete', {
      recordingId,
      tasksSaved: savedTasks.length,
      remindersSaved: savedReminders.length,
      healthNotesSaved: savedHealthNotes.length,
      contentGenerated: generatedContent.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        saved: {
          tasks: savedTasks.length,
          reminders: savedReminders.length,
          healthNotes: savedHealthNotes.length,
        },
        items: {
          tasks: savedTasks,
          reminders: savedReminders,
        },
        generatedContent,
        contentPredictions: contentPredictions.length,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Voice execution API error:", error);
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

