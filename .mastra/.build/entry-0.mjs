import { Mastra } from '@mastra/core/mastra';
import { Agent } from '@mastra/core/agent';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { Memory } from '@mastra/memory';

"use strict";
function getSupabaseClient$2() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}
const getUserProfileTool = createTool({
  id: "get-user-profile",
  description: "Fetches complete user context including profile, language preference, profession, health data, allergies, and interests from the database. Use this to personalize responses.",
  inputSchema: z.object({
    userId: z.string().describe("The user's unique identifier (UUID)")
  }),
  outputSchema: z.object({
    userId: z.string(),
    language: z.string(),
    preferredName: z.string(),
    profession: z.object({
      id: z.string(),
      name: z.string()
    }).nullable(),
    criticalArtifacts: z.array(z.string()),
    socialIntelligence: z.array(z.string()),
    newsFocus: z.array(z.string()),
    gender: z.string().nullable(),
    age: z.number().nullable(),
    bloodGroup: z.string().nullable(),
    bodyType: z.string().nullable(),
    weight: z.number().nullable(),
    skinTone: z.string().nullable(),
    allergies: z.array(z.string()),
    healthInterests: z.array(z.string())
  }),
  execute: async ({ userId }) => {
    const supabase = getSupabaseClient$2();
    const [
      profileResult,
      allergiesResult,
      healthInterestsResult,
      criticalArtifactsResult,
      socialIntelligenceResult,
      newsFocusResult
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("user_allergies").select("allergy").eq("user_id", userId),
      supabase.from("user_health_interests").select("interest").eq("user_id", userId),
      supabase.from("user_critical_artifacts").select("artifact_name").eq("user_id", userId),
      supabase.from("user_social_intelligence").select("source_id").eq("user_id", userId),
      supabase.from("user_news_focus").select("vertical_id").eq("user_id", userId)
    ]);
    const profile = profileResult.data;
    if (!profile) {
      return {
        userId,
        language: "en",
        preferredName: "there",
        profession: null,
        criticalArtifacts: [],
        socialIntelligence: [],
        newsFocus: [],
        gender: null,
        age: null,
        bloodGroup: null,
        bodyType: null,
        weight: null,
        skinTone: null,
        allergies: [],
        healthInterests: []
      };
    }
    return {
      userId,
      language: profile.language || "en",
      preferredName: profile.preferred_name || "there",
      profession: profile.profession ? {
        id: profile.profession_id || profile.profession.toLowerCase().replace(/\s+/g, "-"),
        name: profile.profession
      } : null,
      criticalArtifacts: criticalArtifactsResult.data?.map((a) => a.artifact_name) || [],
      socialIntelligence: socialIntelligenceResult.data?.map((s) => s.source_id) || [],
      newsFocus: newsFocusResult.data?.map((n) => n.vertical_id) || [],
      gender: profile.gender || null,
      age: profile.age ? Number(profile.age) : null,
      bloodGroup: profile.blood_group || null,
      bodyType: profile.body_type || null,
      weight: profile.weight ? Number(profile.weight) : null,
      skinTone: profile.skin_tone || null,
      allergies: allergiesResult.data?.map((a) => a.allergy) || [],
      healthInterests: healthInterestsResult.data?.map((h) => h.interest) || []
    };
  }
});
async function getUserContext(userId) {
  const result = await getUserProfileTool.execute?.({ userId });
  return result;
}

"use strict";
const TaskPrioritySchema = z.enum(["urgent", "high", "medium", "low"]);
const TaskStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "cancelled"
]);
function getSupabaseClient$1() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}
const createTaskTool = createTool({
  id: "create-task",
  description: "Creates a new task for the user. Use this when the user wants to add a task, to-do item, or reminder about something to do.",
  inputSchema: z.object({
    userId: z.string().describe("The user's unique identifier"),
    title: z.string().describe("The task title - what needs to be done"),
    description: z.string().optional().describe("Optional detailed description"),
    priority: TaskPrioritySchema.default("medium").describe(
      "Task priority: urgent, high, medium, or low"
    ),
    dueDate: z.string().optional().describe("Due date in ISO format (YYYY-MM-DD)"),
    dueTime: z.string().optional().describe("Due time in HH:MM format (24-hour)"),
    category: z.string().optional().describe("Category like 'work', 'health', 'personal'"),
    tags: z.array(z.string()).default([]).describe("Tags for organizing the task"),
    sourceRecordingId: z.string().optional().describe("ID of voice recording if extracted from voice")
  }),
  outputSchema: z.object({
    success: z.boolean(),
    taskId: z.string().optional(),
    error: z.string().optional()
  }),
  execute: async ({
    userId,
    title,
    description,
    priority,
    dueDate,
    dueTime,
    category,
    tags,
    sourceRecordingId
  }) => {
    try {
      const supabase = getSupabaseClient$1();
      const { data, error } = await supabase.from("tasks").insert({
        user_id: userId,
        title,
        description: description || null,
        priority,
        status: "pending",
        due_date: dueDate || null,
        due_time: dueTime || null,
        category: category || null,
        tags: tags || [],
        source_recording_id: sourceRecordingId || null
      }).select("id").single();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, taskId: data.id };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create task"
      };
    }
  }
});
const getTasksTool = createTool({
  id: "get-tasks",
  description: "Fetches the user's tasks with optional filtering by status, priority, or category.",
  inputSchema: z.object({
    userId: z.string().describe("The user's unique identifier"),
    status: TaskStatusSchema.optional().describe("Filter by task status"),
    priority: TaskPrioritySchema.optional().describe("Filter by priority"),
    category: z.string().optional().describe("Filter by category"),
    includeCompleted: z.boolean().default(false).describe("Whether to include completed tasks"),
    limit: z.number().default(20).describe("Maximum number of tasks to return")
  }),
  outputSchema: z.object({
    tasks: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().nullable(),
        priority: TaskPrioritySchema,
        status: TaskStatusSchema,
        dueDate: z.string().nullable(),
        dueTime: z.string().nullable(),
        category: z.string().nullable(),
        tags: z.array(z.string()),
        createdAt: z.string(),
        completedAt: z.string().nullable()
      })
    ),
    error: z.string().optional()
  }),
  execute: async ({
    userId,
    status,
    priority,
    category,
    includeCompleted,
    limit
  }) => {
    try {
      const supabase = getSupabaseClient$1();
      let query = supabase.from("tasks").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
      if (!includeCompleted) {
        query = query.neq("status", "completed");
      }
      if (status) {
        query = query.eq("status", status);
      }
      if (priority) {
        query = query.eq("priority", priority);
      }
      if (category) {
        query = query.eq("category", category);
      }
      const { data, error } = await query;
      if (error) {
        return { tasks: [], error: error.message };
      }
      return {
        tasks: (data || []).map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          dueDate: task.due_date,
          dueTime: task.due_time,
          category: task.category,
          tags: task.tags || [],
          createdAt: task.created_at,
          completedAt: task.completed_at
        }))
      };
    } catch (err) {
      return {
        tasks: [],
        error: err instanceof Error ? err.message : "Failed to fetch tasks"
      };
    }
  }
});
const updateTaskTool = createTool({
  id: "update-task",
  description: "Updates an existing task. Can change status, priority, due date, or other fields.",
  inputSchema: z.object({
    taskId: z.string().describe("The task ID to update"),
    userId: z.string().describe("The user's ID (for verification)"),
    title: z.string().optional().describe("New task title"),
    description: z.string().optional().describe("New description"),
    priority: TaskPrioritySchema.optional().describe("New priority"),
    status: TaskStatusSchema.optional().describe("New status"),
    dueDate: z.string().optional().describe("New due date (ISO format)"),
    dueTime: z.string().optional().describe("New due time (HH:MM)"),
    category: z.string().optional().describe("New category"),
    tags: z.array(z.string()).optional().describe("New tags")
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional()
  }),
  execute: async ({
    taskId,
    userId,
    title,
    description,
    priority,
    status,
    dueDate,
    dueTime,
    category,
    tags
  }) => {
    try {
      const supabase = getSupabaseClient$1();
      const updates = {};
      if (title !== void 0) updates.title = title;
      if (description !== void 0) updates.description = description;
      if (priority !== void 0) updates.priority = priority;
      if (status !== void 0) {
        updates.status = status;
        if (status === "completed") {
          updates.completed_at = (/* @__PURE__ */ new Date()).toISOString();
        }
      }
      if (dueDate !== void 0) updates.due_date = dueDate;
      if (dueTime !== void 0) updates.due_time = dueTime;
      if (category !== void 0) updates.category = category;
      if (tags !== void 0) updates.tags = tags;
      const { error } = await supabase.from("tasks").update(updates).eq("id", taskId).eq("user_id", userId);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update task"
      };
    }
  }
});
const deleteTaskTool = createTool({
  id: "delete-task",
  description: "Deletes a task by setting its status to cancelled. Use when user wants to remove a task.",
  inputSchema: z.object({
    taskId: z.string().describe("The task ID to delete"),
    userId: z.string().describe("The user's ID (for verification)")
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional()
  }),
  execute: async ({ taskId, userId }) => {
    try {
      const supabase = getSupabaseClient$1();
      const { error } = await supabase.from("tasks").update({ status: "cancelled" }).eq("id", taskId).eq("user_id", userId);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to delete task"
      };
    }
  }
});
const taskTools = {
  createTask: createTaskTool,
  getTasks: getTasksTool,
  updateTask: updateTaskTool,
  deleteTask: deleteTaskTool
};

