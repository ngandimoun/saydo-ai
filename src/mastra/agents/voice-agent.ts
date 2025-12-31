import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { type UserContext, getUserTimezone } from "../tools/user-profile-tool";
import {
  getWorkFilesTool,
  findMatchingFileTool,
  extractFileContentTool,
  analyzeFileContentTool,
} from "../tools/file-vault-tool";
import {
  getHealthContextTool,
  getRecentHealthDocumentsTool,
} from "../tools/health-context-tool";

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
  summary: z.string().describe(
    "Comprehensive summary capturing ALL user intents and mentions: " +
    "tasks, reminders, content requests, questions, concerns, updates about their day/work, " +
    "professional activities, important details for future correlation. " +
    "Must be in user's language and include context for understanding the full picture. " +
    "This summary will be used to correlate with other voices throughout the day."
  ),
  // Content generation predictions
  contentPredictions: z.array(
    z.object({
      contentType: z.string().describe("Type of content: post, tweet, email, report, sermon, shift_log, summary, memo, etc."),
      description: z.string().describe("What content to generate based on the transcription"),
      confidence: z.number().min(0).max(1).describe("Confidence score 0-1. Use 0.8-1.0 for explicit requests, 0.5-0.7 for implicit opportunities"),
      targetPlatform: z.string().optional().describe("Target platform if social post (e.g., 'x', 'linkedin', 'twitter')"),
      suggestedTitle: z.string().optional().describe("Suggested title for the content"),
      // Profession context (from Mastra memory)
      professionContext: z.string().optional()
        .describe("User's profession from onboarding (nurse, founder, pastor, pharmacist, doctor, football_manager, etc.)"),
      vocabularyLevel: z.enum(["technical", "professional", "casual", "academic"]).optional()
        .describe("Vocabulary level: technical (nurse/pharmacist/doctor), professional (founder/manager), casual (social posts), academic"),
      formalityLevel: z.enum(["formal", "professional", "casual"]).optional()
        .describe("Formality level: formal (reports), professional (emails), casual (social posts)"),
      terminology: z.array(z.string()).optional()
        .describe("Profession-specific terms to use (e.g., ['patient', 'medication'] for nurse, ['sermon', 'congregation'] for pastor)"),
      tone: z.enum(["professional", "friendly", "authoritative", "inspiring", "clinical", "pastoral"]).optional()
        .describe("Tone: clinical (nurse/doctor/pharmacist), inspiring (pastor), professional (founder), friendly (social posts)"),
      audience: z.string().optional()
        .describe("Target audience: healthcare team, congregation, tech community, investors, team management, etc."),
    })
  ).default([]).describe("Content generation opportunities detected in the transcription with profession-specific context"),
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
      items.generalNotes.length +
      (items.contentPredictions?.length || 0);
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

### File Reference Detection

**CRITICAL: When file content is provided in the prompt (in the "EXTRACTED FILE CONTENT" section), file-based content requests MUST trigger content predictions, NOT tasks.**

When the user mentions files in their voice note:
- Detect references like "the report I uploaded", "my quarterly report", "the contract file", "the document I saved", "l'image GIGU", "l'image que j'ai envoyée"
- **If file content is already extracted and provided in the prompt:**
  - User requests content generation (summary, analysis, description) based on the file → **ALWAYS create a content prediction with confidence 0.9+**
  - File-based content requests are **NOT tasks** - they are content generation requests
  - Examples:
    - French: "résumé de l'image GIGU" + file content provided → content prediction (summary, confidence 0.9)
    - English: "summarize the image I uploaded" + file content provided → content prediction (summary, confidence 0.9)
    - Spanish: "resumen de la imagen" + file content provided → content prediction (summary, confidence 0.9)
- **If file content is NOT yet extracted:**
  - Use findMatchingFile tool to locate the specific file the user is referring to
  - Extract content if needed for the task (summaries, analysis, content generation)
  - Include file context in contentPredictions when generating content based on files
  - Link files to generated content via sourceFileIds

**File-Based Content Request Patterns (MUST trigger content predictions):**
- French: "résumé de l'image", "décris cette image", "analyse ce fichier", "fais-moi un résumé de l'image [name]"
- English: "summarize the image", "describe this image", "analyze this file", "make a summary of the image [name]"
- Spanish: "resumen de la imagen", "describe esta imagen", "analiza este archivo"

