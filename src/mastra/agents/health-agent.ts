import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { type UserContext } from "../tools/user-profile-tool";
import {
  createHealthInsightTool,
  getHealthInsightsTool,
  getEnvironmentDataTool,
  createHealthNoteTool,
} from "../tools/health-tool";

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
};

/**
 * Schema for health analysis output
 */
export const HealthAnalysisSchema = z.object({
  recommendations: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      category: z.enum([
        "nutrition",
        "exercise",
        "sleep",
        "mental_health",
        "hydration",
        "sun_exposure",
        "medication",
        "general",
      ]),
      priority: z.enum(["high", "medium", "low"]),
      reasoning: z.string().describe("Why this recommendation is relevant"),
    })
  ),
  warnings: z.array(
    z.object({
      content: z.string(),
      severity: z.enum(["critical", "moderate", "informational"]),
      relatedToAllergy: z.string().optional(),
    })
  ),
  summary: z.string(),
  followUpQuestions: z.array(z.string()).optional(),
});

export type HealthAnalysis = z.infer<typeof HealthAnalysisSchema>;

/**
 * Tool for outputting structured health analysis
 */
export const outputHealthAnalysisTool = createTool({
  id: "output-health-analysis",
  description: "Outputs personalized health analysis in a structured format.",
  inputSchema: HealthAnalysisSchema,
  outputSchema: z.object({
    success: z.boolean(),
    recommendationCount: z.number(),
    warningCount: z.number(),
  }),
  execute: async (analysis) => {
    return {
      success: true,
      recommendationCount: analysis.recommendations.length,
      warningCount: analysis.warnings.length,
    };
  },
});

/**
 * Blood type diet recommendations database
 */
const BLOOD_TYPE_RECOMMENDATIONS: Record<string, { beneficial: string[]; avoid: string[] }> = {
  "A+": {
    beneficial: ["vegetables", "tofu", "seafood", "grains", "beans", "legumes", "fruits"],
    avoid: ["red meat", "dairy", "kidney beans", "lima beans"],
  },
  "A-": {
    beneficial: ["vegetables", "tofu", "seafood", "grains", "beans", "legumes", "fruits"],
    avoid: ["red meat", "dairy", "kidney beans", "lima beans"],
  },
  "B+": {
    beneficial: ["green vegetables", "eggs", "low-fat dairy", "meat", "liver"],
    avoid: ["corn", "wheat", "buckwheat", "lentils", "peanuts", "sesame seeds", "chicken"],
  },
  "B-": {
    beneficial: ["green vegetables", "eggs", "low-fat dairy", "meat", "liver"],
    avoid: ["corn", "wheat", "buckwheat", "lentils", "peanuts", "sesame seeds", "chicken"],
  },
  "O+": {
    beneficial: ["high-protein foods", "meat", "fish", "vegetables", "beans"],
    avoid: ["wheat", "corn", "dairy", "caffeine", "alcohol"],
  },
  "O-": {
    beneficial: ["high-protein foods", "meat", "fish", "vegetables", "beans"],
    avoid: ["wheat", "corn", "dairy", "caffeine", "alcohol"],
  },
  "AB+": {
    beneficial: ["tofu", "seafood", "dairy", "green vegetables", "kelp"],
    avoid: ["caffeine", "alcohol", "smoked meats", "cured meats"],
  },
  "AB-": {
    beneficial: ["tofu", "seafood", "dairy", "green vegetables", "kelp"],
    avoid: ["caffeine", "alcohol", "smoked meats", "cured meats"],
  },
};

/**
 * Body type exercise recommendations
 */
