import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { type UserContext } from "../tools/user-profile-tool";
import { createTaskTool, getTasksTool } from "../tools/task-tool";

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
  tr: "Turkish",
};

/**
 * Schema for task extraction output
 */
export const TaskExtractionSchema = z.object({
  tasks: z.array(
    z.object({
      title: z.string().describe("Clear, actionable task title"),
      description: z.string().optional().describe("Additional details"),
      priority: z.enum(["urgent", "high", "medium", "low"]).describe("Task priority"),
      dueDate: z.string().optional().describe("Due date in YYYY-MM-DD format"),
      dueTime: z.string().optional().describe("Due time in HH:MM format"),
      category: z.string().describe("Category based on profession context"),
      tags: z.array(z.string()).describe("Relevant tags"),
      reasoning: z.string().describe("Why this priority/category was chosen"),
    })
  ),
  suggestions: z.array(z.string()).describe("Suggestions for the user"),
  totalTasks: z.number(),
});

export type TaskExtraction = z.infer<typeof TaskExtractionSchema>;

/**
 * Tool for outputting extracted tasks in structured format
 */
export const outputTaskExtractionTool = createTool({
  id: "output-task-extraction",
  description: "Outputs the extracted tasks in a structured format with smart categorization.",
  inputSchema: TaskExtractionSchema,
  outputSchema: z.object({
    success: z.boolean(),
    taskCount: z.number(),
  }),
  execute: async (extraction) => {
    return { success: true, taskCount: extraction.tasks.length };
  },
});

/**
 * Tool for smart date parsing
 */
export const parseDateTool = createTool({
  id: "parse-date",
  description: "Parses natural language date expressions into ISO format dates.",
  inputSchema: z.object({
    expression: z.string().describe("Natural language date like 'tomorrow', 'next Monday', 'in 3 days'"),
    referenceDate: z.string().optional().describe("Reference date in ISO format, defaults to today"),
  }),
  outputSchema: z.object({
    date: z.string().nullable(),
    time: z.string().nullable(),
    confidence: z.enum(["high", "medium", "low"]),
  }),
  execute: async ({ expression, referenceDate }) => {
    const now = referenceDate ? new Date(referenceDate) : new Date();
    const lowerExpr = expression.toLowerCase().trim();
    
    // Simple date parsing logic
    let resultDate: Date | null = null;
    let resultTime: string | null = null;
    let confidence: "high" | "medium" | "low" = "low";

    // Today
    if (lowerExpr === "today" || lowerExpr === "tonight") {
      resultDate = now;
      confidence = "high";
    }
    // Tomorrow
    else if (lowerExpr === "tomorrow" || lowerExpr.includes("tomorrow")) {
      resultDate = new Date(now);
      resultDate.setDate(resultDate.getDate() + 1);
      confidence = "high";
    }
    // Day after tomorrow
    else if (lowerExpr.includes("day after tomorrow")) {
      resultDate = new Date(now);
      resultDate.setDate(resultDate.getDate() + 2);
      confidence = "high";
    }
    // In X days
    else if (lowerExpr.match(/in (\d+) days?/)) {
      const match = lowerExpr.match(/in (\d+) days?/);
      if (match) {
        resultDate = new Date(now);
        resultDate.setDate(resultDate.getDate() + parseInt(match[1]));
        confidence = "high";
      }
    }
    // Next week
    else if (lowerExpr === "next week") {
      resultDate = new Date(now);
      resultDate.setDate(resultDate.getDate() + 7);
      confidence = "high";
    }
    // This week (end of week - Friday)
    else if (lowerExpr === "this week" || lowerExpr === "end of week") {
      resultDate = new Date(now);
      const daysToFriday = 5 - now.getDay();
      resultDate.setDate(resultDate.getDate() + (daysToFriday >= 0 ? daysToFriday : 7 + daysToFriday));
      confidence = "medium";
    }
    // Days of week
    else {
      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      for (let i = 0; i < days.length; i++) {
        if (lowerExpr.includes(days[i])) {
          resultDate = new Date(now);
          const currentDay = now.getDay();
          let daysToAdd = i - currentDay;
          if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
          if (lowerExpr.includes("next")) daysToAdd += 7;
          resultDate.setDate(resultDate.getDate() + daysToAdd);
          confidence = "high";
          break;
        }
      }
    }

    // Time parsing
    const timeMatch = expression.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const meridiem = timeMatch[3]?.toLowerCase();
      
      if (meridiem === "pm" && hours < 12) hours += 12;
      if (meridiem === "am" && hours === 12) hours = 0;
      
      resultTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    }
    // Common time words
    else if (lowerExpr.includes("morning")) {
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
      confidence,
    };
  },
});

