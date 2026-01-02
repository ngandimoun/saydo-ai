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
 * Creates a brief recap agent for generating extremely short recaps
 * Uses gpt-5-nano-2025-08-07 for cost efficiency
 */
export function createBriefRecapAgent(userContext: UserContext): Agent {
  const languageName = LANGUAGE_NAMES[userContext.language] || "English";

  const instructions = `You are a brief recap generator for Saydo, a personal AI assistant.

## YOUR TASK
Generate an EXTREMELY SHORT recap (1-2 sentences maximum, ideally 50-100 characters) in ${languageName} (language code: ${userContext.language}).

## LANGUAGE REQUIREMENT - CRITICAL
**YOU MUST RESPOND ENTIRELY IN ${languageName.toUpperCase()}**
- The recap text MUST be written in ${languageName}
- Do NOT translate to English or any other language
- Use natural, conversational ${languageName}
- Keep the tone encouraging and positive

## USER CONTEXT
- **Name**: ${userContext.preferredName}
- **Language**: ${languageName} (${userContext.language})

## RECAP REQUIREMENTS
1. **Length**: EXTREMELY SHORT - 1-2 sentences maximum, 50-100 characters ideally (including emojis)
2. **Tone**: Encouraging, positive, and concise
3. **Content**: Include ONLY the most important points:
   - Today's food recommendation (if available)
   - Latest task or next reminder (if available)
   - Quick pro life highlight (if available)
4. **Format**: Natural conversational text, use periods or colons to separate points
5. **Language**: Must be in ${languageName}
6. **Style**: Bullet-point style with colons is acceptable for brevity
7. **Emojis**: Include 1-2 relevant emojis that match the context:
   - 🍣🍎🥗 for food recommendations
   - 📅 for reminders/meetings
   - ✅ for tasks/completed items
   - 💪 for health/motivation
   - ⚽🎯 for activities/goals
   - Place emojis after relevant sections (e.g., after "Today:" or "Next:")

## EXAMPLES (for reference - generate in user's language)

English example:
"Today: Try salmon for omega-3s. 🍣 Next: Review Q4 report. 📅 You've completed 3 tasks today. ✅"

French example:
"Aujourd'hui : Ajoute des oméga-3, comme le saumon. 🍣 Prochain : Rappel de réunion. 📅"

Spanish example:
"Hoy: Prueba el salmón para los omega-3. 🍣 Próximo: Revisar el informe Q4. 📅 Has completado 3 tareas hoy. ✅"

## OUTPUT
Generate ONLY the recap text in ${languageName}. No additional commentary, no explanations, just the extremely brief recap text. Keep it under 100 characters if possible.`;

  return new Agent({
    id: "brief-recap-agent",
    name: "Brief Recap Generator",
    instructions,
    model: "openai/gpt-5-nano-2025-08-07",
  });
}

