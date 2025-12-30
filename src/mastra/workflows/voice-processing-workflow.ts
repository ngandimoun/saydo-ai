import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { transcribeAudioTool } from "../tools/transcription-tool";
import { createTaskTool } from "../tools/task-tool";
import { createReminderTool } from "../tools/reminder-tool";
import { createHealthNoteTool } from "../tools/health-tool";
import { getUserContext, getUserTimezone, type UserContext } from "../tools/user-profile-tool";
import { createVoiceAgent, type ExtractedItems } from "../agents/voice-agent";
import { cleanTranscription } from "../agents/transcription-agent";

/**
 * Input schema for voice processing workflow
 */
const VoiceProcessingInputSchema = z.object({
  userId: z.string().describe("User ID"),
  audioUrl: z.string().optional().describe("URL of the audio file"),
  audioBase64: z.string().optional().describe("Base64-encoded audio"),
  mimeType: z
    .enum(["audio/webm", "audio/mpeg", "audio/mp3", "audio/mp4", "audio/wav", "audio/ogg", "audio/flac"])
    .default("audio/webm"),
  sourceRecordingId: z.string().optional().describe("ID of the source recording"),
  skipSaveItems: z.boolean().optional().describe("Skip saving extracted items to database"),
});

/**
 * Output schema for voice processing workflow
 */
const VoiceProcessingOutputSchema = z.object({
  success: z.boolean(),
  transcription: z.string().optional(),
  language: z.string().optional(),
  extractedItems: z.object({
    tasks: z.array(z.object({
      id: z.string().optional(),
      title: z.string(),
      priority: z.string(),
      dueDate: z.string().optional(),
      category: z.string().optional(),
    })),
    reminders: z.array(z.object({
      title: z.string(),
      reminderTime: z.string().optional(),
      priority: z.string().optional(),
      type: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })),
    healthNotes: z.array(z.object({
      content: z.string(),
      category: z.string(),
    })),
    generalNotes: z.array(z.object({
      content: z.string(),
    })),
    summary: z.string(),
  }).optional(),
  userId: z.string().optional(),
  sourceRecordingId: z.string().optional(),
  error: z.string().optional(),
});

/**
 * Step 1: Transcribe the audio
 */
const transcribeStep = createStep({
  id: "transcribe-audio",
  description: "Transcribe audio using OpenAI Whisper",
  inputSchema: VoiceProcessingInputSchema,
  outputSchema: z.object({
    success: z.boolean(),
    text: z.string().optional(),
    language: z.string().optional(),
    duration: z.number().optional(),
    error: z.string().optional(),
    userId: z.string(),
    sourceRecordingId: z.string().optional(),
    skipSaveItems: z.boolean().optional(),
  }),
  execute: async ({ inputData }) => {
    const result = await transcribeAudioTool.execute?.({
      audioUrl: inputData.audioUrl,
      audioBase64: inputData.audioBase64,
      mimeType: inputData.mimeType,
    });

    return {
      success: result?.success ?? false,
      text: result?.text,
      language: result?.language,
      duration: result?.duration,
      error: result?.error,
      userId: inputData.userId,
      sourceRecordingId: inputData.sourceRecordingId,
      skipSaveItems: inputData.skipSaveItems,
    };
  },
});

/**
 * Step 2: Clean and correct the transcription
 */
const cleanTranscriptionStep = createStep({
  id: "clean-transcription",
  description: "Clean and correct raw transcription using AI",
  inputSchema: z.object({
    success: z.boolean(),
    text: z.string().optional(),
    language: z.string().optional(),
    duration: z.number().optional(),
    error: z.string().optional(),
    userId: z.string(),
    sourceRecordingId: z.string().optional(),
    skipSaveItems: z.boolean().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    rawText: z.string().optional(),
    cleanedText: z.string().optional(),
    language: z.string().optional(),
    duration: z.number().optional(),
    error: z.string().optional(),
    userId: z.string(),
    sourceRecordingId: z.string().optional(),
    skipSaveItems: z.boolean().optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData.success || !inputData.text) {
      return {
        success: false,
        rawText: inputData.text,
        error: inputData.error || "Transcription failed",
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId,
        skipSaveItems: inputData.skipSaveItems,
      };
    }

    try {
      // Get user context for language-aware cleaning
      const userContext = await getUserContext(inputData.userId);
      
      // Clean the transcription using the transcription agent
      const cleanedText = await cleanTranscription(inputData.text, userContext);

      return {
        success: true,
        rawText: inputData.text,
        cleanedText,
        language: inputData.language,
        duration: inputData.duration,
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId,
        skipSaveItems: inputData.skipSaveItems,
      };
    } catch (err) {
      // If cleaning fails, use raw text as fallback
      return {
        success: true,
        rawText: inputData.text,
        cleanedText: inputData.text,
        language: inputData.language,
        duration: inputData.duration,
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId,
        skipSaveItems: inputData.skipSaveItems,
      };
    }
  },
});

/**
 * Step 3: Extract items from transcription using voice agent
 */
