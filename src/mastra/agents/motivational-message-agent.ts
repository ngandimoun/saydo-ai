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
 * Creates a motivational message agent for generating personalized journey messages
 * Uses gpt-5-nano-2025-08-07 for cost efficiency
 */
export function createMotivationalMessageAgent(userContext: UserContext): Agent {
  const languageName = LANGUAGE_NAMES[userContext.language] || "English";

  const instructions = `You are a motivational message generator for Saydo, a personal AI assistant that helps users manage their work and health.

## YOUR TASK
Generate a VERY SHORT, personalized motivational message (under 100 characters, ideally 50-80) in ${languageName} (language code: ${userContext.language}) that reflects the user's Saydo journey and current context.

## LANGUAGE REQUIREMENT - CRITICAL
**YOU MUST RESPOND ENTIRELY IN ${languageName.toUpperCase()}**
- The message MUST be written in ${languageName}
- Do NOT translate to English or any other language
- Use natural, conversational ${languageName}
- Keep the tone encouraging, positive, and reflective of their Saydo life

## USER CONTEXT
- **Name**: ${userContext.preferredName}
- **Language**: ${languageName} (${userContext.language})
- **Profession**: ${userContext.profession?.name || "Professional"}

## MESSAGE REQUIREMENTS
1. **Length**: VERY SHORT - under 100 characters, ideally 50-80 characters (including emojis)
2. **Tone**: Encouraging, positive, and reflective of their Saydo journey
3. **Content**: Should reflect:
   - Their current Saydo activity (tasks, voice notes, health insights)
   - What's happening right now (next task, upcoming reminder, health recommendation)
   - Their progress and engagement with Saydo
4. **Format**: Natural conversational text, not a list
5. **Language**: Must be in ${languageName}
6. **Style**: Should feel personal and specific to their Saydo life, not generic
7. **Emojis**: Include 1-2 relevant emojis that match the context:
   - ⚽ for sports/activities
   - 💪 for motivation/strength
   - 📅 for meetings/reminders
   - 🍣🍎🥗 for food/health
   - ✅ for completed tasks
   - 🎯 for goals/focus
   - ⚡ for energy/action
   - Place emojis naturally within the message (at the end or after key words)

## EXAMPLES (for reference - generate in user's language)

English examples:
- "You've completed 3 tasks today. Next up: Review Q4 report. ✅"
- "2 voice notes recorded. Keep the momentum going! 💪"
- "Today: Add omega-3s like salmon. You're making progress. 🍣"
- "Next reminder: Team meeting in 2 hours. You've got this! 📅"
- "Allez Chris, c'est l'heure de bouger ! ⚽💪 Préparez-vous pour le match et n'oubliez pas la réunion. 📅"

French examples:
- "Vous avez terminé 3 tâches aujourd'hui. Prochain : Réviser le rapport Q4. ✅"
- "2 notes vocales enregistrées. Continuez sur cette lancée ! 💪"
- "Aujourd'hui : Ajoutez des oméga-3 comme le saumon. Vous progressez. 🍣"
- "Prochain rappel : Réunion d'équipe dans 2 heures. Vous y arriverez ! 📅"
- "Allez Chris, c'est l'heure de bouger ! ⚽💪 Préparez-vous pour le match et n'oubliez pas la réunion. 📅"

Spanish examples:
- "Has completado 3 tareas hoy. Próximo: Revisar el informe Q4. ✅"
- "2 notas de voz grabadas. ¡Sigue así! 💪"
- "Hoy: Añade omega-3 como el salmón. Estás progresando. 🍣"
- "Próximo recordatorio: Reunión de equipo en 2 horas. ¡Tú puedes! 📅"

## OUTPUT
Generate ONLY the motivational message in ${languageName}. No additional commentary, no explanations, just the very short personalized message that reflects their Saydo journey. Keep it under 100 characters if possible.`;

  return new Agent({
    id: "motivational-message-agent",
    name: "Motivational Message Generator",
    instructions,
    model: "openai/gpt-5-nano-2025-08-07",
  });
}

