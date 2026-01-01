import { Mastra } from "@mastra/core/mastra";

// Agents
import { saydoAgent } from "./agents/saydo-agent";
import { voiceAgent } from "./agents/voice-agent";
import { taskAgent } from "./agents/task-agent";
import { healthAgent } from "./agents/health-agent";
import { smartAgent } from "./agents/smart-agent";
import { contentAgent } from "./agents/content-agent";
import { healthDocumentAgent } from "./agents/health-document-agent";
import { skincareAgent } from "./agents/skincare-agent";
import { transcriptionPreviewAgent } from "./agents/transcription-preview-agent";

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
import {
  getWorkFilesTool,
  findMatchingFileTool,
  extractFileContentTool,
  analyzeFileContentTool,
} from "./tools/file-vault-tool";

// Health Document Tools
import { classifyHealthDocumentTool } from "./tools/health-classifier-tool";
import {
  analyzeFoodTool,
  analyzeSupplementTool,
  analyzeDrinkTool,
  analyzeLabResultsTool,
  analyzeMedicationTool,
  analyzeGeneralHealthDocTool,
  storeHealthAnalysisTool,
} from "./tools/health-analysis-tools";
import {
  getHealthContextTool,
  getRecentHealthDocumentsTool,
  getBiomarkerHistoryTool,
} from "./tools/health-context-tool";
// Health Engagement Tools
import {
  generateRecommendationsTool,
  generateMealPlanTool,
  createInterventionTool,
  updateHealthScoreTool,
  updateStreakTool,
  checkAchievementsTool,
  generateDailyChallengesTool,
} from "./tools/health-engagement-tools";
// Skincare Tools
import {
  analyzeSkincareProductTool,
  analyzeSkinTool,
  generateSkincareRoutineTool,
  checkIngredientCompatibilityTool,
  getSkincareRecommendationsTool,
  updateSkincareProfileTool,
  logSkincareRoutineTool,
} from "./tools/skincare-tools";

// Workflows
import { voiceProcessingWorkflow } from "./workflows/voice-processing-workflow";
import { healthAnalysisWorkflow } from "./workflows/health-analysis-workflow";
import { dailySummaryWorkflow } from "./workflows/daily-summary-workflow";
import { smartUploadWorkflow } from "./workflows/smart-upload-workflow";

// Memory
import { saydoMemory } from "./memory/config";

/**
 * Main Mastra instance for Saydo.
 * 
 * Contains:
 * - 9 AI Agents (saydo, voice, task, health, smart, content, healthDocument, skincare, transcriptionPreview)
 * - 15+ Tools (user profile, tasks, health, transcription, patterns, content)
 * - 4 Workflows (voice processing, health analysis, daily summary, smart upload)
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
    healthDocumentAgent,
    skincareAgent,
    transcriptionPreviewAgent,
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
    // File Vault Tools
    getWorkFiles: getWorkFilesTool,
    findMatchingFile: findMatchingFileTool,
    extractFileContent: extractFileContentTool,
    analyzeFileContent: analyzeFileContentTool,
    // Health Document Tools
    classifyHealthDocument: classifyHealthDocumentTool,
    analyzeFood: analyzeFoodTool,
    analyzeSupplement: analyzeSupplementTool,
    analyzeDrink: analyzeDrinkTool,
    analyzeLabResults: analyzeLabResultsTool,
    analyzeMedication: analyzeMedicationTool,
    analyzeGeneralHealthDoc: analyzeGeneralHealthDocTool,
    storeHealthAnalysis: storeHealthAnalysisTool,
    // Health Context Tools
    getHealthContext: getHealthContextTool,
    getRecentHealthDocuments: getRecentHealthDocumentsTool,
    getBiomarkerHistory: getBiomarkerHistoryTool,
    // Health Engagement Tools
    generateRecommendations: generateRecommendationsTool,
    generateMealPlan: generateMealPlanTool,
    createIntervention: createInterventionTool,
    updateHealthScore: updateHealthScoreTool,
    updateStreak: updateStreakTool,
    checkAchievements: checkAchievementsTool,
    generateDailyChallenges: generateDailyChallengesTool,
    // Skincare Tools
    analyzeSkincareProduct: analyzeSkincareProductTool,
    analyzeSkin: analyzeSkinTool,
    generateSkincareRoutine: generateSkincareRoutineTool,
    checkIngredientCompatibility: checkIngredientCompatibilityTool,
    getSkincareRecommendations: getSkincareRecommendationsTool,
    updateSkincareProfile: updateSkincareProfileTool,
    logSkincareRoutine: logSkincareRoutineTool,
  },
  workflows: {
    voiceProcessingWorkflow,
    healthAnalysisWorkflow,
    dailySummaryWorkflow,
    smartUploadWorkflow,
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
export { skincareAgent, createSkincareAgent, type SkincareProfile } from "./agents/skincare-agent";
export { 
  transcriptionPreviewAgent, 
  createTranscriptionPreviewAgent, 
  generatePreview,
  type PreviewResult 
} from "./agents/transcription-preview-agent";

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
export {
  getWorkFilesTool,
  findMatchingFileTool,
  extractFileContentTool,
  analyzeFileContentTool,
  fileVaultTools,
} from "./tools/file-vault-tool";

// Export workflows
export { voiceProcessingWorkflow, processVoiceRecording } from "./workflows/voice-processing-workflow";
export { healthAnalysisWorkflow, analyzeHealth } from "./workflows/health-analysis-workflow";
export { dailySummaryWorkflow, generateDailySummary } from "./workflows/daily-summary-workflow";
export { smartUploadWorkflow, processHealthUpload } from "./workflows/smart-upload-workflow";

// Export health document agent and tools
export { healthDocumentAgent, createHealthDocumentAgent, analyzeHealthDocument } from "./agents/health-document-agent";
export { classifyHealthDocumentTool, classifyHealthDocument, type HealthDocumentType } from "./tools/health-classifier-tool";
export {
  analyzeFoodTool,
  analyzeSupplementTool,
  analyzeDrinkTool,
  analyzeLabResultsTool,
  analyzeMedicationTool,
  analyzeGeneralHealthDocTool,
  storeHealthAnalysisTool,
  healthAnalysisTools,
} from "./tools/health-analysis-tools";
export {
  getHealthContextTool,
  getRecentHealthDocumentsTool,
  getBiomarkerHistoryTool,
  getHealthContext,
  healthContextTools,
} from "./tools/health-context-tool";
export {
  generateRecommendationsTool,
  generateMealPlanTool,
  createInterventionTool,
  updateHealthScoreTool,
  updateStreakTool,
  checkAchievementsTool,
  generateDailyChallengesTool,
} from "./tools/health-engagement-tools";
export {
  analyzeSkincareProductTool,
  analyzeSkinTool,
  generateSkincareRoutineTool,
  checkIngredientCompatibilityTool,
  getSkincareRecommendationsTool,
  updateSkincareProfileTool,
  logSkincareRoutineTool,
} from "./tools/skincare-tools";

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