const extractItemsStep = createStep({
  id: "extract-items",
  description: "Extract tasks, reminders, and notes from transcription",
  inputSchema: z.object({
    success: z.boolean(),
    rawText: z.string().optional(),
    cleanedText: z.string().optional(),
    language: z.string().optional(),
    duration: z.number().optional(),
    error: z.string().optional(),
    userId: z.string(),
    sourceRecordingId: z.string().optional(),
    skipSaveItems: z.boolean().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    transcription: z.string().optional(),
    language: z.string().optional(),
    extractedItems: z.any().optional(),
    userId: z.string(),
    sourceRecordingId: z.string().optional(),
    error: z.string().optional(),
    skipSaveItems: z.boolean().optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData.success || !inputData.cleanedText) {
      return {
        success: false,
        error: inputData.error || "Transcription failed",
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId,
      };
    }

    try {
      // Get user context for personalized extraction
      const userContext = await getUserContext(inputData.userId);
      
      // Get user's timezone (falls back to server timezone if not available)
      const userTimezone = await getUserTimezone(inputData.userId);
      
      // Load memory and voice context for correlated understanding
      const { saydoMemory } = await import("../memory/config");
      const { getUserMemoryThreadId, initializeOrUpdateUserMemory, updateMemoryWithVoiceContext } = await import("../memory/onboarding-memory");
      const { getFullVoiceContext } = await import("@/lib/mastra/voice-context");
      
      // Get or create memory thread
      let threadId = await getUserMemoryThreadId(inputData.userId);
      if (!threadId) {
        threadId = await initializeOrUpdateUserMemory(inputData.userId);
      }
      
      // Load correlated voice history
      const voiceContext = await getFullVoiceContext(inputData.userId);
      
      // Update memory with latest voice context for correlation
      // Extract topics from today's recordings (first sentence of each transcription)
      const todayTopics = voiceContext.today.recordings
        .map(r => {
          // Extract first sentence as topic
          const text = r.transcription || "";
          const firstSentence = text.split(/[.!?]/)[0]?.trim();
          return firstSentence || "";
        })
        .filter(t => t.length > 0)
        .slice(0, 10); // Limit to 10 topics
      
      await updateMemoryWithVoiceContext(inputData.userId, {
        todayTopics: todayTopics,
        todayRecordingCount: voiceContext.today.totalRecordings || 0,
        weekSummary: voiceContext.pastWeek.summary || "",
        monthThemes: voiceContext.pastMonth.keyTopics || [],
      });
      
      // Create voice agent with user context, timezone, and memory thread
      // Agent will automatically load working memory from thread, which includes:
      // - Full onboarding context (profession, artifacts, platforms)
      // - Correlated voice history (all today's voices)
      // - Content generation preferences
      const agent = await createVoiceAgent(userContext, userTimezone, threadId);
      
      // Extract items from cleaned transcription
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
      
      console.log('[extractItemsStep] Starting extraction', {
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId,
        cleanedTextLength: inputData.cleanedText?.length || 0,
        cleanedTextPreview: inputData.cleanedText?.substring(0, 200) || 'No text',
        language: userContext.language,
        languageName,
      });
      
      // Get current date and time in user's timezone for date parsing
      const now = new Date();
      
      // Format date in user's timezone (YYYY-MM-DD)
      const dateFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      
      // Format time in user's timezone (HH:MM:SS)
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      
      const currentDate = dateFormatter.format(now); // YYYY-MM-DD
      const currentTime = timeFormatter.format(now); // HH:MM:SS
      
      // Calculate future dates in user's timezone
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const in30Min = new Date(now.getTime() + 30 * 60 * 1000);
      const in10Min = new Date(now.getTime() + 10 * 60 * 1000);
      
      const tomorrowDate = dateFormatter.format(tomorrow);
      const nextWeekDate = dateFormatter.format(nextWeek);
      const in30MinISO = in30Min.toISOString();
      const in10MinISO = in10Min.toISOString();

      const prompt = `Please analyze this voice transcription and extract all actionable items. 

## CURRENT DATE AND TIME - CRITICAL FOR DATE PARSING
**TODAY'S DATE: ${currentDate}**
**CURRENT TIME: ${currentTime} (${userTimezone})**

**IMPORTANT**: When parsing relative dates and times, you MUST calculate from the current date/time above:
- "today" or "tonight" → ${currentDate}
- "tomorrow" → ${tomorrowDate}
- "next week" → ${nextWeekDate}
- "in 3 days" → Calculate 3 days from ${currentDate}
- "in 30 min" → ${in30MinISO}
- "in 10 min" → ${in10MinISO}
- "Monday" → Next Monday from ${currentDate}
- Always use ISO format (YYYY-MM-DD) for dates and ISO datetime for reminder times
- NEVER use dates from the past (like 2023-10-06) - always calculate from ${currentDate}

## TIME EXTRACTION - CRITICAL
**YOU MUST extract specific times mentioned in the transcription:**
- If user says "match at 3pm": Extract dueDate as the current date (${currentDate}) and dueTime as "15:00" (24-hour format)
- If user says "appointment tomorrow at 2:30": Extract dueDate as tomorrow's date (${tomorrowDate}) and dueTime as "14:30"
- If user says "meeting in 2 hours": Calculate exact time and set dueTime in HH:MM format
- If user says "match at 15:00": Extract dueTime as "15:00" directly
- If user says "at 2:30 PM": Convert to 24-hour format: dueTime as "14:30"
- **ALWAYS populate dueTime field when a specific time is mentioned** - this is critical for task scheduling
- **dueTime must be in 24-hour format (HH:MM)** - e.g., "15:00" not "3pm"
- Examples:
  - "match at 3pm": dueTime should be "15:00"
  - "appointment at 9:30 AM": dueTime should be "09:30"
  - "meeting at 14:00": dueTime should be "14:00"
  - "football match tomorrow at 2pm": dueDate should be tomorrow's date (${tomorrowDate}), dueTime should be "14:00"

IMPORTANT: All extracted items (task titles, reminders, notes, tags, and especially the summary) MUST be in ${languageName} (${userContext.language}). Do NOT translate to English.

CRITICAL FOR TAGS: Generate all tags in ${languageName}, NOT English. For example:
- If user mentions "hospital" → use ${languageName} word for hospital (e.g., "hospital" in Spanish, "hôpital" in French)
- If user mentions "meeting" → use ${languageName} word for meeting (e.g., "reunión" in Spanish, "réunion" in French)
- DO NOT use English tags like "health", "work", "meeting" - use ${languageName} equivalents

## SUMMARY FORMAT REQUIREMENTS
The summary field must be clean and well-structured using markdown formatting:
- Start directly with content - NO boilerplate like "Les éléments ont été extraits avec succès" or "Voici le résumé et les éléments actionnables"
- Use markdown headers (###) for sections: ### Résumé, ### Tâches, ### Rappels
- Format tasks/reminders with numbered lists and clear markdown structure
- Do NOT include closing statements like "Si vous avez besoin d'autres informations..." or "n'hésitez pas à demander"
- Keep it concise - only essential information
- Use markdown formatting naturally for better readability

Transcription:
"${inputData.cleanedText}"

YOU MUST use the output-extracted-items tool to return the structured extraction. Do NOT just respond with text - you MUST call the tool. Remember: everything including tags must be in ${languageName}, all dates must be calculated from ${currentDate}, and the summary must be clean without boilerplate text.`;

      console.log('[extractItemsStep] Calling agent.generate', {
        promptLength: prompt.length,
        promptPreview: prompt.substring(0, 300),
      });

      const response = await agent.generate(prompt);

      console.log('[extractItemsStep] Agent response received', {
        hasText: !!response.text,
        textLength: response.text?.length || 0,
        textPreview: response.text?.substring(0, 300) || 'No text',
        toolCallsCount: response.toolCalls?.length || 0,
        toolCallsRaw: response.toolCalls || [],
      });

      // Parse tool call result - Mastra tool calls have payload structure
      const toolCalls = response.toolCalls || [];
      
      // Extract tool calls from payload structure
      const extractedToolCalls = toolCalls.map(tc => {
        const payload = (tc as any).payload || tc;
        return {
          toolName: payload.toolName || tc.toolName,
          toolCallId: payload.toolCallId || (tc as any).toolCallId,
          args: payload.args || tc.args,
          raw: tc,
        };
      });

      console.log('[extractItemsStep] Extracted tool calls', {
        count: extractedToolCalls.length,
        toolCalls: extractedToolCalls.map(tc => ({
          toolName: tc.toolName,
          toolCallId: tc.toolCallId,
          hasArgs: !!tc.args,
          argsType: typeof tc.args,
        })),
      });
      
      // Try to find the extraction call
      let extractionCall = extractedToolCalls.find(
        (call) => call.toolName === "output-extracted-items" || call.toolName === "outputExtractedItems"
      );
      
      // If not found, try first tool call
      if (!extractionCall && extractedToolCalls.length > 0) {
        extractionCall = extractedToolCalls[0];
        console.log('[extractItemsStep] Using first tool call as extraction call', {
          toolName: extractionCall.toolName,
          hasArgs: !!extractionCall.args,
        });
      }

      console.log('[extractItemsStep] Tool call parsing', {
        foundExtractionCall: !!extractionCall,
        extractionCallToolName: extractionCall?.toolName,
        extractionCallToolCallId: extractionCall?.toolCallId,
        extractionCallArgsType: typeof extractionCall?.args,
        extractionCallArgsKeys: extractionCall?.args && typeof extractionCall.args === 'object' ? Object.keys(extractionCall.args) : [],
        extractionCallArgsPreview: extractionCall?.args 
          ? (typeof extractionCall.args === 'string' 
              ? extractionCall.args.substring(0, 500) 
              : JSON.stringify(extractionCall.args).substring(0, 500))
          : 'No args',
      });

      // Parse the args - they might be a JSON string
      let parsedArgs: ExtractedItems | null = null;
      if (extractionCall?.args) {
        try {
          if (typeof extractionCall.args === 'string') {
            parsedArgs = JSON.parse(extractionCall.args) as ExtractedItems;
          } else {
            parsedArgs = extractionCall.args as ExtractedItems;
          }
          console.log('[extractItemsStep] Successfully parsed tool call args', {
            tasksCount: parsedArgs.tasks?.length || 0,
            remindersCount: parsedArgs.reminders?.length || 0,
            healthNotesCount: parsedArgs.healthNotes?.length || 0,
            generalNotesCount: parsedArgs.generalNotes?.length || 0,
          });
        } catch (err) {
          console.error('[extractItemsStep] Failed to parse tool call args', {
            error: err,
            argsType: typeof extractionCall.args,
            argsPreview: typeof extractionCall.args === 'string' 
              ? extractionCall.args.substring(0, 200) 
              : JSON.stringify(extractionCall.args).substring(0, 200),
          });
        }
      }

      // If we couldn't parse from tool call, log a warning but continue
      if (!parsedArgs && toolCalls.length > 0) {
        console.warn('[extractItemsStep] Tool call exists but could not parse args', {
          toolCallsCount: toolCalls.length,
          firstCallStructure: JSON.stringify(toolCalls[0], null, 2).substring(0, 1000),
        });
      }

      const extractedItems: ExtractedItems = parsedArgs || {
            tasks: [],
            reminders: [],
            healthNotes: [],
            generalNotes: [],
            summary: response.text || "Unable to extract items",
          };

      console.log('[extractItemsStep] Extracted items summary', {
        tasksCount: extractedItems.tasks?.length || 0,
        remindersCount: extractedItems.reminders?.length || 0,
        healthNotesCount: extractedItems.healthNotes?.length || 0,
        generalNotesCount: extractedItems.generalNotes?.length || 0,
        hasSummary: !!extractedItems.summary,
        summaryPreview: extractedItems.summary?.substring(0, 200) || 'No summary',
        tasksPreview: extractedItems.tasks?.slice(0, 2).map(t => ({ title: t.title, priority: t.priority })) || [],
        remindersPreview: extractedItems.reminders?.slice(0, 2).map(r => ({ title: r.title, reminderTime: r.reminderTime })) || [],
      });

      return {
        success: true,
        transcription: inputData.cleanedText, // Use cleaned transcription
        language: inputData.language,
        extractedItems,
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId,
        skipSaveItems: inputData.skipSaveItems,
      };
    } catch (err) {
      console.error('[extractItemsStep] Exception during extraction', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId,
        cleanedTextLength: inputData.cleanedText?.length || 0,
      });
      return {
        success: false,
        transcription: inputData.cleanedText,
        error: err instanceof Error ? err.message : "Failed to extract items",
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId,
        skipSaveItems: inputData.skipSaveItems,
      };
    }
  },
});

