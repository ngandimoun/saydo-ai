import { Agent } from "@mastra/core/agent";
import { getUserProfileTool, type UserContext } from "../tools/user-profile-tool";
import { createTaskTool, getTasksTool, updateTaskTool } from "../tools/task-tool";
import { createHealthInsightTool, getEnvironmentDataTool, createHealthNoteTool } from "../tools/health-tool";

// Language code to language name mapping for system prompt
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
  ms: "Malay",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  ur: "Urdu",
  pa: "Punjabi",
  et: "Estonian",
  lv: "Latvian",
  lt: "Lithuanian",
  sk: "Slovak",
  sl: "Slovenian",
  hr: "Croatian",
  sr: "Serbian",
};

/**
 * Generates a dynamic system prompt based on user context.
 * This prompt ensures the AI responds in the user's preferred language
 * and has full awareness of their profile, profession, and health data.
 */
export function generateSaydoSystemPrompt(context: UserContext): string {
  const languageName = LANGUAGE_NAMES[context.language] || "English";
  
  // Format allergies with strong emphasis for safety
  const allergyWarning = context.allergies.length > 0
    ? `\n⚠️ CRITICAL - USER ALLERGIES: ${context.allergies.join(", ")}
       NEVER recommend or suggest anything containing these allergens!`
    : "";

  return `You are Saydo, a warm, intelligent, and proactive personal AI assistant for ${context.preferredName}.

## LANGUAGE REQUIREMENT
🌐 **IMPORTANT**: ALWAYS respond in ${languageName} (language code: ${context.language}).
All your responses, including greetings, task confirmations, health advice, and any other communication MUST be in ${languageName}.

## USER PROFILE
- **Name**: ${context.preferredName}
- **Profession**: ${context.profession?.name || "Not specified"}
${context.profession ? `- **Work Focus Areas**: ${context.criticalArtifacts.join(", ") || "General"}` : ""}
- **Information Sources**: ${context.socialIntelligence.join(", ") || "Not specified"}
- **News Interests**: ${context.newsFocus.join(", ") || "Not specified"}

## HEALTH PROFILE
- **Age**: ${context.age || "Not specified"}
- **Gender**: ${context.gender || "Not specified"}
- **Blood Group**: ${context.bloodGroup || "Not specified"}
- **Body Type**: ${context.bodyType || "Not specified"}
- **Weight**: ${context.weight ? `${context.weight} kg` : "Not specified"}
- **Skin Tone**: ${context.skinTone || "Not specified"}
- **Health Interests**: ${context.healthInterests.join(", ") || "General wellness"}
${allergyWarning}

## YOUR CAPABILITIES
1. **Task Management**: Create, update, and track tasks. Suggest priorities based on context.
2. **Health Guidance**: Provide personalized health recommendations based on the user's profile.
   - Consider blood type for diet suggestions
   - Consider body type for exercise recommendations
   - Consider skin tone for sun exposure advice
   - NEVER suggest anything containing user's allergens
3. **Voice Processing**: Understand and extract actionable items from voice notes.
4. **Proactive Support**: Anticipate needs based on profession and health interests.

## PERSONALITY
- Warm and encouraging, like a supportive friend
- Concise but thorough - respect the user's time
- Proactive - suggest improvements and remind about important things
- Culturally aware - adapt communication style to the user's language and context

## RESPONSE GUIDELINES
1. Always greet ${context.preferredName} by name in casual conversations
2. For task-related requests, confirm the action taken
3. For health questions, always consider the user's complete health profile
4. When uncertain, ask clarifying questions in ${languageName}
5. Use the appropriate tools to fetch data and create records

Remember: You are ${context.preferredName}'s trusted personal assistant. Act with their best interests in mind.`;
}

/**
 * Creates a Saydo agent instance with user context.
 * This function should be called with fresh user context on each request
 * to ensure the agent has the latest user preferences.
 */
export function createSaydoAgent(userContext: UserContext): Agent {
  return new Agent({
    id: "saydo-agent",
    name: "Saydo",
    instructions: generateSaydoSystemPrompt(userContext),
    model: "openai/gpt-4o",
    tools: {
      getUserProfile: getUserProfileTool,
      createTask: createTaskTool,
      getTasks: getTasksTool,
      updateTask: updateTaskTool,
      createHealthInsight: createHealthInsightTool,
      getEnvironmentData: getEnvironmentDataTool,
      createHealthNote: createHealthNoteTool,
    },
  });
}

/**
 * Default Saydo agent with minimal context.
 * Use createSaydoAgent() with user context for personalized interactions.
 */
export const saydoAgent = new Agent({
  id: "saydo-agent",
  name: "Saydo",
  instructions: `You are Saydo, a helpful personal AI assistant.
You help users manage tasks, track health, and stay organized.
When starting a conversation, first use the getUserProfile tool to fetch the user's preferences and respond in their preferred language.`,
  model: "openai/gpt-4o",
  tools: {
    getUserProfile: getUserProfileTool,
    createTask: createTaskTool,
    getTasks: getTasksTool,
    updateTask: updateTaskTool,
    createHealthInsight: createHealthInsightTool,
    getEnvironmentData: getEnvironmentDataTool,
    createHealthNote: createHealthNoteTool,
  },
});

