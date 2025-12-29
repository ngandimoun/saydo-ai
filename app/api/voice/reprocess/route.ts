import { createClient } from "@/lib/supabase-server";
import { NextRequest } from "next/server";
import { getUserContext, getUserTimezone } from "@/src/mastra/tools/user-profile-tool";
import { createVoiceAgent, type ExtractedItems } from "@/src/mastra/agents/voice-agent";
import { createTaskTool } from "@/src/mastra/tools/task-tool";
import { createReminderTool } from "@/src/mastra/tools/reminder-tool";
import { createHealthNoteTool } from "@/src/mastra/tools/health-tool";
import { cleanTranscription } from "@/src/mastra/agents/transcription-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Voice reprocessing API endpoint.
 * Re-processes existing voice recordings to extract tasks and reminders.
 * Useful for testing extraction logic and fixing recordings that weren't processed correctly.
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
    const body = await request.json().catch(() => ({}));
    const { recordingId, limit = 5 } = body as {
      recordingId?: string;
      limit?: number;
    };

    console.log('[voice/reprocess] Starting reprocessing', {
      userId: user.id,
      recordingId,
      limit,
    });

    // Fetch voice recordings
    let query = supabase
      .from("voice_recordings")
      .select("*")
      .eq("user_id", user.id)
      .not("transcription", "is", null)
      .neq("transcription", "");

    if (recordingId) {
      query = query.eq("id", recordingId);
    } else {
      // Get recent recordings that have transcriptions
      query = query.order("created_at", { ascending: false }).limit(limit);
    }

    const { data: recordings, error: recordingsError } = await query;

    if (recordingsError) {
      console.error('[voice/reprocess] Failed to fetch recordings', { error: recordingsError });
      return new Response(
        JSON.stringify({ error: "Failed to fetch recordings", details: recordingsError.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!recordings || recordings.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No recordings found with transcriptions",
          processed: 0,
          results: []
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log('[voice/reprocess] Found recordings to process', {
      count: recordings.length,
      recordingIds: recordings.map(r => r.id),
    });

    const results = [];

    // Process each recording
    for (const recording of recordings) {
      try {
        console.log('[voice/reprocess] Processing recording', {
          recordingId: recording.id,
          hasTranscription: !!recording.transcription,
          transcriptionLength: recording.transcription?.length || 0,
        });

        // Get user context
        const userContext = await getUserContext(user.id);

        // Clean transcription if needed
        let cleanedText = recording.transcription;
        try {
          cleanedText = await cleanTranscription(recording.transcription, userContext);
          console.log('[voice/reprocess] Transcription cleaned', {
            originalLength: recording.transcription.length,
            cleanedLength: cleanedText.length,
          });
        } catch (err) {
          console.warn('[voice/reprocess] Failed to clean transcription, using original', {
            error: err,
          });
          cleanedText = recording.transcription;
        }

        // Get user's timezone
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

        const prompt = `Please analyze this voice transcription and extract all actionable items. 

## CURRENT DATE AND TIME - CRITICAL FOR DATE PARSING
**TODAY'S DATE: ${currentDate}**
**CURRENT TIME: ${currentTime} (${timezone})**

**IMPORTANT**: When parsing relative dates and times, you MUST calculate from the current date/time above.

## TIME EXTRACTION - CRITICAL
**YOU MUST extract specific times mentioned in the transcription:**
- If user says "match at 3pm": Extract dueDate as the current date (${currentDate}) and dueTime as "15:00" (24-hour format)
- If user says "appointment tomorrow at 2:30": Calculate tomorrow's date and extract dueTime as "14:30"
- If user says "meeting in 2 hours": Calculate exact time and set dueTime in HH:MM format
- If user says "match at 15:00": Extract dueTime as "15:00" directly
- If user says "at 2:30 PM": Convert to 24-hour format: dueTime as "14:30"
- **ALWAYS populate dueTime field when a specific time is mentioned** - this is critical for task scheduling
- **dueTime must be in 24-hour format (HH:MM)** - e.g., "15:00" not "3pm"
- Examples:
  - "match at 3pm": dueTime should be "15:00"
  - "appointment at 9:30 AM": dueTime should be "09:30"
  - "meeting at 14:00": dueTime should be "14:00"
  - "football match tomorrow at 2pm": Calculate tomorrow's date, dueTime should be "14:00"

IMPORTANT: All extracted items (task titles, reminders, notes, tags, and especially the summary) MUST be in ${languageName} (${userContext.language}). Do NOT translate to English.

CRITICAL FOR TAGS: Generate all tags in ${languageName}, NOT English. For example:
- If user mentions "hospital" → use ${languageName} word for hospital (e.g., "hospital" in Spanish, "hôpital" in French)
- If user mentions "meeting" → use ${languageName} word for meeting (e.g., "reunión" in Spanish, "réunion" in French)
- DO NOT use English tags like "health", "work", "meeting" - use ${languageName} equivalents

Transcription:
"${cleanedText}"

YOU MUST use the output-extracted-items tool to return the structured extraction. Do NOT just respond with text - you MUST call the tool. Remember: everything including tags must be in ${languageName}, all dates must be calculated from ${currentDate}, and the summary must be clean without boilerplate text.`;

        console.log('[voice/reprocess] Calling agent.generate', {
          recordingId: recording.id,
          promptLength: prompt.length,
        });

        const response = await agent.generate(prompt);

        console.log('[voice/reprocess] Agent response received', {
          recordingId: recording.id,
          hasText: !!response.text,
          textLength: response.text?.length || 0,
          toolCallsCount: response.toolCalls?.length || 0,
          toolCalls: response.toolCalls?.map(tc => ({
            toolName: tc.toolName,
            toolCallId: (tc as any).toolCallId,
            hasArgs: !!tc.args,
            argsType: typeof tc.args,
          })) || [],
        });

        // Parse tool call result
        const toolCalls = response.toolCalls || [];
        
        // Try to find the extraction call
        let extractionCall = toolCalls.find(
          (call) => call.toolName === "output-extracted-items"
        );
        
        // If not found by toolName, try first tool call
        if (!extractionCall && toolCalls.length > 0) {
          const firstCall = toolCalls[0];
          if (firstCall && (firstCall as any).toolCallId) {
            console.log('[voice/reprocess] Using first tool call as extraction call');
            extractionCall = firstCall;
          }
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
            console.log('[voice/reprocess] Successfully parsed extraction', {
              recordingId: recording.id,
              tasksCount: extractedItems.tasks?.length || 0,
              remindersCount: extractedItems.reminders?.length || 0,
              healthNotesCount: extractedItems.healthNotes?.length || 0,
            });
          } catch (err) {
            console.error('[voice/reprocess] Failed to parse tool call args', {
              recordingId: recording.id,
              error: err,
            });
          }
        }

        // Fallback to empty if no extraction
        if (!extractedItems) {
          console.warn('[voice/reprocess] No extraction found, using empty items', {
            recordingId: recording.id,
            hasText: !!response.text,
          });
          extractedItems = {
            tasks: [],
            reminders: [],
            healthNotes: [],
            generalNotes: [],
            summary: response.text || "Unable to extract items",
          };
        }

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
              console.error('[voice/reprocess] Failed to save task', {
                recordingId: recording.id,
                title: task.title,
                error: result?.error,
              });
            }
          } catch (err) {
            console.error('[voice/reprocess] Exception saving task', {
              recordingId: recording.id,
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
              console.error('[voice/reprocess] Failed to save reminder', {
                recordingId: recording.id,
                title: reminder.title,
                error: result?.error,
              });
            }
          } catch (err) {
            console.error('[voice/reprocess] Exception saving reminder', {
              recordingId: recording.id,
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
            console.error('[voice/reprocess] Exception saving health note', {
              recordingId: recording.id,
              error: err,
            });
          }
        }

        results.push({
          recordingId: recording.id,
          success: true,
          extracted: {
            tasks: extractedItems.tasks?.length || 0,
            reminders: extractedItems.reminders?.length || 0,
            healthNotes: extractedItems.healthNotes?.length || 0,
            generalNotes: extractedItems.generalNotes?.length || 0,
          },
          saved: {
            tasks: savedTasks.length,
            reminders: savedReminders.length,
            healthNotes: savedHealthNotes.length,
          },
          items: {
            tasks: savedTasks,
            reminders: savedReminders,
          },
        });

        console.log('[voice/reprocess] Recording processed successfully', {
          recordingId: recording.id,
          tasksExtracted: extractedItems.tasks?.length || 0,
          tasksSaved: savedTasks.length,
          remindersExtracted: extractedItems.reminders?.length || 0,
          remindersSaved: savedReminders.length,
        });

      } catch (err) {
        console.error('[voice/reprocess] Error processing recording', {
          recordingId: recording.id,
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
        });

        results.push({
          recordingId: recording.id,
          success: false,
          error: err instanceof Error ? err.message : "Failed to process recording",
        });
      }
    }

    const totalProcessed = results.length;
    const successful = results.filter(r => r.success).length;
    const totalTasksSaved = results.reduce((sum, r) => sum + (r.saved?.tasks || 0), 0);
    const totalRemindersSaved = results.reduce((sum, r) => sum + (r.saved?.reminders || 0), 0);

    console.log('[voice/reprocess] Reprocessing complete', {
      totalProcessed,
      successful,
      totalTasksSaved,
      totalRemindersSaved,
    });

    return new Response(
      JSON.stringify({
        success: true,
        processed: totalProcessed,
        successful,
        totalTasksSaved,
        totalRemindersSaved,
        results,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Voice reprocessing API error:", error);
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

