import { createClient } from "@/lib/supabase-server"
import { createSaydoAgent } from "@/src/mastra/agents/saydo-agent"
import { getUserContext } from "@/src/mastra/tools/user-profile-tool"
import { NextRequest } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Chat API endpoint.
 * Sends a message to the AI assistant and returns the response.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Parse request body
    const body = await request.json()
    const { conversationId, message } = body as {
      conversationId: string
      message: string
    }

    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    if (!conversationId || typeof conversationId !== "string") {
      return new Response(JSON.stringify({ error: "Conversation ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Verify conversation belongs to user
    const { data: conversation, error: convError } = await supabase
      .from("chat_conversations")
      .select("id, user_id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .single()

    if (convError || !conversation) {
      return new Response(JSON.stringify({ error: "Conversation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get user context
    const userContext = await getUserContext(user.id)

    // Get conversation history for context (last 20 messages)
    const { data: historyMessages } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20)

    // Build conversation context for the agent
    let conversationContext = ""
    if (historyMessages && historyMessages.length > 0) {
      conversationContext = historyMessages
        .map((msg) => {
          const role = msg.role === "user" ? "User" : "Assistant"
          return `${role}: ${msg.content}`
        })
        .join("\n\n")
    }

    // Create saydo agent with user context
    const agent = createSaydoAgent(userContext)

    // Build prompt with conversation history
    const prompt = conversationContext
      ? `Previous conversation:\n\n${conversationContext}\n\nUser: ${message.trim()}\n\nAssistant:`
      : `${message.trim()}`

    // Generate response
    const response = await agent.generate(prompt)

    // Extract response text
    const assistantResponse = response.text || "I'm sorry, I couldn't generate a response. Please try again."

    // Save user message to database
    const { data: userMessage, error: userMsgError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content: message.trim(),
      })
      .select()
      .single()

    if (userMsgError) {
      console.error("[chat/send] Error saving user message:", userMsgError)
      return new Response(JSON.stringify({ error: "Failed to save message" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Save assistant response to database
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: assistantResponse,
      })
      .select()
      .single()

    if (assistantMsgError) {
      console.error("[chat/send] Error saving assistant message:", assistantMsgError)
      // User message was saved, but assistant message failed
      // Still return success but log the error
    }

    // Update conversation title if it's the first message
    if (historyMessages && historyMessages.length === 0) {
      // Generate a title from the first message (truncate to 50 chars)
      const title = message.trim().substring(0, 50)
      await supabase
        .from("chat_conversations")
        .update({ title })
        .eq("id", conversationId)
    }

    return new Response(
      JSON.stringify({
        userMessage: userMessage as {
          id: string
          role: "user"
          content: string
          created_at: string
        },
        assistantMessage: assistantMessage as {
          id: string
          role: "assistant"
          content: string
          created_at: string
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("[chat/send] Error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