/**
 * Step 4: Save extracted items to database
 */
const saveItemsStep = createStep({
  id: "save-items",
  description: "Save extracted tasks and health notes to database",
  inputSchema: z.object({
    success: z.boolean(),
    transcription: z.string().optional(),
    language: z.string().optional(),
    extractedItems: z.any().optional(),
    userId: z.string(),
    sourceRecordingId: z.string().optional(),
    error: z.string().optional(),
    skipSaveItems: z.boolean().optional(),
  }),
  outputSchema: VoiceProcessingOutputSchema,
  execute: async ({ inputData }) => {
    // Skip saving if flag is set
    if (inputData.skipSaveItems) {
      console.log('[saveItemsStep] Skipping save due to skipSaveItems flag');
      return {
        success: inputData.success,
        transcription: inputData.transcription,
        language: inputData.language,
        extractedItems: inputData.extractedItems,
        error: inputData.error,
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId,
      };
    }

    if (!inputData.success || !inputData.extractedItems) {
      return {
        success: false,
        error: inputData.error || "No items to save",
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId,
      };
    }

    const items = inputData.extractedItems as ExtractedItems;
    console.log('[saveItemsStep] Starting to save items', {
      userId: inputData.userId,
      sourceRecordingId: inputData.sourceRecordingId,
      tasksCount: items.tasks?.length || 0,
      remindersCount: items.reminders?.length || 0,
      healthNotesCount: items.healthNotes?.length || 0,
      generalNotesCount: items.generalNotes?.length || 0,
    });

    const savedTasks: Array<{
      id?: string;
      title: string;
      priority: string;
      dueDate?: string;
      category?: string;
    }> = [];

    try {
      // Save tasks
      console.log('[saveItemsStep] Processing tasks', { count: items.tasks?.length || 0 });
      for (const task of items.tasks) {
        console.log('[saveItemsStep] Saving task', {
          title: task.title,
          priority: task.priority,
          dueDate: task.dueDate,
          tags: task.tags,
          sourceRecordingId: inputData.sourceRecordingId,
        });

        const result = await createTaskTool.execute?.({
          userId: inputData.userId,
          title: task.title,
          description: task.description,
          priority: task.priority as "urgent" | "high" | "medium" | "low",
          dueDate: task.dueDate,
          dueTime: task.dueTime,
          category: task.category,
          tags: task.tags || [],
          sourceRecordingId: inputData.sourceRecordingId,
        });

        console.log('[saveItemsStep] Task save result', {
          success: result?.success,
          taskId: result?.taskId,
          error: result?.error,
          title: task.title,
        });

        // Learn patterns from saved task (async, don't block)
        if (result?.success && result.taskId) {
          import("@/lib/mastra/pattern-learning").then(({ analyzeTaskPatterns }) => {
            import("@/lib/mastra/pattern-storage").then(({ savePattern }) => {
              import("@/lib/dashboard/types").then(({ Task }) => {
                const taskObj: Task = {
                  id: result.taskId!,
                  userId: inputData.userId,
                  title: task.title,
                  description: task.description,
                  priority: task.priority as Task["priority"],
                  status: "pending",
                  dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
                  dueTime: task.dueTime,
                  category: task.category,
                  tags: task.tags || [],
                  sourceRecordingId: inputData.sourceRecordingId,
                  createdAt: new Date(),
                };
                const patterns = analyzeTaskPatterns(taskObj);
                patterns.forEach((pattern) => {
                  savePattern(inputData.userId, pattern.patternType, pattern.patternData).catch(
                    (err) => console.error("[saveItemsStep] Pattern learning error for task", err)
                  );
                });
              });
            });
          });
        }

        if (result?.success && result.taskId) {
          savedTasks.push({
            id: result.taskId,
            title: task.title,
            priority: task.priority,
            dueDate: task.dueDate,
            category: task.category,
          });
        } else {
          console.error('[saveItemsStep] Failed to save task', {
            title: task.title,
            error: result?.error,
            result,
          });
        }
      }

      // Save reminders
      console.log('[saveItemsStep] Processing reminders', { count: items.reminders?.length || 0 });
      const savedReminders: Array<{
        id?: string;
        title: string;
        reminderTime?: string;
        priority: string;
        type: string;
        tags: string[];
      }> = [];
      for (const reminder of items.reminders) {
        console.log('[saveItemsStep] Saving reminder', {
          title: reminder.title,
          reminderTime: reminder.reminderTime,
          priority: reminder.priority,
          type: reminder.type,
          tags: reminder.tags,
          sourceRecordingId: inputData.sourceRecordingId,
        });

        const result = await createReminderTool.execute?.({
          userId: inputData.userId,
          title: reminder.title,
          description: reminder.description,
          reminderTime: reminder.reminderTime || new Date().toISOString(),
          isRecurring: reminder.isRecurring,
          recurrencePattern: reminder.recurrencePattern,
          tags: reminder.tags || [],
          priority: (reminder.priority as "urgent" | "high" | "medium" | "low") || "medium",
          type: (reminder.type as "task" | "todo" | "reminder") || "reminder",
          sourceRecordingId: inputData.sourceRecordingId,
        });

        console.log('[saveItemsStep] Reminder save result', {
          success: result?.success,
          reminderId: result?.reminderId,
          error: result?.error,
          title: reminder.title,
        });

        // Learn patterns from saved reminder (async, don't block)
        if (result?.success && result.reminderId) {
          import("@/lib/mastra/pattern-learning").then(({ analyzeReminderPatterns }) => {
            import("@/lib/mastra/pattern-storage").then(({ savePattern }) => {
              import("@/lib/dashboard/types").then(({ Reminder }) => {
                const reminderTime = reminder.reminderTime 
                  ? new Date(reminder.reminderTime) 
                  : new Date();
                const reminderObj: Reminder = {
                  id: result.reminderId!,
                  userId: inputData.userId,
                  title: reminder.title,
                  description: reminder.description,
                  reminderTime: reminderTime,
                  isRecurring: reminder.isRecurring || false,
                  recurrencePattern: reminder.recurrencePattern,
                  isCompleted: false,
                  isSnoozed: false,
                  tags: reminder.tags || [],
                  priority: reminder.priority,
                  type: reminder.type,
                  sourceRecordingId: inputData.sourceRecordingId,
                  createdAt: new Date(),
                };
                const patterns = analyzeReminderPatterns(reminderObj);
                patterns.forEach((pattern) => {
                  savePattern(inputData.userId, pattern.patternType, pattern.patternData).catch(
                    (err) => console.error("[saveItemsStep] Pattern learning error for reminder", err)
                  );
                });
              });
            });
          });
        }

        if (result?.success && result.reminderId) {
          savedReminders.push({
            id: result.reminderId,
            title: reminder.title,
            reminderTime: reminder.reminderTime,
            priority: reminder.priority,
            type: reminder.type,
            tags: reminder.tags || [],
          });
        } else {
          console.error('[saveItemsStep] Failed to save reminder', {
            title: reminder.title,
            error: result?.error,
            result,
          });
        }
      }

      // Save health notes
      const savedHealthNotes: Array<{ content: string; category: string }> = [];
      for (const note of items.healthNotes) {
        const result = await createHealthNoteTool.execute?.({
          userId: inputData.userId,
          content: note.content,
          source: "voice",
          sourceRecordingId: inputData.sourceRecordingId,
          tags: note.tags,
        });

        if (result?.success) {
          savedHealthNotes.push({
            content: note.content,
            category: note.category,
          });
        }
      }

      // Format summary as readable text with enumeration
      let formattedSummary = items.summary || "";
      
      // Clean up boilerplate text patterns (in multiple languages)
      const boilerplatePatterns = [
        // French patterns - combined and individual
        /^Les éléments ont été extraits avec succès\.?\s*Voici le résumé et les éléments actionnables\s*:?\s*/i,
        /^Les éléments ont été extraits avec succès\.?\s*/i,
        /^Voici le résumé et les éléments actionnables\s*:?\s*/i,
        /Si vous avez besoin d'autres informations ou d'actions supplémentaires,?\s*n'hésitez pas à demander\s*!?\s*$/i,
        /Si vous avez besoin d'autres informations,?\s*n'hésitez pas à demander\s*!?\s*$/i,
        /n'hésitez pas à demander\s*!?\s*$/i,
        // English patterns
        /^Items have been extracted successfully\.?\s*Here is the summary and actionable items\s*:?\s*/i,
        /^Items have been extracted successfully\.?\s*/i,
        /^Here is the summary and actionable items\s*:?\s*/i,
        /If you need any other information or additional actions,?\s*please feel free to ask\s*!?\s*$/i,
        /If you need any other information,?\s*please feel free to ask\s*!?\s*$/i,
        /please feel free to ask\s*!?\s*$/i,
        // Spanish patterns
        /^Los elementos han sido extraídos con éxito\.?\s*Aquí está el resumen y los elementos accionables\s*:?\s*/i,
        /^Los elementos han sido extraídos con éxito\.?\s*/i,
        /^Aquí está el resumen y los elementos accionables\s*:?\s*/i,
        /Si necesitas otra información o acciones adicionales,?\s*no dudes en preguntar\s*!?\s*$/i,
        /Si necesitas otra información,?\s*no dudes en preguntar\s*!?\s*$/i,
        /no dudes en preguntar\s*!?\s*$/i,
        // Generic patterns
        /^[^\n]*extracted.*success.*\n?/i,
        /^[^\n]*summary.*actionable.*\n?/i,
        /\n[^\n]*feel free to ask[^\n]*$/i,
        /\n[^\n]*n'hésitez pas[^\n]*$/i,
        /\n[^\n]*no dudes[^\n]*$/i,
      ];
      
      // Remove boilerplate patterns
      for (const pattern of boilerplatePatterns) {
        formattedSummary = formattedSummary.replace(pattern, '');
      }
      
      // Clean up extra whitespace and newlines (but keep markdown formatting)
      formattedSummary = formattedSummary.trim();
      
      // Check if summary is a JSON string and format it nicely
      if (formattedSummary.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(formattedSummary);
          // Format with enumeration/bullet points
          const sections: string[] = [];
          
          if (parsed.tasks && parsed.tasks.length > 0) {
            const taskList = parsed.tasks.map((t: any, idx: number) => `${idx + 1}. ${t.title}`).join("\n");
            sections.push(`Tasks:\n${taskList}`);
          }
          if (parsed.reminders && parsed.reminders.length > 0) {
            const reminderList = parsed.reminders.map((r: any, idx: number) => `${idx + 1}. ${r.title}`).join("\n");
            sections.push(`Reminders:\n${reminderList}`);
          }
          if (parsed.healthNotes && parsed.healthNotes.length > 0) {
            const healthList = parsed.healthNotes.map((h: any, idx: number) => `${idx + 1}. ${h.content}`).join("\n");
            sections.push(`Health Notes:\n${healthList}`);
          }
          if (parsed.generalNotes && parsed.generalNotes.length > 0) {
            const noteList = parsed.generalNotes.map((n: any, idx: number) => `${idx + 1}. ${n.content}`).join("\n");
            sections.push(`Notes:\n${noteList}`);
          }
          if (parsed.summary) {
            sections.push(`Summary: ${parsed.summary}`);
          }
          
          formattedSummary = sections.length > 0 ? sections.join("\n\n") : parsed.summary || formattedSummary;
        } catch {
          // If parsing fails, use the summary as-is
        }
      } else {
        // If summary is already text, detect section headers and format with proper line breaks
        // Note: Markdown has already been stripped above, so we're working with plain text
        // Common section headers in multiple languages (English and French)
        const sectionHeaderRegex = /\b(Tasks?|Tâches?|Reminders?|Rappels?|Health Notes?|Notes? de santé|Notes? santé|Notes?|Remarques?|Summary|Résumé|Sommaire):\s*/gi;
        
        // Check if summary contains section headers
        const hasSections = sectionHeaderRegex.test(formattedSummary);
        
        if (hasSections) {
          // Reset regex lastIndex
          sectionHeaderRegex.lastIndex = 0;
          
          let formatted = formattedSummary;
          
          // Split on section headers and rejoin with proper formatting
          // First, add markers before each section header
          formatted = formatted.replace(sectionHeaderRegex, (match) => {
            return `\n\n__SECTION__${match}`;
          });
          
          // Split by section markers
          const sections = formatted.split('\n\n__SECTION__').filter(s => s.trim().length > 0);
          
          // Format each section
          formatted = sections.map((section, index) => {
            // First section might not have a header (text before first header)
            if (index === 0 && !sectionHeaderRegex.test(section)) {
              return section.trim();
            }
            
            // Reset regex
            sectionHeaderRegex.lastIndex = 0;
            
            // Check if this section starts with a header
            const headerMatch = section.match(/^(Tasks?|Tâches?|Reminders?|Rappels?|Health Notes?|Notes? de santé|Notes? santé|Notes?|Remarques?|Summary|Résumé|Sommaire):\s*/i);
            
            if (headerMatch) {
              const header = headerMatch[0];
              const content = section.substring(header.length).trim();
              
              // For Summary/Résumé, keep content on same line
              if (/^(Summary|Résumé|Sommaire):\s*/i.test(header)) {
                return `${header.trim()} ${content}`;
              }
              
              // For other headers, put content on new line
              // Ensure numbered items are on separate lines
              const formattedContent = content.replace(/(\d+\.\s+)/g, '\n$1').trim();
              return `${header.trim()}\n${formattedContent}`;
            }
            
            return section.trim();
          }).join('\n\n');
          
          // Clean up: remove leading/trailing newlines and collapse multiple newlines (max 2)
          formatted = formatted.trim().replace(/\n{3,}/g, '\n\n');
          
          formattedSummary = formatted;
        } else {
          // If no section headers detected, try to format as numbered list if it contains enumeration
          const numberedItemPattern = /^\d+\.\s+/;
          const lines = formattedSummary.split(/\n/).filter(l => l.trim().length > 0);
          
          if (lines.length > 1 && lines.some(line => numberedItemPattern.test(line.trim()))) {
            // Already has some structure, just ensure proper line breaks
            formattedSummary = lines.join("\n");
          } else {
            // Try to detect if it has tasks/reminders mentioned and format accordingly
            const splitLines = formattedSummary.split(/[.,]\s*/).filter(l => l.trim().length > 0);
            if (splitLines.length > 3) {
              // Format as numbered list for better readability
              formattedSummary = splitLines.map((line, idx) => `${idx + 1}. ${line.trim()}`).join("\n");
            }
          }
        }
      }

      console.log('[saveItemsStep] Save completed successfully', {
        tasksSaved: savedTasks.length,
        remindersSaved: savedReminders.length,
        healthNotesSaved: savedHealthNotes.length,
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId,
      });

      return {
        success: true,
        transcription: inputData.transcription,
        language: inputData.language,
        extractedItems: {
          tasks: savedTasks,
          reminders: savedReminders.map((r) => ({
            title: r.title,
            reminderTime: r.reminderTime,
            priority: r.priority,
            type: r.type,
            tags: r.tags,
          })),
          healthNotes: savedHealthNotes,
          generalNotes: items.generalNotes.map((n) => ({
            content: n.content,
          })),
          summary: formattedSummary,
        },
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId,
      };
    } catch (err) {
      console.error('[saveItemsStep] Error saving items', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId,
      });
      return {
        success: false,
        transcription: inputData.transcription,
        error: err instanceof Error ? err.message : "Failed to save items",
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId,
      };
    }
  },
});

