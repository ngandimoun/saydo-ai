import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getUserContext } from "../tools/user-profile-tool";
import { classifyHealthDocumentTool, type HealthDocumentType, type BodySystemType } from "../tools/health-classifier-tool";
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
  generateRecommendationsTool,
  generateMealPlanTool,
  createInterventionTool,
  updateHealthScoreTool,
  updateStreakTool,
  checkAchievementsTool,
} from "../tools/health-engagement-tools";
import { analyzeSkincareProductTool } from "../tools/skincare-tools";
import {
  extractFindingsTool,
  storeFindingsTool,
} from "../tools/body-system-findings-tool";
import { analyzeAndStoreCorrelations } from "@/lib/health/correlation-engine";
import { generateAndStoreHolisticPlans } from "@/lib/health/holistic-plans-generator";

/**
 * Get Supabase client
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Input schema for smart upload workflow
 */
const SmartUploadInputSchema = z.object({
  userId: z.string().describe("User ID"),
  fileUrl: z.string().describe("URL of the uploaded file in Supabase Storage"),
  fileName: z.string().describe("Original file name"),
  mimeType: z.string().describe("MIME type of the file"),
  fileSize: z.number().optional().describe("File size in bytes"),
});

/**
 * Output schema for smart upload workflow
 */
const SmartUploadOutputSchema = z.object({
  success: z.boolean(),
  documentId: z.string().optional(),
  documentType: z.string().optional(),
  classification: z.object({
    confidence: z.number(),
    detectedElements: z.array(z.string()),
    reasoning: z.string(),
  }).optional(),
  analysis: z.any().optional(),
  healthImpact: z.object({
    score: z.number().optional(),
    benefits: z.array(z.string()),
    concerns: z.array(z.string()),
  }).optional(),
  allergyWarnings: z.array(z.string()).optional(),
  interactionWarnings: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  summary: z.string().optional(),
  error: z.string().optional(),
});

// ============================================
// HELPER: Map MIME type to file_type
// ============================================

/**
 * Maps MIME type to file_type value for health_documents table
 * Matches the pattern used in work_files table
 */
function getFileTypeFromMimeType(mimeType: string): 'pdf' | 'image' | 'document' | 'spreadsheet' | 'presentation' | 'other' {
  const normalizedMimeType = mimeType.toLowerCase();
  
  if (normalizedMimeType === 'application/pdf') {
    return 'pdf';
  }
  
  if (normalizedMimeType.startsWith('image/')) {
    return 'image';
  }
  
  if (
    normalizedMimeType.includes('spreadsheet') ||
    normalizedMimeType.includes('excel') ||
    normalizedMimeType === 'application/vnd.ms-excel' ||
    normalizedMimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    normalizedMimeType === 'text/csv'
  ) {
    return 'spreadsheet';
  }
  
  if (
    normalizedMimeType.includes('presentation') ||
    normalizedMimeType.includes('powerpoint') ||
    normalizedMimeType === 'application/vnd.ms-powerpoint' ||
    normalizedMimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ) {
    return 'presentation';
  }
  
  if (
    normalizedMimeType.includes('word') ||
    normalizedMimeType.includes('document') ||
    normalizedMimeType === 'application/msword' ||
    normalizedMimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    normalizedMimeType === 'text/plain'
  ) {
    return 'document';
  }
  
  return 'other';
}

// ============================================
// STEP 1: Create Document Record
// ============================================

const createDocumentRecordStep = createStep({
  id: "create-document-record",
  description: "Create initial health document record in database",
  inputSchema: SmartUploadInputSchema,
  outputSchema: z.object({
    success: z.boolean(),
    documentId: z.string().optional(),
    userId: z.string(),
    fileUrl: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    fileSize: z.number().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    const stepStartTime = Date.now();
    console.log("[createDocumentRecordStep] Starting", {
      hasInput: !!inputData,
      userId: inputData.userId,
      fileName: inputData.fileName,
      mimeType: inputData.mimeType,
      fileSize: inputData.fileSize,
    });

    try {
      const supabase = getSupabaseClient();

      // Create initial document record with pending status
      const fileType = getFileTypeFromMimeType(inputData.mimeType);
      
      const { data, error } = await supabase
        .from("health_documents")
        .insert({
          user_id: inputData.userId,
          file_name: inputData.fileName,
          file_url: inputData.fileUrl,
          mime_type: inputData.mimeType,
          file_size: inputData.fileSize,
          file_type: fileType,
          document_type: "other", // Will be updated after classification
          status: "classifying",
        })
        .select("id")
        .single();

      if (error) {
        throw new Error(`Failed to create document record: ${error.message}`);
      }

      const duration = Date.now() - stepStartTime;
      console.log("[createDocumentRecordStep] Completed successfully", {
        duration: `${duration}ms`,
        documentId: data.id,
        userId: inputData.userId,
        fileName: inputData.fileName,
      });

      return {
        success: true,
        documentId: data.id,
        userId: inputData.userId,
        fileUrl: inputData.fileUrl,
        fileName: inputData.fileName,
        mimeType: inputData.mimeType,
        fileSize: inputData.fileSize,
      };
    } catch (error) {
      const duration = Date.now() - stepStartTime;
      console.error("[createDocumentRecordStep] Failed after " + duration + "ms:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        inputData: {
          userId: inputData.userId,
          fileName: inputData.fileName,
          mimeType: inputData.mimeType,
        },
      });
      return {
        success: false,
        userId: inputData.userId,
        fileUrl: inputData.fileUrl,
        fileName: inputData.fileName,
        mimeType: inputData.mimeType,
        fileSize: inputData.fileSize,
        error: error instanceof Error ? error.message : "Failed to create document record",
      };
    }
  },
});

