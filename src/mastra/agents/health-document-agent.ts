import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { type UserContext } from "../tools/user-profile-tool";
import { classifyHealthDocumentTool, type HealthDocumentType } from "../tools/health-classifier-tool";
import {
  analyzeFoodTool,
  analyzeSupplementTool,
  analyzeDrinkTool,
  analyzeLabResultsTool,
  analyzeMedicationTool,
  analyzeGeneralHealthDocTool,
  storeHealthAnalysisTool,
  type FoodAnalysisResult,
  type SupplementAnalysisResult,
  type DrinkAnalysisResult,
  type LabAnalysisResult,
  type MedicationAnalysisResult,
  type GeneralHealthAnalysisResult,
} from "../tools/health-analysis-tools";

// Language mapping
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
 * Unified analysis result type
 */
export type HealthAnalysisResult = 
  | { type: "food_photo"; data: FoodAnalysisResult }
  | { type: "supplement"; data: SupplementAnalysisResult }
  | { type: "drink"; data: DrinkAnalysisResult }
  | { type: "lab_pdf" | "lab_handwritten"; data: LabAnalysisResult }
  | { type: "medication"; data: MedicationAnalysisResult }
  | { type: "clinical_report" | "other"; data: GeneralHealthAnalysisResult };

/**
 * Schema for the unified analysis output
 */
export const UnifiedAnalysisOutputSchema = z.object({
  documentType: z.string(),
  classification: z.object({
    confidence: z.number(),
    detectedElements: z.array(z.string()),
    reasoning: z.string(),
  }),
  analysis: z.any(), // Type-specific analysis
  healthImpact: z.object({
    score: z.number().optional(),
    benefits: z.array(z.string()),
    concerns: z.array(z.string()),
  }),
  allergyWarnings: z.array(z.string()),
  interactionWarnings: z.array(z.string()),
  recommendations: z.array(z.string()),
  summary: z.string(),
});

export type UnifiedAnalysisOutput = z.infer<typeof UnifiedAnalysisOutputSchema>;

/**
 * Output tool for the health document agent
 */
export const outputHealthDocumentAnalysisTool = createTool({
  id: "output-health-document-analysis",
  description: "Outputs the complete health document analysis in a structured format",
  inputSchema: UnifiedAnalysisOutputSchema,
  outputSchema: z.object({
    success: z.boolean(),
  }),
  execute: async () => {
    return { success: true };
  },
});

/**
 * Generate the health document agent prompt
 */
export function generateHealthDocumentAgentPrompt(context: UserContext): string {
  const languageName = LANGUAGE_NAMES[context.language] || "English";

  // Format allergies with CRITICAL warning
  const allergySection = context.allergies.length > 0
    ? `
## ⚠️ CRITICAL: USER ALLERGIES ⚠️
The user is allergic to: **${context.allergies.join(", ")}**

YOU MUST:
- ALWAYS check uploaded items for these allergens
- IMMEDIATELY warn if any allergen is detected
- Set health score to LOW if allergens are present
- Never recommend consumption of items containing allergens

This is SAFETY-CRITICAL. Allergic reactions can be life-threatening.
`
    : "";

  return `You are a health document analysis agent for Saydo. Your job is to analyze uploaded health-related files and provide personalized insights.

## LANGUAGE
ALWAYS respond in ${languageName} (code: ${context.language}).

## USER HEALTH PROFILE
- **Name**: ${context.preferredName}
- **Age**: ${context.age || "Not specified"}
- **Gender**: ${context.gender || "Not specified"}
- **Blood Type**: ${context.bloodGroup || "Not specified"}
- **Body Type**: ${context.bodyType || "Not specified"}
- **Weight**: ${context.weight ? `${context.weight} kg` : "Not specified"}
- **Health Interests**: ${context.healthInterests.join(", ") || "General wellness"}
${allergySection}

## YOUR WORKFLOW

1. **CLASSIFY** the document:
   - Use the classify-health-document tool to determine what type of file was uploaded
   - Document types: food_photo, supplement, drink, lab_pdf, lab_handwritten, medication, clinical_report, other

2. **ANALYZE** based on type:
   - Food: Use analyze-food tool → nutrition, ingredients, allergy check
   - Supplement: Use analyze-supplement tool → ingredients, dosage, interactions
   - Drink: Use analyze-drink tool → hydration impact, sugar/caffeine
   - Lab results: Use analyze-lab-results tool → biomarkers, abnormal values
   - Medication: Use analyze-medication tool → drug info, interactions
   - Other: Use analyze-general-health-doc tool → key information

3. **PERSONALIZE** the insights:
   - Cross-reference with user's allergies
   - Consider blood type compatibility for food
   - Check for drug/supplement interactions
   - Provide actionable recommendations

4. **STORE** the results:
   - Use store-health-analysis tool to save results
   - This creates intake log entries and biomarker records

5. **OUTPUT** unified results:
   - Use output-health-document-analysis tool to return structured results

## SAFETY GUIDELINES

- ALWAYS check for allergens before anything else
- For medications, check for interactions with user's supplements
- For lab results, flag critical values immediately
- Include medical disclaimers for health advice
- Recommend consulting healthcare professionals for concerning findings

## RESPONSE FORMAT

After analysis, provide:
1. What was detected
2. Key findings
3. Health impact (score, benefits, concerns)
4. Any warnings (allergies, interactions)
5. Personalized recommendations

Be thorough but concise. Focus on actionable insights.`;
}