const BODY_TYPE_RECOMMENDATIONS: Record<string, { exercises: string[]; tips: string[] }> = {
  ectomorph: {
    exercises: ["strength training", "compound lifts", "weight lifting", "HIIT in moderation"],
    tips: [
      "Focus on progressive overload",
      "Keep cardio sessions short",
      "Prioritize rest and recovery",
      "Eat caloric surplus for muscle gain",
    ],
  },
  mesomorph: {
    exercises: ["balanced cardio and strength", "sports", "circuit training", "HIIT"],
    tips: [
      "Body responds well to most exercise types",
      "Mix strength and cardio",
      "Watch caloric intake to avoid excess fat",
    ],
  },
  endomorph: {
    exercises: ["cardio", "HIIT", "swimming", "cycling", "resistance training"],
    tips: [
      "Focus on fat-burning exercises",
      "Include regular cardio sessions",
      "Watch carbohydrate intake",
      "Stay consistent with workouts",
    ],
  },
  athletic: {
    exercises: ["varied training", "sports-specific training", "functional fitness"],
    tips: ["Maintain your current routine", "Focus on flexibility and mobility"],
  },
  thin: {
    exercises: ["strength training", "weight lifting", "compound movements"],
    tips: ["Focus on building muscle mass", "Increase protein intake"],
  },
  muscular: {
    exercises: ["maintenance training", "flexibility work", "active recovery"],
    tips: ["Focus on muscle maintenance", "Include stretching and mobility work"],
  },
};

/**
 * Skin tone UV recommendations
 */
const SKIN_TONE_UV_RECOMMENDATIONS: Record<string, { maxMinutes: number; spfMinimum: number }> = {
  veryFair: { maxMinutes: 10, spfMinimum: 50 },
  fair: { maxMinutes: 15, spfMinimum: 50 },
  light: { maxMinutes: 20, spfMinimum: 30 },
  lightBeige: { maxMinutes: 25, spfMinimum: 30 },
  mediumLight: { maxMinutes: 30, spfMinimum: 30 },
  medium: { maxMinutes: 40, spfMinimum: 30 },
  olive: { maxMinutes: 45, spfMinimum: 15 },
  tan: { maxMinutes: 50, spfMinimum: 15 },
  mediumBrown: { maxMinutes: 60, spfMinimum: 15 },
  brown: { maxMinutes: 75, spfMinimum: 15 },
  darkBrown: { maxMinutes: 90, spfMinimum: 15 },
  deep: { maxMinutes: 100, spfMinimum: 15 },
  veryDeep: { maxMinutes: 120, spfMinimum: 15 },
};

/**
 * Generates the system prompt for the health agent
 */