// ============================================
// STEP 2: Classify Document
// ============================================

const classifyDocumentStep = createStep({
  id: "classify-document",
  description: "Classify the document type and body system using AI vision",
  inputSchema: z.object({
    success: z.boolean(),
    documentId: z.string().optional(),
    userId: z.string(),
    fileUrl: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    fileSize: z.number().optional(),
    error: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    documentId: z.string().optional(),
    userId: z.string(),
    fileUrl: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    documentType: z.string().optional(),
    bodySystem: z.string().optional(), // Added for cumulative tracking
    classification: z.object({
      confidence: z.number(),
      detectedElements: z.array(z.string()),
      reasoning: z.string(),
      suggestedAnalysis: z.array(z.string()),
      bodySystemContext: z.string().optional(),
    }).optional(),
    error: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    const stepStartTime = Date.now();
    console.log("[classifyDocumentStep] Starting", {
      hasInput: !!inputData,
      inputSuccess: inputData.success,
      documentId: inputData.documentId,
      fileName: inputData.fileName,
      mimeType: inputData.mimeType,
    });

    if (!inputData.success || !inputData.documentId) {
      const duration = Date.now() - stepStartTime;
      console.warn("[classifyDocumentStep] Skipped - previous step failed", {
        duration: `${duration}ms`,
        error: inputData.error || "Previous step failed",
      });
      return {
        success: false,
        userId: inputData.userId,
        fileUrl: inputData.fileUrl,
        fileName: inputData.fileName,
        mimeType: inputData.mimeType,
        error: inputData.error || "Previous step failed",
      };
    }

    try {
      // Classify the document
      const result = await classifyHealthDocumentTool.execute({
        fileUrl: inputData.fileUrl,
        fileName: inputData.fileName,
        mimeType: inputData.mimeType,
      });

      if (!result.success || !result.classification) {
        const errorMessage = result.error && typeof result.error === 'string' 
          ? result.error 
          : "Classification failed";
        throw new Error(errorMessage);
      }

      const { documentType, bodySystem, confidence, detectedElements, reasoning, suggestedAnalysis, bodySystemContext } = result.classification;

      // Update document record with classification and body system
      const supabase = getSupabaseClient();
      await supabase
        .from("health_documents")
        .update({
          document_type: documentType,
          body_system: bodySystem,
          classification_confidence: confidence,
          detected_elements: detectedElements,
          status: "analyzing",
        })
        .eq("id", inputData.documentId);

      const duration = Date.now() - stepStartTime;
      console.log("[classifyDocumentStep] Completed successfully", {
        duration: `${duration}ms`,
        documentId: inputData.documentId,
        documentType,
        bodySystem,
        confidence,
      });

      return {
        success: true,
        documentId: inputData.documentId,
        userId: inputData.userId,
        fileUrl: inputData.fileUrl,
        fileName: inputData.fileName,
        mimeType: inputData.mimeType,
        documentType,
        bodySystem,
        classification: {
          confidence,
          detectedElements,
          reasoning,
          suggestedAnalysis,
          bodySystemContext,
        },
      };
    } catch (error) {
      const duration = Date.now() - stepStartTime;
      console.error("[classifyDocumentStep] Failed after " + duration + "ms:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        documentId: inputData.documentId,
      });

      // Update document status to failed
      if (inputData.documentId) {
        const supabase = getSupabaseClient();
        await supabase
          .from("health_documents")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Classification failed",
          })
          .eq("id", inputData.documentId);
      }

      return {
        success: false,
        documentId: inputData.documentId,
        userId: inputData.userId,
        fileUrl: inputData.fileUrl,
        fileName: inputData.fileName,
        mimeType: inputData.mimeType,
        error: error instanceof Error ? error.message : "Classification failed",
      };
    }
  },
});

// ============================================
// STEP 3: Analyze Document (Type-Specific)
// ============================================