"use strict";
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}
const createHealthInsightTool = createTool({
  id: "create-health-insight",
  description: "Stores an AI-generated health insight or recommendation for the user. Use this to save health advice for later reference.",
  inputSchema: z.object({
    userId: z.string().describe("The user's unique identifier"),
    type: z.enum(["recommendation", "warning", "observation", "tip"]).describe("Type of health insight"),
    title: z.string().describe("Brief title for the insight"),
    content: z.string().describe("Full content of the health insight"),
    category: z.enum([
      "nutrition",
      "exercise",
      "sleep",
      "mental_health",
      "hydration",
      "sun_exposure",
      "medication",
      "general"
    ]).describe("Category of the health insight"),
    priority: z.enum(["high", "medium", "low"]).default("medium").describe("Priority level of the insight"),
    relatedToAllergy: z.string().optional().describe("If related to a specific allergy"),
    expiresAt: z.string().optional().describe("When this insight expires (ISO date)")
  }),
  outputSchema: z.object({
    success: z.boolean(),
    insightId: z.string().optional(),
    error: z.string().optional()
  }),
  execute: async ({
    userId,
    type,
    title,
    content,
    category,
    priority,
    relatedToAllergy,
    expiresAt
  }) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from("health_insights").insert({
        user_id: userId,
        type,
        title,
        content,
        category,
        priority,
        related_to_allergy: relatedToAllergy || null,
        expires_at: expiresAt || null
      }).select("id").single();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, insightId: data.id };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create health insight"
      };
    }
  }
});
const getHealthInsightsTool = createTool({
  id: "get-health-insights",
  description: "Fetches the user's health insights history with optional filtering.",
  inputSchema: z.object({
    userId: z.string().describe("The user's unique identifier"),
    category: z.enum([
      "nutrition",
      "exercise",
      "sleep",
      "mental_health",
      "hydration",
      "sun_exposure",
      "medication",
      "general"
    ]).optional().describe("Filter by category"),
    limit: z.number().default(10).describe("Maximum number of insights to return"),
    includeExpired: z.boolean().default(false).describe("Whether to include expired insights")
  }),
  outputSchema: z.object({
    insights: z.array(
      z.object({
        id: z.string(),
        type: z.string(),
        title: z.string(),
        content: z.string(),
        category: z.string(),
        priority: z.string(),
        createdAt: z.string(),
        expiresAt: z.string().nullable()
      })
    ),
    error: z.string().optional()
  }),
  execute: async ({ userId, category, limit, includeExpired }) => {
    try {
      const supabase = getSupabaseClient();
      let query = supabase.from("health_insights").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
      if (category) {
        query = query.eq("category", category);
      }
      if (!includeExpired) {
        query = query.or(
          `expires_at.is.null,expires_at.gt.${(/* @__PURE__ */ new Date()).toISOString()}`
        );
      }
      const { data, error } = await query;
      if (error) {
        return { insights: [], error: error.message };
      }
      return {
        insights: (data || []).map((insight) => ({
          id: insight.id,
          type: insight.type,
          title: insight.title,
          content: insight.content,
          category: insight.category,
          priority: insight.priority,
          createdAt: insight.created_at,
          expiresAt: insight.expires_at
        }))
      };
    } catch (err) {
      return {
        insights: [],
        error: err instanceof Error ? err.message : "Failed to fetch health insights"
      };
    }
  }
});
const getEnvironmentDataTool = createTool({
  id: "get-environment-data",
  description: "Fetches the latest environmental data (UV index, weather, air quality) for the user's location. Use this for sun exposure advice based on skin tone.",
  inputSchema: z.object({
    userId: z.string().describe("The user's unique identifier")
  }),
  outputSchema: z.object({
    hasData: z.boolean(),
    data: z.object({
      city: z.string().nullable(),
      uvIndex: z.number().nullable(),
      weatherCondition: z.string().nullable(),
      temperature: z.number().nullable(),
      airQualityIndex: z.number().nullable(),
      airQualityCategory: z.string().nullable(),
      fetchedAt: z.string().nullable()
    }).optional(),
    error: z.string().optional()
  }),
  execute: async ({ userId }) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from("environment_data").select("*").eq("user_id", userId).order("fetched_at", { ascending: false }).limit(1).single();
      if (error) {
        if (error.code === "PGRST116") {
          return { hasData: false };
        }
        return { hasData: false, error: error.message };
      }
      return {
        hasData: true,
        data: {
          city: data.location_city,
          uvIndex: data.uv_index,
          weatherCondition: data.weather_condition,
          temperature: data.temperature,
          airQualityIndex: data.air_quality_index,
          airQualityCategory: data.air_quality_category,
          fetchedAt: data.fetched_at
        }
      };
    } catch (err) {
      return {
        hasData: false,
        error: err instanceof Error ? err.message : "Failed to fetch environment data"
      };
    }
  }
});
const createHealthNoteTool = createTool({
  id: "create-health-note",
  description: "Creates a health note from user's voice or chat input. Use this when user mentions something about their health, symptoms, or wellness.",
  inputSchema: z.object({
    userId: z.string().describe("The user's unique identifier"),
    content: z.string().describe("The health note content"),
    source: z.enum(["voice", "chat", "manual"]).default("chat").describe("Source of the note"),
    sourceRecordingId: z.string().optional().describe("ID of voice recording if from voice"),
    tags: z.array(z.string()).default([]).describe("Tags for categorizing the note")
  }),
  outputSchema: z.object({
    success: z.boolean(),
    noteId: z.string().optional(),
    error: z.string().optional()
  }),
  execute: async ({ userId, content, source, sourceRecordingId, tags }) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from("health_notes").insert({
        user_id: userId,
        content,
        source,
        source_recording_id: sourceRecordingId || null,
        tags: tags || []
      }).select("id").single();
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, noteId: data.id };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create health note"
      };
    }
  }
});
const healthTools = {
  createHealthInsight: createHealthInsightTool,
  getHealthInsights: getHealthInsightsTool,
  getEnvironmentData: getEnvironmentDataTool,
  createHealthNote: createHealthNoteTool
};

