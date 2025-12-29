import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { getUserContext } from "../tools/user-profile-tool";
import { getEnvironmentDataTool, createHealthInsightTool } from "../tools/health-tool";
import { createHealthAgent, type HealthAnalysis } from "../agents/health-agent";

/**
 * Input schema for health analysis workflow
 */
const HealthAnalysisInputSchema = z.object({
  userId: z.string().describe("User ID"),
  query: z.string().optional().describe("Optional health question or topic"),
  includeEnvironment: z.boolean().default(true).describe("Whether to include environment data"),
});

/**
 * Output schema for health analysis workflow
 */
const HealthAnalysisOutputSchema = z.object({
  success: z.boolean(),
  analysis: z.object({
    recommendations: z.array(z.object({
      title: z.string(),
      content: z.string(),
      category: z.string(),
      priority: z.string(),
    })),
    warnings: z.array(z.object({
      content: z.string(),
      severity: z.string(),
    })),
    summary: z.string(),
  }).optional(),
  environment: z.object({
    city: z.string().nullable(),
    uvIndex: z.number().nullable(),
    temperature: z.number().nullable(),
    airQualityCategory: z.string().nullable(),
  }).optional(),
  error: z.string().optional(),
});

/**
 * Step 1: Fetch user context and environment data
 */
