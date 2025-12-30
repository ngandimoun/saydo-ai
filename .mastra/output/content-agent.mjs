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
const GeneratedContentSchema = z.object({
  title: z.string().describe("Title of the generated content"),
  contentType: z.string().describe("Type of content: post, email, report, summary, memo, etc."),
  content: z.string().describe("The full generated content"),
  previewText: z.string().describe("First 200 chars for preview"),
  // Multiple versions (for posts, etc.)
  alternativeVersions: z.array(z.object({
    content: z.string(),
    style: z.string().describe("Style of this version: formal, casual, creative, etc.")
  })).optional().describe("Alternative versions of the content"),
  // Metadata
  tags: z.array(z.string()).describe("Auto-extracted tags"),
  targetPlatform: z.string().optional().describe("Target platform if applicable"),
  tone: z.enum(["formal", "casual", "professional", "friendly", "inspirational"]).describe("Tone of the content"),
  wordCount: z.number().describe("Approximate word count"),
  // Source tracking
  keySourcePoints: z.array(z.string()).describe("Key points from voice context used"),
  // Language
  language: z.string().describe("Language of the content")
});
const outputGeneratedContentTool = createTool({
  id: "output-generated-content",
  description: "Output the generated content with all metadata",
  inputSchema: GeneratedContentSchema,
  outputSchema: z.object({
    success: z.boolean(),
    wordCount: z.number(),
    hasAlternatives: z.boolean()
  }),
  execute: async (content) => {
    return {
      success: true,
      wordCount: content.wordCount,
      hasAlternatives: (content.alternativeVersions?.length || 0) > 0
    };
  }
});
function getFormatGuidelines(contentType) {
  const guidelines = {
    social_post: `- Keep it concise (under 280 chars for X, longer for LinkedIn)
- Use engaging hooks
- Include relevant hashtags
- Consider emoji usage
- End with call-to-action or thought-provoking question
- Generate 3-5 alternative versions with different angles`,
    email: `- Clear subject line suggestion
- Professional greeting
- Concise body with clear purpose
- Bullet points for key items
- Professional closing
- Appropriate tone for recipient`,
    report: `- Clear title and date
- Executive summary at top
- Structured sections with headers
- Key findings/observations
- Data points where available
- Conclusions/recommendations
- Professional formatting`,
    summary: `- Brief overview first
- Key points in bullet format
- Important details highlighted
- Action items if any
- Concise and scannable`,
    memo: `- TO/FROM/DATE/SUBJECT header
- Clear purpose statement
- Key points
- Action required if any
- Keep it focused`,
    shift_report: `- Shift date and time
- Patient/client summaries
- Key events and observations
- Medications/treatments given
- Issues to follow up
- Handoff notes for next shift`,
    sermon_notes: `- Scripture references
- Main theme/message
- Key points to cover
- Stories/illustrations
- Application points
- Prayer points`,
    repair_log: `- Customer/vehicle info
- Problem description
- Diagnosis findings
- Work performed
- Parts used
- Recommendations`,
    meeting_notes: `- Date, attendees, purpose
- Key discussion points
- Decisions made
- Action items with owners
- Next steps
- Follow-up date if set`,
    default: `- Clear structure appropriate to content
- Professional formatting
- Key points highlighted
- Actionable where relevant`
  };
  return guidelines[contentType.toLowerCase()] || guidelines.default;
}
async function generateContentAgentPrompt(userContext, voiceContext, contentRequest, languageOverride) {
  const outputLanguage = languageOverride || userContext.language;
  const languageName = LANGUAGE_NAMES[outputLanguage] || "English";
  const profession = userContext.profession?.name || "professional";
  const formatGuidelines = getFormatGuidelines(contentRequest.contentType);
  return `You are a professional content creator that generates high-quality ${contentRequest.contentType} content.

## YOUR MISSION
Generate ${contentRequest.contentType} content based on the user's voice recordings and context.

## USER CONTEXT
- **Name**: ${userContext.preferredName}
- **Language**: ${languageName} (${outputLanguage})
- **Profession**: ${profession}
- **Requested Content Type**: ${contentRequest.contentType}
- **Description**: ${contentRequest.description}
${contentRequest.targetPlatform ? `- **Target Platform**: ${contentRequest.targetPlatform}` : ""}
${contentRequest.additionalInstructions ? `- **Additional Instructions**: ${contentRequest.additionalInstructions}` : ""}

## VOICE CONTEXT (Source Material)
${voiceContext || "No voice context provided."}

## FORMAT GUIDELINES FOR ${contentRequest.contentType.toUpperCase()}
${formatGuidelines}

## PROFESSION-SPECIFIC STYLE
As content for a ${profession}, ensure:
- Appropriate terminology for the field
- Relevant professional context
- Suitable formality level
- Industry-standard formatting

## CONTENT GENERATION RULES

1. **Extract relevant information** from the voice context
2. **Synthesize** into coherent, well-structured content
3. **Adapt format** based on content type and profession
4. **Generate alternatives** for social posts (3-5 versions)
5. **Include appropriate tags** extracted from content
6. **All content must be in ${languageName}**

## LANGUAGE REQUIREMENT
**CRITICAL**: All generated content MUST be in ${languageName}.
- Title: in ${languageName}
- Content: in ${languageName}
- Tags: in ${languageName}
- Preview: in ${languageName}
- Alternative versions: in ${languageName}

## OUTPUT
Use the output-generated-content tool to return the generated content with:
- title: Clear, descriptive title
- contentType: "${contentRequest.contentType}"
- content: Full generated content
- previewText: First 200 chars
- alternativeVersions: Alternative versions if applicable
- tags: Relevant tags
- tone: Detected/appropriate tone
- wordCount: Approximate word count
- keySourcePoints: Key points used from voice context
- language: "${outputLanguage}"`;
}
async function createContentAgent(userContext, voiceContext, contentRequest, languageOverride) {
  const instructions = await generateContentAgentPrompt(
    userContext,
    voiceContext,
    contentRequest,
    languageOverride
  );
  return new Agent({
    id: "dynamic-content-agent",
    name: "Dynamic Content Agent",
    instructions,
    model: "openai/gpt-4o",
    tools: {
      outputGeneratedContent: outputGeneratedContentTool
    }
  });
}
async function generateContent(userContext, voiceContext, contentRequest, languageOverride) {
  const agent = await createContentAgent(
    userContext,
    voiceContext,
    contentRequest,
    languageOverride
  );
  const languageName = LANGUAGE_NAMES[languageOverride || userContext.language] || "English";
  const prompt = `Generate ${contentRequest.contentType} content based on the voice context provided.

## REQUEST
- Content Type: ${contentRequest.contentType}
- Description: ${contentRequest.description}
${contentRequest.targetPlatform ? `- Target Platform: ${contentRequest.targetPlatform}` : ""}
${contentRequest.additionalInstructions ? `- Additional Instructions: ${contentRequest.additionalInstructions}` : ""}

## INSTRUCTIONS
1. Review the voice context in my instructions
2. Extract relevant information for this content type
3. Generate professional, well-formatted content
4. For social posts, generate 3-5 alternative versions
5. Extract appropriate tags

Use the output-generated-content tool to return the content.
ALL content must be in ${languageName}.`;
  const response = await agent.generate(prompt);
  const toolCalls = response.toolCalls || [];
  const contentCall = toolCalls.find(
    (call) => call.toolName === "output-generated-content" || call.toolName === "outputGeneratedContent"
  );
  if (contentCall?.args) {
    try {
      const args = typeof contentCall.args === "string" ? JSON.parse(contentCall.args) : contentCall.args;
      return args;
    } catch {
      console.error("[generateContent] Failed to parse tool call args");
    }
  }
  return {
    title: "Generated Content",
    contentType: contentRequest.contentType,
    content: response.text || "Unable to generate content",
    previewText: (response.text || "").substring(0, 200),
    tags: [],
    tone: "professional",
    wordCount: (response.text || "").split(/\s+/).length,
    keySourcePoints: [],
    language: languageOverride || userContext.language
  };
}
new Agent({
  id: "dynamic-content-agent",
  name: "Dynamic Content Agent",
  instructions: `You are a professional content creator that generates high-quality content.
Adapt your output format based on the content type requested.
Use the output-generated-content tool to return structured content.`,
  model: "openai/gpt-4o",
  tools: {
    outputGeneratedContent: outputGeneratedContentTool
  }
});

export { GeneratedContentSchema, createContentAgent, generateContent, generateContentAgentPrompt, outputGeneratedContentTool };