"use strict";
const LANGUAGE_NAMES$3 = {
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
  sr: "Serbian"
};
function generateSaydoSystemPrompt(context) {
  const languageName = LANGUAGE_NAMES$3[context.language] || "English";
  const allergyWarning = context.allergies.length > 0 ? `
\u26A0\uFE0F CRITICAL - USER ALLERGIES: ${context.allergies.join(", ")}
       NEVER recommend or suggest anything containing these allergens!` : "";
  return `You are Saydo, a warm, intelligent, and proactive personal AI assistant for ${context.preferredName}.

## LANGUAGE REQUIREMENT
\u{1F310} **IMPORTANT**: ALWAYS respond in ${languageName} (language code: ${context.language}).
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
1. **Task Management**: Create, update, and track tasks. Suggest priorities based on context.
2. **Health Guidance**: Provide personalized health recommendations based on the user's profile.
   - Consider blood type for diet suggestions
   - Consider body type for exercise recommendations
   - Consider skin tone for sun exposure advice
   - NEVER suggest anything containing user's allergens
3. **Voice Processing**: Understand and extract actionable items from voice notes.
4. **Proactive Support**: Anticipate needs based on profession and health interests.

## PERSONALITY
- Warm and encouraging, like a supportive friend
- Concise but thorough - respect the user's time
- Proactive - suggest improvements and remind about important things
- Culturally aware - adapt communication style to the user's language and context

## RESPONSE GUIDELINES
1. Always greet ${context.preferredName} by name in casual conversations
2. For task-related requests, confirm the action taken
3. For health questions, always consider the user's complete health profile
4. When uncertain, ask clarifying questions in ${languageName}
5. Use the appropriate tools to fetch data and create records

Remember: You are ${context.preferredName}'s trusted personal assistant. Act with their best interests in mind.`;
}
function createSaydoAgent(userContext) {
  return new Agent({
    id: "saydo-agent",
    name: "Saydo",
    instructions: generateSaydoSystemPrompt(userContext),
    model: "openai/gpt-4o",
    tools: {
      getUserProfile: getUserProfileTool,
      createTask: createTaskTool,
      getTasks: getTasksTool,
      updateTask: updateTaskTool,
      createHealthInsight: createHealthInsightTool,
      getEnvironmentData: getEnvironmentDataTool,
      createHealthNote: createHealthNoteTool
    }
  });
}
const saydoAgent = new Agent({
  id: "saydo-agent",
  name: "Saydo",
  instructions: `You are Saydo, a helpful personal AI assistant.
You help users manage tasks, track health, and stay organized.
When starting a conversation, first use the getUserProfile tool to fetch the user's preferences and respond in their preferred language.`,
  model: "openai/gpt-4o",
  tools: {
    getUserProfile: getUserProfileTool,
    createTask: createTaskTool,
    getTasks: getTasksTool,
    updateTask: updateTaskTool,
    createHealthInsight: createHealthInsightTool,
    getEnvironmentData: getEnvironmentDataTool,
    createHealthNote: createHealthNoteTool
  }
});

"use strict";
const LANGUAGE_NAMES$2 = {
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
  sv: "Swedish"
};
const ExtractedItemsSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().describe("The task title"),
      description: z.string().optional().describe("Optional description"),
      priority: z.enum(["urgent", "high", "medium", "low"]).default("medium").describe("Inferred priority"),
      dueDate: z.string().optional().describe("Due date if mentioned (ISO format)"),
      dueTime: z.string().optional().describe("Due time if mentioned (HH:MM)"),
      category: z.string().optional().describe("Category like work, health, personal")
    })
  ),
  reminders: z.array(
    z.object({
      title: z.string().describe("The reminder text"),
      reminderTime: z.string().optional().describe("When to remind (ISO datetime)"),
      isRecurring: z.boolean().default(false),
      recurrencePattern: z.string().optional().describe("e.g., 'daily', 'weekly'")
    })
  ),
  healthNotes: z.array(
    z.object({
      content: z.string().describe("The health-related note"),
      category: z.enum(["symptom", "medication", "mood", "exercise", "diet", "sleep", "other"]).default("other"),
      tags: z.array(z.string()).default([])
    })
  ),
  generalNotes: z.array(
    z.object({
      content: z.string().describe("General note content"),
      tags: z.array(z.string()).default([])
    })
  ),
  summary: z.string().describe("Brief summary of what was said")
});
const outputExtractedItemsTool = createTool({
  id: "output-extracted-items",
  description: "Outputs the extracted items from the voice transcription in a structured format.",
  inputSchema: ExtractedItemsSchema,
  outputSchema: z.object({
    success: z.boolean(),
    itemCount: z.number()
  }),
  execute: async (items) => {
    const totalItems = items.tasks.length + items.reminders.length + items.healthNotes.length + items.generalNotes.length;
    return { success: true, itemCount: totalItems };
  }
});
function generateVoiceAgentPrompt(context) {
  const languageName = LANGUAGE_NAMES$2[context.language] || "English";
  return `You are a specialized voice transcription analyzer for Saydo, the personal AI assistant.

## YOUR TASK
Analyze voice transcriptions and extract actionable items in a structured format.
The user speaks in ${languageName} and their transcription will be in that language.

## USER CONTEXT
- **Name**: ${context.preferredName}
- **Profession**: ${context.profession?.name || "Not specified"}
- **Work Focus Areas**: ${context.criticalArtifacts.join(", ") || "General"}
- **Health Interests**: ${context.healthInterests.join(", ") || "General wellness"}

## EXTRACTION RULES

### Tasks
Extract any actionable items the user mentions wanting to do:
- "I need to..." \u2192 Task
- "Remind me to..." \u2192 Task with due date if mentioned
- "I should..." \u2192 Task
- "Don't forget to..." \u2192 Task
- Work-related items for a ${context.profession?.name || "professional"} \u2192 Categorize as 'work'

### Priority Detection
- Urgent words: "urgent", "ASAP", "immediately", "right now", "emergency" \u2192 urgent
- High priority: "important", "critical", "must", "deadline" \u2192 high
- Low priority: "whenever", "no rush", "eventually", "if possible" \u2192 low
- Default: medium

### Due Dates
Parse relative dates:
- "tomorrow" \u2192 tomorrow's date
- "next week" \u2192 7 days from now
- "in 3 days" \u2192 3 days from now
- "Monday" \u2192 next Monday
- Specific dates \u2192 parse as mentioned

### Reminders
Separate time-based reminders from tasks:
- Has a specific trigger time \u2192 Reminder
- Recurring pattern mentioned \u2192 Reminder with recurrence

### Health Notes
Extract any health-related observations:
- Symptoms mentioned
- Medication notes
- Mood/energy levels
- Exercise or diet mentions
- Sleep quality mentions

### General Notes
Anything that's not a task, reminder, or health note but worth recording.

## OUTPUT FORMAT
Use the output-extracted-items tool to return structured data.
Always include a brief summary of the transcription.

## IMPORTANT
- Preserve the user's intent accurately
- When in doubt, classify as a task rather than ignoring
- Consider ${context.profession?.name || "their work"} context for categorization
- Be thorough - don't miss any actionable items`;
}
function createVoiceAgent(userContext) {
  return new Agent({
    id: "voice-agent",
    name: "Voice Processor",
    instructions: generateVoiceAgentPrompt(userContext),
    model: "openai/gpt-4o-mini",
    tools: {
      outputExtractedItems: outputExtractedItemsTool
    }
  });
}
const voiceAgent = new Agent({
  id: "voice-agent",
  name: "Voice Processor",
  instructions: `You are a voice transcription analyzer. Extract tasks, reminders, health notes, and general notes from voice transcriptions.
Use the output-extracted-items tool to return structured data.`,
  model: "openai/gpt-4o-mini",
  tools: {
    outputExtractedItems: outputExtractedItemsTool
  }
});
async function extractFromTranscription(transcription, userContext) {
  const agent = createVoiceAgent(userContext);
  const response = await agent.generate(
    `Please analyze this voice transcription and extract all actionable items:

"${transcription}"

Use the output-extracted-items tool to return the structured extraction.`
  );
  const toolCalls = response.toolCalls || [];
  const extractionCall = toolCalls.find(
    (call) => call.toolName === "output-extracted-items"
  );
  if (extractionCall && extractionCall.args) {
    return extractionCall.args;
  }
  return {
    tasks: [],
    reminders: [],
    healthNotes: [],
    generalNotes: [],
    summary: response.text || "Unable to extract items"
  };
}

