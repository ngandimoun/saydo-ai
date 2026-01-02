import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { type UserContext } from "../tools/user-profile-tool";
import {
  analyzeSkincareProductTool,
  analyzeSkinTool,
  generateSkincareRoutineTool,
  checkIngredientCompatibilityTool,
  getSkincareRecommendationsTool,
  updateSkincareProfileTool,
  logSkincareRoutineTool,
} from "../tools/skincare-tools";
import { getEnvironmentDataTool } from "../tools/health-tool";

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
 * Skincare profile interface
 */
export interface SkincareProfile {
  skinType?: "oily" | "dry" | "combination" | "sensitive" | "normal";
  skinConditions?: string[];
  skinGoals?: string[];
  skinConcerns?: string;
}

/**
 * Skin type recommendations database
 */
const SKIN_TYPE_RECOMMENDATIONS: Record<string, { 
  ingredientsToSeek: string[]; 
  ingredientsToAvoid: string[];
  routineTips: string[];
}> = {
  oily: {
    ingredientsToSeek: ["salicylic acid", "niacinamide", "hyaluronic acid", "clay", "tea tree"],
    ingredientsToAvoid: ["heavy oils", "coconut oil", "lanolin", "mineral oil"],
    routineTips: [
      "Use oil-free moisturizers",
      "Double cleanse in the evening",
      "Don't skip moisturizer - dehydration can increase oil production",
    ],
  },
  dry: {
    ingredientsToSeek: ["hyaluronic acid", "ceramides", "squalane", "shea butter", "glycerin"],
    ingredientsToAvoid: ["alcohol denat", "fragrance", "sulfates", "retinoids (use with caution)"],
    routineTips: [
      "Apply moisturizer on damp skin",
      "Use a humidifier at night",
      "Layer hydrating products (essence, serum, cream)",
    ],
  },
  combination: {
    ingredientsToSeek: ["niacinamide", "hyaluronic acid", "lightweight oils", "green tea"],
    ingredientsToAvoid: ["heavy creams on T-zone", "harsh alcohol-based toners"],
    routineTips: [
      "Use different products for different zones",
      "Lightweight gel moisturizers work well",
      "Balance is key - don't over-treat either zone",
    ],
  },
  sensitive: {
    ingredientsToSeek: ["centella asiatica", "aloe vera", "oat extract", "allantoin", "chamomile"],
    ingredientsToAvoid: ["fragrance", "essential oils", "alcohol", "harsh acids", "retinoids"],
    routineTips: [
      "Patch test new products",
      "Keep routine simple - fewer products is better",
      "Avoid hot water when cleansing",
    ],
  },
  normal: {
    ingredientsToSeek: ["vitamin C", "retinol", "peptides", "antioxidants"],
    ingredientsToAvoid: ["unnecessary harsh ingredients"],
    routineTips: [
      "Focus on prevention and maintenance",
      "Can experiment with various active ingredients",
      "Don't overcomplicate your routine",
    ],
  },
};

/**
 * Schema for skincare analysis output
 */
export const SkincareAnalysisSchema = z.object({
  recommendations: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      category: z.enum(["cleanser", "toner", "serum", "moisturizer", "sunscreen", "treatment", "routine", "general"]),
      priority: z.enum(["high", "medium", "low"]),
      reasoning: z.string(),
    })
  ),
  warnings: z.array(
    z.object({
      content: z.string(),
      severity: z.enum(["critical", "moderate", "informational"]),
      ingredient: z.string().optional(),
    })
  ),
  summary: z.string(),
});

export type SkincareAnalysis = z.infer<typeof SkincareAnalysisSchema>;

/**
 * Tool for outputting structured skincare analysis
 */
