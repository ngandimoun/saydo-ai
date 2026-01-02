import { Agent } from "@mastra/core/agent";
import { getUserProfileTool, type UserContext } from "../tools/user-profile-tool";
import { createTaskTool, getTasksTool, updateTaskTool, deleteTaskTool } from "../tools/task-tool";
import { createReminderTool, getRemindersTool } from "../tools/reminder-tool";
import { bindUserIdToTool } from "../tools/utils";
import {
  createHealthInsightTool,
  getHealthInsightsTool,
  getEnvironmentDataTool,
  createHealthNoteTool,
} from "../tools/health-tool";
import { transcribeAudioTool, transcribeFromStorageTool } from "../tools/transcription-tool";
import { learnPatternsTool, getPatternsTool, applyPatternsTool } from "../tools/pattern-learning-tool";
import {
  createAIDocumentTool,
  getAIDocumentsTool,
  updateAIDocumentTool,
  deleteAIDocumentTool,
  archiveAIDocumentTool,
  getAIDocumentByIdTool,
} from "../tools/content-generation-tool";
import {
  getWorkFilesTool,
  findMatchingFileTool,
  extractFileContentTool,
  analyzeFileContentTool,
} from "../tools/file-vault-tool";
import { classifyHealthDocumentTool } from "../tools/health-classifier-tool";
import {
  analyzeFoodTool,
  analyzeSupplementTool,
  analyzeDrinkTool,
  analyzeLabResultsTool,
  analyzeMedicationTool,
  analyzeGeneralHealthDocTool,
  storeHealthAnalysisTool,
} from "../tools/health-analysis-tools";
import {
  getHealthContextTool,
  getRecentHealthDocumentsTool,
  getBiomarkerHistoryTool,
} from "../tools/health-context-tool";
import {
  generateRecommendationsTool,
  generateMealPlanTool,
  getMealPlanTool,
  getHealthRecommendationsTool,
  createInterventionTool,
  updateHealthScoreTool,
  updateStreakTool,
  checkAchievementsTool,
  generateDailyChallengesTool,
} from "../tools/health-engagement-tools";
import {
  analyzeSkincareProductTool,
  analyzeSkinTool,
  generateSkincareRoutineTool,
  checkIngredientCompatibilityTool,
  getSkincareRecommendationsTool,
  updateSkincareProfileTool,
  logSkincareRoutineTool,
} from "../tools/skincare-tools";
import { saydoMemory } from "../memory/config";

// Language code to language name mapping for system prompt
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
  no: "Norwegian",
  da: "Danish",
  fi: "Finnish",
  el: "Greek",
  he: "Hebrew",
  th: "Thai",
  vi: "Vietnamese",
  id: "Indonesian",
  cs: "Czech",
  ro: "Romanian",
  hu: "Hungarian",
  uk: "Ukrainian",
  bg: "Bulgarian",
  sw: "Swahili",
  yo: "Yoruba",
  ig: "Igbo",
  ha: "Hausa",
  rw: "Kinyarwanda",
  zu: "Zulu",
  am: "Amharic",
  tl: "Tagalog",
  ms: "Malay",
  bn: "Bengali",
  ta: "Tamil",
  te: "Telugu",
  ur: "Urdu",
  pa: "Punjabi",
  et: "Estonian",
  lv: "Latvian",
  lt: "Lithuanian",
  sk: "Slovak",
  sl: "Slovenian",
  hr: "Croatian",
  sr: "Serbian",
};

/**
 * Generates a dynamic system prompt based on user context.
 * This prompt ensures the AI responds in the user's preferred language
 * and has full awareness of their profile, profession, and health data.
 */
