import { getUserContext } from "@/src/mastra/index";
import { generateDailySummary, type ProductivityStats, type SummaryContext } from "@/src/mastra/agents/summary-agent";
import { createClient } from "@/lib/supabase";

/**
 * Generate AI summary for daily productivity
 * This function handles fetching user context and generating the summary
 */
export async function generateAISummary(
  userId: string,
  stats: ProductivityStats,
  context?: SummaryContext
): Promise<string> {
  try {
    // Get user context (includes language)
    const userContext = await getUserContext(userId);

    // Generate summary using the agent
    const summary = await generateDailySummary(userContext, stats, context);

    return summary;
  } catch (error) {
    console.error("[generateAISummary] Error:", error);

    // Fallback to English summary
    const statsText = [
      stats.tasksCreated > 0 ? `${stats.tasksCreated} task${stats.tasksCreated !== 1 ? "s" : ""}` : null,
      stats.voiceNotesRecorded > 0 ? `${stats.voiceNotesRecorded} voice note${stats.voiceNotesRecorded !== 1 ? "s" : ""}` : null,
      stats.aiDocumentsGenerated > 0 ? `${stats.aiDocumentsGenerated} AI document${stats.aiDocumentsGenerated !== 1 ? "s" : ""}` : null,
      stats.workFilesUploaded > 0 ? `${stats.workFilesUploaded} file${stats.workFilesUploaded !== 1 ? "s" : ""}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    if (statsText) {
      return `You've been productive today! ${statsText}. Keep it up!`;
    }

    return "Ready to make today productive? Let's get started!";
  }
}

/**
 * Get user ID from Supabase auth
 * Helper for server-side usage
 */
export async function getUserIdFromAuth(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error("[getUserIdFromAuth] Error:", error);
    return null;
  }
}

