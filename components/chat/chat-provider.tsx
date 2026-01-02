"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react"
import { createClient } from "@/lib/supabase"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface ChatConversation {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

interface ChatContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  messages: ChatMessage[]
  isLoading: boolean
  currentConversationId: string | null
  conversations: ChatConversation[]
  sendMessage: (content: string) => Promise<void>
  loadConversation: (conversationId: string) => Promise<void>
  createNewConversation: () => Promise<void>
  loadConversations: () => Promise<void>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

const STORAGE_KEY = "chat-modal-open"
const CONVERSATION_STORAGE_KEY = "chat-current-conversation-id"

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpenState] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  
  // Create Supabase client once
  const supabase = useMemo(() => createClient(), [])

  // Persist open state to localStorage
  const setIsOpen = useCallback((open: boolean) => {
    setIsOpenState(open)
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, open ? "true" : "false")
    }
  }, [])

  // Load conversation messages
  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("[ChatProvider] Supabase error loading conversation:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      setMessages((data as ChatMessage[]) || [])
      setCurrentConversationId(conversationId)
      if (typeof window !== "undefined") {
        localStorage.setItem(CONVERSATION_STORAGE_KEY, conversationId)
      }
    } catch (error) {
      console.error("[ChatProvider] Error loading conversation:", error)
      if (error instanceof Error) {
        console.error("[ChatProvider] Error message:", error.message)
        console.error("[ChatProvider] Error stack:", error.stack)
      }
      setMessages([])
    }
  }, [supabase])

  // Load all conversations
  const loadConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("[ChatProvider] Supabase error loading conversations:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      setConversations((data as ChatConversation[]) || [])
    } catch (error) {
      console.error("[ChatProvider] Error loading conversations:", error)
      if (error instanceof Error) {
        console.error("[ChatProvider] Error message:", error.message)
        console.error("[ChatProvider] Error stack:", error.stack)
      } else if (error && typeof error === 'object') {
        console.error("[ChatProvider] Error details:", JSON.stringify(error, null, 2))
      }
    }
  }, [supabase])

  // Create new conversation
  const createNewConversation = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({
          user_id: user.id,
          title: null,
        })
        .select()
        .single()

      if (error) {
        console.error("[ChatProvider] Supabase error creating conversation:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      if (data) {
        setCurrentConversationId(data.id)
        setMessages([])
        if (typeof window !== "undefined") {
          localStorage.setItem(CONVERSATION_STORAGE_KEY, data.id)
        }
        await loadConversations()
      }
    } catch (error) {
      console.error("[ChatProvider] Error creating conversation:", error)
      if (error instanceof Error) {
        console.error("[ChatProvider] Error message:", error.message)
        console.error("[ChatProvider] Error stack:", error.stack)
      } else if (error && typeof error === 'object') {
        console.error("[ChatProvider] Error details:", JSON.stringify(error, null, 2))
      }
    }
  }, [supabase, loadConversations])

  // Load or create default conversation
  const loadOrCreateDefaultConversation = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Try to get the most recent conversation
      const { data: recentConv, error } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single()

      if (recentConv && !error) {
        setCurrentConversationId(recentConv.id)
        if (typeof window !== "undefined") {
          localStorage.setItem(CONVERSATION_STORAGE_KEY, recentConv.id)
        }
        await loadConversation(recentConv.id)
      } else {
        // Create new conversation
        await createNewConversation()
      }
    } catch (error) {
      console.error("[ChatProvider] Error loading default conversation:", error)
    }
  }, [supabase, loadConversation, createNewConversation])

  // Send message
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return

    // Ensure we have a conversation
    let conversationId = currentConversationId
    if (!conversationId) {
      await createNewConversation()
      // Wait a bit for the conversation to be created
      await new Promise(resolve => setTimeout(resolve, 100))
      conversationId = currentConversationId
      if (!conversationId) {
        console.error("[ChatProvider] Failed to create conversation")
        return
      }
    }

    setIsLoading(true)

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: content.trim(),
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      // Send to API
      const response = await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          message: content.trim(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send message")
      }

      const data = await response.json()

      // Replace temp message with real one and add assistant response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== userMessage.id)
        return [
          ...filtered,
          data.userMessage,
          data.assistantMessage,
        ]
      })

      // Refresh conversations list
      await loadConversations()
    } catch (error) {
      console.error("[ChatProvider] Error sending message:", error)
      // Remove the temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [currentConversationId, isLoading, createNewConversation, loadConversations])

  // Load persisted state from localStorage
  // This useEffect must come after all the callback definitions
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedOpenState = localStorage.getItem(STORAGE_KEY)
      if (savedOpenState === "true") {
        setIsOpenState(true)
      }
      
      // Only load conversations if user is authenticated
      const initializeChat = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const savedConversationId = localStorage.getItem(CONVERSATION_STORAGE_KEY)
          if (savedConversationId) {
            setCurrentConversationId(savedConversationId)
            await loadConversation(savedConversationId)
          } else {
            // Load or create default conversation
            await loadOrCreateDefaultConversation()
          }
          
          await loadConversations()
        }
      }
      
      initializeChat()
    }
  }, [loadConversation, loadOrCreateDefaultConversation, loadConversations, supabase])

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        messages,
        isLoading,
        currentConversationId,
        conversations,
        sendMessage,
        loadConversation,
        createNewConversation,
        loadConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}