"use strict";
const LANGUAGE_NAMES$1 = {
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
  tr: "Turkish"
};
const TaskExtractionSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().describe("Clear, actionable task title"),
      description: z.string().optional().describe("Additional details"),
      priority: z.enum(["urgent", "high", "medium", "low"]).describe("Task priority"),
      dueDate: z.string().optional().describe("Due date in YYYY-MM-DD format"),
      dueTime: z.string().optional().describe("Due time in HH:MM format"),
      category: z.string().describe("Category based on profession context"),
      tags: z.array(z.string()).describe("Relevant tags"),
      reasoning: z.string().describe("Why this priority/category was chosen")
    })
  ),
  suggestions: z.array(z.string()).describe("Suggestions for the user"),
  totalTasks: z.number()
});
const outputTaskExtractionTool = createTool({
  id: "output-task-extraction",
  description: "Outputs the extracted tasks in a structured format with smart categorization.",
  inputSchema: TaskExtractionSchema,
  outputSchema: z.object({
    success: z.boolean(),
    taskCount: z.number()
  }),
  execute: async (extraction) => {
    return { success: true, taskCount: extraction.tasks.length };
  }
});
const parseDateTool = createTool({
  id: "parse-date",
  description: "Parses natural language date expressions into ISO format dates.",
  inputSchema: z.object({
    expression: z.string().describe("Natural language date like 'tomorrow', 'next Monday', 'in 3 days'"),
    referenceDate: z.string().optional().describe("Reference date in ISO format, defaults to today")
  }),
  outputSchema: z.object({
    date: z.string().nullable(),
    time: z.string().nullable(),
    confidence: z.enum(["high", "medium", "low"])
  }),
  execute: async ({ expression, referenceDate }) => {
    const now = referenceDate ? new Date(referenceDate) : /* @__PURE__ */ new Date();
    const lowerExpr = expression.toLowerCase().trim();
    let resultDate = null;
    let resultTime = null;
    let confidence = "low";
    if (lowerExpr === "today" || lowerExpr === "tonight") {
      resultDate = now;
      confidence = "high";
    } else if (lowerExpr === "tomorrow" || lowerExpr.includes("tomorrow")) {
      resultDate = new Date(now);
      resultDate.setDate(resultDate.getDate() + 1);
      confidence = "high";
    } else if (lowerExpr.includes("day after tomorrow")) {
      resultDate = new Date(now);
      resultDate.setDate(resultDate.getDate() + 2);
      confidence = "high";
    } else if (lowerExpr.match(/in (\d+) days?/)) {
      const match = lowerExpr.match(/in (\d+) days?/);
      if (match) {
        resultDate = new Date(now);
        resultDate.setDate(resultDate.getDate() + parseInt(match[1]));
        confidence = "high";
      }
    } else if (lowerExpr === "next week") {
      resultDate = new Date(now);
      resultDate.setDate(resultDate.getDate() + 7);
      confidence = "high";
    } else if (lowerExpr === "this week" || lowerExpr === "end of week") {
      resultDate = new Date(now);
      const daysToFriday = 5 - now.getDay();
      resultDate.setDate(resultDate.getDate() + (daysToFriday >= 0 ? daysToFriday : 7 + daysToFriday));
      confidence = "medium";
    } else {
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      for (let i = 0; i < days.length; i++) {
        if (lowerExpr.includes(days[i])) {
          resultDate = new Date(now);
          const currentDay = now.getDay();
          let daysToAdd = i - currentDay;
          if (daysToAdd <= 0) daysToAdd += 7;
          if (lowerExpr.includes("next")) daysToAdd += 7;
          resultDate.setDate(resultDate.getDate() + daysToAdd);
          confidence = "high";
          break;
        }
      }
    }
    const timeMatch = expression.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const meridiem = timeMatch[3]?.toLowerCase();
      if (meridiem === "pm" && hours < 12) hours += 12;
      if (meridiem === "am" && hours === 12) hours = 0;
      resultTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    } else if (lowerExpr.includes("morning")) {
      resultTime = "09:00";
      confidence = "medium";
    } else if (lowerExpr.includes("noon") || lowerExpr.includes("midday")) {
      resultTime = "12:00";
      confidence = "high";
    } else if (lowerExpr.includes("afternoon")) {
      resultTime = "14:00";
      confidence = "medium";
    } else if (lowerExpr.includes("evening")) {
      resultTime = "18:00";
      confidence = "medium";
    } else if (lowerExpr.includes("night")) {
      resultTime = "21:00";
      confidence = "medium";
    }
    return {
      date: resultDate ? resultDate.toISOString().split("T")[0] : null,
      time: resultTime,
      confidence
    };
  }
});
function generateTaskAgentPrompt(context) {
  const languageName = LANGUAGE_NAMES$1[context.language] || "English";
  const professionCategories = getProfessionCategories(context.profession?.id || "");
  return `You are a specialized task extraction and management agent for Saydo.

## LANGUAGE
Respond in ${languageName} (language code: ${context.language}).

## USER CONTEXT
- **Name**: ${context.preferredName}
- **Profession**: ${context.profession?.name || "General"}
- **Critical Artifacts**: ${context.criticalArtifacts.join(", ") || "Various"}

## YOUR ROLE
Extract, categorize, and structure tasks from user input with intelligent context awareness.

## CATEGORIZATION RULES

### For ${context.profession?.name || "General Professional"}:
${professionCategories.map((c) => `- **${c.name}**: ${c.description}`).join("\n")}

### Default Categories:
- **work**: Professional/job-related tasks
- **health**: Medical, wellness, fitness
- **personal**: Personal errands, life admin
- **finance**: Money, bills, investments
- **social**: People, relationships, events

## PRIORITY DETECTION

### Urgent (\u{1F534})
- Emergency/crisis keywords
- "ASAP", "right now", "immediately"
- Time-sensitive with deadline today

### High (\u{1F7E0})
- Important/critical keywords
- "deadline", "must", "important"
- Due within 1-2 days

### Medium (\u{1F7E1})
- Default for most tasks
- Reasonable timeframe mentioned
- No urgency indicators

### Low (\u{1F7E2})
- "whenever", "no rush", "eventually"
- Nice-to-have items
- No deadline

## DATE PARSING
Use the parse-date tool for natural language dates:
- "tomorrow morning" \u2192 date + time
- "next Tuesday" \u2192 date
- "in 3 days at 2pm" \u2192 date + time
- "end of week" \u2192 Friday

## OUTPUT
Use output-task-extraction tool with:
1. Properly structured tasks
2. Reasoning for categorization
3. Helpful suggestions

## SUGGESTIONS
Provide actionable suggestions like:
- "Consider breaking this large task into smaller steps"
- "This might conflict with your existing task about..."
- "You might want to set a reminder for this"`;
}
function getProfessionCategories(professionId) {
  const professionCategories = {
    doctor: [
      { name: "patient-care", description: "Patient consultations, follow-ups, records" },
      { name: "research", description: "Medical research, reading papers" },
      { name: "admin", description: "Administrative tasks, paperwork" }
    ],
    founder: [
      { name: "product", description: "Product development, features, bugs" },
      { name: "fundraising", description: "Investor meetings, pitch prep" },
      { name: "team", description: "Hiring, team management" },
      { name: "strategy", description: "Planning, roadmap, vision" }
    ],
    marketing: [
      { name: "campaigns", description: "Marketing campaigns, launches" },
      { name: "content", description: "Content creation, copywriting" },
      { name: "analytics", description: "Data analysis, reporting" }
    ],
    finance: [
      { name: "reporting", description: "Financial reports, statements" },
      { name: "analysis", description: "Financial analysis, modeling" },
      { name: "compliance", description: "Regulatory, audit" }
    ]
  };
  return professionCategories[professionId] || [
    { name: "work", description: "Professional tasks" },
    { name: "meetings", description: "Meetings and calls" },
    { name: "follow-up", description: "Follow-up items" }
  ];
}
function createTaskAgent(userContext) {
  return new Agent({
    id: "task-agent",
    name: "Task Extractor",
    instructions: generateTaskAgentPrompt(userContext),
    model: "openai/gpt-4o-mini",
    tools: {
      outputTaskExtraction: outputTaskExtractionTool,
      parseDate: parseDateTool,
      createTask: createTaskTool,
      getTasks: getTasksTool
    }
  });
}
const taskAgent = new Agent({
  id: "task-agent",
  name: "Task Extractor",
  instructions: `You are a task extraction agent. Extract and categorize tasks from user input.
Use parse-date for date parsing and output-task-extraction for structured output.`,
  model: "openai/gpt-4o-mini",
  tools: {
    outputTaskExtraction: outputTaskExtractionTool,
    parseDate: parseDateTool,
    createTask: createTaskTool,
    getTasks: getTasksTool
  }
});

