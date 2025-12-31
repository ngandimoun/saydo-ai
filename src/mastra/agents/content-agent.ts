/**
 * Dynamic Content Agent
 * 
 * Fully dynamic content generation agent that adapts to ANY request type.
 * No hardcoded templates - adapts format based on context.
 * 
 * Key capabilities:
 * - Profession context shapes output style
 * - Content type detected from request (or predicted)
 * - Format adapts: short posts, long emails, structured reports, etc.
 * - Multiple versions when appropriate (e.g., 5 X posts with different angles)
 * - Uses full voice history for comprehensive understanding
 */

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
 * Schema for generated content
 */
export const GeneratedContentSchema = z.object({
  title: z.string().describe("Title of the generated content"),
  contentType: z.string().describe("Type of content: post, email, report, summary, memo, etc."),
  content: z.string().describe("The full generated content"),
  previewText: z.string().describe("First 200 chars for preview"),
  
  // Alternative versions (context-dependent - only include when appropriate)
  alternativeVersions: z.array(z.object({
    content: z.string(),
    style: z.string().describe("Style of this version: formal, casual, creative, etc."),
  })).optional().describe("Alternative versions of the content. Only include when the document style and context benefit from multiple variations (e.g., creative content, social posts, marketing materials). Do NOT include for formal documents, reports, summaries, or technical documentation."),
  
  // Metadata
  tags: z.array(z.string()).describe("Auto-extracted tags"),
  targetPlatform: z.string().optional().describe("Target platform if applicable"),
  tone: z.enum(["formal", "casual", "professional", "friendly", "inspirational"]).describe("Tone of the content"),
  wordCount: z.number().describe("Approximate word count"),
  
  // Source tracking
  keySourcePoints: z.array(z.string()).describe("Key points from voice context used"),
  
  // Language
  language: z.string().describe("Language of the content"),
});

export type GeneratedContent = z.infer<typeof GeneratedContentSchema>;

/**
 * Tool for outputting generated content
 */
export const outputGeneratedContentTool = createTool({
  id: "output-generated-content",
  description: "Output the generated content with all metadata",
  inputSchema: GeneratedContentSchema,
  outputSchema: z.object({
    success: z.boolean(),
    wordCount: z.number(),
    hasAlternatives: z.boolean(),
  }),
  execute: async (content) => {
    return {
      success: true,
      wordCount: content.wordCount,
      hasAlternatives: (content.alternativeVersions?.length || 0) > 0,
    };
  },
});

/**
 * Get format guidelines based on content type
 */
function getFormatGuidelines(contentType: string): string {
  const guidelines: Record<string, string> = {
    social_post: `- Keep it concise (under 280 chars for X, longer for LinkedIn)
- Use engaging hooks
- Include relevant hashtags
- Consider emoji usage
- End with call-to-action or thought-provoking question`,

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
- Actionable where relevant`,
  };

  return guidelines[contentType.toLowerCase()] || guidelines.default;
}

/**
 * Generate the content agent prompt
 */
export async function generateContentAgentPrompt(
  userContext: UserContext,
  voiceContext: string,
  contentRequest: {
    contentType: string;
    description: string;
    targetPlatform?: string;
    additionalInstructions?: string;
  },
  languageOverride?: string
): Promise<string> {
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
4. **Include appropriate tags** extracted from content
5. **All content must be in ${languageName}**

## ALTERNATIVE VERSIONS (Context-Aware)

**IMPORTANT**: Alternative versions should only be generated when they add value based on the document style and context.

**Generate alternatives when:**
- Content is creative or social in nature (social posts, tweets, creative marketing content)
- Multiple angles or styles would benefit the user (A/B testing variations, different tones)
- Content is meant for public sharing where style variations are valuable
- The document style is informal, engaging, or promotional

**DO NOT generate alternatives when:**
- Content is formal documentation (reports, summaries, meeting notes)
- Content is structured and factual (shift reports, repair logs, technical documentation)
- Single authoritative version is required (official memos, professional emails)
- The document style is formal, technical, or informational

**Decision criteria:**
- Consider the document style (creative vs formal)
- Consider the content context (social sharing vs documentation)
- Consider user intent and document purpose
- Only generate 3-5 alternative versions when appropriate

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

/**
 * Create a content generation agent
 */
export async function createContentAgent(
  userContext: UserContext,
  voiceContext: string,
  contentRequest: {
    contentType: string;
    description: string;
    targetPlatform?: string;
    additionalInstructions?: string;
  },
  languageOverride?: string
): Promise<Agent> {
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
      outputGeneratedContent: outputGeneratedContentTool,
    },
  });
}

/**
 * Generate content based on prediction and context
 */
export async function generateContent(
  userContext: UserContext,
  voiceContext: string,
  contentRequest: {
    contentType: string;
    description: string;
    targetPlatform?: string;
    additionalInstructions?: string;
  },
  languageOverride?: string
): Promise<GeneratedContent> {
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
4. Consider whether alternative versions would add value based on document style and context (see alternative versions guidelines in instructions)
5. Extract appropriate tags

Use the output-generated-content tool to return the content.
ALL content must be in ${languageName}.`;

  const response = await agent.generate(prompt);

  // Parse tool call result
  const toolCalls = response.toolCalls || [];
  const contentCall = toolCalls.find(
    (call) => call.toolName === "output-generated-content" || call.toolName === "outputGeneratedContent"
  );

  if (contentCall?.args) {
    try {
      const args = typeof contentCall.args === "string"
        ? JSON.parse(contentCall.args)
        : contentCall.args;
      return args as GeneratedContent;
    } catch {
      console.error("[generateContent] Failed to parse tool call args");
    }
  }

  // Fallback response
  return {
    title: "Generated Content",
    contentType: contentRequest.contentType,
    content: response.text || "Unable to generate content",
    previewText: (response.text || "").substring(0, 200),
    tags: [],
    tone: "professional",
    wordCount: (response.text || "").split(/\s+/).length,
    keySourcePoints: [],
    language: languageOverride || userContext.language,
  };
}

/**
 * Generate multiple content pieces for batch predictions
 */
export async function generateBatchContent(
  userContext: UserContext,
  voiceContext: string,
  contentRequests: Array<{
    contentType: string;
    description: string;
    targetPlatform?: string;
    confidence: number;
  }>,
  languageOverride?: string
): Promise<GeneratedContent[]> {
  // Filter by confidence - only generate for high confidence predictions
  const highConfidenceRequests = contentRequests.filter(r => r.confidence >= 0.5);

  // Generate content in parallel (limit to 3 to avoid rate limits)
  const requestsToProcess = highConfidenceRequests.slice(0, 3);

  const results = await Promise.all(
    requestsToProcess.map(request =>
      generateContent(
        userContext,
        voiceContext,
        {
          contentType: request.contentType,
          description: request.description,
          targetPlatform: request.targetPlatform,
        },
        languageOverride
      )
    )
  );

  return results;
}

/**
 * Default content agent for standalone use
 */
export const contentAgent = new Agent({
  id: "dynamic-content-agent",
  name: "Dynamic Content Agent",
  instructions: `You are a professional content creator that generates high-quality content.
Adapt your output format based on the content type requested.
Use the output-generated-content tool to return structured content.`,
  model: "openai/gpt-4o",
  tools: {
    outputGeneratedContent: outputGeneratedContentTool,
  },
});