/**
 * Create a health document analysis agent with user context
 */
export function createHealthDocumentAgent(userContext: UserContext): Agent {
  return new Agent({
    id: "health-document-agent",
    name: "Health Document Analyzer",
    instructions: generateHealthDocumentAgentPrompt(userContext),
    model: "openai/gpt-5-mini-2025-08-07",
    tools: {
      classifyHealthDocument: classifyHealthDocumentTool,
      analyzeFood: analyzeFoodTool,
      analyzeSupplement: analyzeSupplementTool,
      analyzeDrink: analyzeDrinkTool,
      analyzeLabResults: analyzeLabResultsTool,
      analyzeMedication: analyzeMedicationTool,
      analyzeGeneralHealthDoc: analyzeGeneralHealthDocTool,
      storeHealthAnalysis: storeHealthAnalysisTool,
      outputHealthDocumentAnalysis: outputHealthDocumentAnalysisTool,
    },
  });
}

/**
 * Default health document agent for standalone use
 */
export const healthDocumentAgent = new Agent({
  id: "health-document-agent",
  name: "Health Document Analyzer",
  instructions: `You are a health document analysis agent. Analyze uploaded health-related files.
Use the classification tool first, then the appropriate analysis tool based on document type.
Always check for allergens and provide personalized insights.`,
  model: "openai/gpt-5-mini-2025-08-07",
  tools: {
    classifyHealthDocument: classifyHealthDocumentTool,
    analyzeFood: analyzeFoodTool,
    analyzeSupplement: analyzeSupplementTool,
    analyzeDrink: analyzeDrinkTool,
    analyzeLabResults: analyzeLabResultsTool,
    analyzeMedication: analyzeMedicationTool,
    analyzeGeneralHealthDoc: analyzeGeneralHealthDocTool,
    storeHealthAnalysis: storeHealthAnalysisTool,
    outputHealthDocumentAnalysis: outputHealthDocumentAnalysisTool,
  },
});

/**
 * Analyze a health document with the agent
 * This is a helper function that orchestrates the full analysis pipeline
 */
