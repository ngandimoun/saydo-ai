import { Mastra } from "@mastra/core/mastra";

// Agents
import { saydoAgent } from "./agents/saydo-agent";
import { voiceAgent } from "./agents/voice-agent";
import { taskAgent } from "./agents/task-agent";
import { healthAgent } from "./agents/health-agent";

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
 * - 4 AI Agents (saydo, voice, task, health)
 * - 9 Tools (user profile, tasks, health, transcription)
 * - 3 Workflows (voice processing, health analysis, daily summary)
 * - Memory configuration
 */
export const mastra = new Mastra({
  agents: {
    saydoAgent,
    voiceAgent,
    taskAgent,
    healthAgent,
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

// Export tools
export { getUserProfileTool, getUserContext, type UserContext } from "./tools/user-profile-tool";
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
  getInitialWorkingMemory,
} from "./memory/config";
