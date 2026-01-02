import { Agent } from "@mastra/core/agent";
import { outputExtractedItemsTool, ExtractedItems } from "./voice-agent";
import { UserContext } from "../tools/user-profile-tool";

/**
 * Validation Agent - Catches items the main extraction agent might have missed
 * 
 * This agent re-analyzes the transcription with focus on date/time mentions
 * and returns only items that weren't already extracted by the main agent.
 */
export async function createValidationAgent(
  userContext: UserContext,
  userTimezone?: string
): Promise<Agent> {
  const currentDate = new Date().toISOString().split("T")[0];
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    timeZone: userTimezone || "UTC",
  });

  // Calculate tomorrow's date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split("T")[0];

  const instructions = `You are a validation agent that re-analyzes voice transcriptions to catch items that might have been missed.

Your job is to:
1. Focus on date/time mentions (relative dates like "in 3 days", "tomorrow at 8h", "dans trois jours")
2. Focus on appointment/meeting keywords (rendez-vous, réunion, meeting, appointment)
3. Extract reminders that should have been created
4. Return ONLY items that are NOT already in the provided existing extraction

## CURRENT DATE AND TIME
**TODAY'S DATE: ${currentDate}**
**CURRENT TIME: ${currentTime}**
**TOMORROW'S DATE: ${tomorrowDate}**

## EXTRACTION RULES

### Reminders
- If transcription mentions a date/time + event (rendez-vous, réunion, meeting, appointment) → Create reminder
- Examples:
  - "Dans trois jours, j'ai un rendez-vous" → Reminder in 3 days
  - "Demain à 8h, réunion" → Reminder tomorrow at 8:00
  - "Meeting in 2 hours" → Reminder in 2 hours
  - "Appointment next Monday" → Reminder next Monday

### Tasks
- If transcription mentions "I need to", "I should", "don't forget" + date → Create task
- Only if it's clearly actionable and has a time component

## IMPORTANT
- Use the output-extracted-items tool to return structured data
- Return ONLY new items (not duplicates of existing extraction)
- All text must be in the user's language (${userContext.language || "English"})
- Calculate dates/times from the current date/time above`;

  return new Agent({
    id: "validation-agent",
    name: "Extraction Validator",
    instructions,
    model: "openai/gpt-5-nano-2025-08-07",
    tools: {
      outputExtractedItems: outputExtractedItemsTool,
    },
  });
}

/**
 * Validate extraction by re-analyzing transcription
 * Returns only items that weren't already extracted
 */
export async function validateExtraction(
  transcription: string,
  existingExtraction: ExtractedItems,
  userContext: UserContext,
  userTimezone?: string
): Promise<ExtractedItems> {
  const agent = await createValidationAgent(userContext, userTimezone);

  // Build prompt with existing extraction for comparison
  const existingItemsText = `
## EXISTING EXTRACTION (Do NOT duplicate these):
Tasks: ${existingExtraction.tasks?.map(t => t.title).join(", ") || "None"}
Reminders: ${existingExtraction.reminders?.map(r => r.title).join(", ") || "None"}

## TRANSCRIPTION TO RE-ANALYZE:
"${transcription}"

Focus on date/time mentions and extract ONLY items that are NOT already listed above.
`;

  const response = await agent.generate(existingItemsText);

  // Parse tool call result
  const toolCalls = response.toolCalls || [];
  const extractionCall = toolCalls.find(
    (call) => (call as any).toolName === "output-extracted-items"
  );

  if (extractionCall && (extractionCall as any).args) {
    const validationItems = (extractionCall as any).args as ExtractedItems;
    
    // Deduplicate: Remove items that already exist
    const deduplicatedItems: ExtractedItems = {
      tasks: [],
      reminders: [],
      healthNotes: [],
      generalNotes: [],
      summary: "",
      contentPredictions: [],
    };

    // Deduplicate tasks by title
    if (validationItems.tasks) {
      const existingTaskTitles = new Set(
        (existingExtraction.tasks || []).map(t => t.title.toLowerCase().trim())
      );
      deduplicatedItems.tasks = validationItems.tasks.filter(
        t => !existingTaskTitles.has(t.title.toLowerCase().trim())
      );
    }

    // Deduplicate reminders by title
    if (validationItems.reminders) {
      const existingReminderTitles = new Set(
        (existingExtraction.reminders || []).map(r => r.title.toLowerCase().trim())
      );
      deduplicatedItems.reminders = validationItems.reminders.filter(
        r => !existingReminderTitles.has(r.title.toLowerCase().trim())
      );
    }

    // Pass through other items
    deduplicatedItems.healthNotes = validationItems.healthNotes || [];
    deduplicatedItems.generalNotes = validationItems.generalNotes || [];
    deduplicatedItems.contentPredictions = validationItems.contentPredictions || [];

    return deduplicatedItems;
  }

  // No new items found
  return {
    tasks: [],
    reminders: [],
    healthNotes: [],
    generalNotes: [],
    summary: "",
    contentPredictions: [],
  };
}