"use strict";
const LANGUAGE_NAMES = {
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
  hi: "Hindi"
};
const HealthAnalysisSchema = z.object({
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
        "general"
      ]),
      priority: z.enum(["high", "medium", "low"]),
      reasoning: z.string().describe("Why this recommendation is relevant")
    })
  ),
  warnings: z.array(
    z.object({
      content: z.string(),
      severity: z.enum(["critical", "moderate", "informational"]),
      relatedToAllergy: z.string().optional()
    })
  ),
  summary: z.string(),
  followUpQuestions: z.array(z.string()).optional()
});
const outputHealthAnalysisTool = createTool({
  id: "output-health-analysis",
  description: "Outputs personalized health analysis in a structured format.",
  inputSchema: HealthAnalysisSchema,
  outputSchema: z.object({
    success: z.boolean(),
    recommendationCount: z.number(),
    warningCount: z.number()
  }),
  execute: async (analysis) => {
    return {
      success: true,
      recommendationCount: analysis.recommendations.length,
      warningCount: analysis.warnings.length
    };
  }
});
const BLOOD_TYPE_RECOMMENDATIONS = {
  "A+": {
    beneficial: ["vegetables", "tofu", "seafood", "grains", "beans", "legumes", "fruits"],
    avoid: ["red meat", "dairy", "kidney beans", "lima beans"]
  },
  "A-": {
    beneficial: ["vegetables", "tofu", "seafood", "grains", "beans", "legumes", "fruits"],
    avoid: ["red meat", "dairy", "kidney beans", "lima beans"]
  },
  "B+": {
    beneficial: ["green vegetables", "eggs", "low-fat dairy", "meat", "liver"],
    avoid: ["corn", "wheat", "buckwheat", "lentils", "peanuts", "sesame seeds", "chicken"]
  },
  "B-": {
    beneficial: ["green vegetables", "eggs", "low-fat dairy", "meat", "liver"],
    avoid: ["corn", "wheat", "buckwheat", "lentils", "peanuts", "sesame seeds", "chicken"]
  },
  "O+": {
    beneficial: ["high-protein foods", "meat", "fish", "vegetables", "beans"],
    avoid: ["wheat", "corn", "dairy", "caffeine", "alcohol"]
  },
  "O-": {
    beneficial: ["high-protein foods", "meat", "fish", "vegetables", "beans"],
    avoid: ["wheat", "corn", "dairy", "caffeine", "alcohol"]
  },
  "AB+": {
    beneficial: ["tofu", "seafood", "dairy", "green vegetables", "kelp"],
    avoid: ["caffeine", "alcohol", "smoked meats", "cured meats"]
  },
  "AB-": {
    beneficial: ["tofu", "seafood", "dairy", "green vegetables", "kelp"],
    avoid: ["caffeine", "alcohol", "smoked meats", "cured meats"]
  }
};
const BODY_TYPE_RECOMMENDATIONS = {
  ectomorph: {
    exercises: ["strength training", "compound lifts", "weight lifting", "HIIT in moderation"],
    tips: [
      "Focus on progressive overload",
      "Keep cardio sessions short",
      "Prioritize rest and recovery",
      "Eat caloric surplus for muscle gain"
    ]
  },
  mesomorph: {
    exercises: ["balanced cardio and strength", "sports", "circuit training", "HIIT"],
    tips: [
      "Body responds well to most exercise types",
      "Mix strength and cardio",
      "Watch caloric intake to avoid excess fat"
    ]
  },
  endomorph: {
    exercises: ["cardio", "HIIT", "swimming", "cycling", "resistance training"],
    tips: [
      "Focus on fat-burning exercises",
      "Include regular cardio sessions",
      "Watch carbohydrate intake",
      "Stay consistent with workouts"
    ]
  },
  athletic: {
    exercises: ["varied training", "sports-specific training", "functional fitness"],
    tips: ["Maintain your current routine", "Focus on flexibility and mobility"]
  },
  thin: {
    exercises: ["strength training", "weight lifting", "compound movements"],
    tips: ["Focus on building muscle mass", "Increase protein intake"]
  },
  muscular: {
    exercises: ["maintenance training", "flexibility work", "active recovery"],
    tips: ["Focus on muscle maintenance", "Include stretching and mobility work"]
  }
};
const SKIN_TONE_UV_RECOMMENDATIONS = {
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
  veryDeep: { maxMinutes: 120, spfMinimum: 15 }
};
function generateHealthAgentPrompt(context) {
  const languageName = LANGUAGE_NAMES[context.language] || "English";
  const bloodTypeInfo = context.bloodGroup ? BLOOD_TYPE_RECOMMENDATIONS[context.bloodGroup] : null;
  const bodyTypeInfo = context.bodyType ? BODY_TYPE_RECOMMENDATIONS[context.bodyType.toLowerCase()] || BODY_TYPE_RECOMMENDATIONS.athletic : null;
  const skinToneInfo = context.skinTone ? SKIN_TONE_UV_RECOMMENDATIONS[context.skinTone] : null;
  const allergySection = context.allergies.length > 0 ? `
## \u26A0\uFE0F CRITICAL: USER ALLERGIES \u26A0\uFE0F
The user is allergic to: **${context.allergies.join(", ")}**

YOU MUST:
- NEVER recommend foods or products containing these allergens
- ALWAYS check if any recommendation might contain these
- ALWAYS warn if something could potentially contain these
- Flag any health advice that might interact with allergies

This is a SAFETY-CRITICAL requirement. Allergic reactions can be life-threatening.
` : "";
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
${bloodTypeInfo ? `Beneficial foods: ${bloodTypeInfo.beneficial.join(", ")}
Foods to limit: ${bloodTypeInfo.avoid.join(", ")}` : "No specific blood type recommendations available."}

### Body Type (${context.bodyType || "Unknown"})
${bodyTypeInfo ? `Recommended exercises: ${bodyTypeInfo.exercises.join(", ")}
Tips: ${bodyTypeInfo.tips.join("; ")}` : "No specific body type recommendations available."}

### Sun Exposure (Skin: ${context.skinTone || "Unknown"})
${skinToneInfo ? `Max unprotected sun exposure: ${skinToneInfo.maxMinutes} minutes
Minimum recommended SPF: ${skinToneInfo.spfMinimum}` : "No specific UV recommendations available."}

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
function createHealthAgent(userContext) {
  return new Agent({
    id: "health-agent",
    name: "Health Advisor",
    instructions: generateHealthAgentPrompt(userContext),
    model: "openai/gpt-4o",
    tools: {
      outputHealthAnalysis: outputHealthAnalysisTool,
      createHealthInsight: createHealthInsightTool,
      getHealthInsights: getHealthInsightsTool,
      getEnvironmentData: getEnvironmentDataTool,
      createHealthNote: createHealthNoteTool
    }
  });
}
const healthAgent = new Agent({
  id: "health-agent",
  name: "Health Advisor",
  instructions: `You are a health advisor for Saydo. Provide personalized health recommendations.
Always check for user allergies before making food recommendations.
Use the available tools to fetch environment data and save health insights.`,
  model: "openai/gpt-4o",
  tools: {
    outputHealthAnalysis: outputHealthAnalysisTool,
    createHealthInsight: createHealthInsightTool,
    getHealthInsights: getHealthInsightsTool,
    getEnvironmentData: getEnvironmentDataTool,
    createHealthNote: createHealthNoteTool
  }
});

"use strict";
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }
  return new OpenAI({ apiKey });
}
const transcribeAudioTool = createTool({
  id: "transcribe-audio",
  description: "Transcribes audio using OpenAI Whisper. Accepts audio file URL or base64 data. Returns transcribed text with detected language.",
  inputSchema: z.object({
    audioUrl: z.string().optional().describe("URL of the audio file to transcribe"),
    audioBase64: z.string().optional().describe("Base64-encoded audio data"),
    mimeType: z.enum([
      "audio/webm",
      "audio/mpeg",
      "audio/mp3",
      "audio/mp4",
      "audio/wav",
      "audio/ogg",
      "audio/flac"
    ]).default("audio/webm").describe("MIME type of the audio file"),
    language: z.string().optional().describe(
      "Expected language code (ISO 639-1) to improve accuracy. If not provided, Whisper will auto-detect."
    ),
    prompt: z.string().optional().describe(
      "Optional prompt to guide the transcription (e.g., specific terminology)"
    )
  }),
  outputSchema: z.object({
    success: z.boolean(),
    text: z.string().optional(),
    language: z.string().optional(),
    duration: z.number().optional(),
    error: z.string().optional()
  }),
  execute: async ({ audioUrl, audioBase64, mimeType, language, prompt }) => {
    try {
      const openai = getOpenAIClient();
      let audioBuffer;
      let filename;
      if (audioUrl) {
        const response = await fetch(audioUrl);
        if (!response.ok) {
          return {
            success: false,
            error: `Failed to fetch audio: ${response.statusText}`
          };
        }
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = Buffer.from(arrayBuffer);
        filename = `audio.${getExtensionFromMimeType(mimeType)}`;
      } else if (audioBase64) {
        audioBuffer = Buffer.from(audioBase64, "base64");
        filename = `audio.${getExtensionFromMimeType(mimeType)}`;
      } else {
        return {
          success: false,
          error: "Either audioUrl or audioBase64 must be provided"
        };
      }
      const audioFile = new File([audioBuffer], filename, { type: mimeType });
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: language || void 0,
        prompt: prompt || void 0,
        response_format: "verbose_json"
      });
      return {
        success: true,
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to transcribe audio"
      };
    }
  }
});
function getExtensionFromMimeType(mimeType) {
  const mimeToExt = {
    "audio/webm": "webm",
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/mp4": "m4a",
    "audio/wav": "wav",
    "audio/ogg": "ogg",
    "audio/flac": "flac"
  };
  return mimeToExt[mimeType] || "webm";
}
const transcribeFromStorageTool = createTool({
  id: "transcribe-from-storage",
  description: "Transcribes audio from Supabase Storage. Generates a signed URL and transcribes the audio.",
  inputSchema: z.object({
    bucketName: z.string().default("voice-recordings").describe("Supabase Storage bucket name"),
    filePath: z.string().describe("Path to the file in the bucket"),
    language: z.string().optional().describe("Expected language code (ISO 639-1)")
  }),
  outputSchema: z.object({
    success: z.boolean(),
    text: z.string().optional(),
    language: z.string().optional(),
    duration: z.number().optional(),
    error: z.string().optional()
  }),
  execute: async ({ bucketName, filePath, language }) => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !supabaseServiceKey) {
        return {
          success: false,
          error: "Missing Supabase environment variables"
        };
      }
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from(bucketName).createSignedUrl(filePath, 300);
      if (signedUrlError || !signedUrlData?.signedUrl) {
        return {
          success: false,
          error: signedUrlError?.message || "Failed to generate signed URL"
        };
      }
      const extension = filePath.split(".").pop()?.toLowerCase() || "webm";
      const extToMime = {
        webm: "audio/webm",
        mp3: "audio/mpeg",
        m4a: "audio/mp4",
        wav: "audio/wav",
        ogg: "audio/ogg",
        flac: "audio/flac"
      };
      const mimeType = extToMime[extension] || "audio/webm";
      const result = await transcribeAudioTool.execute?.({
        audioUrl: signedUrlData.signedUrl,
        mimeType,
        language
      });
      return result || { success: false, error: "Transcription failed" };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to transcribe from storage"
      };
    }
  }
});
const transcriptionTools = {
  transcribeAudio: transcribeAudioTool,
  transcribeFromStorage: transcribeFromStorageTool
};

