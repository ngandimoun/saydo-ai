import { getUserContext } from "@/src/mastra/index";
import { createBriefRecapAgent } from "@/src/mastra/agents/brief-recap-agent";
import type { BriefRecapData } from "./brief-recap-data";

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
 * Generate brief recap using Mastra agent
 */
export async function generateBriefRecap(
  userId: string,
  data: BriefRecapData
): Promise<string> {
  try {
    // Get user context (includes language preference)
    const userContext = await getUserContext(userId);

    // Create agent with user context
    const agent = createBriefRecapAgent(userContext);
    const languageName = LANGUAGE_NAMES[userContext.language] || "English";

    // Build concise prompt with data
    let prompt = `Generate an EXTREMELY SHORT recap (1-2 sentences, 50-100 characters) in ${languageName} for ${userContext.preferredName}.

## TODAY'S DATA

### Health - Food Recommendations
${data.health.foodRecommendations.length > 0
  ? data.health.foodRecommendations.map(f => `- ${f.title}${f.description ? ` (${f.description})` : ''}`).join('\n')
  : 'No food recommendations today'}

### Tasks
${data.tasks.latest
  ? `- Latest: ${data.tasks.latest.title} (${data.tasks.latest.status}${data.tasks.latest.isToday ? ', today' : ''})`
  : 'No tasks'}

### Reminders
${data.reminders.next
  ? `- Next: ${data.reminders.next.title} (${data.reminders.next.isToday ? 'today' : 'upcoming'})`
  : 'No reminders'}

### Pro Life
- Tasks completed today: ${data.proLife.tasksCompletedToday}
- Voice notes today: ${data.proLife.voiceNotesToday}

## INSTRUCTIONS
Generate an EXTREMELY SHORT recap in ${languageName} that:
1. Mentions today's food recommendation if available
2. Mentions latest task or next reminder if available
3. Mentions pro life highlight if there's activity
4. Uses natural, conversational ${languageName}
5. Keeps it under 100 characters if possible
6. Uses colons or periods to separate points

Remember: Respond ONLY in ${languageName}. No English, no explanations, just the extremely brief recap text.`;

    const response = await agent.generate(prompt);
    return response.text?.trim() || "";
  } catch (error) {
    console.error("[generateBriefRecap] Error generating recap:", error);
    // Fallback to English
    const parts: string[] = [];
    
    if (data.health.foodRecommendations.length > 0) {
      parts.push(`Today: ${data.health.foodRecommendations[0].title}`);
    }
    
    if (data.tasks.latest) {
      parts.push(`Next: ${data.tasks.latest.title}`);
    } else if (data.reminders.next) {
      parts.push(`Next: ${data.reminders.next.title}`);
    }
    
    if (data.proLife.tasksCompletedToday > 0) {
      parts.push(`${data.proLife.tasksCompletedToday} task${data.proLife.tasksCompletedToday !== 1 ? 's' : ''} completed today`);
    }
    
    if (parts.length > 0) {
      return parts.join('. ') + '.';
    }
    
    return "Welcome back! Ready to make today count?";
  }
}

