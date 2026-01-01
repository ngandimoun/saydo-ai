import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
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
 * Output tool for the preview agent
 */
const outputPreviewTool = createTool({
  id: "output-preview",
  description: "Output the cleaned transcription and AI summary",
  inputSchema: z.object({
    cleanedTranscription: z.string().describe("The cleaned and corrected transcription"),
    aiSummary: z.string().describe("A comprehensive AI summary of what the user said"),
  }),
  outputSchema: z.object({
    cleanedTranscription: z.string(),
    aiSummary: z.string(),
  }),
  execute: async ({ cleanedTranscription, aiSummary }) => {
    return {
      cleanedTranscription: cleanedTranscription,
      aiSummary: aiSummary,
    };
  },
});

/**
 * Generates the system prompt for the transcription preview agent
 * This is a LIGHTWEIGHT agent that only does transcription cleaning and summary generation
 * No item extraction, no content predictions - those happen in the main workflow
 */
export function generateTranscriptionPreviewPrompt(context: UserContext): string {
  const languageName = LANGUAGE_NAMES[context.language] || "English";
  const userName = context.name || "the user";

  return `You are a transcription preview specialist for Saydo, the personal AI assistant.

## YOUR TASK
You have TWO responsibilities:
1. Clean and correct raw voice transcriptions
2. Generate a comprehensive AI summary of what the user said

## USER CONTEXT
- Name: ${userName}
- Profession: ${context.profession?.name || "Not specified"}
- Language: ${languageName}

## LANGUAGE REQUIREMENT - CRITICAL
**ALL OUTPUT MUST BE IN ${languageName.toUpperCase()}**
- The cleaned transcription MUST be in ${languageName}
- The AI summary MUST be in ${languageName}
- Do NOT translate to English or any other language

## TRANSCRIPTION CLEANING RULES

### Grammar & Spelling
- Correct spelling errors and typos
- Fix grammatical mistakes
- Ensure proper sentence structure
- Add proper punctuation where missing
- Capitalize appropriately (proper nouns, sentence starts)

### Repetition Removal - CRITICAL
- Remove word repetitions (e.g., "ma tante, ma tante" → "ma tante")
- Remove phrase repetitions (e.g., "je dois, je dois" → "je dois")
- Detect and merge duplicate phrases that convey the same meaning
- Keep only one instance of repeated information

### Formatting
- Add proper punctuation (periods, commas, question marks, etc.)
- Break into appropriate sentences
- Ensure proper spacing
- Remove filler words only if they don't add meaning

### Preservation
- Preserve the original meaning and intent completely
- Keep the user's speaking style and tone
- Don't add information that wasn't in the original
- Maintain the original language (${languageName})

## AI SUMMARY GENERATION RULES

The summary should be a comprehensive overview that captures:

### What to Include
1. **Main intents**: What does the user want to do? (tasks, reminders, requests)
2. **Content requests**: Did they ask to generate something? (tweet, email, report, post)
3. **Events mentioned**: Meetings, appointments, activities with dates/times
4. **People mentioned**: Names of colleagues, family, friends
5. **Context**: Work updates, health notes, personal matters
6. **Emotional tone**: Are they stressed, excited, calm?

### Summary Format
Use markdown formatting:
- Start with "### Résumé" (or equivalent in the user's language)
- Use bullet points for clarity
- Organize by category (Tasks, Reminders, Content Requests, Notes)
- Keep it concise but complete

### Example Summary (French):
\`\`\`
### Résumé
${userName} mentionne une réunion avec des collègues étrangers dans 4 jours et souhaite générer un tweet sur l'importance des bonnes relations professionnelles.

### Tâches
- Réunion avec collègues étrangers (dans 4 jours)

### Demandes de contenu
- Tweet sur les relations avec les collègues
\`\`\`

## OUTPUT
Use the output-preview tool to return both:
1. The cleaned transcription
2. The AI summary

BOTH must be in ${languageName}.`;
}

/**
 * Creates a transcription preview agent with user context
 * This is LIGHTWEIGHT - only transcription cleaning and summary generation
 */
export function createTranscriptionPreviewAgent(userContext: UserContext): Agent {
  return new Agent({
    id: "transcription-preview-agent",
    name: "Transcription Preview",
    instructions: generateTranscriptionPreviewPrompt(userContext),
    model: "openai/gpt-4o-mini", // Fast model for preview
    tools: {
      outputPreview: outputPreviewTool,
    },
  });
}

/**
 * Default transcription preview agent for standalone use
 */
export const transcriptionPreviewAgent = new Agent({
  id: "transcription-preview-agent",
  name: "Transcription Preview",
  instructions: `You are a transcription preview specialist. Clean voice transcriptions and generate AI summaries. Use the output-preview tool to return results.`,
  model: "openai/gpt-4o-mini",
  tools: {
    outputPreview: outputPreviewTool,
  },
});

/**
 * Result type for preview generation
 */
export interface PreviewResult {
  cleanedTranscription: string;
  aiSummary: string;
}

/**
 * Helper function to generate a preview from a transcription
 * Returns cleaned transcription and AI summary
 */
export async function generatePreview(
  rawTranscription: string,
  userContext: UserContext
): Promise<PreviewResult> {
  const agent = createTranscriptionPreviewAgent(userContext);
  const languageName = LANGUAGE_NAMES[userContext.language] || "English";

  const prompt = `Please analyze this voice transcription and provide:
1. A cleaned, corrected version of the transcription
2. A comprehensive AI summary

The transcription is in ${languageName}.

Raw transcription:
"${rawTranscription}"

Use the output-preview tool to return both the cleaned transcription and the AI summary.
ALL content must be in ${languageName}.`;

  const response = await agent.generate(prompt);

  // Parse tool call result
  const toolCalls = response.toolCalls || [];
  const previewCall = toolCalls.find(
    (call) => call.toolName === "output-preview" || call.toolName === "outputPreview"
  );

  if (previewCall?.args) {
    try {
      const args = typeof previewCall.args === "string" 
        ? JSON.parse(previewCall.args) 
        : previewCall.args;
      
      return {
        cleanedTranscription: args.cleanedTranscription || rawTranscription,
        aiSummary: args.aiSummary || "",
      };
    } catch (e) {
      console.error("[generatePreview] Failed to parse tool call args:", e);
    }
  }

  // Fallback: try to extract from text response
  return {
    cleanedTranscription: rawTranscription,
    aiSummary: response.text || "",
  };
}