const analyzeDocumentStep = createStep({
  id: "analyze-document",
  description: "Run type-specific analysis on the document",
  inputSchema: z.object({
    success: z.boolean(),
    documentId: z.string().optional(),
    userId: z.string(),
    fileUrl: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    documentType: z.string().optional(),
    bodySystem: z.string().optional(), // Added for cumulative tracking
    classification: z.object({
      confidence: z.number(),
      detectedElements: z.array(z.string()),
      reasoning: z.string(),
      suggestedAnalysis: z.array(z.string()),
      bodySystemContext: z.string().optional(),
    }).optional(),
    error: z.string().optional(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    documentId: z.string().optional(),
    userId: z.string(),
    documentType: z.string().optional(),
    bodySystem: z.string().optional(), // Added for cumulative tracking
    classification: z.any().optional(),
    analysis: z.any().optional(),
    allergyWarnings: z.array(z.string()).optional(),
    interactionWarnings: z.array(z.string()).optional(),
    healthScore: z.number().optional(),
    benefits: z.array(z.string()).optional(),
    concerns: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
    summary: z.string().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    const stepStartTime = Date.now();
    console.log("[analyzeDocumentStep] Starting", {
      hasInput: !!inputData,
      inputSuccess: inputData.success,
      documentId: inputData.documentId,
      documentType: inputData.documentType,
      bodySystem: inputData.bodySystem,
    });

    if (!inputData.success || !inputData.documentId || !inputData.documentType) {
      const duration = Date.now() - stepStartTime;
      console.warn("[analyzeDocumentStep] Skipped - previous step failed", {
        duration: `${duration}ms`,
        error: inputData.error || "Previous step failed",
      });
      return {
        success: false,
        documentId: inputData.documentId,
        userId: inputData.userId,
        documentType: inputData.documentType,
        bodySystem: inputData.bodySystem,
        classification: inputData.classification,
        error: inputData.error || "Previous step failed",
      };
    }

    try {
      const documentType = inputData.documentType as HealthDocumentType;
      let analysis: unknown;
      let allergyWarnings: string[] = [];
      let interactionWarnings: string[] = [];
      let healthScore: number | undefined;
      let benefits: string[] = [];
      let concerns: string[] = [];
      let recommendations: string[] = [];
      let summary = "";

      // Route to type-specific analysis tool
      switch (documentType) {
        case "food_photo": {
          const result = await analyzeFoodTool.execute({
            fileUrl: inputData.fileUrl,
            mimeType: inputData.mimeType,
            userId: inputData.userId,
          });
          if (result.success && result.analysis) {
            analysis = result.analysis;
            allergyWarnings = result.analysis.allergyWarnings || [];
            healthScore = result.analysis.healthScore;
            benefits = result.analysis.benefits || [];
            concerns = result.analysis.concerns || [];
            recommendations = result.analysis.recommendations || [];
            summary = `${result.analysis.detected} - ${result.analysis.calories || "?"} calories`;
          } else {
            const errorMessage = result.error && typeof result.error === 'string' 
              ? result.error 
              : "Food analysis failed";
            throw new Error(errorMessage);
          }
          break;
        }

        case "supplement": {
          const result = await analyzeSupplementTool.execute({
            fileUrl: inputData.fileUrl,
            mimeType: inputData.mimeType,
            userId: inputData.userId,
          });
          if (result.success && result.analysis) {
            analysis = result.analysis;
            allergyWarnings = result.analysis.allergyWarnings || [];
            interactionWarnings = result.analysis.drugInteractions || [];
            healthScore = result.analysis.healthScore;
            benefits = result.analysis.benefits || [];
            concerns = result.analysis.concerns || [];
            recommendations = result.analysis.recommendations || [];
            summary = `${result.analysis.name} (${result.analysis.type})`;
          } else {
            const errorMessage = result.error && typeof result.error === 'string' 
              ? result.error 
              : "Supplement analysis failed";
            throw new Error(errorMessage);
          }
          break;
        }

        case "drink": {
          const result = await analyzeDrinkTool.execute({
            fileUrl: inputData.fileUrl,
            mimeType: inputData.mimeType,
            userId: inputData.userId,
          });
          if (result.success && result.analysis) {
            analysis = result.analysis;
            allergyWarnings = result.analysis.allergyWarnings || [];
            healthScore = result.analysis.healthScore;
            benefits = result.analysis.benefits || [];
            concerns = result.analysis.concerns || [];
            recommendations = result.analysis.recommendations || [];
            summary = `${result.analysis.name} - ${result.analysis.hydrationImpact} hydration`;
          } else {
            const errorMessage = result.error && typeof result.error === 'string' 
              ? result.error 
              : "Drink analysis failed";
            throw new Error(errorMessage);
          }
          break;
        }

        case "lab_pdf":
        case "lab_handwritten": {
          const result = await analyzeLabResultsTool.execute({
            fileUrl: inputData.fileUrl,
            mimeType: inputData.mimeType,
            userId: inputData.userId,
          });
          if (result.success && result.analysis) {
            analysis = result.analysis;
            const abnormalCount = result.analysis.abnormalCount || 0;
            healthScore = Math.max(0, 100 - (abnormalCount * 10));
            concerns = result.analysis.criticalFindings || [];
            recommendations = result.analysis.recommendations || [];
            summary = result.analysis.summary || `${result.analysis.biomarkers?.length || 0} biomarkers extracted`;
          } else {
            const errorMessage = result.error && typeof result.error === 'string' 
              ? result.error 
              : "Lab results analysis failed";
            throw new Error(errorMessage);
          }
          break;
        }

        case "medication": {
          const result = await analyzeMedicationTool.execute({
            fileUrl: inputData.fileUrl,
            mimeType: inputData.mimeType,
            userId: inputData.userId,
          });
          if (result.success && result.analysis) {
            analysis = result.analysis;
            allergyWarnings = result.analysis.allergyWarnings || [];
            interactionWarnings = result.analysis.drugInteractions || [];
            concerns = result.analysis.warnings || [];
            recommendations = result.analysis.recommendations || [];
            summary = `${result.analysis.name}${result.analysis.dosage ? ` - ${result.analysis.dosage}` : ""}`;
          } else {
            const errorMessage = result.error && typeof result.error === 'string' 
              ? result.error 
              : "Medication analysis failed";
            throw new Error(errorMessage);
          }
          break;
        }

        case "skincare_product": {
          const result = await analyzeSkincareProductTool.execute({
            userId: inputData.userId,
            fileUrl: inputData.fileUrl,
            mimeType: inputData.mimeType,
          });
          if (result.success && result.analysis) {
            analysis = result.analysis;
            healthScore = result.analysis.compatibilityScore;
            recommendations = result.analysis.compatibilityNotes ? [result.analysis.compatibilityNotes] : [];
            summary = `${result.analysis.name}${result.analysis.brand ? ` by ${result.analysis.brand}` : ""} - ${result.analysis.compatibilityScore}/100 compatibility`;
            // Extract concerns from ingredient analysis
            const ingredientAnalysis = result.analysis.ingredientAnalysis || {};
            concerns = Object.entries(ingredientAnalysis)
              .filter(([_, info]) => (info as { rating: string }).rating === "avoid")
              .map(([ingredient, info]) => `${ingredient}: ${(info as { reason: string }).reason}`);
          } else {
            const errorMessage = result.error && typeof result.error === 'string' 
              ? result.error 
              : "Skincare product analysis failed";
            throw new Error(errorMessage);
          }
          break;
        }

        case "clinical_report":
        case "other":
        default: {
          const result = await analyzeGeneralHealthDocTool.execute({
            fileUrl: inputData.fileUrl,
            mimeType: inputData.mimeType,
            userId: inputData.userId,
          });
          if (result.success && result.analysis) {
            analysis = result.analysis;
            recommendations = result.analysis.recommendations || [];
            summary = result.analysis.summary || "Document analyzed";
          } else {
            const errorMessage = result.error && typeof result.error === 'string' 
              ? result.error 
              : "Document analysis failed";
            throw new Error(errorMessage);
          }
          break;
        }
      }

      const duration = Date.now() - stepStartTime;
      console.log("[analyzeDocumentStep] Completed successfully", {
        duration: `${duration}ms`,
        documentId: inputData.documentId,
        documentType,
        bodySystem: inputData.bodySystem,
        healthScore,
        allergyWarningsCount: allergyWarnings.length,
        hasAnalysis: !!analysis,
      });

      return {
        success: true,
        documentId: inputData.documentId,
        userId: inputData.userId,
        documentType: inputData.documentType,
        bodySystem: inputData.bodySystem,
        classification: inputData.classification,
        analysis,
        allergyWarnings,
        interactionWarnings,
        healthScore,
        benefits,
        concerns,
        recommendations,
        summary,
      };
    } catch (error) {
      const duration = Date.now() - stepStartTime;
      console.error("[analyzeDocumentStep] Failed after " + duration + "ms:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        documentId: inputData.documentId,
        documentType: inputData.documentType,
      });

      // Update document status to failed
      if (inputData.documentId) {
        const supabase = getSupabaseClient();
        await supabase
          .from("health_documents")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Analysis failed",
          })
          .eq("id", inputData.documentId);
      }

      return {
        success: false,
        documentId: inputData.documentId,
        userId: inputData.userId,
        documentType: inputData.documentType,
        bodySystem: inputData.bodySystem,
        classification: inputData.classification,
        error: error instanceof Error ? error.message : "Analysis failed",
      };
    }
  },
});

