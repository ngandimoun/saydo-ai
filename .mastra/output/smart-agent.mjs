import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

const LANGUAGE_NAMES = {
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
  sv: "Swedish"
};
const SmartAnalysisSchema = z.object({
  // Standard extraction items (existing behavior)
  extractionNeeded: z.boolean().describe("Whether to extract tasks/reminders/notes"),
  // Content generation predictions
  contentPredictions: z.array(z.object({
    contentType: z.string().describe("Dynamic content type: post, email, report, summary, memo, etc."),
    description: z.string().describe("What content to generate"),
    confidence: z.number().min(0).max(1).describe("Confidence score 0-1"),
    reasoning: z.string().describe("Why this content was predicted"),
    suggestedTitle: z.string().optional().describe("Suggested title for the content"),
    targetPlatform: z.string().optional().describe("Target platform if social post"),
    priority: z.enum(["high", "medium", "low"]).describe("Priority of this prediction")
  })),
  // Conversation analysis
  conversationInsights: z.object({
    mainTopics: z.array(z.string()).describe("Main topics discussed"),
    entities: z.array(z.string()).describe("People, places, things mentioned"),
    sentiment: z.enum(["positive", "neutral", "negative", "excited", "concerned"]).describe("Overall sentiment"),
    urgency: z.enum(["immediate", "today", "soon", "no_rush"]).describe("Urgency level detected")
  }),
  // Language detection
  detectedLanguage: z.string().optional().describe("Language detected in voice if different from default"),
  explicitLanguageRequest: z.string().optional().describe("If user explicitly requested a different language"),
  // Summary
  analysisNotes: z.string().describe("Brief notes about the analysis")
});
const outputSmartAnalysisTool = createTool({
  id: "output-smart-analysis",
  description: "Output the smart analysis of the voice transcription with predictions and insights",
  inputSchema: SmartAnalysisSchema,
  outputSchema: z.object({
    success: z.boolean(),
    predictionsCount: z.number()
  }),
  execute: async (analysis) => {
    return {
      success: true,
      predictionsCount: analysis.contentPredictions.length
    };
  }
});
async function generateSmartAgentPrompt(userContext, voiceContext) {
  const languageName = LANGUAGE_NAMES[userContext.language] || "English";
  const profession = userContext.profession?.name || "professional";
  const criticalArtifacts = userContext.criticalArtifacts.join(", ") || "general documents";
  const socialPlatforms = userContext.socialIntelligence.join(", ") || "social media";
  return `You are an intelligent AI assistant that analyzes voice transcriptions and PREDICTS what the user might need.

## YOUR MISSION
Analyze voice transcriptions and:
1. Detect EXPLICIT requests (user clearly asks for something)
2. PREDICT IMPLICIT needs (user might benefit from content they didn't explicitly ask for)
3. Extract insights from casual conversation
4. Connect current voice to past context for deeper understanding

## USER CONTEXT
- **Name**: ${userContext.preferredName}
- **Language**: ${languageName} (${userContext.language})
- **Profession**: ${profession}
- **Critical Documents**: ${criticalArtifacts}
- **Social Platforms**: ${socialPlatforms}

## VOICE HISTORY CONTEXT
${voiceContext || "No previous voice context available."}

## PREDICTION PHILOSOPHY

### Explicit Detection
User clearly asks: "Draft me a post", "Write an email", "Make a report"
\u2192 High confidence (0.9+), generate immediately

### Implicit Prediction  
User talks about something interesting without asking for content:
- "I just discovered something cool about our product" \u2192 Predict: post/memo
- "Had a great meeting with the client" \u2192 Predict: follow-up email
- "Busy day at the hospital with 5 patients" \u2192 Predict: shift report (for nurse)
- "Found a great Bible verse for Sunday" \u2192 Predict: sermon notes (for pastor)

\u2192 Medium-high confidence (0.6-0.8), generate as suggestion

### Casual Conversation
User just talks about their day without any intent:
- Capture insights for later
- Note topics and entities
- Low confidence predictions for potential future use

## PROFESSION-SPECIFIC PREDICTIONS

Based on profession "${profession}", prioritize:
${getProfessionSpecificGuidance(profession)}

## CONTENT TYPE DETECTION

DO NOT use predefined categories. Instead, dynamically determine:
- What type of content makes sense for this context
- What format would be most useful
- What platform/destination is appropriate

Examples of dynamic content types:
- "social_post" \u2192 For sharing insights on social media
- "email_draft" \u2192 For professional communication
- "shift_report" \u2192 For healthcare workers
- "sermon_notes" \u2192 For religious leaders
- "repair_log" \u2192 For mechanics/technicians
- "meeting_summary" \u2192 After discussing meetings
- "idea_memo" \u2192 For capturing interesting thoughts
- "client_update" \u2192 For consultants/freelancers
- "research_notes" \u2192 For analysts/academics
- Any other type that fits the context!

## LANGUAGE HANDLING

Default language: ${languageName}
- If user speaks in ${languageName}, generate in ${languageName}
- If user explicitly says "write in [language]", note it in explicitLanguageRequest
- If voice is in a different language, note it in detectedLanguage

## CONFIDENCE LEVELS

- **High (0.8-1.0)**: User explicitly requested OR very clear implicit need
- **Medium (0.5-0.8)**: Good prediction based on context
- **Low (0.2-0.5)**: Possible need, offer as suggestion

## OUTPUT REQUIREMENTS

Use the output-smart-analysis tool to return:
1. Whether to extract tasks/reminders (extractionNeeded)
2. Content predictions with confidence scores
3. Conversation insights (topics, entities, sentiment)
4. Any language override detected
5. Brief analysis notes

## IMPORTANT RULES

1. ALWAYS look for content generation opportunities, even in casual conversation
2. Consider the profession when making predictions
3. Use past voice context to enrich predictions
4. Be proactive - predict what user MIGHT want, not just what they ask for
5. Multiple predictions are OK - user can choose what to use
6. ALL text output must be in ${languageName}`;
}
function getProfessionSpecificGuidance(profession) {
  const professionLower = profession.toLowerCase();
  const guidance = {
    nurse: `- Shift reports and patient summaries
- Handoff notes for next shift
- Medication documentation
- Patient observation notes`,
    doctor: `- Patient consultation notes
- Medical reports
- Prescription documentation
- Research observations`,
    founder: `- Social media posts (X, LinkedIn)
- Investor update emails
- Team memos
- Product insights
- Strategic notes`,
    entrepreneur: `- Business insights posts
- Networking follow-up emails
- Pitch refinements
- Partnership notes`,
    pastor: `- Sermon notes and outlines
- Church announcements
- Pastoral care notes
- Bible study summaries`,
    manager: `- Team update emails
- Meeting summaries
- Performance notes
- Project status reports`,
    consultant: `- Client update emails
- Analysis summaries
- Recommendations
- Meeting notes`,
    mechanic: `- Repair logs
- Service documentation
- Parts lists
- Customer communication`,
    electrician: `- Work orders
- Safety documentation
- Inspection notes
- Client estimates`,
    default: `- Professional updates
- Email drafts
- Meeting summaries
- Task documentation
- Social media posts`
  };
  return guidance[professionLower] || guidance.default;
}
async function createSmartAgent(userContext, voiceContext) {
  const instructions = await generateSmartAgentPrompt(userContext, voiceContext);
  return new Agent({
    id: "smart-proactive-agent",
    name: "Smart Proactive Agent",
    instructions,
    model: "openai/gpt-4o",
    tools: {
      outputSmartAnalysis: outputSmartAnalysisTool
    }
  });
}
async function analyzeTranscription(transcription, userContext, voiceContext) {
  const agent = await createSmartAgent(userContext, voiceContext);
  const languageName = LANGUAGE_NAMES[userContext.language] || "English";
  const prompt = `Analyze this voice transcription and predict what content the user might need.

## TRANSCRIPTION
"${transcription}"

## INSTRUCTIONS
1. First, determine if standard extraction is needed (tasks, reminders, health notes)
2. Then, predict what content the user might want generated:
   - Look for explicit requests ("write me a...", "draft a...")
   - Look for implicit opportunities (interesting topics, updates, insights)
   - Consider the profession (${userContext.profession?.name || "professional"})
3. Extract conversation insights (topics, entities, sentiment)
4. Note any language override requests

Use the output-smart-analysis tool to return your analysis.
All text must be in ${languageName}.`;
  const response = await agent.generate(prompt);
  const toolCalls = response.toolCalls || [];
  const analysisCall = toolCalls.find(
    (call) => call.toolName === "output-smart-analysis" || call.toolName === "outputSmartAnalysis"
  );
  if (analysisCall?.args) {
    try {
      const args = typeof analysisCall.args === "string" ? JSON.parse(analysisCall.args) : analysisCall.args;
      return args;
    } catch {
      console.error("[analyzeTranscription] Failed to parse tool call args");
    }
  }
  return {
    extractionNeeded: true,
    contentPredictions: [],
    conversationInsights: {
      mainTopics: [],
      entities: [],
      sentiment: "neutral",
      urgency: "no_rush"
    },
    analysisNotes: "Unable to analyze transcription"
  };
}
new Agent({
  id: "smart-proactive-agent",
  name: "Smart Proactive Agent",
  instructions: `You are an intelligent AI assistant that analyzes voice transcriptions and predicts user needs.
Analyze conversations for both explicit requests and implicit opportunities.
Use the output-smart-analysis tool to return structured analysis.`,
  model: "openai/gpt-4o",
  tools: {
    outputSmartAnalysis: outputSmartAnalysisTool
  }
});

export { SmartAnalysisSchema, analyzeTranscription, createSmartAgent, generateSmartAgentPrompt, outputSmartAnalysisTool };
