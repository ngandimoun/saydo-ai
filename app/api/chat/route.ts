import { createClient } from "@/lib/supabase-server";
import { getUserContext, createSaydoAgent } from "@/src/mastra/index";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Chat API with streaming support.
 * Fetches user context and responds in their preferred language.
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
    const { message, threadId } = body as {
      message: string;
      threadId?: string;
    };

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch user context (includes language, profession, health profile)
    const userContext = await getUserContext(user.id);

    // Create agent with user context for personalized responses
    const agent = createSaydoAgent(userContext);

    // Generate streaming response
    const stream = await agent.stream(message, {
      threadId,
      resourceId: user.id,
    });

    // Create a ReadableStream that transforms the agent's stream
    const textEncoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream.textStream) {
            // Send each chunk as SSE format
            const data = JSON.stringify({ type: "text", content: chunk });
            controller.enqueue(textEncoder.encode(`data: ${data}\n\n`));
          }

          // Send completion signal
          const finalData = JSON.stringify({ type: "done" });
          controller.enqueue(textEncoder.encode(`data: ${finalData}\n\n`));
          controller.close();
        } catch (error) {
          const errorData = JSON.stringify({
            type: "error",
            error: error instanceof Error ? error.message : "Stream error",
          });
          controller.enqueue(textEncoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
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

/**
 * Non-streaming chat endpoint for simple responses.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const message = searchParams.get("message");

  if (!message) {
    return new Response(JSON.stringify({ error: "Message is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = await createClient();

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

    // Fetch user context
    const userContext = await getUserContext(user.id);

    // Create agent with user context
    const agent = createSaydoAgent(userContext);

    // Generate non-streaming response
    const response = await agent.generate(message, {
      resourceId: user.id,
    });

    return new Response(
      JSON.stringify({
        text: response.text,
        language: userContext.language,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Chat API error:", error);
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