/**
 * Step 5: Smart proactive analysis (predict content needs)
 * 
 * NOTE: This step is no longer used. Content predictions are now extracted
 * directly by the voice agent in extractItemsStep via contentPredictions field.
 * This eliminates duplicate processing and improves reliability.
 */
// const smartAnalysisStep = createStep({
  id: "smart-analysis",
  description: "Analyze transcription for content generation opportunities",
  inputSchema: VoiceProcessingOutputSchema,
  outputSchema: z.object({
    success: z.boolean(),
    transcription: z.string().optional(),
    language: z.string().optional(),
    extractedItems: z.any().optional(),
    userId: z.string().optional(),
    sourceRecordingId: z.string().optional(),
    error: z.string().optional(),
    // Smart analysis results
    smartAnalysis: z.object({
      extractionNeeded: z.boolean(),
      contentPredictions: z.array(z.object({
        contentType: z.string(),
        description: z.string(),
        confidence: z.number(),
        reasoning: z.string(),
        suggestedTitle: z.string().optional(),
        targetPlatform: z.string().optional(),
        priority: z.enum(["high", "medium", "low"]),
      })),
      conversationInsights: z.object({
        mainTopics: z.array(z.string()),
        entities: z.array(z.string()),
        sentiment: z.string(),
        urgency: z.string(),
      }),
      detectedLanguage: z.string().optional(),
      explicitLanguageRequest: z.string().optional(),
      analysisNotes: z.string(),
    }).optional(),
  }),
  execute: async ({ inputData }) => {
    // Skip if previous step failed
    if (!inputData.success || !inputData.transcription) {
      return {
        ...inputData,
        smartAnalysis: undefined,
      };
    }

    try {
      // Dynamically import to avoid circular dependencies
      const { analyzeTranscription } = await import("../agents/smart-agent");
      const { getFullVoiceContext } = await import("@/lib/mastra/voice-context");
      const { getFullUserContext } = await import("../tools/user-profile-tool");

      // Get user context and voice history
      const userId = inputData.userId;
      if (!userId) {
        console.warn("[smartAnalysisStep] No userId, skipping smart analysis");
        return { ...inputData, smartAnalysis: undefined };
      }

      const [userContext, voiceContext] = await Promise.all([
        getFullUserContext(userId),
        getFullVoiceContext(userId),
      ]);

      // Run smart analysis
      const analysis = await analyzeTranscription(
        inputData.transcription,
        userContext,
        voiceContext.combinedContext
      );

      console.log("[smartAnalysisStep] Analysis complete", {
        userId,
        predictionsCount: analysis.contentPredictions.length,
        mainTopics: analysis.conversationInsights.mainTopics,
      });

      return {
        ...inputData,
        userId,
        smartAnalysis: analysis,
      };
    } catch (err) {
      console.error("[smartAnalysisStep] Error in smart analysis", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      // Continue without smart analysis on error
      return {
        ...inputData,
        smartAnalysis: undefined,
      };
    }
  },
}); // End of commented-out smartAnalysisStep - no longer used, content predictions come from voice agent