// ============================================
// STEP 4: Store Results & Generate Insights
// ============================================

const storeResultsStep = createStep({
  id: "store-results",
  description: "Store analysis results and generate health insights",
  inputSchema: z.object({
    success: z.boolean(),
    documentId: z.string().optional(),
    userId: z.string(),
    documentType: z.string().optional(),
    bodySystem: z.string().optional(), // Added for cumulative tracking
    classification: z.any().optional(),
    analysis: z.any().optional(),
    allergyWarnings: z.array(z.string()).optional(),
    interactionWarnings: z.array(z.string()).optional(),
    healthScore: z.number().optional(),
    benefits: z.array(z.string()).optional(),
    concerns: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
    summary: z.string().optional(),
    error: z.string().optional(),
  }),
  outputSchema: SmartUploadOutputSchema.extend({
    bodySystem: z.string().optional(),
  }),
  execute: async ({ inputData }) => {
    const stepStartTime = Date.now();
    console.log("[storeResultsStep] Starting", {
      hasInput: !!inputData,
      inputSuccess: inputData.success,
      documentId: inputData.documentId,
      hasAnalysis: !!inputData.analysis,
      documentType: inputData.documentType,
    });

    if (!inputData.success || !inputData.documentId || !inputData.analysis) {
      const duration = Date.now() - stepStartTime;
      console.warn("[storeResultsStep] Skipped - previous step failed or no analysis", {
        duration: `${duration}ms`,
        error: inputData.error || "Previous step failed",
        hasAnalysis: !!inputData.analysis,
      });
      return {
        success: false,
        documentId: inputData.documentId,
        documentType: inputData.documentType,
        bodySystem: inputData.bodySystem,
        error: inputData.error || "Previous step failed",
      };
    }

    try {
      // Store the analysis results, including document classification
      const storeResult = await storeHealthAnalysisTool.execute({
        documentId: inputData.documentId,
        userId: inputData.userId,
        documentType: inputData.documentType || "other",
        bodySystem: inputData.bodySystem, // Pass body system for classification persistence
        analysisResult: {
          ...inputData.analysis,
          healthScore: inputData.healthScore,
          benefits: inputData.benefits,
          concerns: inputData.concerns,
          summary: inputData.summary,
        },
        allergyWarnings: inputData.allergyWarnings,
        interactionWarnings: inputData.interactionWarnings,
      });

      if (!storeResult.success) {
        throw new Error(storeResult.error || "Failed to store results");
      }

      // Create health insight if there are significant findings
      const supabase = getSupabaseClient();
      
      // Create insight for allergy warnings
      if (inputData.allergyWarnings && inputData.allergyWarnings.length > 0) {
        await supabase.from("health_insights").insert({
          user_id: inputData.userId,
          type: "warning",
          title: "Allergy Alert",
          content: `Allergens detected: ${inputData.allergyWarnings.join(", ")}`,
          category: "nutrition",
          priority: "high",
          related_to_allergy: inputData.allergyWarnings[0],
        });
      }

      // Create insight for low health score
      if (inputData.healthScore !== undefined && inputData.healthScore < 50) {
        await supabase.from("health_insights").insert({
          user_id: inputData.userId,
          type: "warning",
          title: "Health Concern",
          content: `${inputData.summary} - This item has a low health score of ${inputData.healthScore}. ${inputData.concerns?.join(". ") || ""}`,
          category: "nutrition",
          priority: "medium",
        });
      }

      // Create insight for critical lab findings
      if (inputData.concerns && inputData.concerns.length > 0 && 
          (inputData.documentType === "lab_pdf" || inputData.documentType === "lab_handwritten")) {
        await supabase.from("health_insights").insert({
          user_id: inputData.userId,
          type: "observation",
          title: "Lab Results Review",
          content: inputData.concerns.join(". "),
          category: "general",
          priority: inputData.concerns.some(c => c.toLowerCase().includes("critical")) ? "high" : "medium",
        });
      }

      const duration = Date.now() - stepStartTime;
      console.log("[storeResultsStep] Completed successfully", {
        duration: `${duration}ms`,
        documentId: inputData.documentId,
        intakeLogId: storeResult.intakeLogId,
        biomarkersCreated: storeResult.biomarkersCreated,
      });

      return {
        success: true,
        documentId: inputData.documentId,
        documentType: inputData.documentType,
        bodySystem: inputData.bodySystem,
        classification: inputData.classification ? {
          confidence: inputData.classification.confidence,
          detectedElements: inputData.classification.detectedElements,
          reasoning: inputData.classification.reasoning,
        } : undefined,
        analysis: inputData.analysis,
        healthImpact: {
          score: inputData.healthScore,
          benefits: inputData.benefits || [],
          concerns: inputData.concerns || [],
        },
        allergyWarnings: inputData.allergyWarnings,
        interactionWarnings: inputData.interactionWarnings,
        recommendations: inputData.recommendations,
        summary: inputData.summary,
      };
    } catch (error) {
      const duration = Date.now() - stepStartTime;
      console.error("[storeResultsStep] Failed after " + duration + "ms:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        documentId: inputData.documentId,
      });

      // Update document status to failed
      if (inputData.documentId) {
        const supabase = getSupabaseClient();
        await supabase
          .from("health_documents")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Failed to store results",
          })
          .eq("id", inputData.documentId);
      }

      return {
        success: false,
        documentId: inputData.documentId,
        documentType: inputData.documentType,
        bodySystem: inputData.bodySystem,
        error: error instanceof Error ? error.message : "Failed to store results",
      };
    }
  },
});