export async function analyzeHealthDocument(
  fileUrl: string,
  fileName: string,
  mimeType: string,
  documentId: string,
  userContext: UserContext
): Promise<UnifiedAnalysisOutput> {
  // Step 1: Classify the document
  const classificationResult = await classifyHealthDocumentTool.execute({
    fileUrl,
    fileName,
    mimeType,
  });

  if (!classificationResult.success || !classificationResult.classification) {
    throw new Error(classificationResult.error || "Failed to classify document");
  }

  const { documentType, confidence, detectedElements, reasoning } = classificationResult.classification;

  // Step 2: Run type-specific analysis
  let analysisResult: unknown;
  let allergyWarnings: string[] = [];
  let interactionWarnings: string[] = [];
  let healthScore: number | undefined;
  let benefits: string[] = [];
  let concerns: string[] = [];
  let recommendations: string[] = [];
  let summary = "";

  switch (documentType) {
    case "food_photo": {
      const result = await analyzeFoodTool.execute({
        fileUrl,
        mimeType,
        userId: userContext.userId,
      });
      if (result.success && result.analysis) {
        analysisResult = result.analysis;
        allergyWarnings = result.analysis.allergyWarnings || [];
        healthScore = result.analysis.healthScore;
        benefits = result.analysis.benefits || [];
        concerns = result.analysis.concerns || [];
        recommendations = result.analysis.recommendations || [];
        summary = `${result.analysis.detected} - ${result.analysis.calories || "?"} calories`;
      }
      break;
    }

    case "supplement": {
      const result = await analyzeSupplementTool.execute({
        fileUrl,
        mimeType,
        userId: userContext.userId,
      });
      if (result.success && result.analysis) {
        analysisResult = result.analysis;
        allergyWarnings = result.analysis.allergyWarnings || [];
        interactionWarnings = result.analysis.drugInteractions || [];
        healthScore = result.analysis.healthScore;
        benefits = result.analysis.benefits || [];
        concerns = result.analysis.concerns || [];
        recommendations = result.analysis.recommendations || [];
        summary = `${result.analysis.name} (${result.analysis.type})`;
      }
      break;
    }

    case "drink": {
      const result = await analyzeDrinkTool.execute({
        fileUrl,
        mimeType,
        userId: userContext.userId,
      });
      if (result.success && result.analysis) {
        analysisResult = result.analysis;
        allergyWarnings = result.analysis.allergyWarnings || [];
        healthScore = result.analysis.healthScore;
        benefits = result.analysis.benefits || [];
        concerns = result.analysis.concerns || [];
        recommendations = result.analysis.recommendations || [];
        summary = `${result.analysis.name} - ${result.analysis.hydrationImpact} hydration`;
      }
      break;
    }

    case "lab_pdf":
    case "lab_handwritten": {
      const result = await analyzeLabResultsTool.execute({
        fileUrl,
        mimeType,
        userId: userContext.userId,
      });
      if (result.success && result.analysis) {
        analysisResult = result.analysis;
        const abnormal = result.analysis.abnormalCount || 0;
        healthScore = Math.max(0, 100 - (abnormal * 10));
        concerns = result.analysis.criticalFindings || [];
        recommendations = result.analysis.recommendations || [];
        summary = result.analysis.summary || `${result.analysis.biomarkers?.length || 0} biomarkers extracted`;
      }
      break;
    }

    case "medication": {
      const result = await analyzeMedicationTool.execute({
        fileUrl,
        mimeType,
        userId: userContext.userId,
      });
      if (result.success && result.analysis) {
        analysisResult = result.analysis;
        allergyWarnings = result.analysis.allergyWarnings || [];
        interactionWarnings = result.analysis.drugInteractions || [];
        concerns = result.analysis.warnings || [];
        recommendations = result.analysis.recommendations || [];
        summary = `${result.analysis.name} - ${result.analysis.dosage || ""}`;
      }
      break;
    }

    case "clinical_report":
    case "other":
    default: {
      const result = await analyzeGeneralHealthDocTool.execute({
        fileUrl,
        mimeType,
        userId: userContext.userId,
      });
      if (result.success && result.analysis) {
        analysisResult = result.analysis;
        recommendations = result.analysis.recommendations || [];
        summary = result.analysis.summary;
      }
      break;
    }
  }

  if (!analysisResult) {
    throw new Error("Analysis failed for document type: " + documentType);
  }

  // Step 3: Store results
  await storeHealthAnalysisTool.execute({
    documentId,
    userId: userContext.userId,
    documentType,
    analysisResult,
    allergyWarnings,
    interactionWarnings,
  });

  // Step 4: Return unified output
  return {
    documentType,
    classification: {
      confidence,
      detectedElements,
      reasoning,
    },
    analysis: analysisResult,
    healthImpact: {
      score: healthScore,
      benefits,
      concerns,
    },
    allergyWarnings,
    interactionWarnings,
    recommendations,
    summary,
  };
}




