import { Mastra } from "@mastra/core/mastra";

// Agents
import { saydoAgent } from "./agents/saydo-agent";
import { voiceAgent } from "./agents/voice-agent";
import { taskAgent } from "./agents/task-agent";
import { healthAgent } from "./agents/health-agent";
import { smartAgent } from "./agents/smart-agent";
import { contentAgent } from "./agents/content-agent";

// Tools
import { getUserProfileTool } from "./tools/user-profile-tool";
import { createTaskTool, getTasksTool, updateTaskTool, deleteTaskTool } from "./tools/task-tool";
import { createReminderTool, getRemindersTool } from "./tools/reminder-tool";
import {
  createHealthInsightTool,
  getHealthInsightsTool,
  getEnvironmentDataTool,
  createHealthNoteTool,
} from "./tools/health-tool";
import { transcribeAudioTool, transcribeFromStorageTool } from "./tools/transcription-tool";
import { learnPatternsTool, getPatternsTool, applyPatternsTool } from "./tools/pattern-learning-tool";
import {
  createAIDocumentTool,
  getAIDocumentsTool,
  updateAIDocumentTool,
  deleteAIDocumentTool,
  archiveAIDocumentTool,
  getAIDocumentByIdTool,
} from "./tools/content-generation-tool";

// Workflows
import { voiceProcessingWorkflow } from "./workflows/voice-processing-workflow";
import { healthAnalysisWorkflow } from "./workflows/health-analysis-workflow";
import { dailySummaryWorkflow } from "./workflows/daily-summary-workflow";

// Memory
import { saydoMemory } from "./memory/config";

/**
 * Main Mastra instance for Saydo.
 * 
 * Contains:
 * - 6 AI Agents (saydo, voice, task, health, smart, content)
 * - 15+ Tools (user profile, tasks, health, transcription, patterns, content)
 * - 3 Workflows (voice processing, health analysis, daily summary)
 * - Memory configuration
 */
export const mastra = new Mastra({
  agents: {
    saydoAgent,
    voiceAgent,
    taskAgent,
    healthAgent,
    smartAgent,
    contentAgent,
  },
  tools: {
    // User profile
    getUserProfile: getUserProfileTool,
    // Task management
    createTask: createTaskTool,
    getTasks: getTasksTool,
    updateTask: updateTaskTool,
    deleteTask: deleteTaskTool,
    // Reminder management
    createReminder: createReminderTool,
    getReminders: getRemindersTool,
    // Health
    createHealthInsight: createHealthInsightTool,
    getHealthInsights: getHealthInsightsTool,
    getEnvironmentData: getEnvironmentDataTool,
    createHealthNote: createHealthNoteTool,
    // Transcription
    transcribeAudio: transcribeAudioTool,
    transcribeFromStorage: transcribeFromStorageTool,
    // Pattern Learning
    learnPatterns: learnPatternsTool,
    getPatterns: getPatternsTool,
    applyPatterns: applyPatternsTool,
    // Content Generation
    createAIDocument: createAIDocumentTool,
    getAIDocuments: getAIDocumentsTool,
    updateAIDocument: updateAIDocumentTool,
    deleteAIDocument: deleteAIDocumentTool,
    archiveAIDocument: archiveAIDocumentTool,
    getAIDocumentById: getAIDocumentByIdTool,
  },
  workflows: {
    voiceProcessingWorkflow,
    healthAnalysisWorkflow,
    dailySummaryWorkflow,
  },
  memory: {
    saydo: saydoMemory,
  },
});

// Export agents
export { saydoAgent, createSaydoAgent } from "./agents/saydo-agent";
export { voiceAgent, createVoiceAgent } from "./agents/voice-agent";
export { taskAgent, createTaskAgent } from "./agents/task-agent";
export { healthAgent, createHealthAgent } from "./agents/health-agent";
export { smartAgent, createSmartAgent, analyzeTranscription } from "./agents/smart-agent";
export { contentAgent, createContentAgent, generateContent, generateBatchContent } from "./agents/content-agent";

// Export tools
export { getUserProfileTool, getUserContext, getFullUserContext, getUserTimezone, type UserContext, type FullUserContext } from "./tools/user-profile-tool";
export { createTaskTool, getTasksTool, updateTaskTool, deleteTaskTool, taskTools } from "./tools/task-tool";
export { createReminderTool, getRemindersTool, reminderTools } from "./tools/reminder-tool";
export {
  createHealthInsightTool,
  getHealthInsightsTool,
  getEnvironmentDataTool,
  createHealthNoteTool,
  healthTools,
} from "./tools/health-tool";
export { transcribeAudioTool, transcribeFromStorageTool, transcriptionTools } from "./tools/transcription-tool";
export { learnPatternsTool, getPatternsTool, applyPatternsTool, patternLearningTools } from "./tools/pattern-learning-tool";
export {
  createAIDocumentTool,
  getAIDocumentsTool,
  updateAIDocumentTool,
  deleteAIDocumentTool,
  archiveAIDocumentTool,
  getAIDocumentByIdTool,
  saveGeneratedContent,
  contentGenerationTools,
} from "./tools/content-generation-tool";

// Export workflows
export { voiceProcessingWorkflow, processVoiceRecording } from "./workflows/voice-processing-workflow";
export { healthAnalysisWorkflow, analyzeHealth } from "./workflows/health-analysis-workflow";
export { dailySummaryWorkflow, generateDailySummary } from "./workflows/daily-summary-workflow";

// Export memory
export {
  saydoMemory,
  createSaydoMemory,
  saydoMemoryConfig,
  createConversationThread,
  createFullContextThread,
  getInitialWorkingMemory,
  getFullWorkingMemory,
  type FullUserContext as MemoryFullUserContext,
  type VoiceHistoryContext,
  type ContentGenerationContext,
} from "./memory/config";

// Export voice context service
export {
  getTodayVoiceContext,
  getWeekVoiceContext,
  getMonthVoiceContext,
  getFullVoiceContext,
  findRelevantContext,
  saveVoiceSummary,
  getVoiceContextStats,
  type VoiceContext,
  type TodayContext,
  type PeriodContext,
} from "@/lib/mastra/voice-context";
