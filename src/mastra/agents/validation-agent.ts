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

  const languageName = userContext.language === 'en' ? 'English' : 
                      userContext.language === 'es' ? 'Spanish' :
                      userContext.language === 'fr' ? 'French' :
                      userContext.language === 'de' ? 'German' :
                      userContext.language === 'ar' ? 'Arabic' :
                      userContext.language === 'pt' ? 'Portuguese' :
                      userContext.language === 'it' ? 'Italian' :
                      userContext.language === 'ru' ? 'Russian' :
                      userContext.language === 'ko' ? 'Korean' :
                      userContext.language === 'hi' ? 'Hindi' :
                      userContext.language === 'tr' ? 'Turkish' :
                      userContext.language === 'nl' ? 'Dutch' :
                      userContext.language === 'pl' ? 'Polish' :
                      userContext.language === 'sv' ? 'Swedish' : 'English';

  const instructions = `You are a validation agent that re-analyzes voice transcriptions to catch items that might have been missed.

Your job is to:
1. Focus on ALL actionable items that might have been missed (tasks, reminders, todos)
2. Look for work tasks, grocery lists, shopping tasks, personal todos, errands, appointments
3. Focus on date/time mentions (relative dates like "in 3 days", "tomorrow at 8h", "dans trois jours", "ce soir", "demain matin")
4. Focus on appointment/meeting keywords (rendez-vous, réunion, meeting, appointment)
5. Extract tasks and reminders that should have been created
6. Return ONLY items that are NOT already in the provided existing extraction

## CURRENT DATE AND TIME
**TODAY'S DATE: ${currentDate}**
**CURRENT TIME: ${currentTime}**
**TOMORROW'S DATE: ${tomorrowDate}**

## EXTRACTION RULES

### Tasks - Comprehensive Multi-Language Detection

**Work Tasks:**
- **French**: "j'ai un travail à faire", "je dois travailler", "réunion", "travail avec collègues", "projet", "ce soir j'ai un travail"
- **Spanish**: "tengo trabajo que hacer", "reunión", "trabajo con colegas", "proyecto"
- **German**: "ich habe Arbeit zu tun", "Besprechung", "Arbeit mit Kollegen"
- **Portuguese**: "tenho trabalho para fazer", "reunião", "trabalho com colegas"
- **English**: "I have work to do", "meeting", "work with colleagues", "project"

**Grocery/Shopping Tasks:**
- **French**: "acheter", "faire les courses", "liste de courses", "aller au supermarché", "acheter du lait"
- **Spanish**: "comprar", "hacer la compra", "lista de compras", "ir al supermercado", "comprar leche"
- **German**: "einkaufen", "Einkaufsliste", "zum Supermarkt gehen", "Milch kaufen"
- **English**: "buy", "grocery shopping", "shopping list", "go to supermarket", "buy milk"

**Personal/Todo Tasks:**
- **French**: "je dois", "il faut que je", "je vais", "j'ai besoin de", "n'oublie pas de", "pense à", "à faire"
- **Spanish**: "tengo que", "necesito", "debo", "voy a", "no olvides", "por hacer"
- **German**: "ich muss", "ich sollte", "ich werde", "vergiss nicht", "zu tun"
- **English**: "I need to", "I should", "I must", "don't forget", "to do"

**AI-Based Smart Time Parsing (No Regex):**
- Use natural language understanding to parse times intelligently
- "ce soir" (tonight) → ${currentDate}, dueTime: "19:00" (evening inferred)
- "demain matin" (tomorrow morning) → ${tomorrowDate}, dueTime: "09:00" (morning inferred)
- "demain après-midi" (tomorrow afternoon) → ${tomorrowDate}, dueTime: "15:00" (afternoon inferred)
- "mañana por la tarde" (tomorrow afternoon) → ${tomorrowDate}, dueTime: "15:00"
- "tomorrow morning" → ${tomorrowDate}, dueTime: "09:00"
- "at 3pm" or "à 15h" → Extract time as "15:00" (24-hour format)

**Task Type/Category Detection:**
- **Work**: Mentions of "travail", "work", "réunion", "meeting", "projet", "colleagues"
- **Grocery/Shopping**: Mentions of "courses", "shopping", "supermarket", "buy", "acheter", food items
- **Health**: Mentions of "doctor", "appointment", "medication", "hospital"
- **Personal**: General todos, personal errands, household tasks, calls
- **Family**: Mentions of "family", "maman", "papa", "kids", "children"

### Reminders
- If transcription mentions a date/time + event (rendez-vous, réunion, meeting, appointment) → Create reminder
- Examples:
  - "Dans trois jours, j'ai un rendez-vous" → Reminder in 3 days
  - "Demain à 8h, réunion" → Reminder tomorrow at 8:00
  - "Meeting in 2 hours" → Reminder in 2 hours
  - "Appointment next Monday" → Reminder next Monday

## IMPORTANT
- Use the output-extracted-items tool to return structured data
- Return ONLY new items (not duplicates of existing extraction)
- All text must be in ${languageName} (${userContext.language || "English"})
- Calculate dates/times from the current date/time above
- When in doubt, extract as a task rather than ignoring
- Focus on catching missed actionable items across all task types`;

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

  const languageName = userContext.language === 'en' ? 'English' : 
                      userContext.language === 'es' ? 'Spanish' :
                      userContext.language === 'fr' ? 'French' :
                      userContext.language === 'de' ? 'German' :
                      userContext.language === 'ar' ? 'Arabic' :
                      userContext.language === 'pt' ? 'Portuguese' :
                      userContext.language === 'it' ? 'Italian' :
                      userContext.language === 'ru' ? 'Russian' :
                      userContext.language === 'ko' ? 'Korean' :
                      userContext.language === 'hi' ? 'Hindi' :
                      userContext.language === 'tr' ? 'Turkish' :
                      userContext.language === 'nl' ? 'Dutch' :
                      userContext.language === 'pl' ? 'Polish' :
                      userContext.language === 'sv' ? 'Swedish' : 'English';

  // Build prompt with existing extraction for comparison
  const existingItemsText = `
## EXISTING EXTRACTION (Do NOT duplicate these):
Tasks: ${existingExtraction.tasks?.map(t => t.title).join(", ") || "None"}
Reminders: ${existingExtraction.reminders?.map(r => r.title).join(", ") || "None"}

## TRANSCRIPTION TO RE-ANALYZE:
"${transcription}"

## YOUR FOCUS:
1. Look for ANY actionable items that might have been missed:
   - Work tasks (travail, work, réunion, meeting, projet)
   - Grocery/shopping tasks (courses, shopping, comprar, einkaufen, buy)
   - Personal todos (je dois, tengo que, ich muss, I need to)
   - Errands, appointments, calls, visits
2. Focus on date/time mentions (ce soir, demain, mañana, tomorrow, in 3 days, etc.)
3. Use AI understanding to parse times intelligently (no regex):
   - "ce soir" → evening (19:00)
   - "demain matin" → tomorrow morning (09:00)
   - "mañana por la tarde" → tomorrow afternoon (15:00)
4. Extract ONLY items that are NOT already listed above
5. All extracted items must be in ${languageName}

Extract tasks and reminders that might have been missed.
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

