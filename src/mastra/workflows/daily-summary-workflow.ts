import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { getUserContext } from "../tools/user-profile-tool";
import { getTasksTool } from "../tools/task-tool";
import { getHealthInsightsTool } from "../tools/health-tool";
import { createSaydoAgent } from "../agents/saydo-agent";

/**
 * Input schema for daily summary workflow
 */
const DailySummaryInputSchema = z.object({
  userId: z.string().describe("User ID"),
  date: z.string().optional().describe("Date for summary (ISO format), defaults to today"),
});

/**
 * Output schema for daily summary workflow
 */
const DailySummaryOutputSchema = z.object({
  success: z.boolean(),
  summary: z.object({
    greeting: z.string(),
    tasksCompleted: z.number(),
    tasksPending: z.number(),
    topPendingTasks: z.array(z.object({
      title: z.string(),
      priority: z.string(),
      dueDate: z.string().optional(),
    })),
    healthHighlights: z.array(z.string()),
    tomorrowFocus: z.array(z.string()),
    motivationalMessage: z.string(),
    language: z.string(),
  }).optional(),
  error: z.string().optional(),
});

/**
 * Step 1: Gather all data for summary
 */
const gatherDataStep = createStep({
  id: "gather-data",
  description: "Fetch user context, tasks, and health insights",
  inputSchema: DailySummaryInputSchema,
  outputSchema: z.object({
    userId: z.string(),
    date: z.string(),
    userContext: z.any(),
    completedTasks: z.array(z.any()),
    pendingTasks: z.array(z.any()),
    healthInsights: z.array(z.any()),
    error: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    const today = inputData.date || new Date().toISOString().split("T")[0];

    try {
      // Fetch user context
      const userContext = await getUserContext(inputData.userId);

      // Fetch completed tasks for today
      const completedResult = await getTasksTool.execute?.({
        userId: inputData.userId,
        status: "completed",
        includeCompleted: true,
        limit: 50,
      });

      // Fetch pending tasks
      const pendingResult = await getTasksTool.execute?.({
        userId: inputData.userId,
        includeCompleted: false,
        limit: 20,
      });

      // Fetch health insights
      const healthResult = await getHealthInsightsTool.execute?.({
        userId: inputData.userId,
        limit: 5,
        includeExpired: false,
      });

      // Filter completed tasks for today
      const completedToday = (completedResult?.tasks || []).filter((task) => {
        if (!task.completedAt) return false;
        return task.completedAt.startsWith(today);
      });

      return {
        userId: inputData.userId,
        date: today,
        userContext,
        completedTasks: completedToday,
        pendingTasks: pendingResult?.tasks || [],
        healthInsights: healthResult?.insights || [],
      };
    } catch (err) {
      return {
        userId: inputData.userId,
        date: today,
        userContext: null,
        completedTasks: [],
        pendingTasks: [],
        healthInsights: [],
        error: err instanceof Error ? err.message : "Failed to gather data",
      };
    }
  },
});

/**
 * Step 2: Generate summary with AI
 */
const generateSummaryStep = createStep({
  id: "generate-summary",
  description: "Generate personalized daily summary with AI",
  inputSchema: z.object({
    userId: z.string(),
    date: z.string(),
    userContext: z.any(),
    completedTasks: z.array(z.any()),
    pendingTasks: z.array(z.any()),
    healthInsights: z.array(z.any()),
    error: z.string().optional(),
  }),
  outputSchema: DailySummaryOutputSchema,
  execute: async ({ inputData }) => {
    if (inputData.error || !inputData.userContext) {
      return {
        success: false,
        error: inputData.error || "Missing user context",
      };
    }

    try {
      const userContext = inputData.userContext;
      const agent = createSaydoAgent(userContext);

      // Build prompt
      const prompt = `Generate an end-of-day summary for ${userContext.preferredName}.

Today's Date: ${inputData.date}

Completed Tasks (${inputData.completedTasks.length}):
${inputData.completedTasks.map((t) => `- ${t.title}`).join("\n") || "- None completed today"}

Pending Tasks (${inputData.pendingTasks.length}):
${inputData.pendingTasks.slice(0, 5).map((t) => `- [${t.priority}] ${t.title}${t.dueDate ? ` (due: ${t.dueDate})` : ""}`).join("\n") || "- No pending tasks"}

Recent Health Insights:
${inputData.healthInsights.slice(0, 3).map((i) => `- ${i.title}: ${i.content.substring(0, 100)}...`).join("\n") || "- No recent health insights"}

Please generate:
1. A warm, personalized greeting
2. A brief summary of accomplishments
3. Top 3 tasks to focus on tomorrow
4. A motivational message

Remember to respond in ${userContext.language}.`;

      const response = await agent.generate(prompt);

      // Sort pending tasks by priority
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const sortedPending = [...inputData.pendingTasks].sort(
        (a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
                  (priorityOrder[b.priority as keyof typeof priorityOrder] || 2)
      );

      return {
        success: true,
        summary: {
          greeting: response.text?.split("\n")[0] || `Good evening, ${userContext.preferredName}!`,
          tasksCompleted: inputData.completedTasks.length,
          tasksPending: inputData.pendingTasks.length,
          topPendingTasks: sortedPending.slice(0, 3).map((t) => ({
            title: t.title,
            priority: t.priority,
            dueDate: t.dueDate,
          })),
          healthHighlights: inputData.healthInsights.slice(0, 2).map((i) => i.title),
          tomorrowFocus: sortedPending.slice(0, 3).map((t) => t.title),
          motivationalMessage: response.text || "Keep up the great work!",
          language: userContext.language,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to generate summary",
      };
    }
  },
});

/**
 * Daily Summary Workflow
 * 
 * Pipeline:
 * 1. Gather user tasks and health insights
 * 2. Generate personalized summary with AI
 */
export const dailySummaryWorkflow = createWorkflow({
  id: "daily-summary-workflow",
  description: "Generates a personalized end-of-day summary",
  inputSchema: DailySummaryInputSchema,
  outputSchema: DailySummaryOutputSchema,
})
  .then(gatherDataStep)
  .then(generateSummaryStep)
  .commit();

/**
 * Helper function to generate daily summary
 */
export async function generateDailySummary(params: {
  userId: string;
  date?: string;
}) {
  const run = await dailySummaryWorkflow.createRun();
  const result = await run.start({
    inputData: {
      userId: params.userId,
      date: params.date,
    },
  });

  return result;
}

