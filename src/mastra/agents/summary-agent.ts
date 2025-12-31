import { Agent } from "@mastra/core/agent";
import { type UserContext } from "../tools/user-profile-tool";

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
  no: "Norwegian",
  da: "Danish",
  fi: "Finnish",
  el: "Greek",
  he: "Hebrew",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  cs: "Czech",
  ro: "Romanian",
  hu: "Hungarian",
  uk: "Ukrainian",
  bg: "Bulgarian",
  sw: "Swahili",
  yo: "Yoruba",
  ig: "Igbo",
  ha: "Hausa",
  rw: "Kinyarwanda",
  zu: "Zulu",
  am: "Amharic",
  tl: "Tagalog",
  sr: "Serbian",
};

/**
 * Productivity stats for summary generation
 */
export interface ProductivityStats {
  tasksCreated: number;
  aiDocumentsGenerated: number;
  voiceNotesRecorded: number;
  workFilesUploaded: number;
}

/**
 * Optional context for summary generation
 */
export interface SummaryContext {
  endOfDaySummary?: {
    keyAchievements?: string[];
    pendingItems?: string[];
    overallProductivity?: string;
  };
  upcomingReminder?: {
    title: string;
    priority?: string;
  };
}

/**
 * Creates a summary agent for generating daily productivity summaries
 * Uses gpt-4o-mini for cost efficiency
 */
export function createSummaryAgent(userContext: UserContext): Agent {
  const languageName = LANGUAGE_NAMES[userContext.language] || "English";

  const instructions = `You are a daily productivity summary generator for Saydo, a personal AI assistant.

## YOUR TASK
Generate a brief, encouraging daily productivity summary in ${languageName} (language code: ${userContext.language}).

## LANGUAGE REQUIREMENT - CRITICAL
**YOU MUST RESPOND ENTIRELY IN ${languageName.toUpperCase()}**
- The summary text MUST be written in ${languageName}
- Do NOT translate to English or any other language
- Use natural, conversational ${languageName}
- Keep the tone encouraging and positive

## USER CONTEXT
- **Name**: ${userContext.preferredName}
- **Language**: ${languageName} (${userContext.language})
- **Profession**: ${userContext.profession?.name || "Professional"}

## SUMMARY REQUIREMENTS
1. **Length**: Keep it brief - 1-2 sentences maximum
2. **Tone**: Encouraging, positive, and motivating
3. **Content**: Mention relevant productivity metrics naturally
4. **Format**: Natural conversational text, not a list
5. **Language**: Must be in ${languageName}

## EXAMPLES (for reference - generate in user's language)

English example:
"You've been productive today! 2 tasks, 15 voice notes, 3 AI documents, 1 file. Keep it up!"

Spanish example:
"¡Has sido productivo hoy! 2 tareas, 15 notas de voz, 3 documentos de IA, 1 archivo. ¡Sigue así!"

French example:
"Vous avez été productif aujourd'hui ! 2 tâches, 15 notes vocales, 3 documents IA, 1 fichier. Continuez comme ça !"

## OUTPUT
Generate only the summary text in ${languageName}. No additional commentary, no explanations, just the summary text.`;

  return new Agent({
    id: "summary-agent",
    name: "Daily Summary Generator",
    instructions,
    model: "openai/gpt-4o-mini",
  });
}

/**
 * Default summary agent for standalone use
 */
export const summaryAgent = new Agent({
  id: "summary-agent",
  name: "Daily Summary Generator",
  instructions: `You are a daily productivity summary generator. Generate brief, encouraging summaries in the user's language.`,
  model: "openai/gpt-4o-mini",
});

/**
 * Generate a daily productivity summary in the user's language
 */
export async function generateDailySummary(
  userContext: UserContext,
  stats: ProductivityStats,
  context?: SummaryContext
): Promise<string> {
  const agent = createSummaryAgent(userContext);
  const languageName = LANGUAGE_NAMES[userContext.language] || "English";

  // Build the prompt with productivity stats
  const statsText = [
    stats.tasksCreated > 0 ? `${stats.tasksCreated} task${stats.tasksCreated !== 1 ? "s" : ""}` : null,
    stats.voiceNotesRecorded > 0 ? `${stats.voiceNotesRecorded} voice note${stats.voiceNotesRecorded !== 1 ? "s" : ""}` : null,
    stats.aiDocumentsGenerated > 0 ? `${stats.aiDocumentsGenerated} AI document${stats.aiDocumentsGenerated !== 1 ? "s" : ""}` : null,
    stats.workFilesUploaded > 0 ? `${stats.workFilesUploaded} file${stats.workFilesUploaded !== 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  let prompt = `Generate a brief, encouraging daily productivity summary in ${languageName} for ${userContext.preferredName}.

Today's Activity:
${statsText || "No activity recorded yet"}`;

  // Add context if available
  if (context?.endOfDaySummary) {
    const summary = context.endOfDaySummary;
    if (summary.keyAchievements && summary.keyAchievements.length > 0) {
      prompt += `\n\nKey Achievements: ${summary.keyAchievements.slice(0, 3).join(", ")}`;
    }
    if (summary.overallProductivity) {
      prompt += `\n\nOverall Productivity: ${summary.overallProductivity}`;
    }
  }

  if (context?.upcomingReminder) {
    prompt += `\n\nUpcoming Reminder: ${context.upcomingReminder.title}`;
  }

  prompt += `\n\nRemember: Generate the summary in ${languageName} (${userContext.language}). Keep it brief, encouraging, and natural.`;

  try {
    const response = await agent.generate(prompt);
    return response.text?.trim() || "";
  } catch (error) {
    console.error("[generateDailySummary] Error generating summary:", error);
    // Fallback to English
    if (statsText) {
      return `You've been productive today! ${statsText}. Keep it up!`;
    }
    return "Ready to make today productive? Let's get started!";
  }
}