// ============================================
// STEP 5: Extract & Store Body System Findings
// ============================================

const extractAndStoreFindingsStep = createStep({
  id: "extract-store-findings",
  description: "Extract findings from analysis and store in body_system_findings table for cumulative tracking",
  inputSchema: SmartUploadOutputSchema.extend({
    bodySystem: z.string().optional(),
  }),
  outputSchema: SmartUploadOutputSchema.extend({
    bodySystem: z.string().optional(),
    findingsExtracted: z.number().optional(),
    evolutionDetected: z.boolean().optional(),
  }),
  execute: async ({ inputData }) => {
    const stepStartTime = Date.now();
    console.log("[extractAndStoreFindingsStep] Starting", {
      hasInput: !!inputData,
      inputSuccess: inputData.success,
      documentId: inputData.documentId,
      hasAnalysis: !!inputData.analysis,
      bodySystem: inputData.bodySystem,
      documentType: inputData.documentType,
    });

    if (!inputData.success || !inputData.documentId || !inputData.analysis) {
      const duration = Date.now() - stepStartTime;
      console.warn("[extractAndStoreFindingsStep] Skipped - previous step failed or no analysis", {
        duration: `${duration}ms`,
        inputSuccess: inputData.success,
        hasDocumentId: !!inputData.documentId,
        hasAnalysis: !!inputData.analysis,
      });
      return {
        ...inputData,
        findingsExtracted: 0,
        evolutionDetected: false,
      };
    }

    try {
      const supabase = getSupabaseClient();
      
      // Get user ID and language from document/profile
      const { data: document } = await supabase
        .from("health_documents")
        .select("user_id, body_system")
        .eq("id", inputData.documentId)
        .single();

      if (!document) {
        console.warn("[extractAndStoreFindingsStep] Document not found");
        return {
          ...inputData,
          findingsExtracted: 0,
          evolutionDetected: false,
        };
      }

      // Fetch user's language preference from profile
      let userLanguage = "en";
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("language")
          .eq("id", document.user_id)
          .single();
        
        if (profile?.language) {
          userLanguage = profile.language;
        }
      } catch (langError) {
        console.warn("[extractAndStoreFindingsStep] Could not fetch user language, using English");
      }

      const bodySystem = inputData.bodySystem || document.body_system || "general";

      // Extract findings using AI in user's language
      const extractResult = await extractFindingsTool.execute({
        userId: document.user_id,
        documentId: inputData.documentId,
        bodySystem,
        analysisData: inputData.analysis,
        documentType: inputData.documentType || "other",
        userLanguage, // Pass user's preferred language
      });

      // DEBUG: Log the full structure of the Mastra tool result
      console.log("[extractAndStoreFindingsStep] Raw extractResult:", {
        type: typeof extractResult,
        isNull: extractResult === null,
        isUndefined: extractResult === undefined,
        keys: extractResult ? Object.keys(extractResult) : [],
        hasSuccess: extractResult ? 'success' in extractResult : false,
        hasData: extractResult ? 'data' in extractResult : false,
        hasFindings: extractResult ? 'findings' in extractResult : false,
        fullResult: JSON.stringify(extractResult, null, 2).substring(0, 1000),
      });

      // Handle potential Mastra wrapper - check if result is wrapped in 'data' property
      const result = (extractResult as any)?.data ?? extractResult;
      
      console.log("[extractAndStoreFindingsStep] Unwrapped result:", {
        success: result?.success,
        findingsCount: result?.findings?.length || 0,
        hasError: !!result?.error,
      });

      if (!result?.success || !result?.findings?.length) {
        console.warn("[extractAndStoreFindingsStep] No findings extracted", {
          success: result?.success,
          findingsCount: result?.findings?.length || 0,
          error: result?.error,
          bodySystem,
          documentType: inputData.documentType,
          hasAnalysis: !!inputData.analysis,
          analysisKeys: inputData.analysis ? Object.keys(inputData.analysis) : [],
        });
        return {
          ...inputData,
          bodySystem,
          findingsExtracted: 0,
          evolutionDetected: false,
        };
      }

      // Store findings with evolution tracking
      const storeResultRaw = await storeFindingsTool.execute({
        userId: document.user_id,
        documentId: inputData.documentId,
        bodySystem,
        findings: result.findings,
      });
      
      // Handle potential Mastra wrapper for store result
      const storeResult = (storeResultRaw as any)?.data ?? storeResultRaw;

      // Run correlation analysis to find cross-system patterns
      let correlationsDetected = 0;
      try {
        // Pass user's language for translated explanations
        const correlationResult = await analyzeAndStoreCorrelations(document.user_id, userLanguage);
        correlationsDetected = correlationResult.stored;
        console.log("[extractAndStoreFindingsStep] Correlations analyzed", {
          detected: correlationResult.detected,
          stored: correlationResult.stored,
          language: userLanguage,
        });
      } catch (corrError) {
        console.warn("[extractAndStoreFindingsStep] Correlation analysis failed:", corrError);
      }

      // Generate holistic plans based on all accumulated data
      let plansGenerated = 0;
      try {
        // Pass user's language for translated plans
        const planResult = await generateAndStoreHolisticPlans(document.user_id, userLanguage);
        plansGenerated = planResult.stored;
        console.log("[extractAndStoreFindingsStep] Holistic plans generated", {
          generated: planResult.generated,
          stored: planResult.stored,
          language: userLanguage,
        });
      } catch (planError) {
        console.warn("[extractAndStoreFindingsStep] Holistic plan generation failed:", planError);
      }

      const duration = Date.now() - stepStartTime;
      console.log("[extractAndStoreFindingsStep] Completed successfully", {
        duration: `${duration}ms`,
        documentId: inputData.documentId,
        bodySystem,
        findingsCount: storeResult?.storedCount,
        evolutionDetected: storeResult?.evolutionDetected,
        correlationsDetected,
        plansGenerated,
      });

      return {
        ...inputData,
        bodySystem,
        findingsExtracted: storeResult?.storedCount || 0,
        evolutionDetected: storeResult?.evolutionDetected || false,
      };
    } catch (error) {
      const duration = Date.now() - stepStartTime;
      console.error("[extractAndStoreFindingsStep] Failed after " + duration + "ms:", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        documentId: inputData.documentId,
        bodySystem: inputData.bodySystem,
      });
      // Don't fail the workflow if findings extraction fails
      return {
        ...inputData,
        findingsExtracted: 0,
        evolutionDetected: false,
      };
    }
  },
});

