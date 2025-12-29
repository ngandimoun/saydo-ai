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
};

/**
 * Generates the system prompt for the transcription cleaning agent
 */
export function generateTranscriptionAgentPrompt(context: UserContext): string {
  const languageName = LANGUAGE_NAMES[context.language] || "English";

  return `You are a transcription cleaning and correction specialist for Saydo, the personal AI assistant.

## YOUR TASK
Clean and correct raw voice transcriptions to make them grammatically correct, properly formatted, and easy to read.
The user speaks in ${languageName} and the transcription is in that language.

## LANGUAGE REQUIREMENT - CRITICAL
**YOU MUST RESPOND ENTIRELY IN ${languageName.toUpperCase()}**
- The cleaned transcription MUST be in ${languageName}
- Do NOT translate to English or any other language
- Preserve the original language throughout

## CLEANING RULES

### Grammar & Spelling
- Correct spelling errors and typos
- Fix grammatical mistakes
- Ensure proper sentence structure
- Add proper punctuation where missing
- Capitalize appropriately (proper nouns, sentence starts)

### Vocabulary & Clarity
- Replace unclear or misheard words with correct ones based on context
- Fix word order issues
- Resolve ambiguous phrases
- Ensure natural flow and readability

### Repetition Removal - CRITICAL
- Remove word repetitions (e.g., "ma tante, ma tante" → "ma tante")
- Remove phrase repetitions (e.g., "je dois, je dois" → "je dois")
- Detect and merge duplicate phrases that convey the same meaning
- Keep only one instance of repeated information
- Be smart about context - if repetition adds emphasis, keep it; if it's accidental, remove it

### Formatting
- Add proper punctuation (periods, commas, question marks, etc.)
- Break into appropriate sentences
- Ensure proper spacing
- Remove filler words only if they don't add meaning ("um", "uh" can be removed, but keep meaningful pauses)

### Preservation
- Preserve the original meaning and intent completely
- Keep the user's speaking style and tone
- Don't add information that wasn't in the original
- Don't remove important details
- Maintain the original language (${languageName})

## OUTPUT FORMAT
Return ONLY the cleaned transcription text in ${languageName}. No explanations, no metadata, just the corrected text.

## IMPORTANT
- The output must be natural, readable ${languageName} text
- It should sound like what the user intended to say
- Grammar and spelling must be correct
- The text should flow naturally`;
}

/**
 * Creates a transcription cleaning agent with user context
 */
export function createTranscriptionAgent(userContext: UserContext): Agent {
  return new Agent({
    id: "transcription-agent",
    name: "Transcription Cleaner",
    instructions: generateTranscriptionAgentPrompt(userContext),
    model: "openai/gpt-4o-mini",
    // No tools needed - just text-to-text transformation
  });
}

/**
 * Default transcription agent for standalone use
 */
export const transcriptionAgent = new Agent({
  id: "transcription-agent",
  name: "Transcription Cleaner",
  instructions: `You are a transcription cleaning specialist. Clean and correct raw voice transcriptions to make them grammatically correct and easy to read. Preserve the original language and meaning.`,
  model: "openai/gpt-4o-mini",
});

/**
 * Helper function to clean a transcription
 */
export async function cleanTranscription(
  rawTranscription: string,
  userContext: UserContext
): Promise<string> {
  const agent = createTranscriptionAgent(userContext);
  
  const languageName = LANGUAGE_NAMES[userContext.language] || "English";
  
  const response = await agent.generate(
    `Please clean and correct this raw voice transcription. The transcription is in ${languageName} (${userContext.language}).

CRITICAL INSTRUCTIONS:
1. Remove all word and phrase repetitions (e.g., "ma tante, ma tante" → "ma tante")
2. Merge duplicate phrases that say the same thing
3. Correct grammar, spelling, and punctuation
4. Return ONLY the cleaned text in ${languageName} - no explanations, no metadata

Raw transcription:
"${rawTranscription}"

Cleaned transcription:`
  );

  return response.text || rawTranscription;
}