"use strict";
const VoiceProcessingInputSchema = z.object({
  userId: z.string().describe("User ID"),
  audioUrl: z.string().optional().describe("URL of the audio file"),
  audioBase64: z.string().optional().describe("Base64-encoded audio"),
  mimeType: z.enum(["audio/webm", "audio/mpeg", "audio/mp3", "audio/mp4", "audio/wav", "audio/ogg", "audio/flac"]).default("audio/webm"),
  sourceRecordingId: z.string().optional().describe("ID of the source recording")
});
const VoiceProcessingOutputSchema = z.object({
  success: z.boolean(),
  transcription: z.string().optional(),
  language: z.string().optional(),
  extractedItems: z.object({
    tasks: z.array(z.object({
      id: z.string().optional(),
      title: z.string(),
      priority: z.string(),
      dueDate: z.string().optional(),
      category: z.string().optional()
    })),
    reminders: z.array(z.object({
      title: z.string(),
      reminderTime: z.string().optional()
    })),
    healthNotes: z.array(z.object({
      content: z.string(),
      category: z.string()
    })),
    generalNotes: z.array(z.object({
      content: z.string()
    })),
    summary: z.string()
  }).optional(),
  error: z.string().optional()
});
const transcribeStep = createStep({
  id: "transcribe-audio",
  description: "Transcribe audio using OpenAI Whisper",
  inputSchema: VoiceProcessingInputSchema,
  outputSchema: z.object({
    success: z.boolean(),
    text: z.string().optional(),
    language: z.string().optional(),
    duration: z.number().optional(),
    error: z.string().optional(),
    userId: z.string(),
    sourceRecordingId: z.string().optional()
  }),
  execute: async ({ inputData }) => {
    const result = await transcribeAudioTool.execute?.({
      audioUrl: inputData.audioUrl,
      audioBase64: inputData.audioBase64,
      mimeType: inputData.mimeType
    });
    return {
      success: result?.success ?? false,
      text: result?.text,
      language: result?.language,
      duration: result?.duration,
      error: result?.error,
      userId: inputData.userId,
      sourceRecordingId: inputData.sourceRecordingId
    };
  }
});
const extractItemsStep = createStep({
  id: "extract-items",
  description: "Extract tasks, reminders, and notes from transcription",
  inputSchema: z.object({
    success: z.boolean(),
    text: z.string().optional(),
    language: z.string().optional(),
    duration: z.number().optional(),
    error: z.string().optional(),
    userId: z.string(),
    sourceRecordingId: z.string().optional()
  }),
  outputSchema: z.object({
    success: z.boolean(),
    transcription: z.string().optional(),
    language: z.string().optional(),
    extractedItems: z.any().optional(),
    userId: z.string(),
    sourceRecordingId: z.string().optional(),
    error: z.string().optional()
  }),
  execute: async ({ inputData }) => {
    if (!inputData.success || !inputData.text) {
      return {
        success: false,
        error: inputData.error || "Transcription failed",
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId
      };
    }
    try {
      const userContext = await getUserContext(inputData.userId);
      const agent = createVoiceAgent(userContext);
      const response = await agent.generate(
        `Please analyze this voice transcription and extract all actionable items:

"${inputData.text}"

Use the output-extracted-items tool to return the structured extraction.`
      );
      const toolCalls = response.toolCalls || [];
      const extractionCall = toolCalls.find(
        (call) => call.toolName === "output-extracted-items"
      );
      const extractedItems = extractionCall?.args ? extractionCall.args : {
        tasks: [],
        reminders: [],
        healthNotes: [],
        generalNotes: [],
        summary: response.text || "Unable to extract items"
      };
      return {
        success: true,
        transcription: inputData.text,
        language: inputData.language,
        extractedItems,
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId
      };
    } catch (err) {
      return {
        success: false,
        transcription: inputData.text,
        error: err instanceof Error ? err.message : "Failed to extract items",
        userId: inputData.userId,
        sourceRecordingId: inputData.sourceRecordingId
      };
    }
  }
});
const saveItemsStep = createStep({
  id: "save-items",
  description: "Save extracted tasks and health notes to database",
  inputSchema: z.object({
    success: z.boolean(),
    transcription: z.string().optional(),
    language: z.string().optional(),
    extractedItems: z.any().optional(),
    userId: z.string(),
    sourceRecordingId: z.string().optional(),
    error: z.string().optional()
  }),
  outputSchema: VoiceProcessingOutputSchema,
  execute: async ({ inputData }) => {
    if (!inputData.success || !inputData.extractedItems) {
      return {
        success: false,
        error: inputData.error || "No items to save"
      };
    }
    const items = inputData.extractedItems;
    const savedTasks = [];
    try {
      for (const task of items.tasks) {
        const result = await createTaskTool.execute?.({
          userId: inputData.userId,
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate,
          dueTime: task.dueTime,
          category: task.category,
          tags: [],
          sourceRecordingId: inputData.sourceRecordingId
        });
        if (result?.success && result.taskId) {
          savedTasks.push({
            id: result.taskId,
            title: task.title,
            priority: task.priority,
            dueDate: task.dueDate,
            category: task.category
          });
        }
      }
      const savedHealthNotes = [];
      for (const note of items.healthNotes) {
        const result = await createHealthNoteTool.execute?.({
          userId: inputData.userId,
          content: note.content,
          source: "voice",
          sourceRecordingId: inputData.sourceRecordingId,
          tags: note.tags
        });
        if (result?.success) {
          savedHealthNotes.push({
            content: note.content,
            category: note.category
          });
        }
      }
      return {
        success: true,
        transcription: inputData.transcription,
        language: inputData.language,
        extractedItems: {
          tasks: savedTasks,
          reminders: items.reminders.map((r) => ({
            title: r.title,
            reminderTime: r.reminderTime
          })),
          healthNotes: savedHealthNotes,
          generalNotes: items.generalNotes.map((n) => ({
            content: n.content
          })),
          summary: items.summary
        }
      };
    } catch (err) {
      return {
        success: false,
        transcription: inputData.transcription,
        error: err instanceof Error ? err.message : "Failed to save items"
      };
    }
  }
});
const voiceProcessingWorkflow = createWorkflow({
  id: "voice-processing-workflow",
  description: "Transcribes audio and extracts actionable items",
  inputSchema: VoiceProcessingInputSchema,
  outputSchema: VoiceProcessingOutputSchema
}).then(transcribeStep).then(extractItemsStep).then(saveItemsStep).commit();
async function processVoiceRecording(params) {
  const run = await voiceProcessingWorkflow.createRun();
  const result = await run.start({
    inputData: {
      userId: params.userId,
      audioUrl: params.audioUrl,
      audioBase64: params.audioBase64,
      mimeType: params.mimeType || "audio/webm",
      sourceRecordingId: params.sourceRecordingId
    }
  });
  return result;
}