// ============================================
// STEP 6: Generate Recommendations
// ============================================

const generateRecommendationsStep = createStep({
  id: "generate-recommendations",
  description: "Generate personalized recommendations based on analysis",
  inputSchema: SmartUploadOutputSchema.extend({
    bodySystem: z.string().optional(),
    findingsExtracted: z.number().optional(),
    evolutionDetected: z.boolean().optional(),
  }),
  outputSchema: SmartUploadOutputSchema.extend({
    bodySystem: z.string().optional(),
    findingsExtracted: z.number().optional(),
    evolutionDetected: z.boolean().optional(),
    recommendationsGenerated: z.boolean().optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData.success || !inputData.documentId) {
      return inputData;
    }

    try {
      // Extract biomarkers if available
      const supabase = getSupabaseClient();
      const { data: biomarkers } = await supabase
        .from("biomarkers")
        .select("name, value, status")
        .eq("document_id", inputData.documentId);

      const biomarkerData = biomarkers?.map(b => ({
        name: b.name,
        value: Number(b.value),
        status: b.status || "normal",
      })) || [];

      // Generate recommendations
      const recResult = await generateRecommendationsTool.execute({
        userId: inputData.documentId ? (await supabase
          .from("health_documents")
          .select("user_id")
          .eq("id", inputData.documentId)
          .single()).data?.user_id || "" : "",
        analysisData: {
          documentId: inputData.documentId,
          biomarkers: biomarkerData.length > 0 ? biomarkerData : undefined,
          insights: inputData.recommendations,
        },
      });

      return {
        ...inputData,
        recommendationsGenerated: recResult.success,
      };
    } catch (error) {
      console.error("[generateRecommendationsStep] Error:", error);
      // Don't fail the workflow if recommendations fail
      return {
        ...inputData,
        recommendationsGenerated: false,
      };
    }
  },
});

