/**
 * Content Generation Tools
 * 
 * Mastra tools for managing AI-generated content in the ai_documents table.
 * 
 * Tools:
 * - createAIDocumentTool: Save generated content with smart tagging
 * - getAIDocumentsTool: Fetch documents with filters
 * - updateAIDocumentTool: Update content/status
 * - deleteAIDocumentTool: Remove documents
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getUserIdFromContext } from "./utils";

// Create Supabase client for server-side operations
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Tool to create a new AI-generated document
 */
export const createAIDocumentTool = createTool({
  id: "create-ai-document",
  description: "Creates a new AI-generated document and saves it to the database",
  inputSchema: z.object({
    userId: z.string().describe("User ID"),
    title: z.string().describe("Document title"),
    documentType: z.string().describe("Type of document: post, email, report, summary, etc."),
    content: z.string().describe("Full content of the document"),
    previewText: z.string().optional().describe("Preview text (first 200 chars)"),
    sourceVoiceNoteIds: z.array(z.string()).optional().describe("Source voice recording IDs"),
    sourceFileIds: z.array(z.string()).optional().describe("Source file IDs"),
    language: z.string().default("en").describe("Language of the content"),
    tags: z.array(z.string()).optional().describe("Tags for categorization"),
    professionContext: z.string().optional().describe("Profession that influenced generation"),
    confidenceScore: z.number().optional().describe("AI confidence score 0-1"),
    generationType: z.enum(["explicit", "proactive", "suggestion"]).default("explicit").describe("How this was generated"),
    modelUsed: z.string().optional().describe("AI model that generated this"),
    tokensUsed: z.number().optional().describe("Tokens used for generation"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    documentId: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async (input) => {
    const supabase = getSupabaseClient();

    // Generate preview if not provided
    const preview = input.previewText || input.content.substring(0, 200);

    const { data, error } = await supabase
      .from("ai_documents")
      .insert({
        user_id: input.userId,
        title: input.title,
        document_type: input.documentType,
        content: input.content,
        preview_text: preview,
        source_voice_note_ids: input.sourceVoiceNoteIds || [],
        source_file_ids: input.sourceFileIds || [],
        language: input.language,
        tags: input.tags || [],
        profession_context: input.professionContext,
        confidence_score: input.confidenceScore,
        generation_type: input.generationType,
        model_used: input.modelUsed,
        tokens_used: input.tokensUsed,
        status: "ready",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[createAIDocumentTool] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, documentId: data.id };
  },
});

/**
 * Tool to get AI-generated documents for a user
 */
export const getAIDocumentsTool = createTool({
  id: "get-ai-documents",
  description: "Fetches AI-generated documents for a user with optional filters. NOTE: userId is automatically provided - you don't need to pass it.",
  inputSchema: z.object({
    userId: z.string().optional().describe("User ID (automatically provided - do not pass this parameter)"),
    documentType: z.string().optional().describe("Filter by document type"),
    status: z.enum(["generating", "ready", "failed", "archived"]).optional().describe("Filter by status"),
    generationType: z.enum(["explicit", "proactive", "suggestion"]).optional().describe("Filter by generation type"),
    limit: z.number().default(20).describe("Maximum number of documents to return"),
    offset: z.number().default(0).describe("Offset for pagination"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    documents: z.array(z.object({
      id: z.string(),
      title: z.string(),
      documentType: z.string(),
      content: z.string(),
      previewText: z.string().nullable(),
      status: z.string(),
      language: z.string(),
      tags: z.array(z.string()),
      generationType: z.string(),
      confidenceScore: z.number().nullable(),
      generatedAt: z.string(),
    })),
    total: z.number(),
    error: z.string().optional(),
  }),
  execute: async (input, context?) => {
    console.log("[getAIDocumentsTool] Executing", {
      inputUserId: input.userId,
      documentType: input.documentType,
      status: input.status,
      generationType: input.generationType,
      limit: input.limit,
      offset: input.offset,
      hasContext: !!context,
    });

    // Validate and get userId from context
    const actualUserId = getUserIdFromContext(input.userId, context);
    
    console.log("[getAIDocumentsTool] Using userId", {
      userId: actualUserId,
      filters: {
        documentType: input.documentType,
        status: input.status,
        generationType: input.generationType,
        limit: input.limit,
        offset: input.offset,
      },
    });

    const supabase = getSupabaseClient();

    let query = supabase
      .from("ai_documents")
      .select("*", { count: "exact" })
      .eq("user_id", actualUserId)
      .order("generated_at", { ascending: false })
      .range(input.offset, input.offset + input.limit - 1);

    if (input.documentType) {
      query = query.eq("document_type", input.documentType);
    }
    if (input.status) {
      query = query.eq("status", input.status);
    }
    if (input.generationType) {
      query = query.eq("generation_type", input.generationType);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[getAIDocumentsTool] Database error", {
        userId: actualUserId,
        error: error.message,
      });
      return { success: false, documents: [], total: 0, error: error.message };
    }

    const documents = (data || []).map(doc => ({
      id: doc.id,
      title: doc.title,
      documentType: doc.document_type,
      content: doc.content,
      previewText: doc.preview_text,
      status: doc.status,
      language: doc.language,
      tags: doc.tags || [],
      generationType: doc.generation_type,
      confidenceScore: doc.confidence_score,
      generatedAt: doc.generated_at,
    }));

    console.log("[getAIDocumentsTool] Returning documents", {
      userId: actualUserId,
      count: documents.length,
      total: count || 0,
      documentTypes: documents.map(d => d.documentType),
      statuses: documents.map(d => d.status),
    });

    return { success: true, documents, total: count || 0 };
  },
});

/**
 * Tool to update an AI-generated document
 */
export const updateAIDocumentTool = createTool({
  id: "update-ai-document",
  description: "Updates an AI-generated document",
  inputSchema: z.object({
    userId: z.string().describe("User ID (for verification)"),
    documentId: z.string().describe("Document ID to update"),
    title: z.string().optional().describe("New title"),
    content: z.string().optional().describe("New content"),
    status: z.enum(["generating", "ready", "failed", "archived"]).optional().describe("New status"),
    tags: z.array(z.string()).optional().describe("New tags"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async (input) => {
    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {};
    if (input.title) updateData.title = input.title;
    if (input.content) {
      updateData.content = input.content;
      updateData.preview_text = input.content.substring(0, 200);
    }
    if (input.status) updateData.status = input.status;
    if (input.tags) updateData.tags = input.tags;

    const { error } = await supabase
      .from("ai_documents")
      .update(updateData)
      .eq("id", input.documentId)
      .eq("user_id", input.userId);

    if (error) {
      console.error("[updateAIDocumentTool] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },
});

/**
 * Tool to delete an AI-generated document
 */
export const deleteAIDocumentTool = createTool({
  id: "delete-ai-document",
  description: "Deletes an AI-generated document",
  inputSchema: z.object({
    userId: z.string().describe("User ID (for verification)"),
    documentId: z.string().describe("Document ID to delete"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async (input) => {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("ai_documents")
      .delete()
      .eq("id", input.documentId)
      .eq("user_id", input.userId);

    if (error) {
      console.error("[deleteAIDocumentTool] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },
});

/**
 * Tool to archive an AI-generated document
 */
export const archiveAIDocumentTool = createTool({
  id: "archive-ai-document",
  description: "Archives an AI-generated document (soft delete)",
  inputSchema: z.object({
    userId: z.string().describe("User ID (for verification)"),
    documentId: z.string().describe("Document ID to archive"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    error: z.string().optional(),
  }),
  execute: async (input) => {
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from("ai_documents")
      .update({ status: "archived" })
      .eq("id", input.documentId)
      .eq("user_id", input.userId);

    if (error) {
      console.error("[archiveAIDocumentTool] Error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  },
});

/**
 * Tool to get a single AI document by ID
 */
export const getAIDocumentByIdTool = createTool({
  id: "get-ai-document-by-id",
  description: "Fetches a single AI-generated document by ID. NOTE: userId is automatically provided - you don't need to pass it.",
  inputSchema: z.object({
    userId: z.string().optional().describe("User ID (automatically provided - do not pass this parameter)"),
    documentId: z.string().describe("Document ID"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    document: z.object({
      id: z.string(),
      title: z.string(),
      documentType: z.string(),
      content: z.string(),
      previewText: z.string().nullable(),
      status: z.string(),
      language: z.string(),
      tags: z.array(z.string()),
      sourceVoiceNoteIds: z.array(z.string()),
      sourceFileIds: z.array(z.string()),
      professionContext: z.string().nullable(),
      confidenceScore: z.number().nullable(),
      generationType: z.string(),
      version: z.number(),
      generatedAt: z.string(),
      updatedAt: z.string(),
    }).optional(),
    error: z.string().optional(),
  }),
  execute: async (input, context?) => {
    // Validate and get userId from context
    const actualUserId = getUserIdFromContext(input.userId, context);
    
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("ai_documents")
      .select("*")
      .eq("id", input.documentId)
      .eq("user_id", actualUserId)
      .single();

    if (error) {
      console.error("[getAIDocumentByIdTool] Error:", error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Document not found" };
    }

    return {
      success: true,
      document: {
        id: data.id,
        title: data.title,
        documentType: data.document_type,
        content: data.content,
        previewText: data.preview_text,
        status: data.status,
        language: data.language,
        tags: data.tags || [],
        sourceVoiceNoteIds: data.source_voice_note_ids || [],
        sourceFileIds: data.source_file_ids || [],
        professionContext: data.profession_context,
        confidenceScore: data.confidence_score,
        generationType: data.generation_type,
        version: data.version,
        generatedAt: data.generated_at,
        updatedAt: data.updated_at,
      },
    };
  },
});

/**
 * Helper function to save generated content to database
 */
export async function saveGeneratedContent(
  userId: string,
  content: {
    title: string;
    contentType: string;
    content: string;
    previewText?: string;
    tags?: string[];
    language?: string;
    targetPlatform?: string;
  },
  metadata: {
    sourceVoiceNoteIds?: string[];
    sourceFileIds?: string[];
    professionContext?: string;
    confidenceScore?: number;
    generationType?: "explicit" | "proactive" | "suggestion";
    modelUsed?: string;
    tokensUsed?: number;
  } = {}
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  const result = await createAIDocumentTool.execute?.({
    userId,
    title: content.title,
    documentType: content.contentType,
    content: content.content,
    previewText: content.previewText,
    sourceVoiceNoteIds: metadata.sourceVoiceNoteIds,
    sourceFileIds: metadata.sourceFileIds,
    language: content.language || "en",
    tags: content.tags,
    professionContext: metadata.professionContext,
    confidenceScore: metadata.confidenceScore,
    generationType: metadata.generationType || "explicit",
    modelUsed: metadata.modelUsed,
    tokensUsed: metadata.tokensUsed,
  });

  return result || { success: false, error: "Tool execution failed" };
}

/**
 * Export all content generation tools
 */
export const contentGenerationTools = {
  createAIDocument: createAIDocumentTool,
  getAIDocuments: getAIDocumentsTool,
  updateAIDocument: updateAIDocumentTool,
  deleteAIDocument: deleteAIDocumentTool,
  archiveAIDocument: archiveAIDocumentTool,
  getAIDocumentById: getAIDocumentByIdTool,
};