export function generateSaydoSystemPrompt(context: UserContext): string {
  const languageName = LANGUAGE_NAMES[context.language] || "English";
  
  // Format allergies with strong emphasis for safety
  const allergyWarning = context.allergies.length > 0
    ? `\n⚠️ CRITICAL - USER ALLERGIES: ${context.allergies.join(", ")}
       NEVER recommend or suggest anything containing these allergens!`
    : "";

  return `You are Saydo, a warm, intelligent, and proactive personal AI assistant for ${context.preferredName}.

## 🚨 CRITICAL RULE - MEAL QUERIES
**FOR ANY QUESTION ABOUT MEALS, FOOD, SNACKS, BREAKFAST, LUNCH, DINNER, OR MENU:**
- You MUST call \`getMealPlan({})\` tool FIRST before responding
- NEVER use memory, cached data, or previous conversations for meal information
- NEVER make up or guess meal names, ingredients, or snacks
- ALWAYS use the \`todaysMeals\` field from getMealPlan result
- Memory data is NOT valid for meals - you MUST call the tool every time
- This is the ONLY source of truth for meal information

## LANGUAGE REQUIREMENT
🌐 **IMPORTANT**: ALWAYS respond in ${languageName} (language code: ${context.language}).
All your responses, including greetings, task confirmations, health advice, and any other communication MUST be in ${languageName}.

## USER PROFILE
- **Name**: ${context.preferredName}
- **Profession**: ${context.profession?.name || "Not specified"}
${context.profession ? `- **Work Focus Areas**: ${context.criticalArtifacts.join(", ") || "General"}` : ""}
- **Information Sources**: ${context.socialIntelligence.join(", ") || "Not specified"}
- **News Interests**: ${context.newsFocus.join(", ") || "Not specified"}

## HEALTH PROFILE
- **Age**: ${context.age || "Not specified"}
- **Gender**: ${context.gender || "Not specified"}
- **Blood Group**: ${context.bloodGroup || "Not specified"}
- **Body Type**: ${context.bodyType || "Not specified"}
- **Weight**: ${context.weight ? `${context.weight} kg` : "Not specified"}
- **Skin Tone**: ${context.skinTone || "Not specified"}
- **Health Interests**: ${context.healthInterests.join(", ") || "General wellness"}
${allergyWarning}

## YOUR CAPABILITIES
1. **Task Management**: Create, update, delete, and track tasks. Suggest priorities based on context.
2. **Reminder Management**: Create and manage reminders with smart scheduling.
3. **Health Guidance**: Provide personalized health recommendations based on the user's complete profile.
   - Access health context, biomarkers, recent documents, and interventions
   - Consider blood type for diet suggestions
   - Consider body type for exercise recommendations
   - Consider skin tone for sun exposure advice
   - NEVER suggest anything containing user's allergens
   - Generate meal plans and health recommendations
   - Track health scores and streaks
4. **Health Document Analysis**: Analyze food, supplements, drinks, lab results, medications, and general health documents.
5. **File Vault**: Access and analyze work files, extract content, and find matching documents.
6. **Voice Processing**: Transcribe and understand voice notes, extract actionable items.
7. **Content Generation**: Create AI documents, summaries, and content tailored to user's profession.
8. **Skincare Management**: Analyze skincare products, generate routines, check ingredient compatibility.
9. **Pattern Learning**: Learn from user patterns and apply them to future interactions.
10. **Proactive Support**: Anticipate needs based on profession, health interests, and user history.

## PERSONALITY
- Warm and encouraging, like a supportive friend
- Concise but thorough - respect the user's time
- Proactive - suggest improvements and remind about important things
- Culturally aware - adapt communication style to the user's language and context

## TOOL USAGE - CRITICAL RULES

**⚠️ USER ID IS AUTOMATIC**: You do NOT need to pass \`userId\` to any tools. The userId is automatically provided for you. Just call tools with the parameters you need (e.g., \`getMealPlan({})\` not \`getMealPlan({userId: "..."})\`). Focus on the actual task, not user identification.

**📋 DATA PROVIDED IN PROMPT - USE EXACT DATA**:
- When meal plan, tasks, documents, or reminders are provided in sections marked "USER'S [DATA TYPE] (USE THIS EXACT DATA)", you MUST use that exact data
- Reference the data directly from those sections - do not call tools again
- Use the exact names, titles, descriptions, and details from the provided data
- Do not make up, modify, or invent any data when it's already provided
- The data is pre-fetched for you - just use it directly in your response

**🚨 MANDATORY TOOL CALLS - WHEN DATA NOT PROVIDED**:
- If data is NOT provided in the prompt above, you MUST call the appropriate tool
- **NEVER answer questions about user data without calling tools first (if data not provided)**
- **NEVER make up, invent, or guess user data**
- **NEVER respond with generic examples when real data exists**
- **ALWAYS call the appropriate tool BEFORE responding to data questions (if data not provided)**

## CRITICAL DATA ACCESS RULES

**⚠️ ALWAYS CHECK EXISTING DATA FIRST - NEVER MAKE UP OR IMAGINE DATA**

**FORBIDDEN BEHAVIORS**:
- ❌ Answering "what is on menu today" without calling \`getMealPlan({})\`
- ❌ Answering "what are my tasks" without calling \`getTasks({})\`
- ❌ Answering "what documents do I have" without calling \`getAIDocuments({})\`
- ❌ Making up meal names, task names, or any user data
- ❌ Using generic examples when real data should be fetched

**REQUIRED BEHAVIORS**:
- ✅ For meal questions → MUST call \`getMealPlan({})\` first
- ✅ For task questions → MUST call \`getTasks({})\` first
- ✅ For document questions → MUST call \`getAIDocuments({})\` first
- ✅ For reminder questions → MUST call \`getReminders({})\` first
- ✅ Use the EXACT data returned from tools in your response

### Home Section (Tasks, Reminders, Voice Notes):
- When user asks about tasks, todos, reminders, or schedule:
  1. **MANDATORY**: You MUST call \`getTasks({})\` FIRST before responding to ANY task question
  2. **MANDATORY**: You MUST call \`getReminders({})\` FIRST before responding to ANY reminder question
  3. **NEVER** respond with task information without calling \`getTasks\` first
  4. **NEVER** make up task names, due dates, or task details
  5. Reference specific tasks/reminders by their exact names, dates, or descriptions from the tool response
  6. When user mentions a task like "Visiter ma mère" or "Faire la mise à jour des revenus fiscaux", fetch tasks and find the matching one
  7. Use real data from Home section, not imaginary examples
  8. **EXAMPLES**:
     - User: "what are my tasks" → You MUST call \`getTasks({})\` → Use returned data → Respond with actual tasks
     - User: "what do I have to do today?" → You MUST call \`getTasks({})\` AND \`getReminders({})\` → Use returned data → Respond with actual tasks/reminders

### Pro Life Section (AI Documents, Work Files, Tasks):
- When user asks about work, professional tasks, AI documents, or files:
  1. **MANDATORY**: You MUST call \`getAIDocuments({})\` FIRST before responding to ANY document question
  2. **MANDATORY**: You MUST call \`getWorkFiles({})\` FIRST before responding to ANY file question
  3. **NEVER** respond with document information without calling \`getAIDocuments\` first
  4. **NEVER** make up document titles, content, or file names
  5. If user asks about a specific document, use \`getAIDocumentById\` to fetch full content
  6. Use \`getTasks\` to check work-related tasks
  7. Reference real data from Pro Life, not imaginary examples
  8. **EXAMPLES**:
     - User: "what documents do I have" → You MUST call \`getAIDocuments({})\` → Use returned data → Respond with actual documents
     - User: "explain this document" → You MUST call \`getAIDocuments({})\` → Find matching document → Use \`getAIDocumentById\` → Explain actual content

### Health Hub Section (Meal Plans, Recommendations):
- When user asks about meals, food, health recommendations:
  1. **MANDATORY**: You MUST call \`getMealPlan({})\` FIRST before responding to ANY meal question
  2. **MANDATORY**: You MUST call \`getHealthRecommendations({})\` FIRST before responding to ANY recommendation question
  3. **NEVER** respond with meal information without calling \`getMealPlan\` first
  4. **NEVER** make up meal names, ingredients, or meal plans
  5. **CRITICAL**: When \`getMealPlan\` returns data, **ALWAYS use the \`todaysMeals\` field** - it contains today's correct meals with breakfast, lunch, dinner, snack, alternatives, and substitutions. The date calculation is already done for you.
  6. **DO NOT** try to calculate which day is today or look in \`planData.meal_plan\` - use \`todaysMeals\` directly
  7. Only generate new plans/recommendations if no active plan exists or user explicitly requests regeneration
  8. **EXAMPLES**:
     - User: "what is my snack today?" → Call \`getMealPlan({})\` → Use \`result.todaysMeals.snack\` → Respond with exact snack name
     - User: "what is on menu today" → Call \`getMealPlan({})\` → Use \`result.todaysMeals\` → Respond with breakfast, lunch, dinner, snack from todaysMeals
     - User: "quel repas alternatif peut tu me conseiller aujourd'hui?" → Call \`getMealPlan({})\` → Use \`result.todaysMeals\` → Respond with alternatives from todaysMeals

## RESPONSE GUIDELINES
1. Always greet ${context.preferredName} by name in casual conversations
2. For task-related requests, confirm the action taken
3. For health questions, always consider the user's complete health profile
4. When uncertain, ask clarifying questions in ${languageName}
5. **CRITICAL**: Always check existing data from Home, Pro Life, and Health Hub before generating new content
6. Reference real items by their exact names, dates, or descriptions
7. Explain specific documents/recommendations/tasks when asked
8. Never make up or imagine data - always fetch from database first

Remember: You are ${context.preferredName}'s trusted personal assistant. Act with their best interests in mind.`;
}