"use strict";
const HealthAnalysisInputSchema = z.object({
  userId: z.string().describe("User ID"),
  query: z.string().optional().describe("Optional health question or topic"),
  includeEnvironment: z.boolean().default(true).describe("Whether to include environment data")
});
const HealthAnalysisOutputSchema = z.object({
  success: z.boolean(),
  analysis: z.object({
    recommendations: z.array(z.object({
      title: z.string(),
      content: z.string(),
      category: z.string(),
      priority: z.string()
    })),
    warnings: z.array(z.object({
      content: z.string(),
      severity: z.string()
    })),
    summary: z.string()
  }).optional(),
  environment: z.object({
    city: z.string().nullable(),
    uvIndex: z.number().nullable(),
    temperature: z.number().nullable(),
    airQualityCategory: z.string().nullable()
  }).optional(),
  error: z.string().optional()
});
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
      airQualityCategory: z.string().nullable()
    }).optional(),
    error: z.string().optional()
  }),
  execute: async ({ inputData }) => {
    try {
      const userContext = await getUserContext(inputData.userId);
      let environment = void 0;
      if (inputData.includeEnvironment) {
        const envResult = await getEnvironmentDataTool.execute?.({
          userId: inputData.userId
        });
        if (envResult?.hasData && envResult.data) {
          environment = {
            hasData: true,
            city: envResult.data.city,
            uvIndex: envResult.data.uvIndex,
            weatherCondition: envResult.data.weatherCondition,
            temperature: envResult.data.temperature,
            airQualityIndex: envResult.data.airQualityIndex,
            airQualityCategory: envResult.data.airQualityCategory
          };
        }
      }
      return {
        userId: inputData.userId,
        query: inputData.query,
        userContext,
        environment
      };
    } catch (err) {
      return {
        userId: inputData.userId,
        query: inputData.query,
        userContext: null,
        error: err instanceof Error ? err.message : "Failed to fetch context"
      };
    }
  }
});
const analyzeHealthStep = createStep({
  id: "analyze-health",
  description: "Generate personalized health analysis",
  inputSchema: z.object({
    userId: z.string(),
    query: z.string().optional(),
    userContext: z.any(),
    environment: z.any().optional(),
    error: z.string().optional()
  }),
  outputSchema: z.object({
    userId: z.string(),
    analysis: z.any().optional(),
    environment: z.any().optional(),
    error: z.string().optional()
  }),
  execute: async ({ inputData }) => {
    if (inputData.error || !inputData.userContext) {
      return {
        userId: inputData.userId,
        error: inputData.error || "Missing user context"
      };
    }
    try {
      const agent = createHealthAgent(inputData.userContext);
      let prompt = "";
      if (inputData.query) {
        prompt = `Health question: "${inputData.query}"`;
      } else {
        prompt = "Provide a personalized health check-in with recommendations for today.";
      }
      if (inputData.environment?.hasData) {
        prompt += `

Current environment:
- Location: ${inputData.environment.city || "Unknown"}
- UV Index: ${inputData.environment.uvIndex ?? "Unknown"}
- Temperature: ${inputData.environment.temperature ?? "Unknown"}\xB0C
- Air Quality: ${inputData.environment.airQualityCategory || "Unknown"}

Please consider these conditions in your recommendations.`;
      }
      prompt += "\n\nUse the output-health-analysis tool to provide structured recommendations.";
      const response = await agent.generate(prompt);
      const toolCalls = response.toolCalls || [];
      const analysisCall = toolCalls.find(
        (call) => call.toolName === "output-health-analysis"
      );
      const analysis = analysisCall?.args ? analysisCall.args : {
        recommendations: [],
        warnings: [],
        summary: response.text || "Unable to generate analysis"
      };
      return {
        userId: inputData.userId,
        analysis,
        environment: inputData.environment
      };
    } catch (err) {
      return {
        userId: inputData.userId,
        error: err instanceof Error ? err.message : "Failed to analyze health"
      };
    }
  }
});
const saveInsightsStep = createStep({
  id: "save-insights",
  description: "Save health insights to database",
  inputSchema: z.object({
    userId: z.string(),
    analysis: z.any().optional(),
    environment: z.any().optional(),
    error: z.string().optional()
  }),
  outputSchema: HealthAnalysisOutputSchema,
  execute: async ({ inputData }) => {
    if (inputData.error || !inputData.analysis) {
      return {
        success: false,
        error: inputData.error || "No analysis to save"
      };
    }
    try {
      const analysis = inputData.analysis;
      for (const rec of analysis.recommendations.filter((r) => r.priority === "high")) {
        await createHealthInsightTool.execute?.({
          userId: inputData.userId,
          type: "recommendation",
          title: rec.title,
          content: rec.content,
          category: rec.category,
          priority: "high"
        });
      }
      for (const warning of analysis.warnings) {
        await createHealthInsightTool.execute?.({
          userId: inputData.userId,
          type: "warning",
          title: "Health Warning",
          content: warning.content,
          category: "general",
          priority: warning.severity === "critical" ? "high" : "medium",
          relatedToAllergy: warning.relatedToAllergy
        });
      }
      return {
        success: true,
        analysis: {
          recommendations: analysis.recommendations.map((r) => ({
            title: r.title,
            content: r.content,
            category: r.category,
            priority: r.priority
          })),
          warnings: analysis.warnings.map((w) => ({
            content: w.content,
            severity: w.severity
          })),
          summary: analysis.summary
        },
        environment: inputData.environment?.hasData ? {
          city: inputData.environment.city,
          uvIndex: inputData.environment.uvIndex,
          temperature: inputData.environment.temperature,
          airQualityCategory: inputData.environment.airQualityCategory
        } : void 0
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to save insights"
      };
    }
  }
});
const healthAnalysisWorkflow = createWorkflow({
  id: "health-analysis-workflow",
  description: "Analyzes user health and provides personalized recommendations",
  inputSchema: HealthAnalysisInputSchema,
  outputSchema: HealthAnalysisOutputSchema
}).then(fetchContextStep).then(analyzeHealthStep).then(saveInsightsStep).commit();
async function analyzeHealth(params) {
  const run = await healthAnalysisWorkflow.createRun();
  const result = await run.start({
    inputData: {
      userId: params.userId,
      query: params.query,
      includeEnvironment: params.includeEnvironment ?? true
    }
  });
  return result;
}