const fetchContextStep = createStep({
  id: "fetch-context",
  description: "Fetch user profile and environment data",
  inputSchema: HealthAnalysisInputSchema,
  outputSchema: z.object({
    userId: z.string(),
    query: z.string().optional(),
    userContext: z.any(),
    environment: z.object({
      hasData: z.boolean(),
      city: z.string().nullable(),
      uvIndex: z.number().nullable(),
      weatherCondition: z.string().nullable(),
      temperature: z.number().nullable(),
      airQualityIndex: z.number().nullable(),
      airQualityCategory: z.string().nullable(),
    }).optional(),
    error: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    try {
      // Fetch user context
      const userContext = await getUserContext(inputData.userId);

      // Fetch environment data if requested
      let environment = undefined;
      if (inputData.includeEnvironment) {
        const envResult = await getEnvironmentDataTool.execute?.({
          userId: inputData.userId,
        });
        
        if (envResult?.hasData && envResult.data) {
          environment = {
            hasData: true,
            city: envResult.data.city,
            uvIndex: envResult.data.uvIndex,
            weatherCondition: envResult.data.weatherCondition,
            temperature: envResult.data.temperature,
            airQualityIndex: envResult.data.airQualityIndex,
            airQualityCategory: envResult.data.airQualityCategory,
          };
        }
      }

      return {
        userId: inputData.userId,
        query: inputData.query,
        userContext,
        environment,
      };
    } catch (err) {
      return {
        userId: inputData.userId,
        query: inputData.query,
        userContext: null,
        error: err instanceof Error ? err.message : "Failed to fetch context",
      };
    }
  },
});

/**
 * Step 2: Analyze health with personalized agent
 */
const analyzeHealthStep = createStep({
  id: "analyze-health",
  description: "Generate personalized health analysis",
  inputSchema: z.object({
    userId: z.string(),
    query: z.string().optional(),
    userContext: z.any(),
    environment: z.any().optional(),
    error: z.string().optional(),
  }),
  outputSchema: z.object({
    userId: z.string(),
    analysis: z.any().optional(),
    environment: z.any().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    if (inputData.error || !inputData.userContext) {
      return {
        userId: inputData.userId,
        error: inputData.error || "Missing user context",
      };
    }

    try {
      // Create health agent with user context
      const agent = createHealthAgent(inputData.userContext);

      // Build prompt with environment data
      let prompt = "";
      
      if (inputData.query) {
        prompt = `Health question: "${inputData.query}"`;
      } else {
        prompt = "Provide a personalized health check-in with recommendations for today.";
      }

      if (inputData.environment?.hasData) {
        prompt += `\n\nCurrent environment:
- Location: ${inputData.environment.city || "Unknown"}
- UV Index: ${inputData.environment.uvIndex ?? "Unknown"}
- Temperature: ${inputData.environment.temperature ?? "Unknown"}°C
- Air Quality: ${inputData.environment.airQualityCategory || "Unknown"}

Please consider these conditions in your recommendations.`;
      }

      prompt += "\n\nUse the output-health-analysis tool to provide structured recommendations.";

      // Generate analysis
      const response = await agent.generate(prompt);

      // Parse tool call result
      const toolCalls = response.toolCalls || [];
      const analysisCall = toolCalls.find(
        (call) => call.toolName === "output-health-analysis"
      );

      const analysis: HealthAnalysis = analysisCall?.args
        ? (analysisCall.args as HealthAnalysis)
        : {
            recommendations: [],
            warnings: [],
            summary: response.text || "Unable to generate analysis",
          };

      return {
        userId: inputData.userId,
        analysis,
        environment: inputData.environment,
      };
    } catch (err) {
      return {
        userId: inputData.userId,
        error: err instanceof Error ? err.message : "Failed to analyze health",
      };
    }
  },
});

/**
 * Step 3: Save insights and format output
 */
const saveInsightsStep = createStep({
  id: "save-insights",
  description: "Save health insights to database",
  inputSchema: z.object({
    userId: z.string(),
    analysis: z.any().optional(),
    environment: z.any().optional(),
    error: z.string().optional(),
  }),
  outputSchema: HealthAnalysisOutputSchema,
  execute: async ({ inputData }) => {
    if (inputData.error || !inputData.analysis) {
      return {
        success: false,
        error: inputData.error || "No analysis to save",
      };
    }

    try {
      const analysis = inputData.analysis as HealthAnalysis;

      // Save high-priority recommendations as insights
      for (const rec of analysis.recommendations.filter((r) => r.priority === "high")) {
        await createHealthInsightTool.execute?.({
          userId: inputData.userId,
          type: "recommendation",
          title: rec.title,
          content: rec.content,
          category: rec.category as "nutrition" | "exercise" | "sleep" | "mental_health" | "hydration" | "sun_exposure" | "medication" | "general",
          priority: "high",
        });
      }

      // Save warnings as insights
      for (const warning of analysis.warnings) {
        await createHealthInsightTool.execute?.({
          userId: inputData.userId,
          type: "warning",
          title: "Health Warning",
          content: warning.content,
          category: "general",
          priority: warning.severity === "critical" ? "high" : "medium",
          relatedToAllergy: warning.relatedToAllergy,
        });
      }

      return {
        success: true,
        analysis: {
          recommendations: analysis.recommendations.map((r) => ({
            title: r.title,
            content: r.content,
            category: r.category,
            priority: r.priority,
          })),
          warnings: analysis.warnings.map((w) => ({
            content: w.content,
            severity: w.severity,
          })),
          summary: analysis.summary,
        },
        environment: inputData.environment?.hasData
          ? {
              city: inputData.environment.city,
              uvIndex: inputData.environment.uvIndex,
              temperature: inputData.environment.temperature,
              airQualityCategory: inputData.environment.airQualityCategory,
            }
          : undefined,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to save insights",
      };
    }
  },
});

/**
 * Health Analysis Workflow
 * 
 * Pipeline:
 * 1. Fetch user profile and environment data
 * 2. Generate personalized health analysis using health agent
 * 3. Save insights to database
 */
export const healthAnalysisWorkflow = createWorkflow({
  id: "health-analysis-workflow",
  description: "Analyzes user health and provides personalized recommendations",
  inputSchema: HealthAnalysisInputSchema,
  outputSchema: HealthAnalysisOutputSchema,
})
  .then(fetchContextStep)
  .then(analyzeHealthStep)
  .then(saveInsightsStep)
  .commit();

/**
 * Helper function to analyze health
 */
export async function analyzeHealth(params: {
  userId: string;
  query?: string;
  includeEnvironment?: boolean;
}) {
  const run = await healthAnalysisWorkflow.createRun();
  const result = await run.start({
    inputData: {
      userId: params.userId,
      query: params.query,
      includeEnvironment: params.includeEnvironment ?? true,
    },
  });

  return result;
}