**Content Prediction Format for File-Based Requests:**
- contentType: "summary" (for résumé/summarize), "description" (for décris/describe), "analysis" (for analyse/analyze)
- description: Include the file name and what content to generate (e.g., "Summary of image GIGU" or "Résumé de l'image GIGU")
- confidence: 0.9+ (always high for explicit file-based requests)
- Include file context in the description field

**File Detection Patterns:**
- "the [type] I uploaded" → Find file matching type
- "my [description]" → Semantic search for matching file
- "the file about [topic]" → Search by description/topic
- Temporal references: "yesterday's report", "last week's presentation"
- French: "l'image [name]", "l'image que j'ai envoyée", "le fichier [name]"
- Spanish: "la imagen [name]", "el archivo [name]"

### Content Generation Detection

**CRITICAL: Use profession context from user onboarding and Mastra memory**

User's Profession: ${context.profession?.name || "professional"}
Critical Artifacts: ${context.criticalArtifacts.join(", ") || "general documents"}
Social Platforms: ${context.socialIntelligence.join(", ") || "social media"}

**Profession-Specific Content Understanding:**

The SAME content type means DIFFERENT things based on profession. You MUST use profession context to determine vocabulary, tone, terminology, and audience.

**Profession Examples:**

- **"report" for Nurse/Doctor**: Shift report, patient report
  → professionContext: "${context.profession?.name || "nurse"}"
  → vocabularyLevel: "technical"
  → formalityLevel: "formal"
  → tone: "clinical"
  → terminology: ["patient", "medication", "vital signs", "shift", "diagnosis", "treatment"]
  → audience: "healthcare team"

- **"report" for Pastor**: Ministry report, sermon notes
  → professionContext: "${context.profession?.name || "pastor"}"
  → vocabularyLevel: "professional"
  → formalityLevel: "professional"
  → tone: "inspiring"
  → terminology: ["sermon", "congregation", "ministry", "scripture", "worship", "prayer"]
  → audience: "congregation" or "church leadership"

- **"report" for Founder**: Business report, investor update
  → professionContext: "${context.profession?.name || "founder"}"
  → vocabularyLevel: "professional"
  → formalityLevel: "professional"
  → tone: "professional"
  → terminology: ["revenue", "metrics", "growth", "strategy", "team", "product"]
  → audience: "investors" or "stakeholders"

- **"report" for Pharmacist**: Medication report, inventory report
  → professionContext: "${context.profession?.name || "pharmacist"}"
  → vocabularyLevel: "technical"
  → formalityLevel: "formal"
  → tone: "clinical"
  → terminology: ["medication", "dosage", "interaction", "prescription", "inventory", "drug"]
  → audience: "healthcare providers" or "pharmacy team"

- **"report" for Football Manager**: Match report, player analysis
  → professionContext: "${context.profession?.name || "football_manager"}"
  → vocabularyLevel: "professional"
  → formalityLevel: "professional"
  → tone: "authoritative"
  → terminology: ["tactics", "formation", "player", "match", "performance", "strategy"]
  → audience: "team management" or "fans"

**Detection Rules:**
1. Detect explicit requests in ANY language:
   - French: "génère-moi", "générer", "crée-moi", "créer", "écris-moi", "écrire", "fais-moi", "rédige-moi", "rédiger"
   - English: "generate", "create", "write", "draft", "make me", "compose"
   - Spanish: "genera", "crea", "escribe", "redacta", "hazme"
   - Any similar verb pattern followed by a content type

2. Use profession from context to determine:
   - Content style (vocabulary, formality, tone)
   - Appropriate terminology (profession-specific terms)
   - Target audience
   - Format requirements

3. For ambiguous requests like "report", profession determines the type:
   - Nurse: "nursing report" → shift_report with clinical terminology
   - Pastor: "report" → ministry_report with pastoral language
   - Founder: "report" → business_report with business terminology

4. Always include ALL profession context fields:
   - professionContext: User's profession name
   - vocabularyLevel: Based on profession and content type
   - formalityLevel: Based on content type (formal for reports, casual for social)
   - terminology: Array of profession-specific terms
   - tone: Appropriate for profession (clinical, inspiring, professional, etc.)
   - audience: Who will read this content