// ============================================
// STEP 6: Update Meal Plan (if lab results)
// ============================================

const updateMealPlanStep = createStep({
  id: "update-meal-plan",
  description: "Update meal plan if lab results were uploaded",
  inputSchema: SmartUploadOutputSchema.extend({
    recommendationsGenerated: z.boolean().optional(),
  }),
  outputSchema: SmartUploadOutputSchema.extend({
    mealPlanUpdated: z.boolean().optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData.success || !inputData.documentId) {
      return inputData;
    }

    // Only update meal plan for lab results
    if (inputData.documentType !== "lab_pdf" && inputData.documentType !== "lab_handwritten") {
      return {
        ...inputData,
        mealPlanUpdated: false,
      };
    }

    try {
      const supabase = getSupabaseClient();
      const { data: document } = await supabase
        .from("health_documents")
        .select("user_id")
        .eq("id", inputData.documentId)
        .single();

      if (!document) {
        return {
          ...inputData,
          mealPlanUpdated: false,
        };
      }

      // Get biomarker IDs from this document
      const { data: biomarkers } = await supabase
        .from("biomarkers")
        .select("id")
        .eq("document_id", inputData.documentId);

      const biomarkerIds = biomarkers?.map(b => b.id) || [];

      if (biomarkerIds.length === 0) {
        return {
          ...inputData,
          mealPlanUpdated: false,
        };
      }

      // Generate or update meal plan
      const mealPlanResult = await generateMealPlanTool.execute({
        userId: document.user_id,
        type: "weekly",
        biomarkerIds,
      });

      return {
        ...inputData,
        mealPlanUpdated: mealPlanResult.success,
      };
    } catch (error) {
      console.error("[updateMealPlanStep] Error:", error);
      return {
        ...inputData,
        mealPlanUpdated: false,
      };
    }
  },
});

// ============================================
// STEP 7: Create Interventions
// ============================================

