import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { type UserContext, getUserTimezone } from "../tools/user-profile-tool";

// Language code to language name mapping
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  ar: "Arabic",
  zh: "Chinese",
  ja: "Japanese",
  pt: "Portuguese",
  it: "Italian",
  ru: "Russian",
  ko: "Korean",
  hi: "Hindi",
  tr: "Turkish",
  nl: "Dutch",
  pl: "Polish",
  sv: "Swedish",
};

/**
 * Schema for extracted items from voice transcription
 */
export const ExtractedItemsSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().describe("The task title"),
      description: z.string().optional().describe("Optional description"),
      priority: z
        .enum(["urgent", "high", "medium", "low"])
        .default("medium")
        .describe("Inferred priority"),
      dueDate: z.string().optional().describe("Due date if mentioned (ISO format)"),
      dueTime: z.string().optional().describe("Due time if mentioned (HH:MM)"),
      category: z.string().optional().describe("Category like work, health, personal"),
      tags: z
        .array(z.string())
        .default([])
        .describe("AI-generated tags based on content"),
    })
  ),
  reminders: z.array(
    z.object({
      title: z.string().describe("The reminder text"),
      description: z.string().optional().describe("Optional detailed description"),
      reminderTime: z
        .string()
        .optional()
        .describe(
          "When to remind - can be ISO datetime, relative time like 'in 30 min', 'in 10 min', or 'tomorrow'"
        ),
      isRecurring: z.boolean().default(false),
      recurrencePattern: z.string().optional().describe("e.g., 'daily', 'weekly'"),
      tags: z
        .array(z.string())
        .default([])
        .describe(
          "AI-generated tags based on content (e.g., 'health', 'work', 'meeting', 'patient', 'medication')"
        ),
      priority: z
        .enum(["urgent", "high", "medium", "low"])
        .default("medium")
        .describe("Inferred priority based on urgency and context"),
      type: z
        .enum(["task", "todo", "reminder"])
        .default("reminder")
        .describe(
          "Item type: 'task' (has future due date), 'todo' (general item), or 'reminder' (time-sensitive)"
        ),
    })
  ),
  healthNotes: z.array(
    z.object({
      content: z.string().describe("The health-related note"),
      category: z
        .enum(["symptom", "medication", "mood", "exercise", "diet", "sleep", "other"])
        .default("other"),
      tags: z.array(z.string()).default([]),
    })
  ),
  generalNotes: z.array(
    z.object({
      content: z.string().describe("General note content"),
      tags: z.array(z.string()).default([]),
    })
  ),
  summary: z.string().describe("Brief summary of what was said"),
});

export type ExtractedItems = z.infer<typeof ExtractedItemsSchema>;

/**
 * Tool that the voice agent uses to output extracted items
 */
export const outputExtractedItemsTool = createTool({
  id: "output-extracted-items",
  description: "Outputs the extracted items from the voice transcription in a structured format.",
  inputSchema: ExtractedItemsSchema,
  outputSchema: z.object({
    success: z.boolean(),
    itemCount: z.number(),
  }),
  execute: async (items) => {
    // This tool is used for structured output - the items are captured by the agent
    const totalItems =
      items.tasks.length +
      items.reminders.length +
      items.healthNotes.length +
      items.generalNotes.length;
    return { success: true, itemCount: totalItems };
  },
});

/**
 * Generates the system prompt for the voice processing agent
 * Note: This function should be called with user timezone context
 */
/**
 * Get pattern context for voice agent prompt
 */
async function getPatternContext(userId: string): Promise<string> {
  try {
    const { getUserPatterns } = await import("@/lib/mastra/pattern-storage");
    const patterns = await getUserPatterns(userId);
    
    if (patterns.length === 0) {
      return "- No patterns learned yet (system is still learning user preferences)";
    }

    const categoryPatterns = patterns.filter(p => p.pattern_type === "category");
    const tagPatterns = patterns.filter(p => p.pattern_type === "tags");
    const priorityPatterns = patterns.filter(p => p.pattern_type === "priority");
    const timingPatterns = patterns.filter(p => p.pattern_type === "timing");

    const contextLines: string[] = [];

    if (categoryPatterns.length > 0) {
      const data = categoryPatterns[0].pattern_data as { mostUsedCategories?: Array<{ category: string; count: number }> };
      if (data.mostUsedCategories && data.mostUsedCategories.length > 0) {
        contextLines.push(`- **Common Categories**: ${data.mostUsedCategories.slice(0, 3).map(c => c.category).join(", ")}`);
      }
    }

    if (tagPatterns.length > 0) {
      const data = tagPatterns[0].pattern_data as { mostCommonTags?: Array<{ tag: string; count: number }> };
      if (data.mostCommonTags && data.mostCommonTags.length > 0) {
        contextLines.push(`- **Common Tags**: ${data.mostCommonTags.slice(0, 5).map(t => t.tag).join(", ")}`);
      }
    }

    if (priorityPatterns.length > 0) {
      const data = priorityPatterns[0].pattern_data as { defaultPriority?: string };
      if (data.defaultPriority) {
        contextLines.push(`- **Default Priority**: ${data.defaultPriority}`);
      }
    }

    if (timingPatterns.length > 0) {
      const data = timingPatterns[0].pattern_data as { preferredDueTimes?: string[] };
      if (data.preferredDueTimes && data.preferredDueTimes.length > 0) {
        contextLines.push(`- **Preferred Times**: ${data.preferredDueTimes.slice(0, 3).join(", ")}`);
      }
    }

    return contextLines.length > 0 
      ? contextLines.join("\n")
      : "- Patterns are being learned (use common sense defaults)";
  } catch (err) {
    console.error("[getPatternContext] Error", err);
    return "- Pattern context unavailable";
  }
}