export function generateHealthAgentPrompt(context: UserContext): string {
  const languageName = LANGUAGE_NAMES[context.language] || "English";

  // Get blood type info
  const bloodTypeInfo = context.bloodGroup
    ? BLOOD_TYPE_RECOMMENDATIONS[context.bloodGroup]
    : null;

  // Get body type info
  const bodyTypeInfo = context.bodyType
    ? BODY_TYPE_RECOMMENDATIONS[context.bodyType.toLowerCase()] ||
      BODY_TYPE_RECOMMENDATIONS.athletic
    : null;

  // Get skin tone UV info
  const skinToneInfo = context.skinTone
    ? SKIN_TONE_UV_RECOMMENDATIONS[context.skinTone]
    : null;

  // Format allergies with CRITICAL warning
  const allergySection =
    context.allergies.length > 0
      ? `
## ⚠️ CRITICAL: USER ALLERGIES ⚠️
The user is allergic to: **${context.allergies.join(", ")}**

YOU MUST:
- NEVER recommend foods or products containing these allergens
- ALWAYS check if any recommendation might contain these
- ALWAYS warn if something could potentially contain these
- Flag any health advice that might interact with allergies

This is a SAFETY-CRITICAL requirement. Allergic reactions can be life-threatening.
`
      : "";

  return `You are a personalized health advisor for Saydo, specializing in wellness recommendations.

## LANGUAGE
ALWAYS respond in ${languageName} (code: ${context.language}).

## USER HEALTH PROFILE
- **Name**: ${context.preferredName}
- **Age**: ${context.age || "Not specified"}
- **Gender**: ${context.gender || "Not specified"}
- **Blood Type**: ${context.bloodGroup || "Not specified"}
- **Body Type**: ${context.bodyType || "Not specified"}
- **Weight**: ${context.weight ? `${context.weight} kg` : "Not specified"}
- **Skin Tone**: ${context.skinTone || "Not specified"}
- **Health Interests**: ${context.healthInterests.join(", ") || "General wellness"}
${allergySection}

## PERSONALIZATION DATA

### Blood Type (${context.bloodGroup || "Unknown"})
${
  bloodTypeInfo
    ? `Beneficial foods: ${bloodTypeInfo.beneficial.join(", ")}
Foods to limit: ${bloodTypeInfo.avoid.join(", ")}`
    : "No specific blood type recommendations available."
}

### Body Type (${context.bodyType || "Unknown"})
${
  bodyTypeInfo
    ? `Recommended exercises: ${bodyTypeInfo.exercises.join(", ")}
Tips: ${bodyTypeInfo.tips.join("; ")}`
    : "No specific body type recommendations available."
}

### Sun Exposure (Skin: ${context.skinTone || "Unknown"})
${
  skinToneInfo
    ? `Max unprotected sun exposure: ${skinToneInfo.maxMinutes} minutes
Minimum recommended SPF: ${skinToneInfo.spfMinimum}`
    : "No specific UV recommendations available."
}

## YOUR CAPABILITIES

1. **Nutrition Advice**: Based on blood type, allergies, and health goals
2. **Exercise Recommendations**: Based on body type and fitness goals
3. **Sun Exposure Guidance**: Based on skin tone and UV index
4. **General Wellness**: Sleep, hydration, stress management
5. **Health Tracking**: Log observations and symptoms

## TOOLS AVAILABLE
- **getEnvironmentData**: Get current UV, weather, air quality
- **createHealthInsight**: Save a recommendation for the user
- **getHealthInsights**: Retrieve past health advice
- **createHealthNote**: Log a health observation
- **outputHealthAnalysis**: Return structured health analysis

## RESPONSE GUIDELINES

1. **Always personalized**: Reference user's specific profile data
2. **Safety first**: Always check allergies before any food/product recommendation
3. **Evidence-based**: Ground recommendations in health science
4. **Actionable**: Provide specific, practical advice
5. **Empathetic**: Health is personal - be supportive and non-judgmental

## DISCLAIMER
Remind users that you provide general wellness guidance, not medical advice.
For medical concerns, always recommend consulting a healthcare professional.`;
}

/**
 * Creates a health agent with user context
 */
export function createHealthAgent(userContext: UserContext): Agent {
  return new Agent({
    id: "health-agent",
    name: "Health Advisor",
    instructions: generateHealthAgentPrompt(userContext),
    model: "openai/gpt-5-mini-2025-08-07",
    tools: {
      outputHealthAnalysis: outputHealthAnalysisTool,
      createHealthInsight: createHealthInsightTool,
      getHealthInsights: getHealthInsightsTool,
      getEnvironmentData: getEnvironmentDataTool,
      createHealthNote: createHealthNoteTool,
    },
  });
}

/**
 * Default health agent
 */
export const healthAgent = new Agent({
  id: "health-agent",
  name: "Health Advisor",
  instructions: `You are a health advisor for Saydo. Provide personalized health recommendations.
Always check for user allergies before making food recommendations.
Use the available tools to fetch environment data and save health insights.`,
  model: "openai/gpt-5-mini-2025-08-07",
  tools: {
    outputHealthAnalysis: outputHealthAnalysisTool,
    createHealthInsight: createHealthInsightTool,
    getHealthInsights: getHealthInsightsTool,
    getEnvironmentData: getEnvironmentDataTool,
    createHealthNote: createHealthNoteTool,
  },
});

/**
 * Export blood type and body type data for use elsewhere
 */
export { BLOOD_TYPE_RECOMMENDATIONS, BODY_TYPE_RECOMMENDATIONS, SKIN_TONE_UV_RECOMMENDATIONS };