const createInterventionsStep = createStep({
  id: "create-interventions",
  description: "Create proactive interventions based on findings",
  inputSchema: SmartUploadOutputSchema.extend({
    mealPlanUpdated: z.boolean().optional(),
  }),
  outputSchema: SmartUploadOutputSchema.extend({
    interventionsCreated: z.number().optional(),
  }),
  execute: async ({ inputData }) => {
    if (!inputData.success || !inputData.documentId) {
      return inputData;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: document } = await supabase
        .from("health_documents")
        .select("user_id, document_type")
        .eq("id", inputData.documentId)
        .single();

      if (!document) {
        return {
          ...inputData,
          interventionsCreated: 0,
        };
      }

      let interventionsCreated = 0;

      // Create intervention for allergy warnings
      if (inputData.allergyWarnings && inputData.allergyWarnings.length > 0) {
        const interventionResult = await createInterventionTool.execute({
          userId: document.user_id,
          type: "allergy_guardian",
          context: {
            detectedAllergens: inputData.allergyWarnings,
            source: inputData.documentType,
          },
        });
        if (interventionResult.success) {
          interventionsCreated++;
        }
      }

      // Create intervention for critical lab findings
      if (inputData.concerns && inputData.concerns.length > 0 &&
          (inputData.documentType === "lab_pdf" || inputData.documentType === "lab_handwritten")) {
        const hasCritical = inputData.concerns.some(c => 
          c.toLowerCase().includes("critical") || c.toLowerCase().includes("urgent")
        );
        
        if (hasCritical) {
          const interventionResult = await createInterventionTool.execute({
            userId: document.user_id,
            type: "recovery_adjuster",
            context: {
              findings: inputData.concerns,
              source: "lab_results",
            },
          });
          if (interventionResult.success) {
            interventionsCreated++;
          }
        }
      }

      return {
        ...inputData,
        interventionsCreated,
      };
    } catch (error) {
      console.error("[createInterventionsStep] Error:", error);
      return {
        ...inputData,
        interventionsCreated: 0,
      };
    }
  },
});

// ============================================
// STEP 8: Update Gamification
// ============================================

const updateGamificationStep = createStep({
  id: "update-gamification",
  description: "Update health score, streaks, and check achievements",
  inputSchema: SmartUploadOutputSchema.extend({
    interventionsCreated: z.number().optional(),
  }),
  outputSchema: SmartUploadOutputSchema,
  execute: async ({ inputData }) => {
    if (!inputData.success || !inputData.documentId) {
      return inputData;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: document } = await supabase
        .from("health_documents")
        .select("user_id")
        .eq("id", inputData.documentId)
        .single();

      if (!document) {
        return inputData;
      }

      // Update streak for document upload
      await updateStreakTool.execute({
        userId: document.user_id,
        streakType: "document_upload",
      });

      // Update health score
      await updateHealthScoreTool.execute({
        userId: document.user_id,
      });

      // Check achievements
      await checkAchievementsTool.execute({
        userId: document.user_id,
      });

      return inputData;
    } catch (error) {
      console.error("[updateGamificationStep] Error:", error);
      // Don't fail the workflow if gamification fails
      return inputData;
    }
  },
});

// ============================================
// SMART UPLOAD WORKFLOW
// ============================================

/**
 * Smart Upload Workflow
 * 
 * Pipeline:
 * 1. Create document record in database
 * 2. Classify document type using AI vision
 * 3. Run type-specific analysis
 * 4. Store results and generate insights
 */
export const smartUploadWorkflow = createWorkflow({
  id: "smart-upload-workflow",
  description: "Processes health document uploads with smart classification, analysis, body system findings, recommendations, and gamification",
  inputSchema: SmartUploadInputSchema,
  outputSchema: SmartUploadOutputSchema,
})
  .then(createDocumentRecordStep)
  .then(classifyDocumentStep)
  .then(analyzeDocumentStep)
  .then(storeResultsStep)
  .then(extractAndStoreFindingsStep) // NEW: Extract and store cumulative findings
  .then(generateRecommendationsStep)
  .then(updateMealPlanStep)
  .then(createInterventionsStep)
  .then(updateGamificationStep)
  .commit();

/**
 * Helper function to process a health document upload
 */
export async function processHealthUpload(params: {
  userId: string;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
}) {
  try {
    console.log("[processHealthUpload] Creating workflow run", {
      userId: params.userId,
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      fileUrl: params.fileUrl.substring(0, 100) + "...", // Log partial URL for security
    });

    const run = await smartUploadWorkflow.createRun();
    
    console.log("[processHealthUpload] Starting workflow execution");
    const startTime = Date.now();
    
    const result = await run.start({
      inputData: {
        userId: params.userId,
        fileUrl: params.fileUrl,
        fileName: params.fileName,
        mimeType: params.mimeType,
        fileSize: params.fileSize,
      },
    });
    
    const duration = Date.now() - startTime;
    
    console.log("[processHealthUpload] Workflow completed", {
      duration: `${duration}ms`,
      hasResults: !!result.results,
      resultsCount: result.results ? Object.keys(result.results).length : 0,
      resultKeys: Object.keys(result || {}),
    });

    // Log detailed result structure
    if (result.results) {
      console.log("[processHealthUpload] Step execution summary:", {
        stepIds: Object.keys(result.results),
        stepCount: Object.keys(result.results).length,
        steps: Object.entries(result.results).map(([stepId, stepResult]) => ({
          stepId,
          status: stepResult.status,
          hasOutput: !!stepResult.output,
          outputSuccess: stepResult.output?.success,
        })),
      });
    } else {
      console.warn("[processHealthUpload] Workflow returned no results object", {
        resultType: typeof result,
        resultKeys: Object.keys(result || {}),
      });
    }
    
    return result;
  } catch (error) {
    console.error("[processHealthUpload] Workflow execution failed:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
      params: {
        userId: params.userId,
        fileName: params.fileName,
        mimeType: params.mimeType,
        fileSize: params.fileSize,
      },
    });
    throw error;
  }
}