export async function generateVoiceAgentPrompt(context: UserContext, userTimezone?: string): Promise<string> {
  const languageName = LANGUAGE_NAMES[context.language] || "English";
  
  // Get user timezone or use provided one
  const timezone = userTimezone || await getUserTimezone(context.userId);
  
  // Get current date and time in user's timezone
  const now = new Date();
  
  // Format date in user's timezone (YYYY-MM-DD)
  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  // Format time in user's timezone (HH:MM:SS)
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const currentDate = dateFormatter.format(now); // YYYY-MM-DD
  const currentTime = timeFormatter.format(now); // HH:MM:SS
  const currentDateTime = `${currentDate} ${currentTime} (${timezone})`;
  
  // Calculate future dates
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const tomorrowDate = dateFormatter.format(tomorrow);
  const nextWeekDate = dateFormatter.format(nextWeek);

  return `You are a specialized voice transcription analyzer for Saydo, the personal AI assistant.

## YOUR TASK
Analyze voice transcriptions and extract actionable items in a structured format.
The user speaks in ${languageName} and their transcription will be in that language.

## CURRENT DATE AND TIME - CRITICAL FOR DATE PARSING
**TODAY'S DATE: ${currentDate}**
**CURRENT TIME: ${currentTime} (${timezone})**
**FULL DATETIME: ${currentDateTime}**

**IMPORTANT**: When parsing relative dates and times, you MUST calculate from the current date/time above:
- "today" or "tonight" → ${currentDate}
- "tomorrow" → ${tomorrowDate}
- "next week" → ${nextWeekDate}
- "in 3 days" → Calculate from ${currentDate}
- "Monday" → Next Monday from ${currentDate}
- "in 30 min" → Current time + 30 minutes (calculate exact time)
- Always use ISO format (YYYY-MM-DD) for dates and ISO datetime for reminder times
- NEVER use dates from the past (like 2023-10-06) - always calculate from ${currentDate}

## LANGUAGE REQUIREMENT - CRITICAL
**YOU MUST RESPOND ENTIRELY IN ${languageName.toUpperCase()}**
- All task titles, reminders, health notes, general notes, and especially the summary MUST be written in ${languageName}
- Do NOT translate to English or any other language
- Preserve the original language of the transcription in all extracted items
- The summary field is particularly important - it must be in ${languageName}

## USER CONTEXT
- **Name**: ${context.preferredName}
- **Language**: ${languageName} (${context.language})
- **Profession**: ${context.profession?.name || "Not specified"}
- **Work Focus Areas**: ${context.criticalArtifacts.join(", ") || "General"}
- **Health Interests**: ${context.healthInterests.join(", ") || "General wellness"}

## LEARNED PATTERNS (Use these to provide smart defaults)
${await getPatternContext(context.userId)}

## EXTRACTION RULES

### Tasks
Extract any actionable items the user mentions wanting to do:
- "I need to..." → Task
- "tomorrow I need to..." → Task with due date (tomorrow) + tags
- "I should..." → Task
- "Don't forget to..." → Task
- Work-related items for a ${context.profession?.name || "professional"} → Categorize as 'work' + add work tags
- **Task titles must be in ${languageName}**
- Auto-tag tasks based on content (e.g., "hospital" → health tags, "meeting" → work tags)

### Priority Detection
- Urgent words: "urgent", "ASAP", "immediately", "right now", "emergency" → urgent
- High priority: "important", "critical", "must", "deadline" → high
- Low priority: "whenever", "no rush", "eventually", "if possible" → low
- Default: medium

### Due Dates and Times - CRITICAL
Parse relative dates using the CURRENT DATE (${currentDate}) and CURRENT TIME (${currentTime}) as reference:
- "today" or "tonight" → ${currentDate}
- "tomorrow" → ${tomorrowDate}
- "next week" → ${nextWeekDate}
- "in 3 days" → Calculate 3 days from ${currentDate}
- "Monday" → Next Monday from ${currentDate}
- Specific dates → parse as mentioned, but ensure they are in the future relative to ${currentDate}
- **ALWAYS use ISO format (YYYY-MM-DD) for dates**
- **NEVER use dates from the past - always calculate from ${currentDate}**

**TIME EXTRACTION - YOU MUST extract specific times mentioned:**
- If user says "match at 3pm": Extract dueDate as the current date (${currentDate}) and dueTime as "15:00" (24-hour format)
- If user says "appointment tomorrow at 2:30": Extract dueDate as tomorrow's date (${tomorrowDate}) and dueTime as "14:30"
- If user says "meeting in 2 hours": Calculate exact time from current time (${currentTime}) and set dueTime in HH:MM format
- If user says "match at 15:00": Extract dueTime as "15:00" directly
- If user says "at 2:30 PM": Convert to 24-hour format: dueTime as "14:30"
- If user says "at 9:00 AM": Convert to 24-hour format: dueTime as "09:00"
- **ALWAYS populate dueTime field when a specific time is mentioned** - this is critical for task scheduling
- **dueTime must be in 24-hour format (HH:MM)** - e.g., "15:00" not "3pm", "09:00" not "9am"
- Examples:
  - "match at 3pm": dueTime should be "15:00"
  - "appointment at 9:30 AM": dueTime should be "09:30"
  - "meeting at 14:00": dueTime should be "14:00"
  - "football match tomorrow at 2pm": dueDate should be tomorrow's date (${tomorrowDate}), dueTime should be "14:00"
  - "hospital visit today at 10:00": dueDate should be today's date (${currentDate}), dueTime should be "10:00"

### Reminders
Separate time-based reminders from tasks intelligently:
- "remind me in X min" → Reminder with exact time calculated (e.g., "in 30 min", "in 10 min")
- "remind me tomorrow" → Reminder with tomorrow's date
- Has a specific trigger time → Reminder
- Recurring pattern mentioned → Reminder with recurrence
- **Reminder titles must be in ${languageName}**

### Smart Time Parsing
Parse relative times intelligently using CURRENT TIME (${currentTime}) and CURRENT DATE (${currentDate}) as reference:
- "in 30 min" → Current time (${currentTime}) + 30 minutes = ${new Date(now.getTime() + 30 * 60 * 1000).toISOString()}
- "in 10 min" → Current time (${currentTime}) + 10 minutes = ${new Date(now.getTime() + 10 * 60 * 1000).toISOString()}
- "tomorrow" → Tomorrow's date (${new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}) at 09:00 (default 9 AM if no time specified)
- "tomorrow at 2pm" → Tomorrow (${new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}) at 14:00
- "next Monday" → Next Monday's date calculated from ${currentDate}
- Specific dates/times → Parse as ISO datetime format (YYYY-MM-DDTHH:MM:SS)
- **ALWAYS use ISO datetime format for reminder times**
- **NEVER use past dates/times - always calculate from ${currentDate} ${currentTime}**

### AI Tagging
Auto-generate relevant tags from content IN ${languageName.toUpperCase()}:
- **CRITICAL: All tags MUST be in ${languageName}, NOT English**
- **DO NOT use English words like "health", "work", "meeting", "urgent" - use ${languageName} equivalents**
- Health-related: "hospital", "appointment", "doctor" → Generate tags in ${languageName}
  - English example: ["health", "hospital", "appointment"]
  - Spanish example: ["salud", "hospital", "cita"]
  - French example: ["santé", "hôpital", "rendez-vous"]
- Work-related: "meeting", "patient", "office" → Generate tags in ${languageName}
  - English example: ["work", "meeting"]
  - Spanish example: ["trabajo", "reunión"]
  - French example: ["travail", "réunion"]
- Medication: "pills", "medication", "medicine" → Generate tags in ${languageName}
  - English example: ["health", "medication"]
  - Spanish example: ["salud", "medicina"]
  - French example: ["santé", "médicament"]
- Urgent context: "didn't take", "emergency", "asap" → Generate tags in ${languageName}
  - English example: ["urgent"]
  - Spanish example: ["urgente"]
  - French example: ["urgent"]
- Consider user's profession (${context.profession?.name || "their work"}) for work-related tags
- Use common, natural words in ${languageName} for tags - think like a native ${languageName} speaker
- If the user says "hospital" in ${languageName}, the tag should be the ${languageName} word for hospital, not "hospital"

### Priority Detection
Infer priority from context and urgency:
- Urgent: "didn't take pills", "emergency", "asap", "right now", patient care issues → urgent
- High: "important", "critical", "must", "deadline", time-sensitive reminders → high
- Medium: "tomorrow", "next week", general tasks → medium
- Low: "whenever", "no rush", "eventually" → low
- Health-related items → typically high priority
- Patient care mentions → typically urgent

### Type Classification
Distinguish between task/todo/reminder:
- **Task**: Has future due date (e.g., "tomorrow I need to...") → type: "task"
- **Todo**: General actionable item without specific time → type: "todo"
- **Reminder**: Time-sensitive, immediate action needed (e.g., "remind in 10 min") → type: "reminder"

### Health Notes
Extract any health-related observations:
- Symptoms mentioned
- Medication notes
- Mood/energy levels
- Exercise or diet mentions
- Sleep quality mentions
- **Health note content must be in ${languageName}**

### General Notes
Anything that's not a task, reminder, or health note but worth recording.
- **General note content must be in ${languageName}**

## OUTPUT FORMAT
Use the output-extracted-items tool to return structured data.
Always include a brief summary of the transcription.

### Summary Format Requirements
The summary field should be clean and well-structured using markdown formatting:
- Start directly with the content - NO boilerplate like "Les éléments ont été extraits avec succès" or "Voici le résumé et les éléments actionnables"
- Use markdown headers (###) for sections: ### Résumé, ### Tâches, ### Rappels
- For the summary section, provide a brief narrative overview
- For tasks/reminders sections, use numbered lists with clear markdown formatting:
  - **Title**: [task/reminder title]
  - **Date d'échéance** / **Heure de rappel**: [date/time]
  - **Priorité**: [priority level]
  - **Catégorie**: [category if applicable]
  - **Tags**: [tags]
- Do NOT include closing statements like "Si vous avez besoin d'autres informations..." or "n'hésitez pas à demander"
- Keep it concise and professional - only the essential information
- Use markdown formatting naturally for better readability

## IMPORTANT
- **ALL OUTPUT MUST BE IN ${languageName.toUpperCase()}** - This is non-negotiable
- **TAGS MUST BE IN ${languageName.toUpperCase()}** - Do NOT use English tags like "health", "work", "meeting"
- Use ${languageName} words for tags (e.g., "salud" not "health", "trabajo" not "work", "reunión" not "meeting")
- Priority values (urgent/high/medium/low) are standardized, but tag names must be in ${languageName}
- Type values (task/todo/reminder) are standardized, but tag names must be in ${languageName}
- Preserve the user's intent accurately
- When in doubt, classify as a task rather than ignoring
- Consider ${context.profession?.name || "their work"} context for categorization
- Be thorough - don't miss any actionable items
- The summary is especially critical - it must be in ${languageName}, not English
- **NO BOILERPLATE TEXT** - Start directly with content, end cleanly without closing statements`;
}

