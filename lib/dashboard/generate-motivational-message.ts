import { getUserContext } from "@/src/mastra/index";
import { createMotivationalMessageAgent } from "@/src/mastra/agents/motivational-message-agent";
import { fetchMotivationalMessageData, type MotivationalMessageData } from "./motivational-message-data";
import { createClient } from "@/lib/supabase-server";

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
 * Get time-based fallback messages
 */
function getTimeBasedFallback(timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night', language: string): string {
  const fallbacks: Record<string, Record<string, string>> = {
    en: {
      morning: "Ready to make today count?",
      afternoon: "Let's keep the momentum going",
      evening: "Wind down and reflect",
      night: "Time to rest and recharge",
    },
    fr: {
      morning: "Prêt à faire compter aujourd'hui ?",
      afternoon: "Continuons sur cette lancée",
      evening: "Détendez-vous et réfléchissez",
      night: "Temps de se reposer et de recharger",
    },
    es: {
      morning: "¿Listo para hacer que hoy cuente?",
      afternoon: "Sigamos con el impulso",
      evening: "Relájate y reflexiona",
      night: "Hora de descansar y recargar",
    },
    de: {
      morning: "Bereit, heute zählt?",
      afternoon: "Lass uns den Schwung beibehalten",
      evening: "Entspannen und reflektieren",
      night: "Zeit zum Ausruhen und Aufladen",
    },
  };

  const langFallbacks = fallbacks[language] || fallbacks.en;
  return langFallbacks[timeOfDay] || langFallbacks.afternoon;
}

/**
 * Generate motivational message using Mastra agent
 */
export async function generateMotivationalMessage(
  userId: string,
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
): Promise<string> {
  try {
    // Get user context (includes language preference)
    const userContext = await getUserContext(userId);

    // Fetch contextual data
    const supabase = await createClient();
    const data = await fetchMotivationalMessageData(userId, supabase);

    // Create agent with user context
    const agent = createMotivationalMessageAgent(userContext);
    const languageName = LANGUAGE_NAMES[userContext.language] || "English";

    // Build prompt with contextual data
    let prompt = `Generate a VERY SHORT motivational message (under 100 characters, ideally 50-80) in ${languageName} for ${userContext.preferredName} during ${timeOfDay}.

## CURRENT SAYDO CONTEXT

### Next Upcoming Task
${data.nextTask
  ? `- ${data.nextTask.title} (${data.nextTask.status}${data.nextTask.isToday ? ', today' : ''})`
  : 'No upcoming tasks'}

### Next Reminder
${data.nextReminder
  ? `- ${data.nextReminder.title} (${data.nextReminder.isToday ? 'today' : 'upcoming'})`
  : 'No upcoming reminders'}

### Recent Activity Today
- Tasks completed: ${data.recentActivity.tasksCompletedToday}
- Voice notes recorded: ${data.recentActivity.voiceNotesToday}
- Health insights generated: ${data.recentActivity.healthInsightsToday}

### Latest Health Recommendation
${data.latestHealthRecommendation
  ? `- ${data.latestHealthRecommendation.title}${data.latestHealthRecommendation.description ? ` (${data.latestHealthRecommendation.description})` : ''}`
  : 'No health recommendations'}

## INSTRUCTIONS
Generate a VERY SHORT motivational message in ${languageName} that:
1. Reflects their current Saydo journey and activity
2. Mentions what's happening right now (next task, reminder, or health recommendation) if available
3. Acknowledges their progress (tasks completed, voice notes, insights) if there's activity
4. Is appropriate for ${timeOfDay} time of day
5. Uses natural, conversational ${languageName}
6. Keeps it under 100 characters, ideally 50-80 characters
7. Feels personal and specific to their Saydo life

The message should feel like a natural reflection of their Saydo journey, not a generic motivational quote.

Remember: Respond ONLY in ${languageName}. No English, no explanations, just the very short personalized message.`;

    const response = await agent.generate(prompt);
    const message = response.text?.trim() || "";
    
    // If message is empty or too long, use fallback
    if (!message || message.length > 150) {
      return getTimeBasedFallback(timeOfDay, userContext.language);
    }
    
    return message;
  } catch (error) {
    console.error("[generateMotivationalMessage] Error generating message:", error);
    
    // Fallback to time-based message in user's language
    try {
      const userContext = await getUserContext(userId);
      return getTimeBasedFallback(timeOfDay, userContext.language);
    } catch (fallbackError) {
      console.error("[generateMotivationalMessage] Error getting user context for fallback:", fallbackError);
      // Ultimate fallback in English
      const englishFallbacks: Record<string, string> = {
        morning: "Ready to make today count?",
        afternoon: "Let's keep the momentum going",
        evening: "Wind down and reflect",
        night: "Time to rest and recharge",
      };
      return englishFallbacks[timeOfDay] || englishFallbacks.afternoon;
    }
  }
}