/**
 * Generates system prompt for task extraction agent
 */
export function generateTaskAgentPrompt(context: UserContext): string {
  const languageName = LANGUAGE_NAMES[context.language] || "English";
  
  // Build profession-specific category suggestions
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

### Urgent (🔴)
- Emergency/crisis keywords
- "ASAP", "right now", "immediately"
- Time-sensitive with deadline today

### High (🟠)
- Important/critical keywords
- "deadline", "must", "important"
- Due within 1-2 days

### Medium (🟡)
- Default for most tasks
- Reasonable timeframe mentioned
- No urgency indicators

### Low (🟢)
- "whenever", "no rush", "eventually"
- Nice-to-have items
- No deadline

## DATE PARSING
Use the parse-date tool for natural language dates:
- "tomorrow morning" → date + time
- "next Tuesday" → date
- "in 3 days at 2pm" → date + time
- "end of week" → Friday

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

/**
 * Get profession-specific categories
 */
function getProfessionCategories(professionId: string): Array<{ name: string; description: string }> {
  const professionCategories: Record<string, Array<{ name: string; description: string }>> = {
    doctor: [
      { name: "patient-care", description: "Patient consultations, follow-ups, records" },
      { name: "research", description: "Medical research, reading papers" },
      { name: "admin", description: "Administrative tasks, paperwork" },
    ],
    founder: [
      { name: "product", description: "Product development, features, bugs" },
      { name: "fundraising", description: "Investor meetings, pitch prep" },
      { name: "team", description: "Hiring, team management" },
      { name: "strategy", description: "Planning, roadmap, vision" },
    ],
    marketing: [
      { name: "campaigns", description: "Marketing campaigns, launches" },
      { name: "content", description: "Content creation, copywriting" },
      { name: "analytics", description: "Data analysis, reporting" },
    ],
    finance: [
      { name: "reporting", description: "Financial reports, statements" },
      { name: "analysis", description: "Financial analysis, modeling" },
      { name: "compliance", description: "Regulatory, audit" },
    ],
  };

  return professionCategories[professionId] || [
    { name: "work", description: "Professional tasks" },
    { name: "meetings", description: "Meetings and calls" },
    { name: "follow-up", description: "Follow-up items" },
  ];
}

/**
 * Creates a task extraction agent with user context
 */
export function createTaskAgent(userContext: UserContext): Agent {
  return new Agent({
    id: "task-agent",
    name: "Task Extractor",
    instructions: generateTaskAgentPrompt(userContext),
    model: "openai/gpt-5-nano-2025-08-07",
    tools: {
      outputTaskExtraction: outputTaskExtractionTool,
      parseDate: parseDateTool,
      createTask: createTaskTool,
      getTasks: getTasksTool,
    },
  });
}

/**
 * Default task agent
 */
export const taskAgent = new Agent({
  id: "task-agent",
  name: "Task Extractor",
  instructions: `You are a task extraction agent. Extract and categorize tasks from user input.
Use parse-date for date parsing and output-task-extraction for structured output.`,
  model: "openai/gpt-5-nano-2025-08-07",
  tools: {
    outputTaskExtraction: outputTaskExtractionTool,
    parseDate: parseDateTool,
    createTask: createTaskTool,
    getTasks: getTasksTool,
  },
});