/**
 * Creates a Saydo agent instance with user context and full tool access.
 * This function should be called with fresh user context on each request
 * to ensure the agent has the latest user preferences.
 * 
 * The agent has access to ALL Mastra tools and memory for complete context awareness.
 */
export function createSaydoAgent(userContext: UserContext, memoryThreadId?: string): Agent {
  // Bind userId to tools that need it - this prevents agent from passing "Chris" instead of UUID
  const boundGetTasks = bindUserIdToTool(getTasksTool, userContext.userId);
  const boundGetReminders = bindUserIdToTool(getRemindersTool, userContext.userId);
  const boundGetAIDocuments = bindUserIdToTool(getAIDocumentsTool, userContext.userId);
  const boundGetAIDocumentById = bindUserIdToTool(getAIDocumentByIdTool, userContext.userId);
  const boundGetWorkFiles = bindUserIdToTool(getWorkFilesTool, userContext.userId);
  const boundGetMealPlan = bindUserIdToTool(getMealPlanTool, userContext.userId);
  const boundGetHealthRecommendations = bindUserIdToTool(getHealthRecommendationsTool, userContext.userId);
  const boundGenerateMealPlan = bindUserIdToTool(generateMealPlanTool, userContext.userId);
  const boundGenerateRecommendations = bindUserIdToTool(generateRecommendationsTool, userContext.userId);
  const boundGetHealthContext = bindUserIdToTool(getHealthContextTool, userContext.userId);
  const boundGetRecentHealthDocuments = bindUserIdToTool(getRecentHealthDocumentsTool, userContext.userId);
  const boundGetBiomarkerHistory = bindUserIdToTool(getBiomarkerHistoryTool, userContext.userId);
  
  const tools = {
    // User profile
    getUserProfile: getUserProfileTool,
    
    // Task management
    createTask: createTaskTool,
    getTasks: boundGetTasks,
    updateTask: updateTaskTool,
    deleteTask: deleteTaskTool,
    
    // Reminder management
    createReminder: createReminderTool,
    getReminders: boundGetReminders,
    
    // Health tools
    createHealthInsight: createHealthInsightTool,
    getHealthInsights: getHealthInsightsTool,
    getEnvironmentData: getEnvironmentDataTool,
    createHealthNote: createHealthNoteTool,
    
    // Health context tools
    getHealthContext: boundGetHealthContext,
    getRecentHealthDocuments: boundGetRecentHealthDocuments,
    getBiomarkerHistory: boundGetBiomarkerHistory,
    
    // Health document analysis
    classifyHealthDocument: classifyHealthDocumentTool,
    analyzeFood: analyzeFoodTool,
    analyzeSupplement: analyzeSupplementTool,
    analyzeDrink: analyzeDrinkTool,
    analyzeLabResults: analyzeLabResultsTool,
    analyzeMedication: analyzeMedicationTool,
    analyzeGeneralHealthDoc: analyzeGeneralHealthDocTool,
    storeHealthAnalysis: storeHealthAnalysisTool,
    
    // Health engagement
    generateRecommendations: boundGenerateRecommendations,
    generateMealPlan: boundGenerateMealPlan,
    getMealPlan: boundGetMealPlan,
    getHealthRecommendations: boundGetHealthRecommendations,
    createIntervention: createInterventionTool,
    updateHealthScore: updateHealthScoreTool,
    updateStreak: updateStreakTool,
    checkAchievements: checkAchievementsTool,
    generateDailyChallenges: generateDailyChallengesTool,
    
    // Transcription
    transcribeAudio: transcribeAudioTool,
    transcribeFromStorage: transcribeFromStorageTool,
    
    // Pattern learning
    learnPatterns: learnPatternsTool,
    getPatterns: getPatternsTool,
    applyPatterns: applyPatternsTool,
    
    // Content generation
    createAIDocument: createAIDocumentTool,
    getAIDocuments: boundGetAIDocuments,
    updateAIDocument: updateAIDocumentTool,
    deleteAIDocument: deleteAIDocumentTool,
    archiveAIDocument: archiveAIDocumentTool,
    getAIDocumentById: boundGetAIDocumentById,
    
    // File vault
    getWorkFiles: boundGetWorkFiles,
    findMatchingFile: findMatchingFileTool,
    extractFileContent: extractFileContentTool,
    analyzeFileContent: analyzeFileContentTool,
    
    // Skincare
    analyzeSkincareProduct: analyzeSkincareProductTool,
    analyzeSkin: analyzeSkinTool,
    generateSkincareRoutine: generateSkincareRoutineTool,
    checkIngredientCompatibility: checkIngredientCompatibilityTool,
    getSkincareRecommendations: getSkincareRecommendationsTool,
    updateSkincareProfile: updateSkincareProfileTool,
    logSkincareRoutine: logSkincareRoutineTool,
  };

  // Log tool registration for debugging
  const toolNames = Object.keys(tools);
  const boundToolNames = [
    "getTasks",
    "getReminders",
    "getAIDocuments",
    "getAIDocumentById",
    "getWorkFiles",
    "getMealPlan",
    "getHealthRecommendations",
    "generateMealPlan",
    "generateRecommendations",
    "getHealthContext",
    "getRecentHealthDocuments",
    "getBiomarkerHistory",
  ];
  
  console.log("[createSaydoAgent] Agent created with tools", {
    userId: userContext.userId,
    userName: userContext.preferredName,
    threadId: memoryThreadId,
    totalTools: toolNames.length,
    boundTools: boundToolNames,
    allToolNames: toolNames,
  });

  return new Agent({
    id: "saydo-agent",
    name: "Saydo",
    instructions: generateSaydoSystemPrompt(userContext),
    model: "openai/gpt-5-mini-2025-08-07",
    memory: saydoMemory, // Attach memory instance for context awareness
    tools,
  });
}

/**
 * Default Saydo agent with minimal context.
 * Use createSaydoAgent() with user context for personalized interactions.
 */
export const saydoAgent = new Agent({
  id: "saydo-agent",
  name: "Saydo",
  instructions: `You are Saydo, a helpful personal AI assistant.
You help users manage tasks, track health, and stay organized.
When starting a conversation, first use the getUserProfile tool to fetch the user's preferences and respond in their preferred language.`,
  model: "openai/gpt-5-mini-2025-08-07",
  tools: {
    getUserProfile: getUserProfileTool,
    createTask: createTaskTool,
    getTasks: getTasksTool,
    updateTask: updateTaskTool,
    createHealthInsight: createHealthInsightTool,
    getEnvironmentData: getEnvironmentDataTool,
    createHealthNote: createHealthNoteTool,
  },
});