/**
 * Step 6: Generate predicted content
 */
const generateContentStep = createStep({
  id: "generate-content",
  description: "Generate content based on smart analysis predictions",
  inputSchema: z.object({
    success: z.boolean(),
    transcription: z.string().optional(),
    language: z.string().optional(),
    extractedItems: z.any().optional(),
    userId: z.string().optional(),
    sourceRecordingId: z.string().optional(),
    error: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    transcription: z.string().optional(),
    language: z.string().optional(),
    extractedItems: z.any().optional(),
    userId: z.string().optional(),
    sourceRecordingId: z.string().optional(),
    error: z.string().optional(),
    generatedContent: z.array(z.object({
      documentId: z.string().optional(),
      title: z.string(),
      contentType: z.string(),
      previewText: z.string(),
      status: z.string(),
    })).optional(),
  }),
  execute: async ({ inputData }) => {
    const userId = inputData.userId;
    const extractedItems = inputData.extractedItems;

    // Skip if no userId or no extracted items
    if (!userId || !extractedItems) {
      return { ...inputData, generatedContent: [] };
    }

    // Get content predictions from voice agent extraction
    const predictions = extractedItems.contentPredictions || [];
    
    // Filter to high-confidence predictions (>= 0.5)
    const highConfidencePredictions = predictions.filter(
      (p: { confidence: number }) => p.confidence >= 0.5
    );

    if (highConfidencePredictions.length === 0) {
      console.log("[generateContentStep] No high-confidence predictions, skipping");
      return { ...inputData, generatedContent: [] };
    }

    try {
      // Dynamically import
      const { generateContent } = await import("../agents/content-agent");
      const { saveGeneratedContent } = await import("../tools/content-generation-tool");
      const { getFullVoiceContext } = await import("@/lib/mastra/voice-context");
      const { getFullUserContext } = await import("../tools/user-profile-tool");

      const [userContext, voiceContext] = await Promise.all([
        getFullUserContext(userId),
        getFullVoiceContext(userId),
      ]);

      // Limit to top 3 predictions
      const predictionsToGenerate = highConfidencePredictions.slice(0, 3);
      const generatedContent: Array<{
        documentId?: string;
        title: string;
        contentType: string;
        previewText: string;
        status: string;
      }> = [];

      for (const prediction of predictionsToGenerate) {
        try {
          // Generate content
          const content = await generateContent(
            userContext,
            voiceContext.combinedContext,
            {
              contentType: prediction.contentType,
              description: prediction.description,
              targetPlatform: prediction.targetPlatform,
            }
          );

          // Save to database
          const saveResult = await saveGeneratedContent(
            userId,
            {
              title: content.title || prediction.suggestedTitle || `${prediction.contentType} Draft`,
              contentType: prediction.contentType,
              content: content.content,
              previewText: content.previewText,
              tags: content.tags,
              language: content.language,
            },
            {
              sourceVoiceNoteIds: inputData.sourceRecordingId ? [inputData.sourceRecordingId] : [],
              professionContext: userContext.profession?.name,
              confidenceScore: prediction.confidence,
              generationType: prediction.confidence >= 0.8 ? "explicit" : "proactive",
              modelUsed: "gpt-4o",
            }
          );

          generatedContent.push({
            documentId: saveResult.documentId,
            title: content.title,
            contentType: prediction.contentType,
            previewText: content.previewText,
            status: saveResult.success ? "ready" : "failed",
          });

          console.log("[generateContentStep] Content generated and saved", {
            documentId: saveResult.documentId,
            contentType: prediction.contentType,
            title: content.title,
          });
        } catch (contentErr) {
          console.error("[generateContentStep] Failed to generate content", {
            contentType: prediction.contentType,
            error: contentErr instanceof Error ? contentErr.message : "Unknown error",
          });
        }
      }

      return { ...inputData, generatedContent };
    } catch (err) {
      console.error("[generateContentStep] Error generating content", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      return { ...inputData, generatedContent: [] };
    }
  },
});

/**
 * Step 7: Send notifications for generated content
 */
const notifyContentStep = createStep({
  id: "notify-content",
  description: "Send notifications for generated content",
  inputSchema: z.object({
    success: z.boolean(),
    transcription: z.string().optional(),
    language: z.string().optional(),
    extractedItems: z.any().optional(),
    userId: z.string().optional(),
    sourceRecordingId: z.string().optional(),
    error: z.string().optional(),
    generatedContent: z.array(z.any()).optional(),
  }),
  outputSchema: VoiceProcessingOutputSchema.extend({
    generatedContent: z.array(z.object({
      documentId: z.string().optional(),
      title: z.string(),
      contentType: z.string(),
      previewText: z.string(),
      status: z.string(),
    })).optional(),
  }),
  execute: async ({ inputData }) => {
    const generatedContent = inputData.generatedContent || [];
    const userId = inputData.userId;

    if (generatedContent.length === 0 || !userId) {
      return inputData;
    }

    try {
      // Create notifications for each generated document
      const { createClient } = await import("@supabase/supabase-js");
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && supabaseServiceKey) {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        for (const content of generatedContent) {
          if (content.documentId && content.status === "ready") {
            await supabase.from("notifications").insert({
              user_id: userId,
              title: "New Content Ready",
              message: `I drafted a ${content.contentType}: "${content.title}"`,
              type: "ai_generated",
              related_document_id: content.documentId,
              deep_link: `/dashboard/pro?doc=${content.documentId}`,
            });
          }
        }

        console.log("[notifyContentStep] Notifications created", {
          count: generatedContent.filter(c => c.status === "ready").length,
        });
      }
    } catch (err) {
      console.error("[notifyContentStep] Failed to create notifications", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }

    return inputData;
  },
});

/**
 * Voice Processing Workflow (Enhanced)
 * 
 * Pipeline:
 * 1. Transcribe audio using OpenAI Whisper
 * 2. Clean and correct transcription using AI
 * 3. Extract tasks, reminders, and notes using voice agent
 * 4. Save extracted items to database
 * 5. Smart analysis (predict content needs from casual conversation)
 * 6. Generate predicted content
 * 7. Send notifications for generated content
 */
export const voiceProcessingWorkflow = createWorkflow({
  id: "voice-processing-workflow",
  description: "Transcribes audio, extracts actionable items, and generates predicted content",
  inputSchema: VoiceProcessingInputSchema,
  outputSchema: VoiceProcessingOutputSchema.extend({
    generatedContent: z.array(z.object({
      documentId: z.string().optional(),
      title: z.string(),
      contentType: z.string(),
      previewText: z.string(),
      status: z.string(),
    })).optional(),
  }),
})
  .then(transcribeStep)
  .then(cleanTranscriptionStep)
  .then(extractItemsStep)
  .then(saveItemsStep)
  .then(generateContentStep)
  .then(notifyContentStep)
  .commit();

/**
 * Helper function to process voice recording
 */
export async function processVoiceRecording(params: {
  userId: string;
  audioUrl?: string;
  audioBase64?: string;
  mimeType?: "audio/webm" | "audio/mpeg" | "audio/mp3" | "audio/mp4" | "audio/wav" | "audio/ogg" | "audio/flac";
  sourceRecordingId?: string;
  skipSaveItems?: boolean;
}) {
  const run = await voiceProcessingWorkflow.createRun();
  const result = await run.start({
    inputData: {
      userId: params.userId,
      audioUrl: params.audioUrl,
      audioBase64: params.audioBase64,
      mimeType: params.mimeType || "audio/webm",
      sourceRecordingId: params.sourceRecordingId,
      skipSaveItems: params.skipSaveItems,
    },
  });

  return result;
}