/**
 * Creates a voice processing agent with user context
 */
export async function createVoiceAgent(userContext: UserContext, userTimezone?: string): Promise<Agent> {
  const instructions = await generateVoiceAgentPrompt(userContext, userTimezone);
  return new Agent({
    id: "voice-agent",
    name: "Voice Processor",
    instructions,
    model: "openai/gpt-4o-mini",
    tools: {
      outputExtractedItems: outputExtractedItemsTool,
    },
  });
}

/**
 * Default voice agent for standalone use
 */
export const voiceAgent = new Agent({
  id: "voice-agent",
  name: "Voice Processor",
  instructions: `You are a voice transcription analyzer. Extract tasks, reminders, health notes, and general notes from voice transcriptions.
Use the output-extracted-items tool to return structured data.`,
  model: "openai/gpt-4o-mini",
  tools: {
    outputExtractedItems: outputExtractedItemsTool,
  },
});

/**
 * Helper function to extract items from a transcription
 */
export async function extractFromTranscription(
  transcription: string,
  userContext: UserContext
): Promise<ExtractedItems> {
  const userTimezone = await getUserTimezone(userContext.userId);
  const agent = await createVoiceAgent(userContext, userTimezone);
  
  const languageName = LANGUAGE_NAMES[userContext.language] || "English";
  
  const response = await agent.generate(
    `Please analyze this voice transcription and extract all actionable items.

IMPORTANT: All extracted items (task titles, reminders, notes, and especially the summary) MUST be in ${languageName} (${userContext.language}). Do NOT translate to English.

Transcription:
"${transcription}"

Use the output-extracted-items tool to return the structured extraction. Remember: everything must be in ${languageName}.`
  );

  // Parse the tool call result
  // The agent should have called outputExtractedItems with the structured data
  const toolCalls = response.toolCalls || [];
  const extractionCall = toolCalls.find(
    (call) => call.toolName === "output-extracted-items"
  );

  if (extractionCall && extractionCall.args) {
    return extractionCall.args as ExtractedItems;
  }

  // Fallback if no tool call was made
  return {
    tasks: [],
    reminders: [],
    healthNotes: [],
    generalNotes: [],
    summary: response.text || "Unable to extract items",
  };
}