export const outputSkincareAnalysisTool = createTool({
  id: "output-skincare-analysis",
  description: "Outputs personalized skincare analysis in a structured format.",
  inputSchema: SkincareAnalysisSchema,
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
 * Generates the system prompt for the skincare agent
 */
export function generateSkincareAgentPrompt(
  context: UserContext,
  skincareProfile?: SkincareProfile
): string {
  const languageName = LANGUAGE_NAMES[context.language] || "English";

  // Get skin type recommendations
  const skinTypeInfo = skincareProfile?.skinType
    ? SKIN_TYPE_RECOMMENDATIONS[skincareProfile.skinType]
    : null;

  // Format allergies with CRITICAL warning
  const allergySection =
    context.allergies.length > 0
      ? `
## ⚠️ CRITICAL: USER ALLERGIES ⚠️
The user is allergic to: **${context.allergies.join(", ")}**

YOU MUST:
- NEVER recommend products containing these allergens
- ALWAYS check ingredient lists for these allergens
- ALWAYS warn if a product might contain these
- Consider cross-contamination risks

This is a SAFETY-CRITICAL requirement.
`
      : "";

  // Format skin conditions
  const conditionsSection =
    skincareProfile?.skinConditions && skincareProfile.skinConditions.length > 0
      ? `
### Active Skin Conditions
${skincareProfile.skinConditions.map((c) => `- ${c}`).join("\n")}

Consider these conditions when recommending products. Some ingredients may aggravate these conditions.
`
      : "";

  // Format skin goals
  const goalsSection =
    skincareProfile?.skinGoals && skincareProfile.skinGoals.length > 0
      ? `
### Skincare Goals
${skincareProfile.skinGoals.map((g) => `- ${g.replace("_", " ")}`).join("\n")}
`
      : "";

  return `You are a personalized skincare advisor for Saydo, specializing in skincare recommendations.

## LANGUAGE
ALWAYS respond in ${languageName} (code: ${context.language}).

## USER PROFILE
- **Name**: ${context.preferredName}
- **Age**: ${context.age || "Not specified"}
- **Gender**: ${context.gender || "Not specified"}
- **Skin Tone**: ${context.skinTone || "Not specified"}
${allergySection}

## SKINCARE PROFILE
- **Skin Type**: ${skincareProfile?.skinType || "Not specified"}
- **Skin Concerns**: ${skincareProfile?.skinConcerns || "None specified"}
${conditionsSection}
${goalsSection}

## SKIN TYPE RECOMMENDATIONS
${
  skinTypeInfo
    ? `### For ${skincareProfile?.skinType} skin:
**Ingredients to Seek**: ${skinTypeInfo.ingredientsToSeek.join(", ")}
**Ingredients to Avoid**: ${skinTypeInfo.ingredientsToAvoid.join(", ")}
**Routine Tips**:
${skinTypeInfo.routineTips.map((t) => `- ${t}`).join("\n")}`
    : "Complete your skincare profile to get personalized ingredient recommendations."
}

## YOUR CAPABILITIES

1. **Product Analysis**: Analyze skincare products and their ingredients
2. **Routine Building**: Create personalized AM/PM skincare routines
3. **Ingredient Compatibility**: Check if ingredients work well together
4. **Skin Analysis**: Analyze skin photos for conditions and recommendations
5. **UV Protection**: Advise on sun protection based on skin tone and UV index

## TOOLS AVAILABLE
- **analyzeSkincareProduct**: Analyze a skincare product image
- **analyzeSkin**: Analyze a skin photo
- **generateSkincareRoutine**: Create personalized AM/PM routines
- **checkIngredientCompatibility**: Check if ingredients are compatible
- **getSkincareRecommendations**: Get product recommendations
- **updateSkincareProfile**: Update user's skincare profile
- **logSkincareRoutine**: Log routine completion
- **getEnvironmentData**: Get UV index for sunscreen recommendations
- **outputSkincareAnalysis**: Return structured skincare analysis

## RESPONSE GUIDELINES

1. **Always personalized**: Reference user's skin type and concerns
2. **Safety first**: Always check allergies before any product recommendation
3. **Evidence-based**: Ground recommendations in dermatological science
4. **Order matters**: Recommend products in correct application order
5. **Sun protection**: Always emphasize daily SPF use
6. **Patience**: Remind users skincare results take 4-6 weeks

## ROUTINE ORDER
AM: Cleanser → Toner → Serum → Moisturizer → Sunscreen
PM: Cleanser → Toner → Treatment/Serum → Moisturizer → Eye Cream

## DISCLAIMER
Remind users that you provide general skincare guidance, not medical advice.
For persistent skin issues, recommend consulting a dermatologist.`;
}

/**
 * Creates a skincare agent with user context
 */
export function createSkincareAgent(
  userContext: UserContext,
  skincareProfile?: SkincareProfile
): Agent {
  return new Agent({
    id: "skincare-agent",
    name: "Skincare Advisor",
    instructions: generateSkincareAgentPrompt(userContext, skincareProfile),
    model: "openai/gpt-5-mini-2025-08-07",
    tools: {
      outputSkincareAnalysis: outputSkincareAnalysisTool,
      analyzeSkincareProduct: analyzeSkincareProductTool,
      analyzeSkin: analyzeSkinTool,
      generateSkincareRoutine: generateSkincareRoutineTool,
      checkIngredientCompatibility: checkIngredientCompatibilityTool,
      getSkincareRecommendations: getSkincareRecommendationsTool,
      updateSkincareProfile: updateSkincareProfileTool,
      logSkincareRoutine: logSkincareRoutineTool,
      getEnvironmentData: getEnvironmentDataTool,
    },
  });
}

/**
 * Default skincare agent
 */
export const skincareAgent = new Agent({
  id: "skincare-agent",
  name: "Skincare Advisor",
  instructions: `You are a skincare advisor for Saydo. Provide personalized skincare recommendations.
Always check for user allergies before making product recommendations.
Use the available tools to analyze products, build routines, and provide advice.
Emphasize daily sunscreen use and proper product order in routines.`,
  model: "openai/gpt-5-mini-2025-08-07",
  tools: {
    outputSkincareAnalysis: outputSkincareAnalysisTool,
    analyzeSkincareProduct: analyzeSkincareProductTool,
    analyzeSkin: analyzeSkinTool,
    generateSkincareRoutine: generateSkincareRoutineTool,
    checkIngredientCompatibility: checkIngredientCompatibilityTool,
    getSkincareRecommendations: getSkincareRecommendationsTool,
    updateSkincareProfile: updateSkincareProfileTool,
    logSkincareRoutine: logSkincareRoutineTool,
    getEnvironmentData: getEnvironmentDataTool,
  },
});

/**
 * Export skin type data for use elsewhere
 */
export { SKIN_TYPE_RECOMMENDATIONS };



