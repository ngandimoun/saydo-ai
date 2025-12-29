import { createClient } from "@/lib/supabase-server";
import { getUserContext, createTaskAgent, createTaskTool } from "@/src/mastra/index";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Task extraction API endpoint.
 * Extracts tasks from text with smart categorization based on user's profession.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await request.json();
    const { text, autoCreate } = body as {
      text: string;
      autoCreate?: boolean; // If true, automatically create the tasks
    };

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch user context for profession-aware extraction
    const userContext = await getUserContext(user.id);

    // Create task agent with user context
    const agent = createTaskAgent(userContext);

    // Extract tasks
    const response = await agent.generate(
      `Please extract and categorize tasks from this text:

"${text}"

Use the output-task-extraction tool to return structured task data with priorities, due dates, and categories.`
    );

    // Parse tool call result
    const toolCalls = response.toolCalls || [];
    const extractionCall = toolCalls.find(
      (call) => call.toolName === "output-task-extraction"
    );

    if (!extractionCall || !extractionCall.args) {
      return new Response(
        JSON.stringify({
          success: true,
          tasks: [],
          suggestions: [],
          message: "No tasks extracted from the text",
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const extraction = extractionCall.args as {
      tasks: Array<{
        title: string;
        description?: string;
        priority: string;
        dueDate?: string;
        dueTime?: string;
        category?: string;
        tags: string[];
        reasoning: string;
      }>;
      suggestions: string[];
      totalTasks: number;
    };

    // If autoCreate is true, create the tasks
    const createdTasks: Array<{
      id: string;
      title: string;
      priority: string;
      category?: string;
    }> = [];

    if (autoCreate && extraction.tasks.length > 0) {
      for (const task of extraction.tasks) {
        const result = await createTaskTool.execute?.({
          userId: user.id,
          title: task.title,
          description: task.description,
          priority: task.priority as "urgent" | "high" | "medium" | "low",
          dueDate: task.dueDate,
          dueTime: task.dueTime,
          category: task.category,
          tags: task.tags,
        });

        if (result?.success && result.taskId) {
          createdTasks.push({
            id: result.taskId,
            title: task.title,
            priority: task.priority,
            category: task.category,
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tasks: extraction.tasks,
        createdTasks: autoCreate ? createdTasks : undefined,
        suggestions: extraction.suggestions,
        totalExtracted: extraction.totalTasks,
        language: userContext.language,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Task extraction API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