"use strict";
const DailySummaryInputSchema = z.object({
  userId: z.string().describe("User ID"),
  date: z.string().optional().describe("Date for summary (ISO format), defaults to today")
});
const DailySummaryOutputSchema = z.object({
  success: z.boolean(),
  summary: z.object({
    greeting: z.string(),
    tasksCompleted: z.number(),
    tasksPending: z.number(),
    topPendingTasks: z.array(z.object({
      title: z.string(),
      priority: z.string(),
      dueDate: z.string().optional()
    })),
    healthHighlights: z.array(z.string()),
    tomorrowFocus: z.array(z.string()),
    motivationalMessage: z.string(),
    language: z.string()
  }).optional(),
  error: z.string().optional()
});
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
    error: z.string().optional()
  }),
  execute: async ({ inputData }) => {
    const today = inputData.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    try {
      const userContext = await getUserContext(inputData.userId);
      const completedResult = await getTasksTool.execute?.({
        userId: inputData.userId,
        status: "completed",
        includeCompleted: true,
        limit: 50
      });
      const pendingResult = await getTasksTool.execute?.({
        userId: inputData.userId,
        includeCompleted: false,
        limit: 20
      });
      const healthResult = await getHealthInsightsTool.execute?.({
        userId: inputData.userId,
        limit: 5,
        includeExpired: false
      });
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
        healthInsights: healthResult?.insights || []
      };
    } catch (err) {
      return {
        userId: inputData.userId,
        date: today,
        userContext: null,
        completedTasks: [],
        pendingTasks: [],
        healthInsights: [],
        error: err instanceof Error ? err.message : "Failed to gather data"
      };
    }
  }
});
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
    error: z.string().optional()
  }),
  outputSchema: DailySummaryOutputSchema,
  execute: async ({ inputData }) => {
    if (inputData.error || !inputData.userContext) {
      return {
        success: false,
        error: inputData.error || "Missing user context"
      };
    }
    try {
      const userContext = inputData.userContext;
      const agent = createSaydoAgent(userContext);
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
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const sortedPending = [...inputData.pendingTasks].sort(
        (a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
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
            dueDate: t.dueDate
          })),
          healthHighlights: inputData.healthInsights.slice(0, 2).map((i) => i.title),
          tomorrowFocus: sortedPending.slice(0, 3).map((t) => t.title),
          motivationalMessage: response.text || "Keep up the great work!",
          language: userContext.language
        }
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to generate summary"
      };
    }
  }
});
const dailySummaryWorkflow = createWorkflow({
  id: "daily-summary-workflow",
  description: "Generates a personalized end-of-day summary",
  inputSchema: DailySummaryInputSchema,
  outputSchema: DailySummaryOutputSchema
}).then(gatherDataStep).then(generateSummaryStep).commit();
async function generateDailySummary(params) {
  const run = await dailySummaryWorkflow.createRun();
  const result = await run.start({
    inputData: {
      userId: params.userId,
      date: params.date
    }
  });
  return result;
}

"use strict";
const saydoWorkingMemoryTemplate = `
<user_context>
  <name>{{preferredName}}</name>
  <language>{{language}}</language>
  <last_topic>{{lastTopic}}</last_topic>
  <mood>{{mood}}</mood>
  <pending_actions>{{pendingActions}}</pending_actions>
</user_context>
`;
const WorkingMemorySchema = z.object({
  preferredName: z.string().describe("User's preferred name"),
  language: z.string().describe("User's preferred language code"),
  lastTopic: z.string().optional().describe("The last topic discussed"),
  mood: z.enum(["positive", "neutral", "stressed", "tired", "motivated"]).optional().describe("Detected user mood"),
  pendingActions: z.array(z.string()).optional().describe("Actions the user mentioned but haven't been created as tasks"),
  importantDetails: z.array(z.string()).optional().describe("Important details mentioned in conversation")
});
const saydoMemoryConfig = {
  lastMessages: 20,
  // Keep last 20 messages in context
  workingMemory: {
    enabled: true,
    template: saydoWorkingMemoryTemplate
  },
  semanticRecall: false
  // Disable semantic recall (requires vector DB)
};
function createSaydoMemory() {
  return new Memory({
    options: {
      lastMessages: 20,
      semanticRecall: false
    }
  });
}
const saydoMemory = createSaydoMemory();
function getInitialWorkingMemory(userContext) {
  return `
<user_context>
  <name>${userContext.preferredName}</name>
  <language>${userContext.language}</language>
  <last_topic></last_topic>
  <mood>neutral</mood>
  <pending_actions></pending_actions>
</user_context>
`.trim();
}
async function createConversationThread(memory, userId, userContext) {
  const thread = await memory.createThread({
    resourceId: userId,
    metadata: {
      userId,
      language: userContext.language,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastActiveAt: (/* @__PURE__ */ new Date()).toISOString(),
      messageCount: 0
    }
  });
  if (thread.id) {
    await memory.updateWorkingMemory({
      threadId: thread.id,
      resourceId: userId,
      workingMemory: getInitialWorkingMemory(userContext)
    });
  }
  return thread.id;
}

"use strict";
const mastra = new Mastra({
  agents: {
    saydoAgent,
    voiceAgent,
    taskAgent,
    healthAgent
  },
  tools: {
    // User profile
    getUserProfile: getUserProfileTool,
    // Task management
    createTask: createTaskTool,
    getTasks: getTasksTool,
    updateTask: updateTaskTool,
    deleteTask: deleteTaskTool,
    // Health
    createHealthInsight: createHealthInsightTool,
    getHealthInsights: getHealthInsightsTool,
    getEnvironmentData: getEnvironmentDataTool,
    createHealthNote: createHealthNoteTool,
    // Transcription
    transcribeAudio: transcribeAudioTool,
    transcribeFromStorage: transcribeFromStorageTool
  },
  workflows: {
    voiceProcessingWorkflow,
    healthAnalysisWorkflow,
    dailySummaryWorkflow
  },
  memory: {
    saydo: saydoMemory
  }
});

export { analyzeHealth, createConversationThread, createHealthAgent, createHealthInsightTool, createHealthNoteTool, createSaydoAgent, createSaydoMemory, createTaskAgent, createTaskTool, createVoiceAgent, dailySummaryWorkflow, deleteTaskTool, generateDailySummary, getEnvironmentDataTool, getHealthInsightsTool, getInitialWorkingMemory, getTasksTool, getUserContext, getUserProfileTool, healthAgent, healthAnalysisWorkflow, healthTools, mastra, processVoiceRecording, saydoAgent, saydoMemory, saydoMemoryConfig, taskAgent, taskTools, transcribeAudioTool, transcribeFromStorageTool, transcriptionTools, updateTaskTool, voiceAgent, voiceProcessingWorkflow };
