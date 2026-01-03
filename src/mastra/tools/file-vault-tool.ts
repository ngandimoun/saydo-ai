/**
 * File Vault Tools for Mastra
 * 
 * Tools for accessing, matching, and extracting content from user's work files.
 * Uses appropriate AI models based on file type for optimal extraction.
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { getUserIdFromContext } from "./utils";

// pdf-parse is a CommonJS module - we'll use dynamic import

// Get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Get OpenAI client
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }
  return new OpenAI({ apiKey });
}

// Types
interface ExtractionResult {
  success: boolean;
  content?: string;
  structuredData?: any;
  metadata?: Record<string, any>;
  modelUsed?: string;
  error?: string;
}

// Helper: Get MIME type from URL
function getMimeTypeFromUrl(url: string): string {
  const ext = url.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
  };
  return mimeTypes[ext || ""] || "image/jpeg";
}

// Helper: Get cached extraction
async function getFromCache(fileId: string): Promise<ExtractionResult | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("file_content_cache")
      .select("*")
      .eq("file_id", fileId)
      .single();

    if (error || !data) return null;

    return {
      success: true,
      content: data.extracted_text || undefined,
      structuredData: data.structured_data || undefined,
      metadata: {
        extractionMethod: data.extraction_method,
        modelUsed: data.model_used,
      },
      modelUsed: data.model_used || undefined,
    };
  } catch (err) {
    console.error("[getFromCache] Error:", err);
    return null;
  }
}

// Helper: Cache extraction result
async function cacheExtraction(
  fileId: string,
  result: ExtractionResult
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    await supabase.from("file_content_cache").upsert({
      file_id: fileId,
      extracted_text: result.content || null,
      structured_data: result.structuredData || null,
      extraction_method: result.metadata?.extractionMethod || null,
      model_used: result.modelUsed || null,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[cacheExtraction] Error:", err);
  }
}

// PDF Extraction
async function extractPdfContent(fileUrl: string): Promise<ExtractionResult> {
  try {
    const openai = getOpenAIClient();

    // Download PDF
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return { success: false, error: "Failed to download PDF" };
    }
    const buffer = await response.arrayBuffer();

    // Try text extraction first with pdf-parse
    try {
      // Dynamic import - pdf-parse exports PDFParse as named export in ESM
      const { PDFParse } = await import("pdf-parse");
      const pdfParse = new PDFParse({ data: Buffer.from(buffer) });
      const textResult = await pdfParse.getText();
      
      // Extract text from result
      const pdfData = {
        text: textResult.text,
        numpages: textResult.pages.length,
      };

      if (pdfData.text && pdfData.text.trim().length > 100) {
        // Good text extraction - use as is
        // Clean up PDFParse instance
        await pdfParse.destroy();
        return {
          success: true,
          content: pdfData.text,
          modelUsed: "pdf-parse",
          metadata: { pages: pdfData.numpages },
        };
      }
      
      // Clean up if we're going to use vision instead
      await pdfParse.destroy();
    } catch (parseError) {
      console.warn("[extractPdfContent] pdf-parse failed, trying vision:", parseError);
    }

    // Complex PDF (scanned/image-based) - use GPT-4o Vision
    // Note: For production, you'd convert PDF pages to images first
    // This is a simplified version - you may need pdf-poppler or similar
    const base64 = Buffer.from(buffer).toString("base64");

    const visionResponse = await openai.chat.completions.create({
      model: "gpt-5-mini-2025-08-07",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all text and data from this PDF document. Maintain structure and formatting. If this is a scanned document, perform OCR.",
            },
            {
              type: "image_url",
              image_url: { url: `data:application/pdf;base64,${base64}` },
            },
          ],
        },
      ],
      max_completion_tokens: 4096,
    });

    return {
      success: true,
      content: visionResponse.choices[0].message.content || "",
      modelUsed: "gpt-4o-vision",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to extract PDF content",
    };
  }
}

// Image Extraction
async function extractImageContent(fileUrl: string): Promise<ExtractionResult> {
  try {
    const openai = getOpenAIClient();

    // Download and convert to base64
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return { success: false, error: "Failed to download image" };
    }
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = getMimeTypeFromUrl(fileUrl);

    const visionResponse = await openai.chat.completions.create({
      model: "gpt-5-mini-2025-08-07",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image. Extract any text (OCR), describe the content, identify key data points, charts, or tables. Return structured information in a clear format.",
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
      max_completion_tokens: 4096,
    });

    return {
      success: true,
      content: visionResponse.choices[0].message.content || "",
      modelUsed: "gpt-4o-vision",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to extract image content",
    };
  }
}

// Spreadsheet Extraction
async function extractSpreadsheetContent(fileUrl: string): Promise<ExtractionResult> {
  try {
    const openai = getOpenAIClient();

    // Download and parse
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return { success: false, error: "Failed to download spreadsheet" };
    }
    const buffer = await response.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });

    // Extract data from all sheets
    const sheetsData: Record<string, any[]> = {};
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      sheetsData[sheetName] = XLSX.utils.sheet_to_json(sheet);
    }

    // Use GPT-4o to analyze and summarize
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-5-mini-2025-08-07",
      messages: [
        {
          role: "system",
          content:
            "You are a data analyst. Analyze the spreadsheet data and provide key insights, summaries, and important metrics.",
        },
        {
          role: "user",
          content: `Analyze this spreadsheet data:\n${JSON.stringify(sheetsData, null, 2)}`,
        },
      ],
      max_completion_tokens: 4096,
    });

    return {
      success: true,
      content: analysisResponse.choices[0].message.content || "",
      structuredData: sheetsData,
      modelUsed: "xlsx + gpt-4o",
      metadata: { sheets: workbook.SheetNames },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to extract spreadsheet content",
    };
  }
}

// Presentation Extraction
async function extractPresentationContent(fileUrl: string): Promise<ExtractionResult> {
  try {
    const openai = getOpenAIClient();
    
    // Dynamic import for pptx-parser (CommonJS module)
    let parsePptx: any;
    try {
      const pptxParser = await import("pptx-parser");
      parsePptx = pptxParser.parsePptx || (pptxParser as any).default?.parsePptx || (pptxParser as any).default;
      if (!parsePptx) {
        throw new Error("Could not find parsePptx function");
      }
    } catch (importError) {
      return {
        success: false,
        error: "Presentation parser not available. Please ensure pptx-parser is installed.",
      };
    }

    const response = await fetch(fileUrl);
    if (!response.ok) {
      return { success: false, error: "Failed to download presentation" };
    }
    const buffer = await response.arrayBuffer();
    const slides = await parsePptx(Buffer.from(buffer));

    // Extract text from all slides
    const slideTexts = slides
      .map((slide: any, i: number) => `Slide ${i + 1}: ${slide.text || ""}`)
      .join("\n\n");

    // Summarize with GPT-4o
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-5-mini-2025-08-07",
      messages: [
        {
          role: "user",
          content: `Summarize this presentation and extract key points:\n${slideTexts}`,
        },
      ],
      max_completion_tokens: 2048,
    });

    return {
      success: true,
      content: slideTexts,
      structuredData: { summary: summaryResponse.choices[0].message.content || "" },
      modelUsed: "pptx-parser + gpt-4o",
      metadata: { slideCount: slides.length },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to extract presentation content",
    };
  }
}

// Document Extraction
async function extractDocumentContent(fileUrl: string): Promise<ExtractionResult> {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      return { success: false, error: "Failed to download document" };
    }
    const buffer = await response.arrayBuffer();

    const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });

    return {
      success: true,
      content: result.value,
      modelUsed: "mammoth",
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to extract document content",
    };
  }
}

// Tool A: Get Work Files
export const getWorkFilesTool = createTool({
  id: "get-work-files",
  description: "Lists all work files for a user with metadata. NOTE: userId is automatically provided - you don't need to pass it.",
  inputSchema: z.object({
    userId: z.string().optional().describe("User ID (automatically provided - do not pass this parameter)"),
    fileType: z
      .enum(["pdf", "image", "document", "spreadsheet", "presentation", "other"])
      .optional(),
    limit: z.number().default(20),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    files: z.array(
      z.object({
        id: z.string(),
        fileName: z.string(),
        customName: z.string().nullable(),
        description: z.string().nullable(),
        category: z.string().nullable(),
        fileType: z.string(),
        fileUrl: z.string(),
        uploadedAt: z.string(),
      })
    ),
    error: z.string().optional(),
  }),
  execute: async ({ userId, fileType, limit }, context?) => {
    try {
      // Validate and get userId from context
      const actualUserId = getUserIdFromContext(userId, context);
      
      const supabase = getSupabaseClient();

      let query = supabase
        .from("work_files")
        .select("id, file_name, custom_name, description, category, file_type, file_url, uploaded_at")
        .eq("user_id", actualUserId)
        .order("uploaded_at", { ascending: false })
        .limit(limit);

      if (fileType) {
        query = query.eq("file_type", fileType);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, files: [], error: error.message };
      }

      return {
        success: true,
        files:
          data?.map((f) => ({
            id: f.id,
            fileName: f.file_name,
            customName: f.custom_name,
            description: f.description,
            category: f.category,
            fileType: f.file_type,
            fileUrl: f.file_url,
            uploadedAt: f.uploaded_at,
          })) || [],
      };
    } catch (err) {
      return {
        success: false,
        files: [],
        error: err instanceof Error ? err.message : "Failed to get work files",
      };
    }
  },
});

// Tool B: Find Matching File (Semantic Search)
export const findMatchingFileTool = createTool({
  id: "find-matching-file",
  description:
    "Finds the best matching file based on user query using semantic search with embeddings",
  inputSchema: z.object({
    userId: z.string(),
    query: z
      .string()
      .describe("User query like 'quarterly report' or 'the contract I uploaded'"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    file: z
      .object({
        id: z.string(),
        fileName: z.string(),
        customName: z.string().nullable(),
        description: z.string().nullable(),
        category: z.string().nullable(),
        fileType: z.string(),
        fileUrl: z.string(),
        uploadedAt: z.string(),
      })
      .optional(),
    confidence: z.number(),
    alternatives: z
      .array(
        z.object({
          id: z.string(),
          fileName: z.string(),
          confidence: z.number(),
        })
      )
      .optional(),
    error: z.string().optional(),
  }),
  execute: async ({ userId, query }) => {
    try {
      const openai = getOpenAIClient();
      const supabase = getSupabaseClient();

      // Generate embedding for query
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
      });
      const queryEmbedding = embeddingResponse.data[0].embedding;

      // Get all user files with embeddings
      const { data: files, error: filesError } = await supabase
        .from("work_files")
        .select("id, file_name, custom_name, description, category, file_type, file_url, uploaded_at, embedding")
        .eq("user_id", userId)
        .not("embedding", "is", null);

      if (filesError || !files) {
        // Fallback to keyword search if no embeddings
        const { data: fallbackFiles } = await supabase
          .from("work_files")
          .select("*")
          .eq("user_id", userId)
          .ilike("file_name", `%${query}%`)
          .limit(5);

        if (fallbackFiles && fallbackFiles.length > 0) {
          return {
            success: true,
            file: {
              id: fallbackFiles[0].id,
              fileName: fallbackFiles[0].file_name,
              customName: fallbackFiles[0].custom_name,
              description: fallbackFiles[0].description,
              category: fallbackFiles[0].category,
              fileType: fallbackFiles[0].file_type,
              fileUrl: fallbackFiles[0].file_url,
              uploadedAt: fallbackFiles[0].uploaded_at,
            },
            confidence: 0.7,
          };
        }

        return { success: false, confidence: 0, error: "No files found" };
      }

      // Calculate cosine similarity
      const similarities = files
        .map((file) => {
          if (!file.embedding) return null;
          const fileEmbedding = file.embedding as number[];
          // Cosine similarity
          const dotProduct = queryEmbedding.reduce(
            (sum, val, i) => sum + val * fileEmbedding[i],
            0
          );
          const queryMagnitude = Math.sqrt(
            queryEmbedding.reduce((sum, val) => sum + val * val, 0)
          );
          const fileMagnitude = Math.sqrt(
            fileEmbedding.reduce((sum, val) => sum + val * val, 0)
          );
          const similarity = dotProduct / (queryMagnitude * fileMagnitude);
          return { file, similarity };
        })
        .filter((item): item is { file: typeof files[0]; similarity: number } => item !== null)
        .sort((a, b) => b.similarity - a.similarity);

      if (similarities.length === 0) {
        return { success: false, confidence: 0, error: "No matching files found" };
      }

      const bestMatch = similarities[0];
      const confidence = Math.max(0, Math.min(1, bestMatch.similarity));

      return {
        success: true,
        file: {
          id: bestMatch.file.id,
          fileName: bestMatch.file.file_name,
          customName: bestMatch.file.custom_name,
          description: bestMatch.file.description,
          category: bestMatch.file.category,
          fileType: bestMatch.file.file_type,
          fileUrl: bestMatch.file.file_url,
          uploadedAt: bestMatch.file.uploaded_at,
        },
        confidence,
        alternatives: similarities.slice(1, 4).map((item) => ({
          id: item.file.id,
          fileName: item.file.file_name,
          confidence: item.similarity,
        })),
      };
    } catch (err) {
      return {
        success: false,
        confidence: 0,
        error: err instanceof Error ? err.message : "Failed to find matching file",
      };
    }
  },
});

// Tool C: Extract File Content
export const extractFileContentTool = createTool({
  id: "extract-file-content",
  description:
    "Extracts content from a file using appropriate model based on file type. Caches results for performance.",
  inputSchema: z.object({
    fileId: z.string(),
    fileUrl: z.string(),
    fileType: z.enum(["pdf", "image", "document", "spreadsheet", "presentation", "other"]),
    extractionMode: z.enum(["text", "summary", "data", "full"]).default("text"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    content: z.string().optional(),
    structuredData: z.any().optional(),
    metadata: z.record(z.any()).optional(),
    modelUsed: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ fileId, fileUrl, fileType, extractionMode }) => {
    try {
      // Check cache first
      const cached = await getFromCache(fileId);
      if (cached && cached.success) {
        return cached;
      }

      // Extract based on file type
      let result: ExtractionResult;
      switch (fileType) {
        case "pdf":
          result = await extractPdfContent(fileUrl);
          break;
        case "image":
          result = await extractImageContent(fileUrl);
          break;
        case "spreadsheet":
          result = await extractSpreadsheetContent(fileUrl);
          break;
        case "presentation":
          result = await extractPresentationContent(fileUrl);
          break;
        case "document":
          result = await extractDocumentContent(fileUrl);
          break;
        default:
          return {
            success: false,
            error: `Unsupported file type: ${fileType}`,
          };
      }

      // Cache result if successful
      if (result.success) {
        await cacheExtraction(fileId, result);
      }

      return result;
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to extract file content",
      };
    }
  },
});

// Tool D: Analyze File Content
export const analyzeFileContentTool = createTool({
  id: "analyze-file-content",
  description:
    "Uses GPT-4o to analyze extracted file content and provide insights, summaries, or key points",
  inputSchema: z.object({
    content: z.string(),
    analysisType: z
      .enum(["summary", "key_points", "data_insights", "action_items", "custom"])
      .default("summary"),
    customPrompt: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    analysis: z.string().optional(),
    structuredInsights: z.any().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ content, analysisType, customPrompt }) => {
    try {
      const openai = getOpenAIClient();

      const prompts: Record<string, string> = {
        summary: "Provide a comprehensive summary of this content.",
        key_points:
          "Extract and list the key points from this content in a structured format.",
        data_insights:
          "Analyze this data and provide insights, trends, and notable findings.",
        action_items:
          "Extract any action items, tasks, or next steps from this content.",
        custom: customPrompt || "Analyze this content.",
      };

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini-2025-08-07",
        messages: [
          {
            role: "user",
            content: `${prompts[analysisType]}\n\nContent:\n${content}`,
          },
        ],
        max_completion_tokens: 4096,
      });

      return {
        success: true,
        analysis: response.choices[0].message.content || "",
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to analyze content",
      };
    }
  },
});

// Export all tools
export const fileVaultTools = {
  getWorkFiles: getWorkFilesTool,
  findMatchingFile: findMatchingFileTool,
  extractFileContent: extractFileContentTool,
  analyzeFileContent: analyzeFileContentTool,
};

