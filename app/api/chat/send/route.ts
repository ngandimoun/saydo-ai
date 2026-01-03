import { createClient } from "@/lib/supabase-server"
import { createSaydoAgent } from "@/src/mastra/agents/saydo-agent"
import { getUserContext } from "@/src/mastra/tools/user-profile-tool"
import { convertToDataUrls } from "@/lib/chat-images"
import OpenAI from "openai"
import { NextRequest } from "next/server"

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required")
  }
  return new OpenAI({ apiKey })
}

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
    const { conversationId, message, imageUrls } = body as {
      conversationId: string
      message: string
      imageUrls?: string[]
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

    // Build prompt with conversation history
    const prompt = conversationContext
      ? `Previous conversation:\n\n${conversationContext}\n\nUser: ${message.trim()}\n\nAssistant:`
      : `${message.trim()}`

    let assistantResponse: string

    // If images are present, use OpenAI Vision API directly
    if (imageUrls && imageUrls.length > 0) {
      try {
        // Convert image URLs to base64 data URLs
        const imageDataUrls = await convertToDataUrls(imageUrls)

        // Build multi-modal content
        const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
          { type: "text", text: prompt },
          ...imageDataUrls.map((dataUrl) => ({
            type: "image_url" as const,
            image_url: { url: dataUrl, detail: "high" as const },
          })),
        ]

        // Get user context summary for the prompt
        const userContextSummary = `User: ${userContext.preferredName}
Language: ${userContext.language}
${userContext.profession ? `Profession: ${userContext.profession.name}` : ""}
${userContext.allergies.length > 0 ? `Allergies: ${userContext.allergies.join(", ")}` : ""}`

        const enhancedPrompt = `${userContextSummary}\n\n${prompt}`

        // Call OpenAI directly with vision support
        const openai = getOpenAIClient()
        const visionResponse = await openai.chat.completions.create({
          model: "gpt-5-mini-2025-08-07",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: enhancedPrompt },
                ...imageDataUrls.map((dataUrl) => ({
                  type: "image_url" as const,
                  image_url: { url: dataUrl, detail: "high" as const },
                })),
              ],
            },
          ],
          max_tokens: 2000,
        })

        assistantResponse =
          visionResponse.choices[0]?.message?.content ||
          "I'm sorry, I couldn't generate a response. Please try again."
      } catch (error) {
        console.error("[chat/send] Vision API error:", error)
        // Fallback to text-only if vision fails
        const agent = createSaydoAgent(userContext)
        const response = await agent.generate(prompt)
        assistantResponse =
          response.text || "I'm sorry, I couldn't generate a response. Please try again."
      }
    } else {
      // No images, use regular agent
      const agent = createSaydoAgent(userContext)
      const response = await agent.generate(prompt)
      assistantResponse =
        response.text || "I'm sorry, I couldn't generate a response. Please try again."
    }

    // Save user message to database (with image URLs if present)
    const { data: userMessage, error: userMsgError } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content: message.trim(),
        image_urls: imageUrls && imageUrls.length > 0 ? imageUrls : null,
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
          image_urls: string[] | null
          created_at: string
        },
        assistantMessage: assistantMessage as {
          id: string
          role: "assistant"
          content: string
          image_urls: string[] | null
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