**Examples with Full Context:**

- Nurse: "do me nursing report of my day" →
  contentType: "shift_report",
  description: "nursing report of my day",
  confidence: 0.9,
  professionContext: "nurse",
  vocabularyLevel: "technical",
  formalityLevel: "formal",
  terminology: ["patient", "medication", "vital signs", "shift", "nursing"],
  tone: "clinical",
  audience: "healthcare team"

- Founder: "draft me a X post about coding" →
  contentType: "tweet",
  description: "X post about coding",
  confidence: 0.9,
  targetPlatform: "x",
  professionContext: "founder",
  vocabularyLevel: "professional",
  formalityLevel: "casual",
  terminology: ["codebase", "feature", "deployment", "coding", "development"],
  tone: "friendly",
  audience: "tech community"

- Pastor: "I need a report for Sunday service" →
  contentType: "sermon_notes" or "ministry_report",
  description: "report for Sunday service",
  confidence: 0.85,
  professionContext: "pastor",
  vocabularyLevel: "professional",
  formalityLevel: "professional",
  terminology: ["sermon", "congregation", "ministry", "scripture", "worship"],
  tone: "inspiring",
  audience: "congregation"

**Implicit Opportunities (Medium Confidence 0.5-0.7):**
- User mentions something interesting without explicitly asking
- User describes their day/work in detail → might want summary/report
- User talks about discovery/insight → might want post/memo
- Still include profession context even for implicit predictions

**Rules:**
- For explicit requests (user directly asks), set confidence: 0.8-1.0
- For implicit opportunities, set confidence: 0.5-0.7
- Extract topic/description from transcription context
- If platform mentioned (X, Twitter, LinkedIn), include in targetPlatform
- ALL contentPredictions fields must be in ${languageName}
- ALWAYS include profession context fields for accurate generation

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
export async function createVoiceAgent(
  userContext: UserContext,
  userTimezone?: string,
  memoryThreadId?: string
): Promise<Agent> {
  const instructions = await generateVoiceAgentPrompt(userContext, userTimezone);

  // Import memory helpers
  const { saydoMemory } = await import("../memory/config");
  const { getUserMemoryThreadId, initializeOrUpdateUserMemory } = await import("../memory/onboarding-memory");

  // Get or create memory thread for user
  let threadId = memoryThreadId;
  if (!threadId) {
    threadId = (await getUserMemoryThreadId(userContext.userId)) ?? undefined;
    if (!threadId) {
      // Initialize memory if it doesn't exist
      threadId = await initializeOrUpdateUserMemory(userContext.userId);
    }
  }

  // Get memory instance - agent will automatically load working memory from thread
  const memory = saydoMemory;

  return new Agent({
    id: "voice-agent",
    name: "Voice Processor",
    instructions,
    model: "openai/gpt-4o-mini",
    memory: memory, // Attach memory - agent will have access to onboarding data from working memory
    tools: {
      outputExtractedItems: outputExtractedItemsTool,
      // File Vault Tools
      getWorkFiles: getWorkFilesTool,
      findMatchingFile: findMatchingFileTool,
      extractFileContent: extractFileContentTool,
      analyzeFileContent: analyzeFileContentTool,
      // Health Context Tools - for accessing uploaded health documents
      getHealthContext: getHealthContextTool,
      getRecentHealthDocuments: getRecentHealthDocumentsTool,
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
Use the output-extracted-items tool to return structured data.
When health topics are mentioned, use getHealthContext to access the user's recent health uploads and biomarkers.`,
  model: "openai/gpt-4o-mini",
  tools: {
    outputExtractedItems: outputExtractedItemsTool,
    getHealthContext: getHealthContextTool,
    getRecentHealthDocuments: getRecentHealthDocumentsTool,
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
    (call) => (call as any).toolName === "output-extracted-items"
  );

  if (extractionCall && (extractionCall as any).args) {
    return (extractionCall as any).args as ExtractedItems;
  }

  // Fallback if no tool call was made
  return {
    tasks: [],
    reminders: [],
    healthNotes: [],
    generalNotes: [],
    summary: response.text || "Unable to extract items",
    contentPredictions: [],
  };
}

